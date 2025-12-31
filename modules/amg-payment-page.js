// ===================================================================
// МОДУЛЬ: Страница оплаты
// ===================================================================

// --- ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ ОПЛАТЫ ---
export function setupPaymentPage(planDetails) {
    // Проверяем, что мы на странице оплаты ЛЮБЫМ способом
    const isPaymentPage = window.location.pathname.includes('payment.html') || 
                          window.location.href.includes('payment.html') ||
                          document.querySelector('.payment-container') !== null;
    
    if (!isPaymentPage) {
        return;
    }

    console.log('💰 Инициализация страницы оплаты - страница обнаружена');

    const urlParams = new URLSearchParams(window.location.search);
    const planKey = urlParams.get('plan') || 'extended';
    const orderID = localStorage.getItem('lastOrderID');
    
    console.log('📊 Параметры URL:', { planKey, orderID });

    // Если нет orderID, пробуем получить из localStorage или URL
    if (!orderID) {
        console.warn('⚠️ Нет orderID в localStorage, проверяем URL...');
        // Может быть передан в URL как параметр
        const orderFromURL = urlParams.get('order') || urlParams.get('id');
        if (orderFromURL) {
            console.log('✅ OrderID из URL:', orderFromURL);
        } else {
            console.error('❌ Нет orderID ни в localStorage, ни в URL');
            // Показываем ошибку пользователю
            const planNameEl = document.getElementById('selectedPlanName');
            if (planNameEl) {
                planNameEl.textContent = 'Ошибка: ID заказа не найден';
                planNameEl.style.color = 'red';
            }
            return;
        }
    }
    
    const plan = planDetails[planKey];
    if (!plan) {
        console.error('❌ Неизвестный тариф:', planKey, 'Доступные:', Object.keys(planDetails));
        return;
    }

    // Убираем пробелы и "₽" из цены
    const price = plan.price.replace(' ₽', '').replace(/\s/g, '').replace('₽', '');
    
    console.log('💰 Данные для оплаты:', { 
        planKey, 
        price, 
        orderID, 
        planName: plan.name,
        planPrice: plan.price 
    });

    // Обновляем элементы на странице
    const elementsToUpdate = {
        'selectedPlanName': plan.name,
        'selectedPlanPrice': `${price} ₽ <br><span style="color:red; font-size:1rem;">ID: ${orderID}</span>`,
        'selectedPlanId': `ID: ${orderID}`,
        'selectedPlanDesc': plan.desc,
        'manualPrice': price,
        'stepAmount': price
    };

    Object.entries(elementsToUpdate).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            if (id === 'selectedPlanPrice') {
                element.innerHTML = value;
            } else {
                element.textContent = value;
            }
            console.log(`✅ Обновлен элемент #${id}:`, value);
        } else {
            console.warn(`⚠️ Элемент #${id} не найден на странице`);
        }
    });

    // Генерация QR-кода
    const qrImg = document.getElementById('qrCodeImage');
    if (qrImg) {
        const baseQR = 'https://www.sberbank.ru/ru/choise_bank?requisiteNumber=79108777700&bankCode=100000000111';
        const qrData = encodeURIComponent(baseQR + '&sum=' + price + '&label=' + orderID);
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrData}`;
        qrImg.alt = `QR-код для перевода ${price} ₽, ID: ${orderID}`;
        console.log('✅ QR-код обновлен, src:', qrImg.src.substring(0, 100) + '...');
    } else {
        console.warn('⚠️ Элемент QR-кода не найден');
    }
    
    // Диагностика: проверяем все важные элементы
    console.log('🔍 Диагностика элементов:');
    ['selectedPlanName', 'selectedPlanPrice', 'manualPrice', 'stepAmount', 'qrCodeImage'].forEach(id => {
        const el = document.getElementById(id);
        console.log(`  ${id}:`, el ? 'НАЙДЕН' : 'НЕ НАЙДЕН', el);
    });
}
