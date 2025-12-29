// ========== КОНФИГУРАЦИЯ ==========
const API_BASE = 'https://chea.onrender.com';
const ADMIN_PASS = "amg2025";

// ========== АВТОРИЗАЦИЯ ==========
window.addEventListener('DOMContentLoaded', function() {
    if (sessionStorage.getItem('adminAuth') === 'true') {
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('adminPage').style.display = 'block';
        loadPromoCodes();
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

// ========== ЛОГИКА ПРОМО-КОДОВ ==========
async function loadPromoCodes() {
    const tbody = document.getElementById('promoCodesBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5">⏳ Загрузка...</td></tr>';

    try {
        const response = await fetch(`${API_BASE}/get-promo-codes`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const promoCodes = await response.json();
        tbody.innerHTML = '';

        if (!promoCodes || promoCodes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">Нет промо-кодов</td></tr>';
            return;
        }

        promoCodes.forEach(promo => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${promo.code}</strong></td>
                <td><span class="package-badge">${promo.discount || 0}%</span></td>
                <td>${promo.used_count || 0} / ${promo.usage_limit || '∞'}</td>
                <td>${promo.expires_at ? new Date(promo.expires_at).toLocaleDateString('ru-RU') : '—'}</td>
                <td>
                    <button onclick="deletePromoCode('${promo.code}')" class="btn-delete">
                        🗑️ Удалить
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5">❌ Ошибка: ${error.message}</td></tr>`;
    }
}

async function deletePromoCode(code) {
    if (!confirm(`Удалить промо-код ${code}?`)) return;
    
    try {
        const params = new URLSearchParams({ code: code });
        const response = await fetch(`${API_BASE}/delete-promo-code?${params.toString()}`);
        const data = await response.json();
        
        if (data.success || (response.ok && !data.error)) {
            alert(`✅ Промо-код ${code} удален`);
            loadPromoCodes();
        } else {
            alert(`❌ Ошибка: ${data.error || data.message}`);
        }
    } catch (error) {
        alert('❌ Ошибка связи с сервером');
    }
}

setInterval(() => {
    if (sessionStorage.getItem('adminAuth') === 'true') {
        loadPromoCodes();
    }
}, 30000);

// ========== ЭКСПОРТ ==========
window.checkAuth = checkAuth;
window.logout = logout;
window.loadPromoCodes = loadPromoCodes;
window.deletePromoCode = deletePromoCode;
