/**
 * АДМИН-ПАНЕЛЬ — работа с реальной БД
 */
const API_BASE = 'https://chea.onrender.com';
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
        const response = await fetch(`${API_BASE}/get-pending`);
        
        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }
        
        // ✅ ВАЖНОЕ ИСПРАВЛЕНИЕ: Извлекаем данные из body
        const result = await response.json();
        console.log('Ответ от сервера:', result); // Для отладки
        
        // Проверяем, если ответ в формате Netlify Functions
        let orders = result;
        if (result.body !== undefined) {
            // Если body - строка, парсим её как JSON
            orders = typeof result.body === 'string' 
                ? JSON.parse(result.body) 
                : result.body;
        }
        
        // Убедимся, что orders - массив
        if (!Array.isArray(orders)) {
            console.error('Ожидался массив, но получено:', orders);
            throw new Error('Некорректный формат данных от сервера');
        }
        
        // Статистика (теперь orders точно массив)
        const pending = orders.filter(o => o.status === 'pending').length;
        const active = orders.filter(o => o.status === 'active').length;
        
        pendingEl.textContent = pending;
        activeEl.textContent = active;
        updateTime.textContent = new Date().toLocaleTimeString();
        
        // Очищаем таблицу
        tbody.innerHTML = '';
        
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-row">Нет заявок на активации</td></tr>';
            return;
        }
        
        // Заполняем таблицу
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

// Активация кода (ИСПРАВЛЕННАЯ ФУНКЦИЯ - GET запрос)
// Активация кода (УМНАЯ ФУНКЦИЯ — заправляет капсы по тарифу)
async function activateCode(code) {
    // 1. Пытаемся найти строку в таблице, чтобы вытащить название тарифа
    const rows = Array.from(document.querySelectorAll('#ordersBody tr'));
    const targetRow = rows.find(r => r.innerText.includes(code));
    const packageName = targetRow ? targetRow.querySelector('.package-badge').innerText.toLowerCase() : 'basic';

    if (!confirm(`Активировать доступ для кода:\n${code}\nТариф: ${packageName.toUpperCase()}\n\nПосле активации клиент получит доступ к чату.`)) {
        return;
    }
    
    try {
        // Определяем лимит согласно нашей "Адвокатской" сетке
        const capsMap = { 'basic': 30000, 'pro': 60000, 'premium': 90000 };
        const limit = capsMap[packageName] || 30000;

        // ✅ КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Передаем и код, и лимит, и флаг активации
        const url = `${API_BASE}/activate-code?code=${encodeURIComponent(code)}&limit=${limit}&active=true`;
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
            showNotification(`✅ Код ${code} активирован! Залито ${limit} капсов.`);
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
