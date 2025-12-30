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
      .not('package', 'eq', 'PROMO_CAMPAIGN');

    if (error) throw error;

    // Функция для парсинга даты из кода AMG25-MMDDHHMM-XXX
    const parseDateFromCode = (code) => {
      if (!code || typeof code !== 'string') return null;
      
      // Ищем паттерн AMG25-12302150-PMT
      const match = code.match(/AMG25-(\d{2})(\d{2})(\d{2})(\d{2})-/);
      if (!match) return null;
      
      const [_, month, day, hour, minute] = match;
      const currentYear = new Date().getFullYear();
      
      try {
        // Создаём дату (год берём текущий)
        const date = new Date(currentYear, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
        return !isNaN(date.getTime()) ? date : null;
      } catch (e) {
        return null;
      }
    };

    const enrichedData = (data || []).map(item => {
      // Пробуем получить дату из metadata.created_at, activated_at или из кода
      let createdDate = null;
      
      // 1. Пробуем metadata.created_at
      if (item.metadata?.created_at) {
        const metaDate = new Date(item.metadata.created_at);
        if (!isNaN(metaDate.getTime())) createdDate = metaDate;
      }
      
      // 2. Пробуем activated_at
      if (!createdDate && item.activated_at) {
        const activatedDate = new Date(item.activated_at);
        if (!isNaN(activatedDate.getTime())) createdDate = activatedDate;
      }
      
      // 3. Парсим из кода
      if (!createdDate) {
        createdDate = parseDateFromCode(item.code);
      }
      
      // Форматируем для отображения
      const created_at = createdDate ? createdDate.toISOString() : null;
      const created_at_display = createdDate ? createdDate.toLocaleDateString('ru-RU') : '—';

      return {
        ...item,
        created_at: created_at, // ISO строка для сортировки
        created_at_display: created_at_display, // Для отображения в таблице
        is_active: item.is_active === true
      };
    });

    // Сортировка по дате создания (новые сверху)
    const sortedData = enrichedData.sort((a, b) => {
      if (!a.created_at && !b.created_at) return b.id - a.id;
      if (!a.created_at) return 1;
      if (!b.created_at) return -1;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(sortedData),
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
