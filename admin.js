const API_BASE = 'https://chea.onrender.com';
// const ADMIN_PASS = "amg2025"; // Пароль в нижнем регистре

// ========== АВТОРИЗАЦИЯ ==========

// Авторизация при загрузке
window.addEventListener('DOMContentLoaded', function() {
    if (sessionStorage.getItem('adminAuth') === 'true') {
        console.log('✅ Авторизация пройдена');
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('adminPage').style.display = 'block';
        loadAllData(); // ← ИЗМЕНЕНО: загружаем ВСЁ (статистику + заявки)
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

async function checkAuth() {
    const input = document.getElementById('adminPass');
    const enteredPass = input ? input.value : '';
    
    console.log('🔑 Проверка пароля через БД...');
    
    // Визуальная обратная связь
    const loginBtn = document.querySelector('.admin-login-btn');
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.textContent = '⏳ Проверка...';
    }
    
    try {
        const response = await fetch(`${API_BASE}/check-admin-pass`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: enteredPass })
        });
        
        const data = await response.json();
        console.log('📥 Ответ сервера:', data);
        
        if (data.valid) {
            console.log('✅ Пароль верный (проверено через БД)');
            sessionStorage.setItem('adminAuth', 'true');
            
            // Визуальная обратная связь
            if (loginBtn) {
                loginBtn.textContent = '✅ Успешно!';
                loginBtn.style.background = '#38a169';
            }
            
            // Перезагрузка с небольшой задержкой
            setTimeout(() => {
                console.log('🔄 Перезагрузка страницы...');
                location.reload();
            }, 800);
        } else {
            console.log('❌ Пароль неверный');
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.textContent = 'Войти';
                loginBtn.style.background = '';
            }
            alert("❌ Неверный пароль");
            if (input) {
                input.value = '';
                input.focus();
                input.style.borderColor = '#e53e3e';
                setTimeout(() => input.style.borderColor = '', 2000);
            }
        }
    } catch (error) {
        console.error('❌ Ошибка сети при проверке пароля:', error);
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Войти';
            loginBtn.style.background = '';
        }
        alert("❌ Ошибка соединения с сервером");
        if (input) {
            input.value = '';
            input.focus();
        }
    }
}
// ========== НОРМАЛИЗАЦИЯ ТАРИФОВ ==========

function normalizeTariff(tariff) {
    if (!tariff) return 'BASIC';
    
    const upperTariff = tariff.toUpperCase().trim();
    
    // Маппинг на три основных тарифа
    const mapping = {
        // BASIC
        'BASIC': 'BASIC',
        'EMT': 'BASIC',
        'ED': 'BASIC',
        'EB': 'BASIC',
        'EMZ': 'BASIC',
        'XA': 'BASIC',
        
        // EXTENDED
        'EXTENDED': 'EXTENDED',
        'SMT': 'EXTENDED',
        'XC': 'EXTENDED',
        'PRO': 'EXTENDED',
        
        // SUBSCRIPTION
        'SUBSCRIPTION': 'SUBSCRIPTION',
        'VMT': 'SUBSCRIPTION',
        'XF': 'SUBSCRIPTION',
        'PREMIUM': 'SUBSCRIPTION'
    };
    
    // Сначала проверяем точное совпадение
    if (mapping[upperTariff]) {
        return mapping[upperTariff];
    }
    
    // Проверяем частичные совпадения
    for (const [key, value] of Object.entries(mapping)) {
        if (upperTariff.includes(key)) {
            return value;
        }
    }
    
    // По умолчанию BASIC
    return 'BASIC';
}

// ========== РАБОТА С ДАТАМИ ==========

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

// ========== ЗАГРУЗКА СТАТИСТИКИ ==========

// Функция загрузки всех данных (статистика + заявки)
async function loadAllData() {
    console.log('📊 Загрузка всех данных...');
    const btn = document.querySelector('.stats-header .btn');
    const originalText = btn ? btn.innerHTML : '';
    
    // Добавляем анимацию вращения к иконке
    if (btn) {
        btn.classList.add('btn-updating');
        btn.disabled = true;
    }
    
    try {
        // Загружаем параллельно
        await Promise.all([
            loadStats(),
            loadOrders()
        ]);
        console.log('✅ Все данные загружены');
    } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error);
    } finally {
        // Восстанавливаем кнопку
        if (btn) {
            btn.classList.remove('btn-updating');
            btn.disabled = false;
        }
    }
}

// Загрузка статистики
async function loadStats() {
    console.log('📈 Загрузка статистики...');
    
    try {
        // Загружаем три типа данных параллельно
        const [pendingResponse, promoCodesResponse, activeCodesResponse] = await Promise.all([
            fetch(`${API_BASE}/get-pending`),
            fetch(`${API_BASE}/get-promo-codes`),
            fetch(`${API_BASE}/get-active-codes`)
        ]);

        // Проверяем ответы
        if (!pendingResponse.ok) throw new Error('Ошибка загрузки ожидающих кодов');
        if (!promoCodesResponse.ok) throw new Error('Ошибка загрузки промо-кодов');
        if (!activeCodesResponse.ok) throw new Error('Ошибка загрузки активных кодов');

        const pendingCodes = await pendingResponse.json();
        const promoCodes = await promoCodesResponse.json();
        const activeCodes = await activeCodesResponse.json();

        // Фильтруем данные
        const pendingCount = Array.isArray(pendingCodes) ? pendingCodes.length : 0;
        
        // Промо-коды ожидающие активации (is_active = false)
        const promoPendingCount = Array.isArray(promoCodes) 
            ? promoCodes.filter(code => code.is_active === false).length 
            : 0;
        
        // Активные коды (все)
        const activeCount = Array.isArray(activeCodes) ? activeCodes.length : 0;

        // Обновляем интерфейс
        updateStatsDisplay(pendingCount, promoPendingCount, activeCount);
        
        console.log('📊 Статистика:', { pendingCount, promoPendingCount, activeCount });
        
    } catch (error) {
        console.error('❌ Ошибка загрузки статистики:', error);
        // Показываем ошибку в интерфейсе
        document.getElementById('statPending').textContent = '!';
        document.getElementById('statPromo').textContent = '!';
        document.getElementById('statActive').textContent = '!';
        
        // Можно добавить тултип с ошибкой
        document.getElementById('statsRow').title = `Ошибка: ${error.message}`;
    }
}

// Обновление отображения статистики
function updateStatsDisplay(pending, promo, active) {
    const pendingEl = document.getElementById('statPending');
    const promoEl = document.getElementById('statPromo');
    const activeEl = document.getElementById('statActive');
    
    if (pendingEl) pendingEl.textContent = pending;
    if (promoEl) promoEl.textContent = promo;
    if (activeEl) activeEl.textContent = active;
    
    // Добавляем анимацию обновления
    [pendingEl, promoEl, activeEl].forEach(el => {
        if (el) {
            el.style.transform = 'scale(1.1)';
            setTimeout(() => {
                el.style.transform = 'scale(1)';
            }, 300);
        }
    });
}

// ========== ЗАГРУЗКА ЗАЯВОК ==========

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
            
            // Нормализуем тариф
            const rawTariff = order.tariff || order.package || 'BASIC';
            const tariff = normalizeTariff(rawTariff);
            const date = formatOrderDate(order.code);
            
            // CSS класс для тарифа
            const tariffClass = `tariff-${tariff.toLowerCase()}`;
            
            row.innerHTML = `
                <td><strong>${order.code}</strong></td>
                <td><span class="package-badge ${tariffClass}">${tariff}</span></td>
                <td>${date}</td>
                <td>
                    <button onclick="activateCode('${order.code}', '${tariff}')" class="btn-activate">
                        ✅ АКТИВИРОВАТЬ
                    </button>
                    <button onclick="deleteCode('${order.code}')" class="btn-delete">
                        🗑️ УДАЛИТЬ
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

// ========== АКТИВАЦИЯ КОДА ==========

// Активация кода
async function activateCode(code, tariff) {
    console.log(`🔄 Активация: ${code}, тариф: ${tariff}`);
    
    const caps = { 
        'BASIC': 30000, 
        'EXTENDED': 60000,
        'SUBSCRIPTION': 90000
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
            loadAllData(); // ← ИЗМЕНЕНО: обновляем ВСЁ после активации
        } else {
            const errorMsg = data.error || data.message || 'Неизвестная ошибка';
            alert(`❌ Ошибка активации:\n${errorMsg}`);
        }
    } catch (error) {
        console.error('❌ Ошибка сети:', error);
        alert('❌ Ошибка связи с сервером\nПроверьте интернет-соединение');
    }
}

// ========== УДАЛЕНИЕ КОДА ==========

// Функция удаления кода
async function deleteCode(code) {
    if (!confirm(`Удалить код ${code}?\n\nЭто действие нельзя отменить!`)) {
        return;
    }
    
    try {
        const params = new URLSearchParams({ code: code });
        
        console.log(`🗑️ Отправка запроса на удаление: ${API_BASE}/delete-code?${params}`);
        
        const response = await fetch(`${API_BASE}/delete-code?${params.toString()}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        
        const data = await response.json();
        console.log('📥 Ответ сервера:', data);
        
        if (data.success || (response.ok && !data.error)) {
            alert(`✅ Код ${code} удален!`);
            loadAllData(); // ← ИЗМЕНЕНО: обновляем ВСЁ после удаления
        } else {
            const errorMsg = data.error || data.message || 'Неизвестная ошибка';
            alert(`❌ Ошибка удаления:\n${errorMsg}`);
        }
    } catch (error) {
        console.error('❌ Ошибка сети:', error);
        alert('❌ Ошибка связи с сервером');
    }
}

// ========== АВТООБНОВЛЕНИЕ ==========

// Автообновление каждые 30 секунд (только статистика)
setInterval(() => {
    if (sessionStorage.getItem('adminAuth') === 'true') {
        console.log('🔄 Автообновление статистики...');
        loadStats();
    }
}, 30000);

// ========== ЭКСПОРТ ФУНКЦИЙ ==========

window.checkAuth = checkAuth;
window.logout = logout;
window.loadOrders = loadOrders;
window.loadAllData = loadAllData;
window.loadStats = loadStats;
window.activateCode = activateCode;
window.deleteCode = deleteCode;
