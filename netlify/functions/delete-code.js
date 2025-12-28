// netlify/functions/delete-code.js
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // CORS заголовки как в других файлах
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Обработка OPTIONS запроса
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Проверяем метод
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Метод не разрешен' })
    };
  }

  // Получаем параметры
  const { code } = event.queryStringParameters || {};
  
  if (!code) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: 'Параметр code обязателен' 
      })
    };
  }

  console.log(`DELETE запрос для кода: ${code}`);

  try {
    // Подключаемся к Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Удаляем из access_codes
    const { error } = await supabase
      .from('access_codes')
      .delete()
      .eq('code', code);

    if (error) {
      console.error('Supabase ошибка:', error);
      throw error;
    }

    // Успешный ответ
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true, 
        message: `Код ${code} удален`,
        deleted_code: code
      })
    };

  } catch (error) {
    console.error('Ошибка при удалении:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: error.message || 'Внутренняя ошибка сервера'
      })
    };
  }
};
