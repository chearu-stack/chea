const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': 'https://chearu-stack.github.io',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        const { fp, code } = event.queryStringParameters || {};
        
        if (!fp && !code) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    active: false,
                    caps_used: 0,
                    caps_limit: 0,
                    package: null,
                    is_fully_used: false,
                    code: null
                })
            };
        }

        // ========== ИСПРАВЛЕНИЕ: РАЗДЕЛЕНИЕ ЛОГИКИ ==========
        let query = supabase
            .from('access_codes')
            .select('is_active, caps_used, caps_limit, package, code, fingerprint, id, activated_at')
            .order('id', { ascending: false })
            .limit(1);

        if (code) {
            // ДЛЯ ПРОМО-КОДОВ: проверяем ТОЛЬКО по коду, игнорируем fingerprint
            query = query.eq('code', code);
            
            // Важно: проверяем, что это именно промо-код, а не случайный код
            // (промо-коды начинаются с AMG25- или PROMO_)
            const isPromoCode = code.startsWith('AMG25-') || code.startsWith('PROMO_');
            
            if (isPromoCode) {
                // Для промо-кодов fingerprint НЕ учитываем
                // Продолжаем запрос как есть
            } else {
                // Для обычных кодов проверяем и fingerprint
                if (fp) {
                    query = query.eq('fingerprint', fp);
                }
            }
        } else {
            // Если нет code, проверяем по fingerprint (старая логика)
            query = query.eq('fingerprint', fp);
        }

        const { data, error } = await query;

        if (error) throw error;

        // data теперь массив, берем первый элемент
        const record = data && data.length > 0 ? data[0] : null;

        if (!record) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    active: false,
                    caps_used: 0,
                    caps_limit: 0,
                    package: null,
                    is_fully_used: false,
                    code: null
                })
            };
        }

        // Дополнительная защита: если это НЕ промо-код, проверяем fingerprint
        const isPromoRecord = record.code.startsWith('AMG25-') || 
                              record.code.startsWith('PROMO_') || 
                              record.package.startsWith('PROMO_');
        
        if (!isPromoRecord && fp && record.fingerprint !== fp) {
            // Обычный код, но fingerprint не совпадает
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    active: false,
                    caps_used: 0,
                    caps_limit: 0,
                    package: null,
                    is_fully_used: false,
                    code: null,
                    reason: 'fingerprint_mismatch'
                })
            };
        }

        const isFullyUsed = record.is_active && (record.caps_used >= record.caps_limit);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                active: record.is_active || false,
                caps_used: record.caps_used || 0,
                caps_limit: record.caps_limit || 0,
                package: record.package || null,
                code: record.code || null,
                is_fully_used: isFullyUsed
            })
        };

    } catch (error) {
        console.error('Ошибка check-status:', error);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                active: false,
                caps_used: 0,
                caps_limit: 0,
                package: null,
                is_fully_used: false,
                code: null,
                error: error.message 
            })
        };
    }
};
