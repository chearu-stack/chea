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
      .order('id', { ascending: false });

    if (error) throw error;

    // Обрабатываем кампании
    const enrichedCampaigns = (campaigns || []).map((campaign) => {
        // 1. Дата создания — берём из metadata или используем текущую
        let createdDate = '—';
        let rawDate = null;
        
        if (campaign.metadata?.created_at) {
            try {
                const date = new Date(campaign.metadata.created_at);
                if (!isNaN(date.getTime())) {
                    createdDate = date.toLocaleDateString('ru-RU');
                    rawDate = campaign.metadata.created_at;
                }
            } catch (e) {
                // Оставляем прочерк
            }
        }
        
        // Если в metadata нет даты, пробуем activated_at
        if (createdDate === '—' && campaign.activated_at) {
            try {
                const date = new Date(campaign.activated_at);
                if (!isNaN(date.getTime())) {
                    createdDate = date.toLocaleDateString('ru-RU');
                    rawDate = campaign.activated_at;
                }
            } catch (e) {
                // Оставляем прочерк
            }
        }

        // 2. Срок действия — берём из metadata или дефолт 30
        const expiresDays = campaign.metadata?.expires_days || 30;

        return {
          code: campaign.code,
          title: campaign.metadata?.title || 'Без названия',
          description: campaign.metadata?.description || '',
          is_active: campaign.is_active === true,
          created_at: createdDate, // Форматированная дата
          created_at_raw: rawDate, // Исходная дата для сортировки
          color: campaign.metadata?.color || '#dd6b20',
          package: campaign.metadata?.package || 'PROMO_BASIC',
          expires_days: expiresDays, // Твои 3 дня, а не дефолт 30!
          promo_codes_count: 0, // Пока не считаем
          metadata: campaign.metadata || {}
        };
      });

    // Сортируем по дате (новые сверху)
    enrichedCampaigns.sort((a, b) => {
        if (!a.created_at_raw || !b.created_at_raw) return 0;
        return new Date(b.created_at_raw) - new Date(a.created_at_raw);
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
