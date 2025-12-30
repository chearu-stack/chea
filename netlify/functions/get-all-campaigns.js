const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': 'https://chearu-stack.github.io',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Получаем ВСЕ кампании
    const { data: campaigns, error } = await supabase
      .from('access_codes')
      .select('*')
      .eq('package', 'PROMO_CAMPAIGN')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Подсчитываем промо-коды для каждой кампании
    const enrichedCampaigns = await Promise.all(
      (campaigns || []).map(async (campaign) => {
        // Считаем промо-коды, созданные во время активности этой кампании
        const { count } = await supabase
          .from('access_codes')
          .select('*', { count: 'exact', head: true })
          .like('package', 'PROMO_%')
          .not('package', 'eq', 'PROMO_CAMPAIGN')
          .gte('created_at', campaign.created_at) // созданы после начала кампании
          .lt('created_at', new Date(Date.now() + (campaign.metadata?.expires_days || 30) * 24 * 60 * 60 * 1000).toISOString());

        return {
          code: campaign.code,
          title: campaign.metadata?.title || 'Без названия',
          description: campaign.metadata?.description || '',
          is_active: campaign.is_active === true,
          created_at: campaign.created_at || campaign.activated_at,
          color: campaign.metadata?.color || '#dd6b20',
          package: campaign.metadata?.package || 'PROMO_BASIC',
          expires_days: campaign.metadata?.expires_days || 30,
          promo_codes_count: count || 0,
          metadata: campaign.metadata || {}
        };
      })
    );

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(enrichedCampaigns),
    };
  } catch (error) {
    console.error('❌ Ошибка в get-all-campaigns:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
