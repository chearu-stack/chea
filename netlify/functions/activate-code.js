const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // 1. CORS заголовки для работы с твоим GitHub Pages фронтендом
  const headers = {
    'Access-Control-Allow-Origin': 'https://chearu-stack.github.io',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Обработка preflight запроса браузера
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // 2. Проверка учетных данных Supabase
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
    // 3. Получаем параметры из URL (code, limit, active)
    const { code, limit, active } = event.queryStringParameters || {};
    
    if (!code) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ error: 'Missing code parameter' }) 
      };
    }

    // 4. Подготовка данных для "Таксометра"
    const newLimit = limit ? parseInt(limit) : null;
    const activateFlag = active === 'true';

    const updateData = {
      status: 'active',
      activated_at: new Date().toISOString(),
      is_active: activateFlag, // Поле для проверки Ботом
      caps_used: 0             // Обнуляем расход при (пере)активации
    };

    // Если передан лимит (30000, 60000 или 90000), записываем его
    if (newLimit !== null) {
      updateData.caps_limit = newLimit;
    }

    // 5. Запрос к БД (Имя таблицы изменено на access_codes согласно твоему скриншоту)
    const { data, error } = await supabase
      .from('access_codes') 
      .update(updateData)
      .eq('code', code)
      .select()
      .single();

    if (error) throw error;

    // 6. Успешный ответ
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true, 
        message: `Code ${code} activated successfully`,
        details: {
          is_active: activateFlag,
          caps_limit: newLimit || (data ? data.caps_limit : 'unknown')
        }
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers, 
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      })
    };
  }
};
