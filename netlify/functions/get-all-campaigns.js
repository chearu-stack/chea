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
        // Парсим metadata (оно хранится как JSON строка)
        let metadata = {};
        try {
            if (typeof campaign.metadata === 'string') {
                metadata = JSON.parse(campaign.metadata);
            } else if (campaign.metadata && typeof campaign.metadata === 'object') {
                metadata = campaign.metadata;
            }
        } catch (e) {
            console.warn('Ошибка парсинга metadata:', e.message);
            metadata = {};
        }

        // 1. Дата создания
        let createdDate = '—';
        let rawDate = null;
        
        // Пробуем разные источники даты в порядке приоритета
        const dateSources = [
            metadata.created_at,      // 1. Из metadata
            campaign.activated_at,    // 2. activated_at из БД
            new Date().toISOString()  // 3. Текущая дата
        ];
        
        for (const dateStr of dateSources) {
            if (dateStr) {
                try {
                    const date = new Date(dateStr);
                    if (!isNaN(date.getTime())) {
                        createdDate = date.toLocaleDateString('ru-RU');
                        rawDate = dateStr;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
        }

        // 2. Срок действия (берём из metadata или дефолт 30)
        const expiresDays = metadata.expires_days || 30;

        // 3. Подсчитываем промо-коды для этой кампании (упрощённо)
        // В реальности нужен запрос к БД, но пока временно 0
        const promoCount = 0;

        return {
          code: campaign.code,
          title: metadata.title || 'Без названия',
          description: metadata.description || '',
          is_active: campaign.is_active === true,
          created_at: createdDate,
          created_at_raw: rawDate,
          color: metadata.color || '#dd6b20',
          package: metadata.package || 'PROMO_BASIC',
          expires_days: expiresDays,
          promo_codes_count: promoCount,
          metadata: metadata
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
