const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // 1. Подключаемся к Supabase
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Supabase credentials not configured' }) 
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 2. Получаем данные из запроса (пакет и базовый код от фронтенда)
    const { package: packageType, baseCode } = JSON.parse(event.body || '{}');
    
    if (!packageType || !baseCode) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Missing package or baseCode' }) 
      };
    }

    // 3. Ищем последний код для этой минуты (например, AMG25-12172147-*)
    const { data: existingCodes, error: fetchError } = await supabase
      .from('access_codes')
      .select('code')
      .like('code', `${baseCode}-%`)
      .order('code', { ascending: false })
      .limit(1);

    if (fetchError) throw fetchError;

    // 4. Определяем следующую букву
    let nextLetter = 'A';
    if (existingCodes && existingCodes.length > 0) {
      const lastCode = existingCodes[0].code;
      const lastLetter = lastCode.split('-').pop();
      nextLetter = getNextExcelColumn(lastLetter);
    }

    const finalCode = `${baseCode}-${nextLetter}`;

    // 5. Записываем в БД
    const { data, error: insertError } = await supabase
      .from('access_codes')
      .insert([
        {
          code: finalCode,
          package: packageType,
          status: 'pending',
          ip_address: event.headers['x-forwarded-for'] || 'unknown'
        }
      ])
      .select()
      .single();

    if (insertError) {
      // Если код уже существует (уникальность нарушена), пробуем следующую букву
      if (insertError.code === '23505') {
        // Рекурсивно вызываем снова с обновлённой базой
        const newBaseCode = `${baseCode}-${nextLetter}`;
        return exports.handler({
          ...event,
          body: JSON.stringify({ package: packageType, baseCode: newBaseCode })
        }, context);
      }
      throw insertError;
    }

    // 6. Возвращаем успех
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true, 
        code: finalCode,
        id: data.id 
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      })
    };
  }
};

// Вспомогательная функция для Excel-стиля колонок (A, B, ..., Z, AA, AB, ...)
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
