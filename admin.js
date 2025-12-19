/**
 * АДМИН-ПАНЕЛЬ — Полная исправленная версия
 */
const API_BASE = 'https://chea.onrender.com';
const ADMIN_PASS = "amg2025";
let isAuthenticated = sessionStorage.getItem('adminAuth') === 'true';

// Проверка авторизации
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
    const updateTime = document.getElementById('lastUpdate');
    
    tbody.innerHTML = '<tr><td colspan="6" class="loading-row">Загрузка данных...</td></tr>';

    try {
        const response = await fetch(`${API_BASE}/get-pending`);
        const result = await response.json();
        
        let orders = result;
        if (result.body !== undefined) {
            orders = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
        }
        
        if (!Array.isArray(orders)) throw new Error('Некорректный формат данных');
        
        pendingEl.textContent = orders.filter(o => o.status === 'pending').length;
        activeEl.textContent = orders.filter(o => o.status === 'active').length;
        updateTime.textContent = new Date().toLocaleTimeString();
        
        tbody.innerHTML = '';
        
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-row">Нет заявок</td></tr>';
            return;
        }
        
        orders.forEach(order => {
            const row = document.createElement('tr');
            const tariffName = (order.tariff || order.package || 'basic').toLowerCase();
            
            row.innerHTML = `
                <td><strong class="order-code">${order.code}</strong></td>
                <td><span class="package-badge">${tariffName.toUpperCase()}</span></td>
                <td>${formatDate(order.created_at || order.date)}</td>
                <td>${getStatusBadge(order.status)}</td>
                <td>${order.caps_limit ? `${(order.remaining || order.caps_used || 0)} / ${order.caps_limit}` : '—'}</td>
                <td>
                    <div class="action-cell">
                        ${order.status === 'pending' 
                            ? `<button onclick="activateCode('${order.code}', '${tariffName}')" class="btn-activate">Активировать</button>` 
                            : '<span class="status-active">Активен</span>'}
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" class="error-row">Ошибка: ${error.message}</td></tr>`;
    }
}

async function activateCode(code, tariff) {
    if (!confirm(`Активировать ${code} (${tariff.toUpperCase()})?`)) return;
    
    try {
        const capsMap = { 'basic': 30000, 'pro': 60000, 'premium': 90000 };
        const limit = capsMap[tariff] || 30000;
        const url = `${API_BASE}/activate-code?code=${encodeURIComponent(code)}&limit=${limit}&active=true`;
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
            showNotification(`✅ Код активирован! Лимит: ${limit}`);
            loadOrders();
        } else {
            showNotification(`❌ Ошибка: ${result.error}`, 'error');
        }
    } catch (error) {
        showNotification(`❌ Ошибка сети`, 'error');
    }
}

function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getStatusBadge(status) {
    const s = String(status).toLowerCase();
    const badges = {
        'pending': '<span class="status-badge status-pending">Ожидает чека</span>',
        'active': '<span class="status-badge status-active">Активен</span>'
    };
    return badges[s] || `<span>${s}</span>`;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `admin-notification admin-notification-${type}`;
    notification.innerHTML = `<div class="notification-content">${message}</div>`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
}

document.getElementById('adminPass')?.addEventListener('keypress', (e) => { if (e.key === 'Enter') checkAuth(); });
setInterval(() => { if (sessionStorage.getItem('adminAuth') === 'true') loadOrders(); }, 30000);
