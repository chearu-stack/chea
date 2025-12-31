// ===================================================================
// МОДУЛЬ: Страница оплаты
// ===================================================================

// --- ИНИЦИАЛИЗАЦИЯ СТРАНИЦЫ ОПЛАТЫ ---
export function setupPaymentPage(planDetails) {
    if (!window.location.pathname.includes('payment.html')) {
        return; // Мы не на странице оплаты
    }

    console.log('💰 Инициализация страницы оплаты');

    const urlParams = new URLSearchParams(window.location.search);
    const planKey = urlParams.get('plan') || 'extended';
    const orderID = localStorage.getItem('lastOrderID');
    const plan = planDetails[planKey] || planDetails.extended;

    const price = plan.price.replace(' ₽', '').replace(/\s/g, '');

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
        }
    });

    // Генерация QR-кода
    const qrImg = document.getElementById('qrCodeImage');
    if (qrImg) {
        const baseQR = 'https://www.sberbank.ru/ru/choise_bank?requisiteNumber=79108777700&bankCode=100000000111';
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(baseQR + '&sum=' + price + '&label=' + orderID)}`;
    }

    console.log('💰 Данные обновлены:', { planKey, price, orderID });
}
