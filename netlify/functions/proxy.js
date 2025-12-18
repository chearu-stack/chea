// netlify/functions/proxy.js
const BOTHUB_API_KEY = process.env.BOTHUB_API_KEY;

exports.handler = async (event) => {
    if (!BOTHUB_API_KEY) {
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'BOTHUB_API_KEY не настроен' })
        };
    }

    try {
        const payload = JSON.parse(event.body);
        
        const response = await fetch('https://api.bothub.io/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${BOTHUB_API_KEY}`
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        return {
            statusCode: 200,
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
