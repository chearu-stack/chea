// ===================================================================
// АДВОКАТ МЕДНОГО ГРОША — script.js
// ВЕРСИЯ С КОРРЕКТНОЙ БЛОКИРОВКОЙ И ПЕРЕВЕШИВАНИЕМ ОБРАБОТЧИКОВ
// ===================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('💰 Тарифы: инициализация с блокировкой');
    
    // --- 1. ГЕНЕРАЦИЯ ID И ОТПЕЧАТКА ---
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

    // --- 2. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
    function clearLocalStorage() {
        localStorage.removeItem('selectedPlan');
        localStorage.removeItem('lockTime');
        localStorage.removeItem('lastOrderID');
        console.log('localStorage очищен');
    }

    function blockTariffButtons(message) {
        const buttons = document.querySelectorAll('.pricing-card .btn[data-plan]');
        buttons.forEach(btn => {
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.title = message;
            btn.setAttribute('disabled', 'disabled');
            btn.setAttribute('data-original-href', btn.getAttribute('href'));
            btn.removeAttribute('href');
        });
    }

    function unlockTariffButtons() {
        const buttons = document.querySelectorAll('.pricing-card .btn[data-plan]');
        buttons.forEach(btn => {
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
            btn.title = '';
            btn.removeAttribute('disabled');
            const originalHref = btn.getAttribute('data-original-href');
            if (originalHref) {
                btn.setAttribute('href', originalHref);
                btn.removeAttribute('data-original-href');
            }
        });
    }

    function unlockAndResetTariffButtons() {
        console.log('Разблокировка и сброс обработчиков');
        unlockTariffButtons();
        setupTariffButtons(); // Перевешиваем обработчики
    }

    // --- 3. ПРОВЕРКА И БЛОКИРОВКА ТАРИФОВ ---
    async function checkAndBlockTariffs() {
        try {
            const savedOrderID = localStorage.getItem('lastOrderID');
            const savedPlan = localStorage.getItem('selectedPlan');
            const lockTime = localStorage.getItem('lockTime');
            
            if (!savedOrderID || !savedPlan || !lockTime) {
                unlockTariffButtons();
                return;
            }
            
            // Проверяем срок блокировки (24 часа)
            const timePassed = Date.now() - parseInt(lockTime);
            if (timePassed > 24 * 60 * 60 * 1000) {
                clearLocalStorage();
                unlockAndResetTariffButtons(); // Разблокируем со сбросом
                return;
            }
            
            // ПРОВЕРКА: есть ли код в БД?
            const response = await fetch(`https://chea.onrender.com/check-status?code=${savedOrderID}`);
            const status = await response.json();
            
            // Если код не найден (удалён) → разблокируем со сбросом
            if (!status.code) {
                console.log('Код удалён из БД → разблокировка и сброс обработчиков');
                clearLocalStorage();
                unlockAndResetTariffButtons(); // КЛЮЧЕВОЕ ИЗМЕНЕНИЕ
                return;
            }
            
            // Если код есть → блокируем на оставшееся время
            const hoursLeft = Math.ceil((24 * 60 * 60 * 1000 - timePassed) / (60 * 60 * 1000));
            blockTariffButtons(`Тариф выбран. Смена через ${hoursLeft}ч`);
            
        } catch (error) {
            console.error('Ошибка проверки блокировки:', error);
            unlockTariffButtons();
        }
    }

    // --- 4. ОБРАБОТКА КНОПОК ТАРИФОВ ---
    function setupTariffButtons() {
        const tariffButtons = document.querySelectorAll('.pricing-card .btn[data-plan]');
        console.log(`💰 Найдено кнопок тарифов: ${tariffButtons.length}`);
        
        tariffButtons.forEach(button => {
            // Удаляем все старые обработчики
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            newButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Проверяем не заблокирована ли кнопка
                if (this.hasAttribute('disabled')) {
                    console.log('Кнопка заблокирована, игнорируем клик');
                    return false;
                }
                
                console.log('💰 Клик по тарифу:', this.getAttribute('data-plan'));
                
                const planKey = this.getAttribute('data-plan');
                
                // 1. Генерация и сохранение
                const newID = generateOrderIdentifier(planKey);
                localStorage.setItem('lastOrderID', newID);
                localStorage.setItem('selectedPlan', planKey);
                localStorage.setItem('lockTime', Date.now());

                // 2. Отправка в БД
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
                    });
                    
                    console.log("✅ Запрос на регистрацию отправлен");
                    
                } catch (err) {
                    console.error("❌ Ошибка:", err);
                }

                // 3. Блокируем кнопки сразу после выбора
                checkAndBlockTariffs();

                // 4. Переход на payment.html
                const href = this.getAttribute('href');
                if (href) {
                    setTimeout(() => {
                        window.location.href = href;
                    }, 100);
                }
                
                return false;
            });
        });
    }
    
    // --- 5. СТАТУС "ОЖИДАНИЕ" ---
    function showWaitingStatus() {
        const savedPlan = localStorage.getItem('selectedPlan');
        const lockTime = localStorage.getItem('lockTime');
        const orderID = localStorage.getItem('lastOrderID');
        
        if (savedPlan && lockTime && (Date.now() - lockTime < 24 * 60 * 60 * 1000)) {
            const cardHeader = document.querySelector('.card-header');
            const cardBody = document.querySelector('.card-body');
            
            if (cardHeader && cardBody) {
                const plan = planDetails[savedPlan] || planDetails.extended;
                
                cardHeader.innerHTML = `<i class="fas fa-clock"></i> Ваш выбор: ${plan.name}`;
                cardBody.innerHTML = `
                    <div style="text-align: left;">
                        <p style="font-weight: bold; color: #e67e22; margin-bottom: 10px;">
                            <i class="fas fa-hourglass-half"></i> Статус: ОЖИДАНИЕ ПОДТВЕРЖДЕНИЯ
                        </p>
                        <p style="margin-bottom: 15px;">${plan.desc}</p>
                        <p style="font-size: 0.9rem; margin-bottom: 10px;">
                            <strong>Бот забронирован.</strong> Отправьте ID и чек в Telegram:
                        </p>
                        <a href="https://t.me/chearu252?text=${encodeURIComponent('Мой ID: ' + orderID + '. Прикрепите чек к сообщению!')}" 
                           target="_blank" 
                           style="display: block; background: #0088cc; color: white; padding: 12px; border-radius: 6px; text-decoration: none; text-align: center; font-weight: 600;">
                           <i class="fab fa-telegram"></i> ПОДТВЕРДИТЬ В TELEGRAM
                        </a>
                        <p style="font-size: 0.8rem; color: #718096; margin-top: 10px;">
                            ID для справки: ${orderID}
                        </p>
                    </div>
                `;
                
                startActivationCheck();
            }
        }
    }
    
    // --- 6. ПРОВЕРКА АКТИВАЦИИ ---
    let activationCheckInterval = null;
    
    function startActivationCheck() {
        if (activationCheckInterval) {
            clearInterval(activationCheckInterval);
        }
        
        activationCheckInterval = setInterval(async () => {
            try {
                const response = await fetch(`https://chea.onrender.com/check-status?fp=${userFP}`);
                const data = await response.json();
                
                console.log('Проверка активации:', data);
                
                if (data.active === true) {
                    showActivatedStatus();
                    clearInterval(activationCheckInterval);
                }
                
            } catch (error) {
                console.log('Ошибка проверки активации:', error);
            }
        }, 10000);
    }
    
    // --- 7. СТАТУС "АКТИВИРОВАН" (С ПРОВЕРКОЙ) ---
    async function showActivatedStatus() {
        const savedOrderID = localStorage.getItem('lastOrderID');
        if (!savedOrderID) return;
        
        try {
            // ПРОВЕРКА: есть ли ещё этот код в БД?
            const response = await fetch(`https://chea.onrender.com/check-status?code=${savedOrderID}`);
            const status = await response.json();
            
            // Если код удалён → не показываем "АКТИВИРОВАН"
            if (!status.code || !status.active) {
                console.log('Код удалён, скрываем статус');
                clearLocalStorage();
                return;
            }
            
            // Код есть и активен → показываем
            const cardHeader = document.querySelector('.card-header');
            const cardBody = document.querySelector('.card-body');
            
            if (cardHeader && cardBody) {
                cardHeader.innerHTML = `<i class="fas fa-check-circle"></i> Статус: АКТИВИРОВАН`;
                cardBody.innerHTML = `
                    <div style="text-align: center;">
                        <p style="margin-bottom: 20px; font-weight: 600;">
                            <strong>Ваш пакет полностью готов.</strong> Все инструменты цифрового адвоката разблокированы.
                        </p>
                        <a href="https://bothub-bridge.onrender.com/?access_code=${savedOrderID}" 
                           target="_blank"
                           style="display: block; background: #27ae60; color: white; padding: 15px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                           ВХОД В ЛИЧНЫЙ КАБИНЕТ
                        </a>
                        <p style="font-size: 0.9rem; color: #718096; margin-top: 15px;">
                            Код доступа: <code>${savedOrderID}</code>
                        </p>
                    </div>
                `;
            }
            
        } catch (error) {
            console.error('Ошибка проверки кода:', error);
            clearLocalStorage();
        }
    }
    
  // --- 8. СТРАНИЦА ОПЛАТЫ (ИСПРАВЛЕННАЯ) ---
function setupPaymentPage() {
    if (window.location.pathname.includes('payment.html')) {
        console.log('💰 Инициализация страницы оплаты');
        
        const urlParams = new URLSearchParams(window.location.search);
        const planKey = urlParams.get('plan') || 'extended';
        const orderID = localStorage.getItem('lastOrderID');
        const plan = planDetails[planKey] || planDetails.extended;
        
        // ПРАВИЛЬНАЯ ЦЕНА из planDetails
        const price = plan.price.replace(' ₽', '').replace(/\s/g, ''); // "500 ₽" → "500"
        
        // Обновляем название тарифа
        if (document.getElementById('selectedPlanName')) {
            document.getElementById('selectedPlanName').textContent = plan.name;
        }
        
        // Обновляем цену и ID
        const priceEl = document.getElementById('selectedPlanPrice');
        if (priceEl) {
            priceEl.innerHTML = `${price} ₽ <br><span style="color:red; font-size:1rem;">ID: ${orderID}</span>`;
        }
        
        // Обновляем ID тарифа
        const planIdEl = document.getElementById('selectedPlanId');
        if (planIdEl) {
            planIdEl.textContent = `ID: ${orderID}`;
        }
        
        // Обновляем описание тарифа
        const planDescEl = document.getElementById('selectedPlanDesc');
        if (planDescEl) {
            planDescEl.textContent = plan.desc;
        }
        
        // ОБНОВЛЯЕМ поле manualPrice (это <strong> элемент!)
        const manualPriceEl = document.getElementById('manualPrice');
        if (manualPriceEl) {
            manualPriceEl.textContent = price; // не .value, а .textContent!
        }
        
        // ОБНОВЛЯЕМ поле stepAmount (это тоже <strong> элемент!)
        const stepAmountEl = document.getElementById('stepAmount');
        if (stepAmountEl) {
            stepAmountEl.textContent = price; // не .value, а .textContent!
        }
        
        // Генерируем QR-код
        const qrImg = document.getElementById('qrCodeImage');
        if (qrImg) {
            const baseQR = 'https://www.sberbank.ru/ru/choise_bank?requisiteNumber=79108777700&bankCode=100000000111';
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(baseQR + '&sum=' + price + '&label=' + orderID)}`;
        }
        
        console.log('💰 Данные обновлены:', { planKey, price, orderID });
    }
}

    // --- 9. ИНИЦИАЛИЗАЦИЯ ---
    try {
        console.log('💰 Начало инициализации...');
        
        // Настройка тарифов (сначала вешаем обработчики)
        setupTariffButtons();
        
        // Проверяем и блокируем тарифы если нужно (после настройки)
        checkAndBlockTariffs();
        
        // Показываем статус "ОЖИДАНИЕ" если есть сохранённый план
        showWaitingStatus();
        
        // Настройка страницы оплаты
        setupPaymentPage();
        
        console.log('✅ Модуль инициализирован');
        
    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
    }
});

console.log('✅ script.js загружен (с корректной разблокировкой)');
