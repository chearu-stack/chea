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
    // Используем order.tariff, так как в БД именно это имя
    const tariffName = order.tariff || order.package || 'basic'; 
    
    row.innerHTML = `
        <td><strong class="order-code">${order.code}</strong></td>
        <td><span class="package-badge">${tariffName}</span></td>
        <td>${formatDate(order.created_at || order.date)}</td> 
        <td>${getStatusBadge(order.status)}</td>
        <td>
            <div class="action-cell">
                ${order.status === 'pending' 
                    ? `<button onclick="activateCode('${order.code}')" class="btn-activate">Активировать</button>` 
                    : `<small>${order.remaining || 0} / ${order.caps_limit || 0}</small>`}
            </div>
        </td>
    `;
    tbody.appendChild(row);
});
