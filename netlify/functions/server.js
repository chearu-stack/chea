const express = require('express');
const app = express();
app.use(express.json());

// Твои функции
const generateCode = require('./generate-code');
const getPending = require('./get-pending');
const activateCode = require('./activate-code');
const verifyCode = require('./verify-code');

// Маршруты
app.post('/generate-code', async (req, res) => {
  try {
    const result = await generateCode.handler(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/get-pending', async (req, res) => {
  try {
    const result = await getPending.handler();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/activate-code', async (req, res) => {
  try {
    const result = await activateCode.handler(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/verify-code', async (req, res) => {
  try {
    const result = await verifyCode.handler(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API запущен на порту ${PORT}`);
});
