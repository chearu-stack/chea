// Константы из твоего конфига
const API_STATUS = 'https://chea.onrender.com/check-status';
const API_VERIFY = 'https://chea.onrender.com/verify-code';
const BRIDGE = 'https://bothub-bridge.onrender.com/api/chat';

const getFP = () => btoa(`${screen.width}${screen.height}${navigator.userAgent}`).substring(0, 12);
const fp = getFP();
let activeCode = null;

// Синхронизация лимитов
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
                document.getElementById('res-bar').style.width = pct + '%';
            }
        }
    } catch (e) { console.error("Sync failed"); }
}

// Отправка
document.getElementById('send-btn').onclick = async () => {
    const input = document.getElementById('user-input');
    const win = document.getElementById('chat-window');
    const text = input.value.trim();

    if (!text || !activeCode) return;

    input.value = '';
    win.innerHTML += `<div class="msg msg-user">${text}</div>`;
    win.scrollTop = win.scrollHeight;

    // Индикатор мысли
    const loader = document.createElement('div');
    loader.className = 'msg msg-bot';
    loader.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Анализирую правовое поле...`;
    win.appendChild(loader);

    try {
        const response = await fetch(BRIDGE, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ messages: [{role: 'user', content: text}] })
        });
        const d = await response.json();
        loader.innerHTML = d.choices[0].message.content;
        
        // Списание ресурса
        await fetch(API_VERIFY, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ fingerprint: fp, usage: loader.innerText.length })
        });
        sync();
    } catch (err) { loader.innerHTML = "Ошибка связи с сервером."; }
};

sync();
