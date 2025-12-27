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
            
            // ВАЖНО: Используем правильное получение даты
            const date = getOrderDate(order);
            
            // Добавляем CSS класс для тарифа
            const tariffClass = `tariff-${tariff.toLowerCase()}`;

            row.innerHTML = `
                <td><strong>${order.code}</strong></td>
                <td><span class="package-badge ${tariffClass}">${tariff}</span></td>
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

// Функция для определения даты заявки
function getOrderDate(order) {
    // 1. Проверяем activated_at (если уже активирована)
    if (order.activated_at && order.activated_at !== 'NULL') {
        return formatDate(order.activated_at);
    }
    
    // 2. Извлекаем дату из кода
    if (order.code) {
        const dateFromCode = extractDateFromCode(order.code);
        if (dateFromCode) return dateFromCode;
    }
    
    // 3. Используем metadata.created_at если есть
    if (order.metadata && order.metadata.created_at) {
        return formatDate(order.metadata.created_at);
    }
    
    return "Дата неизвестна";
}

// Извлечение даты из кода
function extractDateFromCode(code) {
    try {
        // AMG25-12280037-EMT → "1228" (MMDD)
        const match = code.match(/AMG\d+-(\d{4})/);
        if (!match) return null;
        
        const dateStr = match[1]; // "1228"
        const month = parseInt(dateStr.substring(0, 2)) - 1;
        const day = parseInt(dateStr.substring(2, 4));
        const year = new Date().getFullYear();
        
        // Проверяем валидность даты
        if (month < 0 || month > 11 || day < 1 || day > 31) {
            return null;
        }
        
        const date = new Date(year, month, day);
        return formatDateObject(date);
    } catch (e) {
        return null;
    }
}

// Форматирование даты объекта
function formatDateObject(date) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
        return "Сегодня";
    } else if (date.toDateString() === yesterday.toDateString()) {
        return "Вчера";
    } else {
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
}

// Форматирование строковой даты
function formatDate(dateString) {
    try {
        // Пробуем разные форматы даты
        let date = new Date(dateString);
        
        // Если дата невалидна, пробуем парсить как timestamp
        if (isNaN(date.getTime())) {
            const timestamp = parseInt(dateString);
            if (!isNaN(timestamp)) {
                date = new Date(timestamp);
            } else {
                return "Дата неизвестна";
            }
        }
        
        return formatDateObject(date);
    } catch (e) {
        return "Дата неизвестна";
    }
}
