const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': 'https://chearu-stack.github.io',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { code, package: packageType, fingerprint } = JSON.parse(event.body || '{}');
    
    if (!code || !packageType) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing code or package' }) };
    }

    // --- ЛОГИКА ТАРИФОВ (Защита от подмены лимита) ---
    const limits = {
      'base': 30000,
      'pro': 60000,
      'vip': 90000
    };
    // Если пакет неизвестен — даем минимум, если VIP — 90к
    const finalLimit = limits[packageType] || 30000;

    console.log(`📡 Регистрация: ${code}, FP: ${fingerprint}, Пакет: ${packageType}, Лимит: ${finalLimit}`);

    const { data, error: insertError } = await supabase
      .from('access_codes')
      .insert([
        {
          code: code,
          package: packageType,
          status: 'pending',
          is_active: false, 
          fingerprint: fingerprint || 'unknown',
          caps_limit: finalLimit, // Сервер сам ставит лимит!
          caps_used: 0,
          ip_address: event.headers['x-forwarded-for'] || 'unknown'
        }
      ])
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        return { statusCode: 409, headers, body: JSON.stringify({ error: 'Код уже существует' }) };
      }
      throw insertError;
    }

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, code: data.code, limit_assigned: finalLimit })
    };

  } catch (error) {
    console.error('Ошибка:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
