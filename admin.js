/**
 * АДМИН-ПАНЕЛЬ — работа с реальной БД
 */
const API_BASE = 'https://chea.onrender.com'; // ✅ ИЗМЕНЕНО: новый адрес Render
const ADMIN_PASS = "amg2025";
let isAuthenticated = sessionStorage.getItem('adminAuth') === 'true';

// Проверка авторизации при загрузке
if (isAuthenticated) {
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('adminPage').style.display = 'block';
    loadOrders();
}

// Вход
function checkAuth() {
    const pass = document.getElementById('adminPass').value;
    if (pass === ADMIN_PASS) {
        sessionStorage.setItem('adminAuth', 'true');
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('adminPage').style.display = 'block';
        document.getElementById('errorMsg').style.display = 'none';
        loadOrders();
    } else {
        document.getElementById('errorMsg').style.display = 'block';
        document.getElementById('adminPass').value = '';
        document.getElementById('adminPass').focus();
    }
}

// Выход
function logout() {
    sessionStorage.removeItem('adminAuth');
    location.reload();
}

// Загрузка реальных заказов из БД
async function loadOrders() {
    const tbody = document.getElementById('ordersBody');
    const pendingEl = document.getElementById('pendingCount');
    const activeEl = document.getElementById('activeCount');
    const updateTime = document.getElementById('lastUpdate');
    
    tbody.innerHTML = '<tr><td colspan="6" class="loading-row">Загрузка данных...</td></tr>';

    try {
        const response = await fetch(`${API_BASE}/get-pending`); // ✅ Теперь запрос идёт на Render
        
        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }
        
        const orders = await response.json();
        
        // Статистика
        const pending = orders.filter(o => o.status === 'pending').length;
        const active = orders.filter(o => o.status === 'active').length;
        
        pendingEl.textContent = pending;
        activeEl.textContent = active;
        updateTime.textContent = new Date().toLocaleTimeString();
        
        // Очищаем таблицу
        tbody.innerHTML = '';
        
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-row">Нет заявок на активацию</td></tr>';
            return;
        }
        
        // Заполняем таблицу (6 колонок!)
        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong class="order-code">${order.code}</strong></td>
                <td><span class="package-badge">${order.package}</span></td>
                <td>${formatDate(order.created_at)}</td>
                <td>${getStatusBadge(order.status)}</td>
                <td>${order.caps_limit ? `${(order.caps_used || 0)} / ${order.caps_limit}` : '—'}</td>
                <td>
                    ${order.status === 'pending' 
                        ? `<button onclick="activateCode('${order.code}')" class="btn-activate">
                            <i class="fas fa-check"></i> Активировать
                           </button>`
                        : '<span class="no-action">—</span>'}
                </td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="error-row">
                    <i class="fas fa-exclamation-triangle"></i>
                    Ошибка загрузки: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Активация кода (реальная функция)
async function activateCode(code) {
    if (!confirm(`Активировать доступ для кода:\n${code}\n\nПосле активации клиент получит доступ к чату.`)) {
        return;
    }
    
    try {
        // ✅ ИЗМЕНЕНО: Теперь POST-запрос с телом в формате JSON
        const response = await fetch(`${API_BASE}/activate-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: code })
        });
        const result = await response.json();
        
        if (result.success) {
            showNotification(`✅ Код ${code} активирован! Клиенту открыт доступ.`);
            loadOrders(); // Обновляем список
        } else {
            showNotification(`❌ Ошибка: ${result.error || 'Неизвестная ошибка'}`, 'error');
        }
    } catch (error) {
        showNotification(`❌ Ошибка сети: ${error.message}`, 'error');
    }
}

// Уведомления
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `admin-notification admin-notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            ${message}
            <button onclick="this.parentElement.parentElement.remove()" class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Форматирование даты
function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Бейджи статусов
function getStatusBadge(status) {
    const badges = {
        'pending': '<span class="status-badge status-pending">Ожидает чека</span>',
        'active': '<span class="status-badge status-active">Активен</span>',
        'used': '<span class="status-badge status-used">Использован</span>'
    };
    return badges[status] || `<span class="status-badge">${status}</span>`;
}

// Enter для входа
document.getElementById('adminPass')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkAuth();
});

// Автообновление каждые 30 секунд
setInterval(() => {
    if (sessionStorage.getItem('adminAuth') === 'true') {
        loadOrders();
    }
}, 30000);
