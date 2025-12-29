// ========== КОНФИГУРАЦИЯ ==========
const API_BASE = 'https://chea.onrender.com';
const ADMIN_PASS = "amg2025";

// ========== АВТОРИЗАЦИЯ ==========
window.addEventListener('DOMContentLoaded', function() {
    if (sessionStorage.getItem('adminAuth') === 'true') {
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('adminPage').style.display = 'block';
        loadActiveCodes();
    } else {
        document.getElementById('loginOverlay').style.display = 'flex';
        document.getElementById('adminPage').style.display = 'none';
        
        setTimeout(() => {
            const passInput = document.getElementById('adminPass');
            if (passInput) passInput.focus();
        }, 100);
    }
});

function checkAuth() {
    const input = document.getElementById('adminPass');
    const enteredPass = input ? input.value : '';
    
    if (enteredPass === ADMIN_PASS) {
        sessionStorage.setItem('adminAuth', 'true');
        
        const loginBtn = document.querySelector('.admin-login-btn');
        if (loginBtn) {
            loginBtn.textContent = '✅ Успешно!';
            loginBtn.style.background = '#38a169';
            loginBtn.disabled = true;
        }
        
        setTimeout(() => {
            location.reload();
        }, 800);
    } else {
        alert("❌ Неверный пароль");
        if (input) {
            input.value = '';
            input.focus();
            input.style.borderColor = '#e53e3e';
            setTimeout(() => input.style.borderColor = '', 2000);
        }
    }
}

document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && document.getElementById('loginOverlay').style.display !== 'none') {
        checkAuth();
    }
});

function logout() {
    sessionStorage.removeItem('adminAuth');
    location.reload();
}

// ========== ЛОГИКА АКТИВНЫХ КОДОВ ==========
async function loadActiveCodes() {
    const tbody = document.getElementById('activeCodesBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5">⏳ Загрузка...</td></tr>';

    try {
        const response = await fetch(`${API_BASE}/get-active-codes`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const activeCodes = await response.json();
        tbody.innerHTML = '';

        if (!activeCodes || activeCodes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">Нет активных кодов</td></tr>';
            return;
        }

        activeCodes.forEach(code => {
            const usagePercent = code.caps_limit > 0 
                ? Math.round((code.caps_used / code.caps_limit) * 100)
                : 0;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${code.code}</strong></td>
                <td><span class="package-badge">${code.package || 'BASIC'}</span></td>
                <td>${code.activated_at ? new Date(code.activated_at).toLocaleDateString('ru-RU') : '—'}</td>
                <td>${code.caps_used || 0} / ${code.caps_limit || 0} (${usagePercent}%)</td>
                <td>
                    <button onclick="deactivateCode('${code.code}')" class="btn-deactivate">
                        ⏸️ Деактивировать
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5">❌ Ошибка: ${error.message}</td></tr>`;
    }
}

async function deactivateCode(code) {
    if (!confirm(`Деактивировать код ${code}?`)) return;
    
    try {
        const params = new URLSearchParams({ 
            code: code,
            is_active: 'false'
        });
        
        const response = await fetch(`${API_BASE}/activate-code?${params.toString()}`);
        const data = await response.json();
        
        if (data.success || (response.ok && !data.error)) {
            alert(`✅ Код ${code} деактивирован`);
            loadActiveCodes();
        } else {
            alert(`❌ Ошибка: ${data.error || data.message}`);
        }
    } catch (error) {
        alert('❌ Ошибка связи с сервером');
    }
}

setInterval(() => {
    if (sessionStorage.getItem('adminAuth') === 'true') {
        loadActiveCodes();
    }
}, 30000);

// ========== ЭКСПОРТ ==========
window.checkAuth = checkAuth;
window.logout = logout;
window.loadActiveCodes = loadActiveCodes;
window.deactivateCode = deactivateCode;
