/**
 * АДВОКАТ МЕДНОГО ГРОША — chat-logic.js (Ferrari Final Edition)
 */
document.addEventListener('DOMContentLoaded', () => {
    const API_STATUS = 'https://chea.onrender.com/check-status';
    const API_VERIFY = 'https://chea.onrender.com/verify-code';
    const BRIDGE = 'https://bothub-bridge.onrender.com/api/chat';

    const getFP = () => btoa(`${screen.width}${screen.height}${navigator.userAgent}${screen.colorDepth}`).substring(0, 12);
    const fp = getFP();
    
    let activeCode = null;
    let history = []; 
    const readyDocs = { pretenzia: null, rospotreb: null, prokuror: null };

    const steps = [
        "🔍 Изучение правового поля...",
        "📂 Анализ материалов дела...",
        "⚖️ Сверка с судебной практикой...",
        "📑 Подготовка правовой позиции...",
        "📝 Формирование документа..."
    ];

    // --- 1. ПАМЯТЬ ПРИ ПЕРЕЗАГРУЗКЕ ---
    const savedHistory = localStorage.getItem(`chat_history_${fp}`);
    if (savedHistory) {
        history = JSON.parse(savedHistory);
        const win = document.getElementById('chat-window');
        history.forEach(msg => {
            const className = msg.role === 'user' ? 'msg-user' : 'msg-bot';
            win.innerHTML += `<div class="msg ${className}">${msg.content.replace(/\n/g, '<br>')}</div>`;
            updateVault(msg.content); // Восстанавливаем кнопки документов в шапке
        });
        win.scrollTop = win.scrollHeight;
    }

    // --- 2. АВТОРЕСАЙЗА ПОЛЯ ВВОДА ---
    const inputField = document.getElementById('user-input');
    if (inputField) {
        inputField.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 200) + 'px';
        });
    }

    // --- 3. СКАНЕР ДОКУМЕНТОВ (ВАРКА В ПРОЦЕССЕ) ---
    function updateVault(text) {
        const checkList = [
            { key: 'pretenzia', trigger: 'ПРЕТЕНЗИЯ', id: 'btn-pretenzia' },
            { key: 'rospotreb', trigger: 'РОСПОТРЕБ', id: 'btn-rospotreb' },
            { key: 'prokuror', trigger: 'ПРОКУРАТУР', id: 'btn-prokuror' }
        ];
        checkList.forEach(item => {
            if (text.toUpperCase().includes(item.trigger)) {
                readyDocs[item.key] = text;
                const btn = document.getElementById(item.id);
                if (btn) {
                    btn.classList.remove('doc-inactive');
                    btn.classList.add('doc-active');
                    btn.onclick = () => downloadDoc(`${item.key}.txt`, readyDocs[item.key]);
                }
            }
        });
    }

    // --- 4. СИНХРОНИЗАЦИЯ CAPS И БАРА ---
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
                    const remaining = vData.remaining;
                    const total = vData.caps_limit || 100000;
                    const pct = Math.max(5, Math.min(100, Math.round((remaining / total) * 100)));
                    
                    const bar = document.getElementById('res-bar');
                    if(bar) {
                        bar.style.width = pct + '%';
                        bar.style.backgroundColor = pct < 20 ? '#e53e3e' : (pct < 50 ? '#dd6b20' : '#38a169');
                    }
                }
            } else { window.location.href = 'index.html'; }
        } catch (e) { console.error("Sync failed"); }
    }

    // --- 5. ФУНКЦИЯ СКАЧИВАНИЯ ---
    window.downloadDoc = (filename, text) => {
        const element = document.createElement('a');
        const cleanText = text.replace(/<br>/g, '\n');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(cleanText));
        element.setAttribute('download', filename);
        element.click();
    };

    // --- 6. ОТПРАВКА СООБЩЕНИЯ ---
    const sendMessage = async () => {
        const input = document.getElementById('user-input');
        const win = document.getElementById('chat-window');
        const text = input.value.trim();

        if (!text || !activeCode) return;

        input.value = '';
        input.style.height = '45px';
        win.innerHTML += `<div class="msg msg-user">${text}</div>`;
        win.scrollTop = win.scrollHeight;

        history.push({role: 'user', content: text});
        localStorage.setItem(`chat_history_${fp}`, JSON.stringify(history));

        const loader = document.createElement('div');
        loader.className = 'msg msg-bot msg-bot-loading';
        loader.innerHTML = `<div style="display:flex;align-items:center;"><i class="fas fa-gavel fa-spin" style="color:#e67e22;margin-right:12px;"></i><span id="dynamic-status" class="blink-status">Запуск системы...</span></div>`;
        win.appendChild(loader);
        win.scrollTop = win.scrollHeight;

        let stepIdx = 0;
        const statusEl = loader.querySelector('#dynamic-status');
        const stepInterval = setInterval(() => {
            if (statusEl && stepIdx < steps.length) { statusEl.innerText = steps[stepIdx]; stepIdx++; }
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
            localStorage.setItem(`chat_history_${fp}`, JSON.stringify(history));
            
            updateVault(aiText); // Проверяем, не "сварился" ли документ
            win.scrollTop = win.scrollHeight;

            await fetch(API_VERIFY, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ fingerprint: fp, usage: aiText.length * 3 }) // Чуть снизил множитель
            });
            sync();
        } catch (err) {
            clearInterval(stepInterval);
            loader.innerHTML = "⚠️ Ошибка связи. Проверьте соединение.";
        }
    };

    // --- 7. ГЛОБАЛЬНЫЕ КОМАНДЫ ---
    window.clearChat = () => {
        if (confirm("Удалить все материалы дела?")) {
            localStorage.removeItem(`chat_history_${fp}`);
            location.reload();
        }
    };

    document.getElementById('send-btn').onclick = sendMessage;
    document.getElementById('user-input').onkeydown = (e) => {
        if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    sync();
});
