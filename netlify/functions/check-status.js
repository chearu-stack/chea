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
            .select('is_active, caps_used, caps_limit, package, code, fingerprint');

        if (code) {
            query = query.eq('code', code);
        } else {
            query = query.eq('fingerprint', fp);
        }

        const { data, error } = await query.maybeSingle();

        if (error) throw error;

        if (!data) {
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

        const isFullyUsed = data.is_active && (data.caps_used >= data.caps_limit);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                active: data.is_active || false,
                caps_used: data.caps_used || 0,
                caps_limit: data.caps_limit || 0,
                package: data.package || null,
                code: data.code || null,
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
