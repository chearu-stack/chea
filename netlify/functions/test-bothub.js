const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// POST /test-bothub
router.post('/', async (req, res) => {
    console.log('🔍 /test-bothub called');
    
    const BOTHUB_API_KEY = process.env.BOTHUB_API_KEY;
    
    if (!BOTHUB_API_KEY) {
        console.error('❌ BOTHUB_API_KEY missing');
        return res.status(500).json({ 
            success: false, 
            error: 'BOTHUB_API_KEY not configured' 
        });
    }
    
    console.log('✅ BOTHUB_API_KEY loaded');
    
    try {
        // Данные из запроса или дефолтные
        const userPrompt = req.body.test_prompt || req.body.prompt || "Привет";
        const model = req.body.test_model || req.body.model || "gpt-4o-mini";
        
        console.log(`📤 Sending to Bothub: model=${model}, prompt=${userPrompt.substring(0, 50)}...`);
        
        const bothubResponse = await fetch('https://api.bothub.io/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${BOTHUB_API_KEY}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        "role": "system", 
                        "content": "Ты помощник. Ответь одним словом: 'Работает' на русском"
                    },
                    {
                        "role": "user", 
                        "content": userPrompt
                    }
                ],
                max_tokens: 100,
                temperature: 0.7
            })
        });

        const data = await bothubResponse.json();
        console.log('📥 Bothub response received');
        
        if (bothubResponse.ok) {
            const aiText = data.choices?.[0]?.message?.content || "Нет текста";
            console.log(`🤖 AI response: ${aiText}`);
            
            res.json({
                success: true,
                message: '✅ Связь с Bothub установлена!',
                bothubResponse: aiText,
                model: model,
                prompt: userPrompt,
                usage: data.usage,
                timestamp: new Date().toISOString()
            });
        } else {
            console.error('❌ Bothub API error:', data);
            res.status(bothubResponse.status).json({
                success: false,
                error: 'Bothub API error',
                details: data.error || data
            });
        }
        
    } catch (error) {
        console.error('🔥 Exception in test-bothub:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// GET /test-bothub (для простой проверки)
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'test-bothub endpoint is ready',
        method: 'Use POST with JSON body',
        example: {
            test_prompt: "Привет",
            test_model: "gpt-4o-mini"
        }
    });
});

module.exports = router;
