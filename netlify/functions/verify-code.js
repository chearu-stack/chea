const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
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
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Теперь по умолчанию usage = 0, никакого жлобства!
    const { code, usage = 0 } = event.queryStringParameters || {};
    
    if (!code) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Нужен код' }) };
    }

    const { data: accessData, error: fetchError } = await supabase
      .from('access_codes')
      .select('*')
      .eq('code', code)
      .single();

    if (fetchError || !accessData) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Код не найден' }) };
    }

    // Проверка активации (то, что ты делаешь в админке)
    if (accessData.status !== 'active' || !accessData.is_active) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Код еще не активирован владельцем' })
      };
    }

    const capsLimit = accessData.caps_limit || 0;
    const capsUsed = accessData.caps_used || 0;
    const requestedUsage = parseInt(usage, 10) || 0;
    
    // Проверяем, хватит ли капсов на запрос
    if (capsUsed + requestedUsage > capsLimit) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Лимит капсов исчерпан', remaining: capsLimit - capsUsed })
      };
    }

    // СПИСАНИЕ ПРОИСХОДИТ ТОЛЬКО ЕСЛИ usage > 0
    let currentCapsUsed = capsUsed;
    if (requestedUsage > 0) {
      const { error: updateError } = await supabase
        .from('access_codes')
        .update({ caps_used: capsUsed + requestedUsage })
        .eq('code', code);

      if (updateError) throw updateError;
      currentCapsUsed = capsUsed + requestedUsage;
    }

    // Возвращаем честный ответ
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        message: requestedUsage > 0 ? 'Капсы списаны' : 'Код валиден, лимит есть',
        remaining: capsLimit - currentCapsUsed,
        caps_limit: capsLimit,
        caps_used: currentCapsUsed
      })
    };

  } catch (error) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
