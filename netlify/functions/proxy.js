const { createClient } = require('@supabase/supabase-js');

// Настройки
const BOTHUB_API_KEY = process.env.BOTHUB_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// === ТОЧНАЯ ФУНКЦИЯ ПОДСЧЁТА ТОКЕНОВ (как в bridge) ===
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

// === ПОДСЧЁТ ТОКЕНОВ ДЛЯ ВСЕГО КОНТЕКСТА ===
function countConversationTokens(messages) {
    // Твой системный промпт "Адвокат Медного Гроша" весит ~1050 токенов.
    // Мы закладываем это число как базу для каждого запроса.
    const SYSTEM_PROMPT_WEIGHT = 1050; 
    
    let totalTokens = SYSTEM_PROMPT_WEIGHT;
    
    // Считаем токены всей истории сообщений
    messages.forEach(msg => {
        totalTokens += countTokens(msg.content) + 10; // +10 на технические заголовки
    });
    
    return totalTokens;
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
        const { messages, userCode } = payload;

        // === 1. ОТПРАВКА В BRIDGE ===
        const BRIDGE_URL = 'https://bothub-bridge.onrender.com/api/chat';
        
        console.log(`📤 Отправка в Bridge. Сообщений в истории: ${messages.length}`);
        
        const bridgeResponse = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages })
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

        // === 2. ЧЕСТНЫЙ ПОДСЧЁТ: ВЕСЬ КОНТЕКСТ + ОТВЕТ ===
        // 2A. Токены всего запроса (вся история + твой промпт 1050 токенов)
        const requestTokens = countConversationTokens(messages);
        
        // 2B. Токены ответа
        const responseTokens = countTokens(aiText);
        
        // 2C. ИТОГО (именно столько KeyAPI посчитал на своих серверах)
        const totalTokens = requestTokens + responseTokens;
        
        console.log(`🧮 ЧЕСТНЫЙ БИЛЛИНГ:`);
        console.log(`   • Системный промпт: 1050 токенов`);
        console.log(`   • История (${messages.length} сообщ.): ${requestTokens - 1050} токенов`);
        console.log(`   • Ответ: ${responseTokens} токенов`);
        console.log(`   • ВСЕГО К ОПЛАТЕ: ${totalTokens} токенов`);

        // === 3. ОБНОВЛЕНИЕ БАЗЫ ===
        if (totalTokens > 0 && userCode) {
            try {
                // Получаем текущий баланс
                const { data: codeData, error: fetchError } = await supabase
                    .from('access_codes')
                    .select('caps_used, caps_limit')
                    .eq('code', userCode)
                    .single();

                if (!fetchError && codeData) {
                    const currentCapsUsed = codeData.caps_used || 0;
                    const newCapsUsed = currentCapsUsed + totalTokens;
                    
                    // Проверяем лимит
                    if (newCapsUsed > codeData.caps_limit) {
                        console.error(`❌ Превышение лимита: ${userCode} (${newCapsUsed} > ${codeData.caps_limit})`);
                        
                        // Возвращаем ошибку - нельзя превысить лимит
                        return {
                            statusCode: 403,
                            headers,
                            body: JSON.stringify({ 
                                error: 'Лимит CAPS исчерпан',
                                code: 'CAPS_LIMIT_EXCEEDED',
                                remaining: codeData.caps_limit - currentCapsUsed,
                                required: totalTokens
                            })
                        };
                    }
                    
                    // Списание
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
                        console.log(`✅ Списано: ${totalTokens} токенов`);
                        console.log(`   Баланс: ${newCapsUsed}/${codeData.caps_limit} CAPS`);
                    }
                }
            } catch (dbError) {
                console.error("⚠️ Ошибка БД:", dbError.message);
                // НЕ падаем - пользователь уже получил ответ
            }
        }

        // === 4. ВОЗВРАТ ОТВЕТА ===
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
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
