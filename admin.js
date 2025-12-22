const API_BASE = 'https://chea.onrender.com';
const ADMIN_PASS = "amg2025";

// Авторизация
if (sessionStorage.getItem('adminAuth') === 'true') {
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('adminPage').style.display = 'block';
    loadOrders();
}

function checkAuth() {
    if (document.getElementById('adminPass').value === ADMIN_PASS) {
        sessionStorage.setItem('adminAuth', 'true');
        location.reload();
    } else {
        alert("Неверный пароль");
    }
}

function logout() {
    sessionStorage.removeItem('adminAuth');
    location.reload();
}

// Загрузка только входящих заявок
async function loadOrders() {
    const tbody = document.getElementById('ordersBody');
    tbody.innerHTML = '<tr><td colspan="4">Синхронизация...</td></tr>';

    try {
        const response = await fetch(`${API_BASE}/get-pending`);
        const orders = await response.json();
        
        tbody.innerHTML = '';

        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-row">Новых заявок нет</td></tr>';
            return;
        }

        orders.forEach(order => {
            const row = document.createElement('tr');
            const tariff = (order.tariff || order.package || 'BASIC').toUpperCase();
            const date = order.date || order.created_at || 'Сегодня';

            row.innerHTML = `
                <td><strong>${order.code}</strong></td>
                <td><span class="package-badge">${tariff}</span></td>
                <td>${date}</td>
                <td>
                    <button onclick="activateCode('${order.code}', '${tariff}')" class="btn-activate">
                        АКТИВИРОВАТЬ
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="4">Ошибка сервера: ${e.message}</td></tr>`;
    }
}

// АКТИВАЦИЯ: Приведена в соответствие с полями твоей БД
async function activateCode(code, tariff) {
    const caps = { 'BASIC': 30000, 'PRO': 60000, 'PREMIUM': 90000 };
    const limit = caps[tariff] || 30000;

    if (!confirm(`Активировать код ${code}\nТариф: ${tariff}\nЛимит: ${limit} CAPS?`)) return;

    try {
        // ИСПОЛЬЗУЕМ КЛЮЧИ ИЗ ТВОЕЙ ТАБЛИЦЫ: caps_limit и is_active
        const params = new URLSearchParams({
            code: code,
            caps_limit: limit, 
            is_active: 'true'
        });

        const res = await fetch(`${API_BASE}/activate-code?${params.toString()}`);
        const data = await res.json();
        
        // Логика успеха
        if (data.success || (res.ok && !data.error)) {
            alert(`Успех! Код ${code} теперь активен.`);
            loadOrders(); 
        } else {
            // Если сервер выдает "Cannot coerce", мы увидим это здесь
            const errorMsg = data.error || data.message || 'Запись не найдена в БД';
            alert('Ошибка: ' + errorMsg);
        }
    } catch (e) {
        console.error('Ошибка активации:', e);
        alert('Ошибка связи с сервером');
    }
}

// Автообновление раз в минуту
setInterval(() => {
    if (sessionStorage.getItem('adminAuth') === 'true') loadOrders();
}, 60000);
