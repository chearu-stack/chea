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

        let query = supabase
            .from('access_codes')
            .select('is_active, caps_used, caps_limit, package, code, fingerprint, id, activated_at')
            .order('id', { ascending: false }) // Сортируем по ID (больший ID = новее запись)
            .limit(1);

        if (code) {
            query = query.eq('code', code);
        } else {
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
