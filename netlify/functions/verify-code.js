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
    // ЛК теперь присылает данные в теле (body) POST-запроса
    const { code, fingerprint, usage = 0 } = JSON.parse(event.body || '{}');

    // 1. Ищем запись: приоритет отпечатку (FP), если нет — по коду
    let query = supabase.from('access_codes').select('*');
    
    if (fingerprint) {
      query = query.eq('fingerprint', fingerprint);
    } else if (code) {
      query = query.eq('code', code);
    } else {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Нужен код или FP' }) };
    }

    const { data: accessData, error: fetchError } = await query.maybeSingle();

    if (fetchError || !accessData) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Доступ не найден' }) };
    }

    // 2. ПРОВЕРКА СТАТУСА - КРИТИЧНОЕ ИСПРАВЛЕНИЕ
    if (accessData.status !== 'active') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ 
          error: 'Доступ не активирован', 
          is_active: false // Для совместимости
        })
      };
    }

    // 3. Проверка активации (галочка в Supabase)
    if (!accessData.is_active) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Доступ отключен администратором', is_active: false })
      };
    }

    const capsLimit = accessData.caps_limit || 0;
    const capsUsed = accessData.caps_used || 0;
    const requestedUsage = parseInt(usage, 10) || 0;

    // 4. Проверка лимитов
    if (capsUsed + requestedUsage > capsLimit) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Лимит исчерпан', remaining: capsLimit - capsUsed })
      };
    }

    // 5. Списание капсов
    let currentCapsUsed = capsUsed;
    if (requestedUsage > 0) {
      const { error: updateError } = await supabase
        .from('access_codes')
        .update({ caps_used: capsUsed + requestedUsage })
        .eq('id', accessData.id);

      if (updateError) throw updateError;
      currentCapsUsed = capsUsed + requestedUsage;
    }

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        code: accessData.code, // Возвращаем код, чтобы ЛК его знал
        remaining: capsLimit - currentCapsUsed,
        caps_limit: capsLimit,
        caps_used: currentCapsUsed
      })
    };

  } catch (error) {
    console.error("Ошибка верификации:", error.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
