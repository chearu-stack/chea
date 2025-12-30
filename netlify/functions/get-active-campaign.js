const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': 'https://chearu-stack.github.io',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Ищем активную кампанию
    const { data, error } = await supabase
      .from('access_codes')
      .select('*')
      .eq('package', 'PROMO_CAMPAIGN')
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ active: false }),
      };
    }

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        active: true,
        code: data.code, // ← ДОБАВЛЕНО: уникальный код кампании для связи
        title: data.metadata?.title || 'Акция',
        description: data.metadata?.description || '',
        button_text: data.metadata?.button_text || 'Участвовать',
        package: data.metadata?.package || 'PROMO_BASIC',
        color: data.metadata?.color || '#dd6b20',
        expires_days: data.metadata?.expires_days || 30
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message, active: false }),
    };
  }
};
