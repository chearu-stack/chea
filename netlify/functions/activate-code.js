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

    // 1. СНАЧАЛА проверяем, существует ли код в БД
    const { data: existingCode, error: fetchError } = await supabase
      .from('access_codes')
      .select('id, code, package, is_active')
      .eq('code', code)
      .single();

    if (fetchError || !existingCode) {
      return { 
        statusCode: 404, 
        headers, 
        body: JSON.stringify({ 
          success: false, 
          error: 'Код не найден в базе данных',
          code: code
        }) 
      };
    }

    // 2. Подготовка данных для обновления
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

    // 3. Обновляем существующую запись
    const { data: updatedData, error: updateError } = await supabase
      .from('access_codes')
      .update(updateData)
      .eq('code', code)
      .select()
      .single();

    if (updateError) throw updateError;

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true, 
        message: `Активирован: ${code}`,
        is_active: activateFlag,
        caps_limit: newLimit,
        data: updatedData,
        package: existingCode.package // Возвращаем информацию о тарифе
      })
    };

  } catch (error) {
    console.error('❌ Ошибка в activate-code:', error.message);
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ 
        success: false,
        error: error.message 
      }) 
    };
  }
};
