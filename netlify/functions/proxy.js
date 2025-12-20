const { createClient } = require('@supabase/supabase-js');

// Настройки из переменных окружения (Render)
const BOTHUB_API_KEY = process.env.BOTHUB_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Инициализация Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

exports.handler = async (event) => {
    // Стандартные заголовки для CORS и JSON
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Ответ на предварительный запрос браузера (Preflight)
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (!BOTHUB_API_KEY) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Ключ Bothub не настроен' }) };
    }

    try {
        const payload = JSON.parse(event.body);
        const { messages, userCode, model } = payload; 

        // 1. Отправляем запрос в Bothub
        const response = await fetch('https://api.bothub.io/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${BOTHUB_API_KEY}`
            },
            body: JSON.stringify({
                model: model || "deepseek-ai/deepseek-r1",
                messages: messages
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Bothub Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        // 2. ЕСЛИ ЕСТЬ ОТВЕТ И КОД ПОЛЬЗОВАТЕЛЯ — СПИСЫВАЕМ ТОКЕНЫ
        if (data.usage && userCode) {
            const totalUsed = data.usage.total_tokens;

            // Обновляем Supabase: увеличиваем caps_used на реальное число токенов
            // и фиксируем время последней активности (для твоих 14 дней)
            const { error: dbError } = await supabase
                .from('access_codes')
                .select('caps_used')
                .eq('code', userCode)
                .single();

            if (!dbError) {
                await supabase
                    .from('access_codes')
                    .update({ 
                        caps_used: (data.usage.total_tokens + (data.usage.caps_used || 0)), // Если поле было пустым
                        last_activity: new Date().toISOString()
                    })
                    .eq('code', userCode);
                
                // Дополнительно обновляем через инкремент для точности
                await supabase.rpc('increment_caps_count', { 
                    row_id: userCode, 
                    amount: totalUsed 
                }).catch(() => {
                    // Если RPC не настроен, используем простой update ниже
                    return supabase
                        .from('access_codes')
                        .update({ 
                            last_activity: new Date().toISOString()
                        })
                        .eq('code', userCode);
                });
            }
        }

        // Возвращаем чистый JSON ответ от нейросети фронтенду
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error("❌ Ошибка в Proxy:", error.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
