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

    // 1. Проверяем, существует ли код и каков его статус
    const { data: existingCode, error: fetchError } = await supabase
      .from('access_codes')
      .select('id, code, package, status, is_active, metadata')
      .eq('code', code)
      .single();

    if (fetchError || !existingCode) {
      return { 
        statusCode: 404, 
        headers, 
        body: JSON.stringify({ 
          success: false, 
          error: 'Код не найден в базе данных'
        }) 
      };
    }

    // 2. Проверяем статус - можно активировать только если статус не 'active'
    if (existingCode.status === 'active') {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ 
          success: false, 
          error: 'Код уже активирован',
          current_status: existingCode.status
        }) 
      };
    }

    // 3. Подготовка данных для обновления
    const newLimit = limit ? parseInt(limit) : null;
    const activateFlag = active === 'true';

    const updateData = {
      status: 'active', // ← Меняем статус на 'active'
      activated_at: new Date().toISOString(),
      is_active: activateFlag,
      caps_used: 0
    };

    if (newLimit !== null) {
      updateData.caps_limit = newLimit;
    }

    // 4. Обновляем запись
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
        status: 'active', // Возвращаем новый статус
        is_active: activateFlag,
        caps_limit: newLimit,
        data: updatedData
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
