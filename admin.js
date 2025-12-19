const API_BASE = 'https://chea.onrender.com';
const ADMIN_PASS = "amg2025";
let isAuthenticated = sessionStorage.getItem('adminAuth') === 'true';

if (isAuthenticated) {
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('adminPage').style.display = 'block';
    loadOrders();
}

function checkAuth() {
    const pass = document.getElementById('adminPass').value;
    if (pass === ADMIN_PASS) {
        sessionStorage.setItem('adminAuth', 'true');
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('adminPage').style.display = 'block';
        loadOrders();
    } else {
        document.getElementById('errorMsg').style.display = 'block';
    }
}

function logout() {
    sessionStorage.removeItem('adminAuth');
    location.reload();
}

async function loadOrders() {
    const tbody = document.getElementById('ordersBody');
    const pendingEl = document.getElementById('pendingCount');
    const activeEl = document.getElementById('activeCount');
    
    tbody.innerHTML = '<tr><td colspan="6" class="loading-row">Загрузка...</td></tr>';

    try {
        const response = await fetch(`${API_BASE}/get-pending`);
        const orders = await response.json();
        
        // Статистика
        pendingEl.textContent = orders.filter(o => o.status === 'pending').length;
        activeEl.textContent = orders.filter(o => o.status === 'active').length;
        
        tbody.innerHTML = '';
        
        orders.forEach(order => {
            const row = document.createElement('tr');
            // Исправляем прочерки: берем tariff, если нет - package
            const displayTariff = (order.tariff || order.package || '—').toUpperCase();
            
            row.innerHTML = `
                <td><strong>${order.code}</strong></td>
                <td><span class="package-badge">${displayTariff}</span></td>
                <td>${formatDate(order.created_at || order.date)}</td>
                <td>${getStatusBadge(order.status)}</td>
                <td>${order.caps_limit ? `${order.remaining || 0} / ${order.caps_limit}` : '—'}</td>
                <td>
                    ${order.status === 'pending' 
                        ? `<button onclick="activateCode('${order.code}')" class="btn-activate">Активировать</button>` 
                        : '—'}
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="6">Ошибка: ${e.message}</td></tr>`;
    }
}

async function activateCode(code) {
    // Вычисляем лимит по старинке, чтобы не ломать логику
    const rows = Array.from(document.querySelectorAll('tr'));
    const row = rows.find(r => r.innerText.includes(code));
    const tariff = row ? row.querySelector('.package-badge').innerText.toLowerCase() : 'basic';
    
    const caps = { 'basic': 30000, 'pro': 60000, 'premium': 90000 };
    const limit = caps[tariff] || 30000;

    if (!confirm(`Активировать ${code} на ${limit} капсов?`)) return;

    try {
        // ТВОЙ рабочий URL (проверь его еще раз)
        const res = await fetch(`${API_BASE}/activate-code?code=${code}&limit=${limit}&active=true`);
        const data = await res.json();
        
        if (data.success) {
            alert('Успешно активировано!');
            loadOrders();
        } else {
            alert('Ошибка: ' + data.error);
        }
    } catch (e) {
        alert('Ошибка сети');
    }
}

function formatDate(d) {
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleString('ru-RU');
}

function getStatusBadge(s) {
    if (s === 'pending') return '<span style="color: orange">Ожидает</span>';
    if (s === 'active') return '<span style="color: green">Активен</span>';
    return s;
}

setInterval(() => { if(isAuthenticated) loadOrders(); }, 30000);
