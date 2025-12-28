const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // CORS заголовки
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Получаем код из параметров
  const { code } = event.queryStringParameters || {};
  
  if (!code) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Параметр code обязателен' })
    };
  }

  // Подключаемся к Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // УДАЛЯЕМ код из таблицы access_codes
    const { error } = await supabase
      .from('access_codes')
      .delete()
      .eq('code', code);

    if (error) throw error;

    // Успешный ответ
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true, 
        message: `Код ${code} удален` 
      })
    };

  } catch (error) {
    // Ошибка
    console.error('Ошибка удаления:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
