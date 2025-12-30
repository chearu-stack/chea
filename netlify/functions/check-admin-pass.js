const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // CORS заголовки
  const headers = {
    'Access-Control-Allow-Origin': 'https://chearu-stack.github.io',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { password } = JSON.parse(event.body);
    
    if (!password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ valid: false, error: 'No password provided' })
      };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Ищем запись с package = 'ADMIN_AUTH'
    const { data, error } = await supabase
      .from('access_codes')
      .select('metadata')
      .eq('package', 'ADMIN_AUTH')
      .single();

    if (error || !data) {
      console.error('ADMIN_AUTH запись не найдена:', error);
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ valid: false, error: 'Auth configuration missing' })
      };
    }

    // Простейшая проверка (без хэширования для простоты)
    const storedPassword = data.metadata?.admin_password;
    const isValid = storedPassword && (storedPassword === password);

    console.log(`Проверка пароля: ${isValid ? 'VALID' : 'INVALID'}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ valid: isValid })
    };

  } catch (error) {
    console.error('Ошибка в check-admin-pass:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ valid: false, error: error.message })
    };
  }
};
