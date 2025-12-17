const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // CORS headers for GitHub Pages
  const headers = {
    'Access-Control-Allow-Origin': 'https://chearu-stack.github.io',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return { 
      statusCode: 500, 
      headers, // ✅ Добавил здесь
      body: JSON.stringify({ error: 'Supabase credentials not configured' }) 
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { package: packageType, baseCode } = JSON.parse(event.body || '{}');
    
    if (!packageType || !baseCode) {
      return { 
        statusCode: 400, 
        headers, // ✅ Добавил здесь
        body: JSON.stringify({ error: 'Missing package or baseCode' }) 
      };
    }

    // Лимиты капсов по пакетам
    const capsLimitMap = {
      basic: 30000,
      pro: 50000,
      premium: 90000
    };
    const caps_limit = capsLimitMap[packageType] || 30000;

    // Ищем последний код для этой минуты
    const { data: existingCodes, error: fetchError } = await supabase
      .from('access_codes')
      .select('code')
      .like('code', `${baseCode}-%`)
      .order('code', { ascending: false })
      .limit(1);

    if (fetchError) throw fetchError;

    // Определяем следующую букву
    let nextLetter = 'A';
    if (existingCodes && existingCodes.length > 0) {
      const lastCode = existingCodes[0].code;
      const lastLetter = lastCode.split('-').pop();
      nextLetter = getNextExcelColumn(lastLetter);
    }

    const finalCode = `${baseCode}-${nextLetter}`;

    // Записываем в БД с лимитом
    const { data, error: insertError } = await supabase
      .from('access_codes')
      .insert([
        {
          code: finalCode,
          package: packageType,
          status: 'pending',
          caps_limit: caps_limit,
          caps_used: 0,
          ip_address: event.headers['x-forwarded-for'] || 'unknown'
        }
      ])
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        const newBaseCode = `${baseCode}-${nextLetter}`;
        return exports.handler({
          ...event,
          body: JSON.stringify({ package: packageType, baseCode: newBaseCode })
        }, context);
      }
      throw insertError;
    }

    // Успех
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' }, // ✅ Добавил headers
      body: JSON.stringify({ 
        success: true, 
        code: finalCode,
        id: data.id,
        caps_limit: caps_limit
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers, // ✅ Добавил здесь
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      })
    };
  }
};

// Вспомогательная функция для Excel-стиля колонок
function getNextExcelColumn(current) {
  if (!current || current === '') return 'A';
  
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let arr = current.split('').reverse();
  
  for (let i = 0; i < arr.length; i++) {
    const idx = letters.indexOf(arr[i]);
    if (idx < 25) {
      arr[i] = letters[idx + 1];
      return arr.reverse().join('');
    }
    arr[i] = 'A';
  }
  
  return 'A' + 'A'.repeat(arr.length);
}
