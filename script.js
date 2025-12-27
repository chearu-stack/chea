// ГЛОБАЛЬНЫЙ ОБЪЕКТ СОСТОЯНИЯ СИСТЕМЫ
window.AMG_State = window.AMG_State || {
    // Флаги состояний
    systemReady: false,
    scrollAllowed: false,
    widgetActive: false,
    
    // Данные
    currentPlan: null,
    userFP: null,
    initializationStarted: false,
    initializationComplete: false,
    
    // Методы управления
    blockSystem: function(reason) {
        console.log(`🔒 [AMG_State] Блокировка системы: ${reason}`);
        this.systemReady = false;
        this.scrollAllowed = false;
        this.initializationStarted = true;
    },
    
    unblockSystem: function() {
        console.log('✅ [AMG_State] Система разблокирована');
        this.systemReady = true;
        this.scrollAllowed = true;
        this.initializationComplete = true;
        
        // Глобальное событие для других скриптов
        window.dispatchEvent(new CustomEvent('amg-system-ready'));
    },
    
    // Аварийная разблокировка
    emergencyUnblock: function() {
        console.warn('🆘 [AMG_State] АВАРИЙНАЯ разблокировка системы');
        this.systemReady = true;
        this.scrollAllowed = true;
        this.initializationComplete = true;
        window.dispatchEvent(new CustomEvent('amg-system-emergency-ready'));
    }
};

/**
 * АДВОКАТ МЕДНОГО ГРОША — script.js
 * ВЕРСИЯ: FERRARI EDITION v2.1 (стабильная с исправлениями)
 */

// ===== КРИТИЧЕСКИЙ ФИКС: ЗАЩИТА ОТ ДВОЙНОЙ ИНИЦИАЛИЗАЦИИ =====
if (window.AMG_State.initializationStarted) {
    console.warn('⚠️ [ScriptJS] Система уже инициализируется, пропускаем дублирование');
} else {
    // БЛОКИРОВКА СИСТЕМЫ ПРИ ЗАГРУЗКЕ
    window.AMG_State.blockSystem('Загрузка script.js');
}

// ===== ГАРАНТИРОВАННАЯ ИНИЦИАЛИЗАЦИЯ =====
function initializeAMGSystem() {
    console.log("🚀 [ScriptJS] Система АМГ: Ferrari Mode активирована.");
    
    // Защита от повторного выполнения
    if (window._AMG_INITIALIZED) {
        console.warn('⚠️ [ScriptJS] Система уже инициализирована');
        return;
    }
    window._AMG_INITIALIZED = true;
    
    // --- 0. СТИЛИ ДЛЯ МЕРЦАНИЯ И КНОПОК ---
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
        .blink-status { animation: blink 2s infinite ease-in-out; color: #e67e22; font-weight: bold; display: block; margin: 10px 0; font-family: 'Open Sans', sans-serif; }
        .btn-cabinet { background: #27ae60; color: white; padding: 15px; border-radius: 5px; text-decoration: none; display: block; text-align: center; font-weight: bold; margin-top: 15px; transition: 0.3s; }
        .btn-cabinet:hover { background: #2ecc71; }
        .btn-tg-lock { background: #0088cc; color: white; padding: 12px; border-radius: 5px; text-decoration: none; display: block; text-align: center; font-weight: bold; margin-top: 10px; }
    `;
    document.head.appendChild(style);

    // --- 1. ГЕНЕРАЦИЯ ID И ОТПЕЧАТКА ---
    const getFP = () => {
        const s = window.screen;
        const b = navigator.userAgent;
        return btoa(`${s.width}${s.height}${b}${s.colorDepth}`).substring(0, 12);
    };
    const userFP = getFP();
    window.AMG_State.userFP = userFP; // Сохраняем в глобальное состояние

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

    // --- 2. ЛОГИКА ПОДМЕНЫ КАРТОЧКИ (ГЛАВНАЯ) ---
    function renderWaitingCard(planKey) {
        // ПРОВЕРКА: если система заблокирована - ждём
        if (!window.AMG_State.systemReady) {
            console.log('⏳ [RenderCard] Ожидание разблокировки системы...');
            setTimeout(() => renderWaitingCard(planKey), 100);
            return;
        }
        
        console.log('🎨 [RenderCard] Отрисовка карточки для плана:', planKey);
        
        const plan = planDetails[planKey] || planDetails['extended'];
        const header = document.querySelector('.card-header');
        const body = document.querySelector('.card-body');
        const orderID = localStorage.getItem('lastOrderID') || "ID ГЕНЕРИРУЕТСЯ...";

        if(header && body) {
            header.id = "hero-card-header";
            body.id = "hero-card-body";
            header.innerHTML = `<i class="fas fa-clock"></i> Ваш выбор: ${plan.name} — ${plan.price}`;
            body.innerHTML = `
                <p style="font-size: 0.9rem; font-weight: bold;">Статус: <span class="blink-status">ОЖИДАНИЕ ПОДТВЕРЖДЕНИЯ</span></p>
                <div style="text-align: left; font-size: 0.85rem; background: #fdf2e9; padding: 10px; border-radius: 5px; border-left: 4px solid #e67e22;">
                    ${plan.desc}
                </div>
                <p style="font-size: 0.8rem; margin-top: 10px;">Бот забронирован. Отправьте ID и чек в Telegram:</p>
                <a href="https://t.me/chearu252?text=${encodeURIComponent('Мой ID: ' + orderID + '. Прикрепите чек к сообщению!')}" target="_blank" class="btn-tg-lock">
                    <i class="fab fa-telegram-plane"></i> ПОДТВЕРДИТЬ В TELEGRAM
                </a>
                <p style="font-size: 0.7rem; color: #999; margin-top: 8px;">ID для справки: ${orderID}</p>
            `;
        }
    }

    async function checkActivation() {
        try {
            const response = await fetch(`https://chea.onrender.com/check-status?fp=${userFP}`);
            const data = await response.json();
            if (data.active) {
                const header = document.getElementById('hero-card-header');
                const body = document.getElementById('hero-card-body');
                if(header && body) {
                    header.innerHTML = `<i class="fas fa-check-circle"></i> Статус: АКТИВИРОВАН`;
                    body.innerHTML = `
                        <p><strong>Ваш пакет полностью готов.</strong> Все инструменты цифрового адвоката разблокированы.</p>
                        <a href="chat.html?fp=${userFP}" class="btn-cabinet">ВХОД В ЛИЧНЫЙ КАБИНЕТ</a>
                    `;
                }
            }
        } catch (e) { console.log("[CheckActivation] Проверка..."); }
    }

    // --- 3. ИСПРАВЛЕННАЯ ОБРАБОТКА ТАРИФОВ ---
    function setupTariffButtons() {
        const tariffButtons = document.querySelectorAll('.pricing-card .btn[data-plan]');
        console.log(`🔘 [TariffButtons] Найдено кнопок тарифов: ${tariffButtons.length}`);
        
        tariffButtons.forEach(button => {
            // Удаляем старый обработчик (если есть)
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            // Вешаем новый с preventDefault
            newButton.addEventListener('click', async function(e) {
                e.preventDefault(); // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ!
                e.stopPropagation();
                
                console.log('🖱️ [TariffButtons] Клик по тарифу:', this.getAttribute('data-plan'));
                
                const card = this.closest('.pricing-card');
                const planKey = this.getAttribute('data-plan');
                const priceText = card.querySelector('.price').textContent.replace(/\s/g, '');
                const priceInt = parseInt(priceText);
                
                // 1. Генерируем данные локально
                const newID = generateOrderIdentifier(planKey);
                localStorage.setItem('lastOrderID', newID);
                localStorage.setItem('selectedPlan', planKey);
                localStorage.setItem('lockTime', Date.now());

                // 2. СРАЗУ отправляем "отпечаток" и заказ на сервер
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
                    
                    console.log("✅ [TariffButtons] Заказ предварительно зарегистрирован в БД");
                } catch (err) {
                    console.error("❌ [TariffButtons] Ошибка связи с сервером:", err);
                }

                // 3. ТОЛЬКО ПОСЛЕ обработки — переход на payment.html
                setTimeout(() => {
                    window.location.href = this.getAttribute('href');
                }, 100);
            });
        });
    }
    
    // --- 4. ПРОВЕРКА СОСТОЯНИЯ ПРИ ЗАГРУЗКЕ ---
    function checkSavedState() {
        const savedPlan = localStorage.getItem('selectedPlan');
        const lockTime = localStorage.getItem('lockTime');

        if (savedPlan && lockTime && (Date.now() - lockTime < 24 * 60 * 60 * 1000)) {
            window.AMG_State.currentPlan = savedPlan;
            renderWaitingCard(savedPlan);
            setInterval(checkActivation, 10000);
            console.log('💾 [SavedState] Восстановлено сохранённое состояние:', savedPlan);
        } else {
            console.log('💾 [SavedState] Сохранённое состояние не найдено');
        }
    }

    // --- 5. ЛОГИКА СТРАНИЦЫ ОПЛАТЫ ---
    function setupPaymentPage() {
        if (window.location.pathname.includes('payment.html')) {
            console.log('💰 [PaymentPage] Инициализация страницы оплаты');
            
            const urlParams = new URLSearchParams(window.location.search);
            const planKey = urlParams.get('plan') || 'extended';
            const price = urlParams.get('price') || '1200';
            const orderID = localStorage.getItem('lastOrderID');

            if (document.getElementById('selectedPlanName')) {
                document.getElementById('selectedPlanName').textContent = planDetails[planKey].name;
            }
            
            const priceEl = document.getElementById('selectedPlanPrice');
            if (priceEl) {
                priceEl.innerHTML = `${price} ₽ <br><span style="color:red; font-size:1rem;">ID: ${orderID}</span>`;
            }
            
            const qrImg = document.getElementById('qrCodeImage');
            if (qrImg) {
                const baseQR = 'https://www.sberbank.ru/ru/choise_bank?requisiteNumber=79108777700&bankCode=100000000111';
                qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(baseQR + '&sum=' + price + '&label=' + orderID)}`;
            }
        }
    }
    
    // --- 6. ВЫПОЛНЕНИЕ ВСЕХ ИНИЦИАЛИЗАЦИЙ ---
    try {
        console.log('⚙️ [ScriptJS] Начало инициализации компонентов...');
        
        // Настройка кнопок тарифов
        setupTariffButtons();
        
        // Проверка сохранённого состояния
        checkSavedState();
        
        // Настройка страницы оплаты (если мы на ней)
        setupPaymentPage();
        
        console.log('✅ [ScriptJS] Все компоненты инициализированы');
        
    } catch (error) {
        console.error('❌ [ScriptJS] Ошибка инициализации:', error);
    }
    
    // --- 7. ГАРАНТИРОВАННАЯ РАЗБЛОКИРОВКА СИСТЕМЫ ---
    function guaranteedUnblock() {
        console.log('🔓 [GuaranteedUnblock] Запуск гарантированной разблокировки');
        
        // ВАЖНО: Убеждаемся, что unblockSystem вызывается
        if (!window.AMG_State.systemReady) {
            window.AMG_State.unblockSystem();
            console.log('🚀 [ScriptJS] Система АМГ: Ferrari Mode ГОТОВ К РАБОТЕ');
        } else {
            console.log('ℹ️ [ScriptJS] Система уже разблокирована');
        }
        
        // Дополнительная проверка через 1 секунду
        setTimeout(() => {
            if (!window.AMG_State.systemReady) {
                console.warn('⚠️ [ScriptJS] Система всё ещё заблокирована! Аварийная разблокировка');
                window.AMG_State.emergencyUnblock();
            }
        }, 1000);
    }
    
    // Разблокировка через 300мс
    setTimeout(guaranteedUnblock, 300);
}

// ===== ОСНОВНАЯ ИНИЦИАЛИЗАЦИЯ =====

// Вариант 1: Если DOM уже загружен
if (document.readyState === 'loading') {
    // Вариант 2: Ждём загрузки DOM
    document.addEventListener('DOMContentLoaded', function amgDOMLoaded() {
        console.log('📄 [ScriptJS] DOM загружен, инициализация системы');
        document.removeEventListener('DOMContentLoaded', amgDOMLoaded);
        initializeAMGSystem();
    });
} else {
    // DOM уже загружен
    console.log('📄 [ScriptJS] DOM уже загружен, немедленная инициализация');
    setTimeout(initializeAMGSystem, 0);
}

// ===== АВАРИЙНЫЕ МЕХАНИЗМЫ =====

// Защита от зависания: если через 10 секунд система не разблокирована
setTimeout(function() {
    if (!window.AMG_State.systemReady && !window.AMG_State.initializationComplete) {
        console.error('🆘 [ScriptJS] КРИТИЧЕСКАЯ ОШИБКА: Система не разблокирована за 10 секунд!');
        window.AMG_State.emergencyUnblock();
    }
}, 10000);

// Экспорт для отладки
window._AMG_Debug = {
    getState: function() {
        return {
            AMG_State: window.AMG_State,
            initialized: window._AMG_INITIALIZED,
            readyState: document.readyState
        };
    },
    forceUnblock: function() {
        window.AMG_State.emergencyUnblock();
    }
};

console.log('✅ [ScriptJS] Модуль загружен и готов к инициализации');
