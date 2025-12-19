const express = require('express');
const app = express();
app.use(express.json());

// ===== УНИВЕРСАЛЬНЫЙ CORS ДЛЯ ВСЕХ МАРШРУТОВ =====
app.use((req, res, next) => {
    let allowedOrigin;
    if (req.path.startsWith('/proxy')) {
        allowedOrigin = '*';
    } else {
        allowedOrigin = 'https://chearu-stack.github.io';
    }
    
    res.header('Access-Control-Allow-Origin', allowedOrigin);
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// Импортируем твои функции
const generateCode = require('./generate-code');
const getPending = require('./get-pending');
const activateCode = require('./activate-code');
const verifyCode = require('./verify-code');
const testBothub = require('./test-bothub');
const proxy = require('./proxy');

// Вспомогательная функция для создания "event" из запроса Express
const createNetlifyEvent = (req) => {
    return {
        httpMethod: req.method,
        path: req.path,
        queryStringParameters: req.query,
        body: req.method === 'POST' ? JSON.stringify(req.body) : null,
        headers: req.headers,
        isBase64Encoded: false
    };
};

// УНИВЕРСАЛЬНЫЙ ОБРАБОТЧИК (Исправляет выдачу данных)
const handleRequest = (handler) => async (req, res) => {
    try {
        const event = createNetlifyEvent(req);
        const result = await handler.handler(event);
        
        // Устанавливаем статус и заголовки из функции, отправляем тело
        res.status(result.statusCode || 200)
           .set(result.headers || {})
           .send(result.body);
           
    } catch (error) {
        console.error(`❌ Ошибка в маршруте ${req.path}:`, error.message);
        res.status(500).json({ error: error.message });
    }
};

// МАРШРУТЫ (С поддержкой коротких и длинных путей)

// 1. Генерация кода
app.post('/generate-code', handleRequest(generateCode));
app.post('/.netlify/functions/generate-code', handleRequest(generateCode));
app.post('/.netlify/functions/server/generate-code', handleRequest(generateCode));

// 2. Ожидающие коды
app.get('/get-pending', handleRequest(getPending));
app.get('/.netlify/functions/get-pending', handleRequest(getPending));

// 3. Активация
app.post('/activate-code', handleRequest(activateCode));
app.post('/.netlify/functions/activate-code', handleRequest(activateCode));

// 4. Проверка
app.post('/verify-code', handleRequest(verifyCode));
app.post('/.netlify/functions/verify-code', handleRequest(verifyCode));

// 5. Тест Bothub
app.post('/test-bothub', handleRequest(testBothub));
app.post('/.netlify/functions/test-bothub', handleRequest(testBothub));

// 6. Прокси
app.post('/proxy', handleRequest(proxy));
app.post('/.netlify/functions/proxy', handleRequest(proxy));

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ API запущен и слушает порт ${PORT}`);
});
