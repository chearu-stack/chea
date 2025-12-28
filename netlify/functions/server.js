const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const app = express();
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// CORS
app.use((req, res, next) => {
    let allowedOrigin = req.path.startsWith('/proxy') ? '*' : 'https://chearu-stack.github.io';
    res.header('Access-Control-Allow-Origin', allowedOrigin);
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();
    next();
});

// Импорты
const generateCode = require('./generate-code');
const getPending = require('./get-pending');
const activateCode = require('./activate-code');
const verifyCode = require('./verify-code');
const testBothub = require('./test-bothub');
const proxy = require('./proxy');
const deleteCode = require('./delete-code'); // ← ДОБАВИЛИ

// Вспомогательная функция
const createNetlifyEvent = (req) => ({
    httpMethod: req.method,
    path: req.path,
    queryStringParameters: req.query,
    body: req.method === 'POST' ? JSON.stringify(req.body) : null,
    headers: req.headers,
    isBase64Encoded: false
});

const handleRequest = (handler) => async (req, res) => {
    try {
        const event = createNetlifyEvent(req);
        const result = await handler.handler(event);
        res.status(result.statusCode || 200)
           .set(result.headers || {})
           .send(result.body);
    } catch (error) {
        console.error(`❌ Ошибка в маршруте ${req.path}:`, error.message);
        res.status(500).json({ error: error.message });
    }
};

// МАРШРУТЫ
app.get('/check-status', async (req, res) => {
    const { fp } = req.query;
    if (!fp) return res.json({ active: false });
    try {
        const { data, error } = await supabase
            .from('access_codes')
            .select('is_active')
            .eq('fingerprint', fp)
            .eq('is_active', true)
            .maybeSingle();
        if (error) throw error;
        res.json({ active: !!data });
    } catch (err) {
        console.error("Ошибка Бодрячка:", err.message);
        res.json({ active: false });
    }
});

app.post('/generate-code', handleRequest(generateCode));
app.get('/get-pending', handleRequest(getPending));
app.all('/activate-code', handleRequest(activateCode));
app.post('/verify-code', handleRequest(verifyCode));
app.post('/test-bothub', handleRequest(testBothub));
app.post('/proxy', handleRequest(proxy));
app.all('/delete-code', handleRequest(deleteCode)); // ← ДОБАВИЛИ

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ API запущен и слушает порт ${PORT}`);
});
