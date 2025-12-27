const API_BASE = 'https://chea.onrender.com';
const ADMIN_PASS = "amg2025"; // Пароль в нижнем регистре

// Авторизация при загрузке
window.addEventListener('DOMContentLoaded', function() {
    if (sessionStorage.getItem('adminAuth') === 'true') {
        console.log('✅ Авторизация пройдена');
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('adminPage').style.display = 'block';
        loadOrders();
    } else {
        console.log('🔐 Требуется авторизация');
        document.getElementById('loginOverlay').style.display = 'flex';
        document.getElementById('adminPage').style.display = 'none';
        
        // Автофокус на поле ввода
        setTimeout(() => {
            const passInput = document.getElementById('adminPass');
            if (passInput) passInput.focus();
        }, 100);
    }
});

function checkAuth() {
    const input = document.getElementById('adminPass');
    const enteredPass = input ? input.value : '';
    
    console.log('🔑 Проверка пароля:', {
        введено: `"${enteredPass}"`,
        ожидается: `"${ADMIN_PASS}"`,
        длина: `${enteredPass.length}/${ADMIN_PASS.length}`,
        совпадение: enteredPass === ADMIN_PASS
    });
    
    // Сравниваем БЕЗ trim() - пароль "amg2025" без пробелов
    if (enteredPass === ADMIN_PASS) {
        console.log('✅ Пароль верный');
        sessionStorage.setItem('adminAuth', 'true');
        
        // Визуальная обратная связь
        const loginBtn = document.querySelector('.admin-login-btn');
        if (loginBtn) {
            loginBtn.textContent = '✅ Успешно!';
            loginBtn.style.background = '#38a169';
            loginBtn.disabled = true;
        }
        
        // Перезагрузка с небольшой задержкой
        setTimeout(() => {
            console.log('🔄 Перезагрузка страницы...');
            location.reload();
        }, 800);
    } else {
        console.log('❌ Пароль неверный');
        alert("❌ Неверный пароль. Попробуйте: amg2025");
        if (input) {
            input.value = '';
            input.focus();
            input.style.borderColor = '#e53e3e';
            setTimeout(() => input.style.borderColor = '', 2000);
        }
    }
}

// Поддержка Enter в поле пароля
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && document.getElementById('loginOverlay').style.display !== 'none') {
        checkAuth();
    }
});

function logout() {
    sessionStorage.removeItem('adminAuth');
    console.log('🚪 Выход из системы');
    location.reload();
}

// Функция извлечения даты из кода
function extractDateFromCode(code) {
    try {
        // AMG25-12280037-EMT → "1228" (MMDD)
        const parts = code.split('-');
        if (parts.length < 2) return null;
        
        const datePart = parts[1]; // "12280037"
        if (datePart.length < 4) return null;
        
        const monthStr = datePart.substring(0, 2); // "12"
        const dayStr = datePart.substring(2, 4);   // "28"
        
        const month = parseInt(monthStr, 10) - 1; // JavaScript месяцы 0-11
        const day = parseInt(dayStr, 10);
        const year = new Date().getFullYear(); // 2024 или 2025
        
        // Валидация
        if (isNaN(month) || isNaN(day) || month < 0 || month > 11 || day < 1 || day > 31) {
            return null;
        }
        
        const date = new Date(year, month, day);
        if (isNaN(date.getTime())) return null;
        
        return date;
    } catch (e) {
        console.error('Ошибка извлечения даты из кода:', e);
        return null;
    }
}

// Форматирование даты
function formatOrderDate(code) {
    const orderDate = extractDateFromCode(code);
    if (!orderDate) return "Дата в коде";
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Сравниваем только даты (без времени)
    const isToday = orderDate.toDateString() === today.toDateString();
    const isYesterday = orderDate.toDateString() === yesterday.toDateString();
    
    if (isToday) return "Сегодня";
    if (isYesterday) return "Вчера";
    
    // Форматируем нормальную дату
    return orderDate.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Загрузка заявок
async function loadOrders() {
    const tbody = document.getElementById('ordersBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="4" class="loading-row">⏳ Загрузка...</td></tr>';

    try {
        const response = await fetch(`${API_BASE}/get-pending`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const orders = await response.json();
        console.log('📋 Получено заявок:', orders ? orders.length : 0);
        
        tbody.innerHTML = '';

        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="empty-row">✅ Новых заявок нет</td></tr>';
            return;
        }

        // Сортируем по дате (новые сверху)
        orders.sort((a, b) => {
            const dateA = extractDateFromCode(a.code);
            const dateB = extractDateFromCode(b.code);
            if (!dateA || !dateB) return 0;
            return dateB - dateA; // Новые сверху
        });

        orders.forEach(order => {
            const row = document.createElement('tr');
            const tariff = (order.tariff || order.package || 'BASIC').toUpperCase();
            const date = formatOrderDate(order.code);
            
            // Определяем CSS класс для тарифа
            const tariffClass = `tariff-${tariff.toLowerCase()}`;
            
            row.innerHTML = `
                <td><strong>${order.code}</strong></td>
                <td><span class="package-badge ${tariffClass}">${tariff}</span></td>
                <td>${date}</td>
                <td>
                    <button onclick="activateCode('${order.code}', '${tariff}')" class="btn-activate">
                        ✅ АКТИВИРОВАТЬ
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        console.log('✅ Таблица обновлена');
        
    } catch (error) {
        console.error('❌ Ошибка загрузки:', error);
        tbody.innerHTML = `
            <tr><td colspan="4" class="error-row">
                ❌ Ошибка сервера: ${error.message}<br>
                <small>Проверьте соединение и обновите страницу</small>
            </td></tr>
        `;
    }
}

// Активация кода
async function activateCode(code, tariff) {
    console.log(`🔄 Активация: ${code}, тариф: ${tariff}`);
    
    const caps = { 
        'BASIC': 30000, 
        'EXTENDED': 30000,
        'SUBSCRIPTION': 90000,
        'PRO': 60000, 
        'PREMIUM': 90000 
    };
    
    const limit = caps[tariff] || 30000;
    
    if (!confirm(`Подтвердите активацию:\n\nКод: ${code}\nТариф: ${tariff}\nЛимит CAPS: ${limit}`)) {
        return;
    }

    try {
        // Параметры точно как в БД
        const params = new URLSearchParams({
            code: code,
            caps_limit: limit.toString(),
            is_active: 'true'
        });

        console.log(`📤 Отправка запроса: ${API_BASE}/activate-code?${params}`);
        
        const response = await fetch(`${API_BASE}/activate-code?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log('📥 Ответ сервера:', data);
        
        if (data.success || (response.ok && !data.error)) {
            alert(`✅ Успех!\nКод ${code} активирован.\nЛимит: ${limit} CAPS`);
            loadOrders(); // Обновляем список
        } else {
            const errorMsg = data.error || data.message || 'Неизвестная ошибка';
            alert(`❌ Ошибка активации:\n${errorMsg}`);
        }
    } catch (error) {
        console.error('❌ Ошибка сети:', error);
        alert('❌ Ошибка связи с сервером\nПроверьте интернет-соединение');
    }
}

// Автообновление каждые 30 секунд
setInterval(() => {
    if (sessionStorage.getItem('adminAuth') === 'true') {
        console.log('🔄 Автообновление списка...');
        loadOrders();
    }
}, 30000);

// Экспорт функций в глобальную область видимости
window.checkAuth = checkAuth;
window.logout = logout;
window.loadOrders = loadOrders;
window.activateCode = activateCode;
