// ===================================================================
// МОДУЛЬ: Страница оплаты
// ===================================================================

// --- ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ ОПЛАТЫ ---
export function setupPaymentPage(planDetails) {
    // Проверяем, что мы на странице payment.html
    const isPaymentPage = window.location.pathname.includes('payment.html') || 
                          window.location.href.includes('payment.html');
    
    if (!isPaymentPage) {
        return;
    }

    console.log('💰 Инициализация страницы оплаты');

    const urlParams = new URLSearchParams(window.location.search);
    const planKey = urlParams.get('plan') || 'extended';
    const orderID = localStorage.getItem('lastOrderID');
    
    // Проверяем, есть ли данные
    if (!orderID) {
        console.error('❌ Нет orderID в localStorage');
        return;
    }
    
    const plan = planDetails[planKey];
    if (!plan) {
        console.error('❌ Неизвестный тариф:', planKey);
        return;
    }

    // Убираем пробелы и "₽" из цены
    const price = plan.price.replace(' ₽', '').replace(/\s/g, '').replace('₽', '');
    
    console.log('💰 Данные для оплаты:', { planKey, price, orderID, planName: plan.name });

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
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(baseQR + '&sum=' + price + '&label=' + orderID)}`;
        console.log('✅ QR-код обновлен');
    } else {
        console.warn('⚠️ Элемент QR-кода не найден');
    }
}
