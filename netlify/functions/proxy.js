const { createClient } = require('@supabase/supabase-js');

// Настройки из переменных окружения
const BOTHUB_API_KEY = process.env.BOTHUB_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// === ФУНКЦИЯ ПОДСЧЁТА ТОКЕНОВ ===
function countTokens(text) {
    if (!text || typeof text !== 'string') return 0;
    
    let tokenCount = 0;
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        
        if ((charCode >= 0x0400 && charCode <= 0x04FF) || 
            (charCode >= 0x0410 && charCode <= 0x044F)) {
            tokenCount += 0.4;
        } else if ((charCode >= 65 && charCode <= 90) || 
                   (charCode >= 97 && charCode <= 122)) {
            tokenCount += 0.285;
        } else if (charCode >= 48 && charCode <= 57) {
            tokenCount += 0.2;
        } else if (charCode === 32 || charCode === 10 || charCode === 9) {
            tokenCount += 0.166;
        } else if ('.,!?;:"\'()[]{}<>-–—=+*/\\|@#$%^&*'.includes(String.fromCharCode(charCode))) {
            tokenCount += 0.125;
        } else {
            tokenCount += 0.25;
        }
    }
    return Math.ceil(tokenCount * 1.1);
}

// === ОСНОВНОЙ ОБРАБОТЧИК ===
exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const payload = JSON.parse(event.body);
        const { messages, userCode } = payload; // Модель убрана - её задаёт Bridge

        // === 1. ОТПРАВКА В BRIDGE (чтобы сохранить "личность" адвоката) ===
        const BRIDGE_URL = 'https://bothub-bridge.onrender.com/api/chat';
        const bridgeResponse = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages }) // Bridge сам добавит системный промпт
        });

        if (!bridgeResponse.ok) {
            const errorText = await bridgeResponse.text();
            throw new Error(`Bridge Error: ${bridgeResponse.status} - ${errorText}`);
        }

        const data = await bridgeResponse.json();
        
        if (!data.choices || !data.choices[0]) {
            throw new Error('Некорректный ответ от Bridge');
        }

        const aiText = data.choices[0].message.content;

        // === 2. УМНЫЙ ПОДСЧЁТ ТОКЕНОВ (БЕЗ ПОВТОРНОГО УЧЁТА ИСТОРИИ) ===
        // Считаем ТОЛЬКО токены последнего вопроса пользователя + ответа бота
        // Чтобы избежать многократного списания за одну и ту же историю
        
        // 2A. Последний вопрос пользователя (последнее сообщение с role: 'user')
        const userMessages = messages.filter(m => m.role === 'user');
        const lastUserQuestion = userMessages[userMessages.length - 1]?.content || '';
        const questionTokens = countTokens(lastUserQuestion);
        
        // 2B. Ответ бота
        const answerTokens = countTokens(aiText);
        
        // 2C. Добавляем фиксированную плату за системный промпт и форматирование
        const SYSTEM_OVERHEAD = 150; // Токены на системный промпт "Ты адвокат..."
        const FORMATTING_OVERHEAD = 30; // Токены на форматирование сообщений
        
        // 2D. ИТОГО токенов для списания (без учета всей истории!)
        const tokensToCharge = SYSTEM_OVERHEAD + FORMATTING_OVERHEAD + questionTokens + answerTokens;
        
        console.log(`🧮 Токены для списания: вопрос=${questionTokens}, ответ=${answerTokens}, накладные=${SYSTEM_OVERHEAD + FORMATTING_OVERHEAD}, всего=${tokensToCharge}`);

        // === 3. ОБНОВЛЕНИЕ БАЗЫ (БЕЗ ДУБЛИРОВАНИЯ!) ===
        if (tokensToCharge > 0 && userCode) {
            try {
                // Получаем текущий баланс
                const { data: codeData, error: fetchError } = await supabase
                    .from('access_codes')
                    .select('caps_used, caps_limit')
                    .eq('code', userCode)
                    .single();

                if (!fetchError && codeData) {
                    const currentCapsUsed = codeData.caps_used || 0;
                    const newCapsUsed = currentCapsUsed + tokensToCharge;
                    
                    // Проверяем, не превысит ли списание лимит
                    if (newCapsUsed > codeData.caps_limit) {
                        console.warn(`⚠️ Списание ${tokensToCharge} токенов превысит лимит для кода ${userCode}`);
                        // Можно вернуть ошибку или списать только до лимита
                    }
                    
                    // ОДИН ЗАПРОС на обновление - без RPC!
                    const { error: updateError } = await supabase
                        .from('access_codes')
                        .update({ 
                            caps_used: newCapsUsed,
                            last_activity: new Date().toISOString()
                        })
                        .eq('code', userCode);

                    if (updateError) {
                        console.error("❌ Ошибка обновления БД:", updateError.message);
                    } else {
                        console.log(`✅ База обновлена: код ${userCode}, +${tokensToCharge} токенов, итого ${newCapsUsed}/${codeData.caps_limit}`);
                    }
                }
            } catch (dbError) {
                console.error("⚠️ Ошибка работы с БД:", dbError.message);
                // НЕ ПАДАЕМ - чат продолжает работать
            }
        }

        // === 4. ВОЗВРАЩАЕМ ОТВЕТ ===
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data) // Возвращаем чистый ответ от Bridge
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
