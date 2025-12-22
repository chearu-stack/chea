const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // CORS заголовки для связи фронтенда и бэкенда
  const headers = {
    'Access-Control-Allow-Origin': 'https://chearu-stack.github.io',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Извлекаем параметры. Добавлена поддержка имен из вашего admin.js (caps_limit и is_active)
    const params = event.queryStringParameters || {};
    const code = params.code;
    const limit = params.caps_limit || params.limit;
    const active = params.is_active || params.active;
    
    if (!code) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ error: 'Код не указан' }) 
      };
    }

    // Подготовка данных
    const newLimit = limit ? parseInt(limit) : null;
    const activateFlag = active === 'true';

    const updateData = {
      status: 'active',
      activated_at: new Date().toISOString(),
      is_active: activateFlag,
      caps_used: 0
    };

    if (newLimit !== null) {
      updateData.caps_limit = newLimit;
    }

    // ВАЖНО: Заменили .single() на .maybeSingle()
    const { data, error } = await supabase
      .from('access_codes') 
      .update(updateData)
      .eq('code', code)
      .select()
      .maybeSingle(); // <--- Исправлено здесь

    if (error) throw error;

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true, 
        message: `Activated: ${code}`,
        is_active: activateFlag,
        caps_limit: newLimit,
        data: data // Вернем данные объекта для надежности
      })
    };

  } catch (error) {
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ error: error.message }) 
    };
  }
};
