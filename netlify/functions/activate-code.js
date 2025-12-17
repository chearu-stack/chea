const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Supabase credentials not configured' }) 
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Получаем код из параметра запроса
    const { code } = event.queryStringParameters || {};
    
    if (!code) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Missing code parameter' }) 
      };
    }

    // Обновляем статус на 'active' и ставим время активации
    const { data, error } = await supabase
      .from('access_codes')
      .update({ 
        status: 'active',
        activated_at: new Date().toISOString()
      })
      .eq('code', code)
      .eq('status', 'pending') // Защита от повторной активации
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return {
        statusCode: 404,
        body: JSON.stringify({ 
          error: 'Code not found or already activated' 
        })
      };
    }

    // Здесь потом добавим вызов API ботхаба для установки лимита капсов
    // const botResponse = await fetch('https://bot-hub-api.com/set-limit', {...});

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true, 
        message: `Code ${code} activated`,
        data,
        caps_limit: data.caps_limit
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      })
    };
  }
};
