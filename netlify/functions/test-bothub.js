// netlify/functions/test-bothub.js
exports.handler = async (event) => {
    // Безопасно берём ключ из переменных окружения Render
    const BOTHUB_API_KEY = process.env.BOTHUB_API_KEY;
    
    // Проверяем, что ключ есть
    if (!BOTHUB_API_KEY) {
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': 'https://chearu-stack.github.io' },
            body: JSON.stringify({ error: 'BOTHUB_API_KEY not configured' })
        };
    }

    try {
        // Прямой запрос к Bothub API
        const response = await fetch('https://api.bothub.io/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${BOTHUB_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [
                    {"role": "system", "content": "Ты помощник. Ответь одним словом: 'Работает'"},
                    {"role": "user", "content": "Привет"}
                ]
            })
        });

        const data = await response.json();
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': 'https://chearu-stack.github.io',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                message: 'Связь с Bothub установлена',
                bothubResponse: data.choices?.[0]?.message?.content || 'Ответ не распознан',
                rawData: data // для отладки
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': 'https://chearu-stack.github.io' },
            body: JSON.stringify({ error: error.message })
        };
    }
};
