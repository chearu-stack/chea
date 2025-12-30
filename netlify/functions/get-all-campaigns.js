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

    // Обрабатываем кампании с подсчётом промо-кодов
    const enrichedCampaigns = await Promise.all(
      (campaigns || []).map(async (campaign) => {
        // Парсим metadata
        let metadata = {};
        try {
          if (typeof campaign.metadata === 'string') {
            metadata = JSON.parse(campaign.metadata);
          } else if (campaign.metadata && typeof campaign.metadata === 'object') {
            metadata = campaign.metadata;
          }
        } catch (e) {
          metadata = {};
        }

        // 1. Генерируем уникальный campaign_code для связи
        // Используем существующий campaign_id из metadata или создаём из code кампании
        const campaignCode = metadata.campaign_id || `CAMPAIGN_${campaign.code}`;
        
        // 2. Дата создания
        let createdDate = '—';
        let rawDate = null;
        const dateSources = [metadata.created_at, campaign.activated_at];
        
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

        // 3. Подсчитываем промо-коды для ЭТОЙ КОНКРЕТНОЙ КАМПАНИИ
        let promoCount = 0;
        
        try {
          // Ищем промо-коды, у которых в metadata есть campaign_code, равный нашему
          const { count, error: countError } = await supabase
            .from('access_codes')
            .select('*', { count: 'exact', head: true })
            .in('package', ['PROMO_BASIC', 'PROMO_EXTENDED', 'PROMO_SUBSCRIPTION'])
            .or(`metadata->>campaign_code.eq.${campaignCode},metadata->>campaign_id.eq.${campaignCode}`);
          
          if (!countError) {
            promoCount = count || 0;
          }
        } catch (countErr) {
          console.warn(`Не удалось посчитать коды для кампании ${campaign.code}:`, countErr.message);
        }

        // 4. Срок действия
        const expiresDays = metadata.expires_days || 30;

        return {
          code: campaign.code, // оригинальный код записи в БД
          campaign_code: campaignCode, // уникальный идентификатор кампании для связи
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
      })
    );

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
