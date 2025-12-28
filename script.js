// ===================================================================
// АДВОКАТ МЕДНОГО ГРОША — script.js
// ГИБРИДНАЯ ВЕРСИЯ: связь с БД из рабочего кода + без скроллинга
// ===================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('💰 Тарифы: инициализация');
    
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

    // --- 2. ИСПРАВЛЕННАЯ ОБРАБОТКА КНОПОК ТАРИФОВ (без скроллинга, с БД) ---
    function setupTariffButtons() {
        const tariffButtons = document.querySelectorAll('.pricing-card .btn[data-plan]');
        console.log(`💰 Найдено кнопок тарифов: ${tariffButtons.length}`);
        
        tariffButtons.forEach(button => {
            // Клонируем кнопку как в рабочем коде, чтобы убрать старые обработчики
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            // Вешаем обработчик как в рабочем коде
            newButton.addEventListener('click', function(e) {
                e.preventDefault(); // БЛОКИРУЕМ скроллинг
                e.stopPropagation();
                
                console.log('💰 Клик по тарифу:', this.getAttribute('data-plan'));
                
                const planKey = this.getAttribute('data-plan');
                const card = this.closest('.pricing-card');
                
                // 1. Генерация и сохранение (как в рабочем коде)
                const newID = generateOrderIdentifier(planKey);
                localStorage.setItem('lastOrderID', newID);
                localStorage.setItem('selectedPlan', planKey);
                localStorage.setItem('lockTime', Date.now());

                // 2. ОТПРАВКА В БД (ВАЖНО: как в рабочем коде БЕЗ .catch)
                try {
                    const capsLimits = { 'basic': 30000, 'extended': 60000, 'subscription': 90000 };
                    
                    // ТОЧНО ТАК ЖЕ КАК В РАБОЧЕМ КОДЕ - без обработки ошибок
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
                    
                    console.log("✅ Заказ предварительно зарегистрирован в БД");
                    
                } catch (err) {
                    console.error("❌ Ошибка:", err);
                }

                // 3. Переход на payment.html (с задержкой как в рабочем коде)
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
    
    // --- 3. ЛОГИКА ПОДМЕНЫ КАРТОЧКИ (как в рабочем коде) ---
    function renderWaitingCard(planKey) {
        const plan = planDetails[planKey] || planDetails['extended'];
        const header = document.querySelector('.card-header');
        const body = document.querySelector('.card-body');
        const orderID = localStorage.getItem('lastOrderID') || "ID ГЕНЕРИРУЕТСЯ...";

        if(header && body) {
            header.id = "hero-card-header";
            body.id = "hero-card-body";
            header.innerHTML = `<i class="fas fa-clock"></i> Ваш выбор: ${plan.name} — ${plan.price}`;
            body.innerHTML = `
                <p style="font-size: 0.9rem; font-weight: bold;">Статус: <span style="color: #e67e22; font-weight: bold;">ОЖИДАНИЕ ПОДТВЕРЖДЕНИЯ</span></p>
                <div style="text-align: left; font-size: 0.85rem; background: #fdf2e9; padding: 10px; border-radius: 5px; border-left: 4px solid #e67e22;">
                    ${plan.desc}
                </div>
                <p style="font-size: 0.8rem; margin-top: 10px;">Бот забронирован. Отправьте ID и чек в Telegram:</p>
                <a href="https://t.me/chearu252?text=${encodeURIComponent('Мой ID: ' + orderID + '. Прикрепите чек к сообщению!')}" target="_blank" style="display: block; background: #0088cc; color: white; padding: 12px; border-radius: 6px; text-decoration: none; text-align: center; font-weight: 600;">
                    <i class="fab fa-telegram-plane"></i> ПОДТВЕРДИТЬ В TELEGRAM
                </a>
                <p style="font-size: 0.7rem; color: #999; margin-top: 8px;">ID для справки: ${orderID}</p>
            `;
        }
    }

    // --- 4. ПРОВЕРКА АКТИВАЦИИ (как в рабочем коде) ---
    async function checkActivation() {
        try {
            const response = await fetch(`https://chea.onrender.com/check-status?fp=${userFP}`);
            const data = await response.json();
            if (data.active) {
                const header = document.getElementById('hero-card-header');
                const body = document.getElementById('hero-card-body');
                const savedOrderID = localStorage.getItem('lastOrderID');
                
                if(header && body) {
                    header.innerHTML = `<i class="fas fa-check-circle"></i> Статус: АКТИВИРОВАН`;
                    body.innerHTML = `
                        <p><strong>Ваш пакет полностью готов.</strong> Все инструменты цифрового адвоката разблокированы.</p>
                        <a href="https://bothub-bridge.onrender.com/?access_code=${savedOrderID}" target="_blank" style="display: block; background: #27ae60; color: white; padding: 15px; border-radius: 8px; text-decoration: none; text-align: center; font-weight: 600;">
                            ВХОД В ЛИЧНЫЙ КАБИНЕТ
                        </a>
                        <p style="font-size: 0.9rem; color: #718096; margin-top: 15px;">
                            Код доступа: <code>${savedOrderID}</code>
                        </p>
                    `;
                }
            }
        } catch (e) { console.log("Проверка..."); }
    }
    
    // --- 5. СТРАНИЦА ОПЛАТЫ ---
    function setupPaymentPage() {
        if (window.location.pathname.includes('payment.html')) {
            console.log('💰 Инициализация страницы оплаты');
            
            const urlParams = new URLSearchParams(window.location.search);
            const planKey = urlParams.get('plan') || 'extended';
            const price = urlParams.get('price') || '1200';
            const orderID = localStorage.getItem('lastOrderID');
            const plan = planDetails[planKey] || planDetails.extended;

            // Обновление полей
            if (document.getElementById('selectedPlanName')) {
                document.getElementById('selectedPlanName').textContent = plan.name;
            }
            
            const priceEl = document.getElementById('selectedPlanPrice');
            if (priceEl) {
                priceEl.innerHTML = `${price} ₽ <br><span style="color:red; font-size:1rem;">ID: ${orderID}</span>`;
            }
            
            // QR-код
            const qrImg = document.getElementById('qrCodeImage');
            if (qrImg) {
                const baseQR = 'https://www.sberbank.ru/ru/choise_bank?requisiteNumber=79108777700&bankCode=100000000111';
                qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(baseQR + '&sum=' + price + '&label=' + orderID)}`;
            }
            
            console.log('💰 Данные обновлены:', { planKey, price, orderID });
        }
    }
    
    // --- 6. ВОССТАНОВЛЕНИЕ СОСТОЯНИЯ (как в рабочем коде) ---
    function checkSavedState() {
        const savedPlan = localStorage.getItem('selectedPlan');
        const lockTime = localStorage.getItem('lockTime');

        if (savedPlan && lockTime && (Date.now() - lockTime < 24 * 60 * 60 * 1000)) {
            console.log('💰 Восстановлен сохранённый план:', savedPlan);
            renderWaitingCard(savedPlan);
            setInterval(checkActivation, 10000); // Проверка каждые 10 секунд
        }
    }

    // --- 7. ВЫПОЛНЕНИЕ ---
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

console.log('✅ script.js загружен (гибридная версия)');
