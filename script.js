// ===================================================================
// АДВОКАТ МЕДНОГО ГРОША — script.js
// ВЕРСИЯ: ТАРИФЫ И ОПЛАТА (без скроллов)
// ===================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('💰 Тарифы: инициализация');
    
    // --- 1. ГЕНЕРАЦИЯ ID И ОТПЕЧАТКА (сохраняем) ---
    const getFP = () => {
        const s = window.screen;
        const b = navigator.userAgent;
        return btoa(`${s.width}${s.height}${b}${s.colorDepth}`).substring(0, 12);
    };
    const userFP = getFP();

    function generateOrderIdentifier(planKey) {
        const now = new Date();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const planLetters = { 'basic': 'E', 'extended': 'S', 'subscription': 'V' };
        const planLetter = planLetters[planKey] || 'X';
        return `AMG25-${mm}${dd}${hh}${min}-${planLetter}${userFP.substring(0,2).toUpperCase()}`;
    }

    const planDetails = {
        'basic': { name: 'Базовый', price: '500 ₽', desc: 'Диагноз, план и 1 претензия. 7 вопросов боту.' },
        'extended': { name: 'Расширенный', price: '1 200 ₽', desc: 'Всё из Базового + расчёт неустойки и 3 документа. 20 вопросов.' },
        'subscription': { name: 'Профессиональный', price: '2 500 ₽', desc: 'Борьба с отписками, стратегия и сложные расчёты. 50 вопросов.' }
    };

    // --- 2. ОБРАБОТКА КНОПОК ТАРИФОВ (без конфликтов) ---
    function setupTariffButtons() {
        const tariffButtons = document.querySelectorAll('.pricing-card .btn[data-plan]');
        console.log(`💰 Найдено кнопок тарифов: ${tariffButtons.length}`);
        
        tariffButtons.forEach(button => {
            // Простой обработчик без клонирования (чтобы не конфликтовать)
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                
                console.log('💰 Клик по тарифу:', this.getAttribute('data-plan'));
                
                const planKey = this.getAttribute('data-plan');
                
                // 1. Локальное сохранение
                const newID = generateOrderIdentifier(planKey);
                localStorage.setItem('lastOrderID', newID);
                localStorage.setItem('selectedPlan', planKey);
                localStorage.setItem('lockTime', Date.now());

                // 2. Отправка на сервер (асинхронно)
                try {
                    const capsLimits = { 'basic': 30000, 'extended': 60000, 'subscription': 90000 };
                    
                    fetch('https://chea.onrender.com/generate-code', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            code: newID,
                            package: planKey,
                            caps_limit: capsLimits[planKey] || 30000,
                            fingerprint: userFP
                        })
                    }).then(() => {
                        console.log("💰 Заказ зарегистрирован в БД");
                    }).catch(err => {
                        console.error("💰 Ошибка связи с сервером:", err);
                    });
                    
                } catch (err) {
                    console.error("💰 Ошибка:", err);
                }

                // 3. Переход на payment.html
                const href = this.getAttribute('href');
                if (href) {
                    window.location.href = href;
                }
                
                return false;
            }, true); // Используем capture для приоритета
        });
    }
    
    // --- 3. ВОССТАНОВЛЕНИЕ СОСТОЯНИЯ ---
    function checkSavedState() {
        const savedPlan = localStorage.getItem('selectedPlan');
        const lockTime = localStorage.getItem('lockTime');

        if (savedPlan && lockTime && (Date.now() - lockTime < 24 * 60 * 60 * 1000)) {
            console.log('💰 Восстановлен сохранённый план:', savedPlan);
        }
    }

    // --- 4. СТРАНИЦА ОПЛАТЫ (ИСПРАВЛЕННАЯ ВЕРСИЯ) ---
    function setupPaymentPage() {
        if (window.location.pathname.includes('payment.html')) {
            console.log('💰 Инициализация страницы оплаты');
            
            const urlParams = new URLSearchParams(window.location.search);
            const planKey = urlParams.get('plan') || 'extended';
            const price = urlParams.get('price') || '1200';
            const orderID = localStorage.getItem('lastOrderID');
            const plan = planDetails[planKey] || planDetails.extended;

            // Обновление ВСЕХ полей
            const elements = {
                'selectedPlanName': plan.name,
                'selectedPlanPrice': `${price} ₽`,
                'selectedPlanId': `ID: ${orderID}`,
                'selectedPlanDesc': plan.desc,
                'manualPrice': price,
                'stepAmount': price
            };

            Object.keys(elements).forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    if (id === 'selectedPlanPrice') {
                        element.innerHTML = `${price} ₽`;
                    } else {
                        element.textContent = elements[id];
                    }
                }
            });

            // QR-код
            const qrImg = document.getElementById('qrCodeImage');
            if (qrImg) {
                const baseQR = 'https://www.sberbank.ru/ru/choise_bank?requisiteNumber=79108777700&bankCode=100000000111';
                qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(baseQR + '&sum=' + price + '&label=' + orderID)}`;
            }
            
            console.log('💰 Данные обновлены:', { planKey, price, orderID });
        }
    }
    
    // --- 5. ВЫПОЛНЕНИЕ ---
    try {
        console.log('💰 Начало инициализации модуля тарифов...');
        
        // НАСТРОЙКА ТАРИФОВ
        setupTariffButtons();
        
        // ВОССТАНОВЛЕНИЕ СОСТОЯНИЯ
        checkSavedState();
        
        // СТРАНИЦА ОПЛАТЫ
        setupPaymentPage();
        
        console.log('✅ Модуль тарифов инициализирован');
        
    } catch (error) {
        console.error('❌ Ошибка инициализации модуля тарифов:', error);
    }
});

console.log('✅ script.js загружен (тарифы и оплата)');
