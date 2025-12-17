// Конфигурация
const API_BASE = 'https://ваш-сайт.netlify.app/.netlify/functions';
const ADMIN_PASS = "amg2025"; // Временный пароль (потом заменить на функцию)

// Элементы DOM
let loginOverlay, adminPage, adminPassInput, errorMsg;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    loginOverlay = document.getElementById('loginOverlay');
    adminPage = document.getElementById('adminPage');
    adminPassInput = document.getElementById('adminPass');
    errorMsg = document.getElementById('errorMsg');
    
    // Проверяем авторизацию в sessionStorage
    if (sessionStorage.getItem('adminAuth') === 'true') {
        loginOverlay.style.display = 'none';
        adminPage.style.display = 'block';
        loadOrders();
    }
    
    // Enter для входа
    adminPassInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') checkAuth();
    });
});

// Проверка пароля
function checkAuth() {
    const pass = adminPassInput.value.trim();
    
    if (pass === ADMIN_PASS) {
        // Успешный вход
        sessionStorage.setItem('adminAuth', 'true');
        loginOverlay.style.display = 'none';
        adminPage.style.display = 'block';
        errorMsg.style.display = 'none';
        loadOrders();
    } else {
        // Ошибка
        errorMsg.style.display = 'block';
        adminPassInput.value = '';
        adminPassInput.focus();
    }
}

// Выход
function logout() {
    sessionStorage.removeItem('adminAuth');
    location.reload();
}

// Загрузка списка заказов из БД
async function loadOrders() {
    const tbody = document.getElementById('ordersBody');
    const pendingEl = document.getElementById('pendingCount');
    const activeEl = document.getElementById('activeCount');
    const updateTime = document.getElementById('lastUpdate');
    
    // Показываем загрузку
    tbody.innerHTML = '<tr><td colspan="5" class="loading-row">Загрузка данных...</td></tr>';
    
    try {
        // Запрос к Netlify Function
        const response = await fetch(`${API_BASE}/get-pending`);
        
        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }
        
        const orders = await response.json();
        
        // Обновляем статистику
        const pending = orders.filter(o => o.status === 'pending').length;
        const active = orders.filter(o => o.status === 'active').length;
        
        pendingEl.textContent = pending;
        activeEl.textContent = active;
        updateTime.textContent = new Date().toLocaleTimeString();
        
        // Очищаем таблицу
        tbody.innerHTML = '';
        
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="empty-row">Нет заявок на активацию</td></tr>';
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
                <td>${getActionButton(order.status, order.code)}</td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="error-row">
                    <i class="fas fa-exclamation-triangle"></i>
                    Ошибка загрузки: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Активация кода доступа
async function activateOrder(code) {
    if (!confirm(`Активировать доступ для кода:\n${code}\n\nПосле активации клиент получит доступ к чату.`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/activate-code?code=${encodeURIComponent(code)}`);
        const result = await response.json();
        
        if (result.success) {
            showNotification(`✅ Код ${code} активирован!`);
            loadOrders(); // Обновляем список
        } else {
            showNotification(`❌ Ошибка: ${result.error || 'Неизвестная ошибка'}`, 'error');
        }
    } catch (error) {
        showNotification(`❌ Ошибка сети: ${error.message}`, 'error');
    }
}

// Вспомогательные функции
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusBadge(status) {
    const badges = {
        'pending': '<span class="status-badge status-pending">Ожидает чека</span>',
        'active': '<span class="status-badge status-active">Активирован</span>',
        'used': '<span class="status-badge status-used">Использован</span>'
    };
    return badges[status] || `<span class="status-badge">${status}</span>`;
}

function getActionButton(status, code) {
    if (status === 'pending') {
        return `<button onclick="activateOrder('${code}')" class="btn-activate">
            <i class="fas fa-check"></i> Активировать
        </button>`;
    }
    return '<span class="no-action">—</span>';
}

function showNotification(message, type = 'success') {
    // Создаем временное уведомление
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
    
    // Автоудаление через 5 секунд
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Автообновление каждые 30 секунд
setInterval(() => {
    if (sessionStorage.getItem('adminAuth') === 'true') {
        loadOrders();
    }
}, 30000);
