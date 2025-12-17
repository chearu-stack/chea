// ЗАГЛУШКА данных (пока нет БД)
const MOCK_DATA = [
    { code: "AMG-A1B2C3", package: "Базовый", created_at: new Date().toISOString(), status: "pending" },
    { code: "AMG-X7Y8Z9", package: "Продвинутый", created_at: new Date(Date.now() - 3600000).toISOString(), status: "pending" },
    { code: "AMG-ACT123", package: "Базовый", created_at: new Date(Date.now() - 7200000).toISOString(), status: "active" },
];

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
    }
}

// Выход
function logout() {
    sessionStorage.removeItem('adminAuth');
    location.reload();
}

// Загрузка заказов (заглушка)
async function loadOrders() {
    const tbody = document.getElementById('ordersBody');
    tbody.innerHTML = '<tr><td colspan="5" class="loading-row">Загрузка...</td></tr>';

    // Имитация задержки сети
    await new Promise(resolve => setTimeout(resolve, 300));

    const orders = MOCK_DATA;
    
    // Обновляем статистику
    document.getElementById('pendingCount').textContent = orders.filter(o => o.status === 'pending').length;
    document.getElementById('activeCount').textContent = orders.filter(o => o.status === 'active').length;
    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();

    // Очищаем таблицу
    tbody.innerHTML = '';

    // Заполняем таблицу
    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${order.code}</strong></td>
            <td>${order.package}</td>
            <td>${new Date(order.created_at).toLocaleString()}</td>
            <td>${order.status === 'pending' ? '<span class="status-pending">Ожидает</span>' : '<span class="status-active">Активен</span>'}</td>
            <td>
                ${order.status === 'pending' 
                    ? `<button onclick="activateCode('${order.code}')" class="btn-activate">Активировать</button>`
                    : '—'}
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Активация кода (заглушка)
async function activateCode(code) {
    if (!confirm(`Активировать код ${code}?`)) return;
    
    alert(`✅ Код ${code} активирован (заглушка)`);
    console.log(`Активирован код: ${code}`);
    
    // Обновляем список
    loadOrders();
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
