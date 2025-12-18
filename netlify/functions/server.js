const express = require('express');
const app = express();
app.use(express.json());

// ===== CORS Middleware (ВАЖНО: ОДИН РАЗ В НАЧАЛЕ) =====
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://chearu-stack.github.io');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    // Обработка preflight-запроса
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// Импортируем ваши функции
const generateCode = require('./generate-code');
const getPending = require('./get-pending');
const activateCode = require('./activate-code');
const verifyCode = require('./verify-code');

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

// Маршруты
app.post('/generate-code', async (req, res) => {
  try {
    const event = createNetlifyEvent(req);
    const result = await generateCode.handler(event);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/get-pending', async (req, res) => {
  try {
    const event = createNetlifyEvent(req);
    const result = await getPending.handler(event);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/activate-code', async (req, res) => {
  try {
    const event = createNetlifyEvent(req);
    const result = await activateCode.handler(event);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/verify-code', async (req, res) => {
  try {
    const event = createNetlifyEvent(req);
    const result = await verifyCode.handler(event);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`API запущен на порту ${PORT}`);
});
