const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // CORS заголовки
  const headers = {
    'Access-Control-Allow-Origin': 'https://chearu-stack.github.io',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

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
    // Читаем параметры из URL, которые присылает наша НОВАЯ админка
    const { code, limit, active } = event.queryStringParameters || {};
    
    if (!code) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ error: 'Missing code parameter' }) 
      };
    }

    // ЛОГИКА ТАКСОМЕТРА:
    // 1. Берем лимит из запроса (30к/60к/90к) или оставляем что было
    const newLimit = limit ? parseInt(limit) : null;
    // 2. Флаг активации (true/false)
    const activateFlag = active === 'true';

    const updateData = {
      status: 'active',
      activated_at: new Date().toISOString(),
      is_active: activateFlag, // ВКЛЮЧАЕМ КЛЮЧ
      caps_used: 0             // ОБНУЛЯЕМ СЧЕТЧИК ПРИ АКТИВАЦИИ
    };

    // Если прилетел лимит — обновляем и его
    if (newLimit) {
      updateData.caps_limit = newLimit;
    }

    const { data, error } = await supabase
      .from('orders') // Убедись, что таблица называется orders, а не access_codes
      .update(updateData)
      .eq('code', code)
      .select()
      .single();

    if (error) throw error;

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true, 
        message: `Code ${code} activated with limit ${newLimit}`,
        is_active: activateFlag,
        caps_limit: newLimit
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
