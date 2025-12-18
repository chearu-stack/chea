// netlify/functions/test-proxy-exact.js
exports.handler = async (event) => {
    const BOTHUB_API_KEY = process.env.BOTHUB_API_KEY;
    
    if (!BOTHUB_API_KEY) {
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'BOTHUB_API_KEY not configured' })
        };
    }

    try {
        // ТОЧНО ТАКОЕ ЖЕ ТЕЛО ЗАПРОСА, КАК В ВАШЕМ ВИДЖЕТЕ
        const payload = JSON.parse(event.body);
        
        // ПРЯМОЙ ЗАПРОС К BOTHUB API (как в Netlify Proxy)
        const response = await fetch('https://api.bothub.io/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${BOTHUB_API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        
        // ТОЧНО ТАКОЙ ЖЕ ОТВЕТ, КАК ОЖИДАЕТ ВАШ ВИДЖЕТ
        return {
            statusCode: response.status,
            headers: { 
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: error.message })
        };
    }
};
