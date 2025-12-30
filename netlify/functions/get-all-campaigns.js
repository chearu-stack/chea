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
    // Получаем ВСЕ кампании (сортируем по id, так как created_at нет в таблице)
    const { data: campaigns, error } = await supabase
      .from('access_codes')
      .select('*')
      .eq('package', 'PROMO_CAMPAIGN')
      .order('id', { ascending: false }); // ← СОРТИРУЕМ ПО ID

    if (error) throw error;

    // Подсчитываем промо-коды для каждой кампании
    const enrichedCampaigns = (campaigns || []).map((campaign) => {
        // Используем дату из metadata или текущую дату
        const campaignDate = campaign.metadata?.created_at || 
                           campaign.activated_at || 
                           new Date().toISOString();
        
        // Преобразуем дату для отображения
        let displayDate = '—';
        try {
            const date = new Date(campaignDate);
            displayDate = date.toLocaleDateString('ru-RU');
        } catch (e) {
            // Если дата некорректна, оставляем прочерк
        }

        return {
          code: campaign.code,
          title: campaign.metadata?.title || 'Без названия',
          description: campaign.metadata?.description || '',
          is_active: campaign.is_active === true,
          created_at: displayDate, // Форматированная дата для отображения
          created_at_raw: campaignDate, // Исходная дата
          color: campaign.metadata?.color || '#dd6b20',
          package: campaign.metadata?.package || 'PROMO_BASIC',
          expires_days: campaign.metadata?.expires_days || 30,
          // Временно не считаем промо-коды (чтобы не усложнять)
          promo_codes_count: 0, // Временно 0
          metadata: campaign.metadata || {}
        };
      });

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
