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
    const { 
      code, 
      package: packageType, 
      fingerprint,
      caps_limit, // Добавляем принятие caps_limit из запроса
      is_active, // Добавляем принятие is_active из запроса
      metadata    // Добавляем принятие metadata из запроса
    } = JSON.parse(event.body || '{}');
    
    if (!code || !packageType) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing code or package' }) };
    }

    // --- ЛОГИКА ТАРИФОВ (Защита от подмены лимита) ---
    const limits = {
      'base': 30000,
      'pro': 60000,
      'vip': 90000,
      // Добавляем поддержку PROMO_ пакетов
      'PROMO_BASIC': 30000,
      'PROMO_EXTENDED': 60000,
      'PROMO_SUBSCRIPTION': 90000,
      'PROMO_CAMPAIGN': 0 // Для записей кампаний лимит не нужен
    };
    
    // ПРАВИЛО: если передали caps_limit и это промо-пакет — используем переданный
    // Иначе используем стандартную логику защиты
    let finalLimit;
    if (caps_limit !== undefined && packageType.startsWith('PROMO_')) {
      finalLimit = caps_limit; // Доверяем админке для промо-пакетов
    } else {
      finalLimit = limits[packageType] || 30000;
    }

    console.log(`📡 Регистрация: ${code}, Пакет: ${packageType}, Лимит: ${finalLimit}, Активен: ${is_active || false}`);

    const recordData = {
      code: code,
      package: packageType,
      status: 'pending',
      fingerprint: fingerprint || 'unknown',
      caps_limit: finalLimit,
      caps_used: 0,
      ip_address: event.headers['x-forwarded-for'] || 'unknown'
    };

    // Добавляем is_active только если передано
    if (is_active !== undefined) {
      recordData.is_active = is_active;
      recordData.status = is_active ? 'active' : 'pending';
    }

    // Добавляем metadata если передано
    if (metadata !== undefined) {
      recordData.metadata = metadata;
    }

    const { data, error: insertError } = await supabase
      .from('access_codes')
      .insert([recordData])
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
      body: JSON.stringify({ 
        success: true, 
        code: data.code, 
        limit_assigned: finalLimit,
        is_active: data.is_active
      })
    };

  } catch (error) {
    console.error('Ошибка:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
