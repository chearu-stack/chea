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
    const { code, usage = 100 } = event.queryStringParameters || {};
    
    if (!code) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Missing code parameter' }) 
      };
    }

    // 1. Находим запись с этим кодом
    const { data: accessData, error: fetchError } = await supabase
      .from('access_codes')
      .select('*')
      .eq('code', code)
      .single();

    if (fetchError || !accessData) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Code not found' })
      };
    }

    // 2. Проверяем статус
    if (accessData.status !== 'active') {
      return {
        statusCode: 403,
        body: JSON.stringify({ 
          error: 'Access not activated',
          status: accessData.status
        })
      };
    }

    // 3. Проверяем лимит капсов
    const capsLimit = accessData.caps_limit || 0;
    const capsUsed = accessData.caps_used || 0;
    const requestedUsage = parseInt(usage, 10) || 100;
    
    if (capsUsed + requestedUsage > capsLimit) {
      return {
        statusCode: 403,
        body: JSON.stringify({ 
          error: 'Caps limit exceeded',
          caps_used: capsUsed,
          caps_limit: capsLimit,
          remaining: capsLimit - capsUsed
        })
      };
    }

    // 4. Обновляем счётчик использованных капсов (если usage > 0)
    let updatedCapsUsed = capsUsed;
    if (requestedUsage > 0) {
      const { error: updateError } = await supabase
        .from('access_codes')
        .update({ caps_used: capsUsed + requestedUsage })
        .eq('code', code);

      if (updateError) throw updateError;
      updatedCapsUsed = capsUsed + requestedUsage;
    }

    // 5. Возвращаем успех
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        access: 'granted',
        code: accessData.code,
        package: accessData.package,
        caps_used: updatedCapsUsed,
        caps_limit: capsLimit,
        remaining: capsLimit - updatedCapsUsed,
        status: accessData.status
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
