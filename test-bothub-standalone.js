// test-bothub-standalone.js
const express = require('express');
const app = express();
app.use(express.json());

// ПРОСТОЙ CORS ДЛЯ ЛОКАЛЬНОГО ТЕСТА
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();
    next();
});

// ЕДИНСТВЕННЫЙ МАРШРУТ - прокси к Bothub
app.post('/proxy', async (req, res) => {
    const BOTHUB_API_KEY = process.env.BOTHUB_API_KEY || 'bh_3aD8fG4jK1LpQ9xR6sT2vW0yZ7bC4eA';
    
    try {
        const response = await fetch('https://api.bothub.io/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${BOTHUB_API_KEY}`
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 3001; // Другой порт, не 10000
app.listen(PORT, () => console.log(`Тестовый прокси Bothub запущен на порту ${PORT}`));
