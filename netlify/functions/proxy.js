// netlify/functions/proxy.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// === ФУНКЦИЯ ПОДСЧЁТА ТОКЕНОВ (ТА ЖЕ САМАЯ) ===
function countTokens(text) {
    if (!text) return 0;
    
    let tokens = 0;
    for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        
        if ((charCode >= 0x0400 && charCode <= 0x04FF)) {
            tokens += 0.4;
        } else if ((charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122)) {
            tokens += 0.3;
        } else if (charCode >= 48 && charCode <= 57) {
            tokens += 0.25;
        } else {
            tokens += 0.2;
        }
    }
    
    return Math.ceil(tokens * 1.1);
}

exports.handler = async (event) => {
    try {
        const { messages, fingerprint, code } = JSON.parse(event.body);
        
        if (!fingerprint || !code) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Требуются fingerprint и code' })
            };
        }
        
        // === 1. ПРОВЕРЯЕМ ЛИМИТ ===
        const { data: codeData, error: fetchError } = await supabase
            .from('codes')
            .select('*')
            .eq('fingerprint', fingerprint)
            .eq('code', code)
            .single();
            
        if (fetchError || !codeData || !codeData.is_active) {
            return {
                statusCode: 403,
                body: JSON.stringify({ error: 'Код не найден или неактивен' })
            };
        }
        
        const remaining = codeData.caps_limit - (codeData.caps_used || 0);
        if (remaining <= 0) {
            return {
                statusCode: 403,
                body: JSON.stringify({ error: 'Лимит CAPS исчерпан' })
            };
        }
        
        // === 2. ОТПРАВЛЯЕМ В BRIDGE ===
        const BRIDGE_URL = 'https://bothub-bridge.onrender.com/api/chat';
        
        const response = await fetch(BRIDGE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages })
        });
        
        if (!response.ok) {
            const error = await response.text();
            return {
                statusCode: response.status,
                body: error
            };
        }
        
        const data = await response.json();
        const aiText = data.choices?.[0]?.message?.content || '';
        
        // === 3. СЧИТАЕМ ТОКЕНЫ ВОТ ЗДЕСЬ, В PROXY.JS! ===
        // Считаем токены запроса (все сообщения)
        let requestTokens = 0;
        messages.forEach(msg => {
            requestTokens += countTokens(msg.content) + 5; // +5 на роль
        });
        
        // Считаем токены ответа
        const responseTokens = countTokens(aiText);
        const totalTokens = requestTokens + responseTokens;
        
        console.log(`📊 PROXY: Запрос=${requestTokens}, Ответ=${responseTokens}, Всего=${totalTokens}`);
        
        // === 4. ОБНОВЛЯЕМ БАЗУ ===
        const newCapsUsed = (codeData.caps_used || 0) + totalTokens;
        
        const { error: updateError } = await supabase
            .from('codes')
            .update({ 
                caps_used: newCapsUsed,
                last_used: new Date().toISOString()
            })
            .eq('id', codeData.id);
            
        if (updateError) {
            throw updateError;
        }
        
        // === 5. ВОЗВРАЩАЕМ ОТВЕТ ===
        return {
            statusCode: 200,
            body: JSON.stringify({
                ...data,
                tokens_info: {
                    estimated_tokens: totalTokens,
                    remaining: codeData.caps_limit - newCapsUsed
                }
            })
        };
        
    } catch (error) {
        console.error('Proxy error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
