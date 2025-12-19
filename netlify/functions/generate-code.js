const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // CORS заголовки для GitHub Pages
  const headers = {
    'Access-Control-Allow-Origin': 'https://chearu-stack.github.io',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Обработка preflight запросов
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ error: 'Supabase credentials not configured' }) 
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // ПРИНИМАЕМ ДАННЫЕ (Добавили fingerprint)
    const { code, package: packageType, caps_limit, fingerprint } = JSON.parse(event.body || '{}');
    
    if (!code || !packageType) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ error: 'Missing code or package' }) 
      };
    }

    console.log(`📡 Регистрация: ${code}, FP: ${fingerprint}, Пакет: ${packageType}`);

    // Записываем в БД (Добавили поля fingerprint и is_active)
    const { data, error: insertError } = await supabase
      .from('access_codes')
      .insert([
        {
          code: code,
          package: packageType,
          status: 'pending',
          is_active: false, // Всегда FALSE при создании
          fingerprint: fingerprint || 'unknown', // Сохраняем отпечаток
          caps_limit: caps_limit || 30000,
          caps_used: 0,
          ip_address: event.headers['x-forwarded-for'] || 'unknown'
        }
      ])
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return {
            statusCode: 409,
            headers,
            body: JSON.stringify({ error: 'Код уже существует' })
        };
      }
      throw insertError;
    }

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, code: data.code })
    };

  } catch (error) {
    console.error('Ошибка:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
