/**
 * АДВОКАТ МЕДНОГО ГРОША — chat-logic.js (Ferrari Edition + Auto-Resize)
 */
document.addEventListener('DOMContentLoaded', () => {
    const API_STATUS = 'https://chea.onrender.com/check-status';
    const API_VERIFY = 'https://chea.onrender.com/verify-code';
    const BRIDGE = 'https://bothub-bridge.onrender.com/api/chat';

    const getFP = () => btoa(`${screen.width}${screen.height}${navigator.userAgent}${screen.colorDepth}`).substring(0, 12);
    const fp = getFP();
    
    let activeCode = null;
    let history = []; 

    const steps = [
        "🔍 Изучение правового поля...",
        "📂 Анализ материалов дела...",
        "⚖️ Сверка с судебной практикой...",
        "📑 Подготовка правовой позиции...",
        "📝 Формирование документа..."
    ];

    // --- ЛОГИКА АВТОРЕСАЙЗА ПОЛЯ ВВОДА ---
    const inputField = document.getElementById('user-input');
    if (inputField) {
        inputField.addEventListener('input', function() {
            this.style.height = 'auto'; // Сброс для пересчета
            const newHeight = Math.min(this.scrollHeight, 200); // Лимит 200px
            this.style.height = newHeight + 'px';
        });
    }

    async function sync() {
        try {
            const res = await fetch(`${API_STATUS}?fp=${fp}`);
            const data = await res.json();
            if (data.active) {
                const vRes = await fetch(API_VERIFY, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ fingerprint: fp })
                });
                const vData = await vRes.json();
                if (vData.success) {
                    activeCode = vData.code;
                    const pct = Math.round((vData.remaining / vData.caps_limit) * 100);
                    const bar = document.getElementById('res-bar');
                    if(bar) bar.style.width = pct + '%';
                }
            } else {
                window.location.href = 'index.html';
            }
        } catch (e) { console.error("Sync failed"); }
    }

    const sendMessage = async () => {
        const input = document.getElementById('user-input');
        const win = document.getElementById('chat-window');
        const text = input.value.trim();

        if (!text || !activeCode) return;

        // СБРОС ПОЛЯ (Текст + Высота)
        input.value = '';
        input.style.height = '45px'; 
        
        win.innerHTML += `<div class="msg msg-user">${text}</div>`;
        win.scrollTop = win.scrollHeight;

        history.push({role: 'user', content: text});

        const loader = document.createElement('div');
        loader.className = 'msg msg-bot msg-bot-loading';
        loader.innerHTML = `
            <div style="display: flex; align-items: center;">
                <i class="fas fa-gavel fa-spin" style="color: #e67e22; margin-right: 12px;"></i>
                <span id="dynamic-status" class="blink-status">Инициализация анализа...</span>
            </div>
        `;
        win.appendChild(loader);
        win.scrollTop = win.scrollHeight;

        let stepIdx = 0;
        const statusEl = loader.querySelector('#dynamic-status');
        const stepInterval = setInterval(() => {
            if (statusEl && stepIdx < steps.length) {
                statusEl.innerText = steps[stepIdx];
                stepIdx++;
            }
        }, 1800);

        try {
            const response = await fetch(BRIDGE, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ messages: history })
            });
            const d = await response.json();
            const aiText = d.choices[0].message.content;
            
            clearInterval(stepInterval);
            
            loader.innerHTML = aiText.replace(/\n/g, '<br>');
            history.push({role: 'assistant', content: aiText});
            win.scrollTop = win.scrollHeight;

            await fetch(API_VERIFY, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ fingerprint: fp, usage: aiText.length * 5 })
            });
            sync();

        } catch (err) {
            clearInterval(stepInterval);
            loader.innerHTML = "⚠️ Ошибка связи с правовым сервером.";
        }
    };

    document.getElementById('send-btn').onclick = sendMessage;
    document.getElementById('user-input').onkeydown = (e) => {
        if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    sync();
});
