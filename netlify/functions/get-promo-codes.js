const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': 'https://chearu-stack.github.io',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { data, error } = await supabase
      .from('access_codes')
      .select('*')
      .like('package', 'PROMO_%')
      .not('package', 'eq', 'PROMO_CAMPAIGN'); // ← ВОТ ЭТА СТРОЧКА ФИЛЬТРУЕТ КАМПАНИИ!

    if (error) throw error;

    const sortedData = (data || []).sort((a, b) => b.id - a.id);

    const normalizedData = sortedData.map(item => ({
      ...item,
      is_active: item.is_active === true
    }));

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(normalizedData),
    };
  } catch (error) {
    console.error('❌ Ошибка в get-promo-codes:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
