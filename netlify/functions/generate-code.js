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
      caps_limit,
      is_active,
      metadata
    } = JSON.parse(event.body || '{}');
    
    if (!code || !packageType) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing code or package' }) };
    }

    // ИСПРАВЛЕНИЕ: правильные имена тарифов
    const limits = {
      'basic': 30000,
      'extended': 60000,
      'subscription': 90000,
      'PROMO_BASIC': 30000,
      'PROMO_EXTENDED': 60000,
      'PROMO_SUBSCRIPTION': 90000,
      'PROMO_CAMPAIGN': 0
    };
    
    // ИСПРАВЛЕНИЕ: используем переданный caps_limit если есть
    let finalLimit;
    if (caps_limit !== undefined) {
      finalLimit = caps_limit; // Используем переданный лимит
    } else {
      finalLimit = limits[packageType] || 30000; // Иначе стандартный
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

    if (is_active !== undefined) {
      recordData.is_active = is_active;
      recordData.status = is_active ? 'active' : 'pending';
    }

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
