// ===================================================================
// АДВОКАТ МЕДНОГО ГРОША — script.js
// ВЕРСИЯ: STABLE FERRARI EDITION (исправленная, без конфликтов)
// ===================================================================

// ГЛОБАЛЬНЫЙ ОБЪЕКТ СОСТОЯНИЯ (минимальный)
window.AMG_State = window.AMG_State || {
    systemReady: false,
    scrollAllowed: false,
    currentPlan: null,
    userFP: null
};

/**
 * Основная инициализация системы
 */
function initializeAMGSystem() {
    console.log("🚀 Система АМГ: Ferrari Mode активирована.");
    
    // --- 1. СТИЛИ ДЛЯ МЕРЦАНИЯ И КНОПОК ---
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
        .blink-status { 
            animation: blink 2s infinite ease-in-out; 
            color: #e67e22; 
            font-weight: bold; 
            display: block; 
            margin: 10px 0; 
            font-family: 'Open Sans', sans-serif; 
        }
        .btn-cabinet { 
            background: #27ae60; 
            color: white; 
            padding: 15px; 
            border-radius: 5px; 
            text-decoration: none; 
            display: block; 
            text-align: center; 
            font-weight: bold; 
            margin-top: 15px; 
            transition: 0.3s; 
        }
        .btn-cabinet:hover { background: #2ecc71; }
        .btn-tg-lock { 
            background: #0088cc; 
            color: white; 
            padding: 12px; 
            border-radius: 5px; 
            text-decoration: none; 
            display: block; 
            text-align: center; 
            font-weight: bold; 
            margin-top: 10px; 
        }
    `;
    document.head.appendChild(style);

    // --- 2. ГЕНЕРАЦИЯ ID И ОТПЕЧАТКА ---
    const getFP = () => {
        const s = window.screen;
        const b = navigator.userAgent;
        return btoa(`${s.width}${s.height}${b}${s.colorDepth}`).substring(0, 12);
    };
    const userFP = getFP();
    window.AMG_State.userFP = userFP;

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

    // --- 3. ЛОГИКА ПОДМЕНЫ КАРТОЧКИ (ГЛАВНАЯ) ---
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
        } catch (e) { 
            console.log("[CheckActivation] Проверка статуса..."); 
        }
    }

    // --- 4. ОБРАБОТКА КНОПОК ТАРИФОВ (ГЛАВНОЕ!) ---
    function setupTariffButtons() {
        const tariffButtons = document.querySelectorAll('.pricing-card .btn[data-plan]');
        console.log(`Найдено кнопок тарифов: ${tariffButtons.length}`);
        
        tariffButtons.forEach(button => {
            // Создаем новую кнопку с теми же атрибутами
            const newButton = button.cloneNode(true);
            
            // Заменяем старую кнопку на новую (для чистых обработчиков)
            if (button.parentNode) {
                button.parentNode.replaceChild(newButton, button);
            }
            
            // Вешаем ОДИН обработчик
            newButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('Клик по тарифу:', this.getAttribute('data-plan'));
                
                const planKey = this.getAttribute('data-plan');
                
                // 1. Генерируем данные локально
                const newID = generateOrderIdentifier(planKey);
                localStorage.setItem('lastOrderID', newID);
                localStorage.setItem('selectedPlan', planKey);
                localStorage.setItem('lockTime', Date.now());

                // 2. Отправляем на сервер (асинхронно, не ждём)
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
                        console.log("Заказ зарегистрирован в БД");
                    }).catch(err => {
                        console.error("Ошибка связи с сервером:", err);
                    });
                    
                } catch (err) {
                    console.error("Ошибка:", err);
                }

                // 3. Переход на payment.html БЕЗ ЗАДЕРЖЕК
                const href = this.getAttribute('href');
                if (href) {
                    window.location.href = href;
                }
                
                return false;
            });
        });
    }
    
    // --- 5. ВОССТАНОВЛЕНИЕ СОСТОЯНИЯ ---
    function checkSavedState() {
        const savedPlan = localStorage.getItem('selectedPlan');
        const lockTime = localStorage.getItem('lockTime');

        if (savedPlan && lockTime && (Date.now() - lockTime < 24 * 60 * 60 * 1000)) {
            window.AMG_State.currentPlan = savedPlan;
            renderWaitingCard(savedPlan);
            
            // Проверка активации каждые 10 секунд
            setInterval(checkActivation, 10000);
            console.log('Восстановлено сохранённое состояние:', savedPlan);
        }
    }

    // --- 6. СТРАНИЦА ОПЛАТЫ ---
    function setupPaymentPage() {
        if (window.location.pathname.includes('payment.html')) {
            console.log('Инициализация страницы оплаты');
            
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
    
    // --- 7. НАСТРОЙКА ЛОГОТИПА (скролл наверх) ---
    function setupLogoClick() {
        const navLogo = document.getElementById('navLogo');
        if (navLogo) {
            navLogo.style.cursor = 'pointer';
            
            navLogo.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Клик по логотипу - скролл наверх');
                
                // Плавный скролл к верху
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
                
                return false;
            });
        }
    }
    
    // --- 8. ВЫПОЛНЕНИЕ ВСЕХ ИНИЦИАЛИЗАЦИЙ ---
    try {
        console.log('Начало инициализации компонентов...');
        
        // Настройка кнопок тарифов (ВАЖНО!)
        setupTariffButtons();
        
        // Восстановление состояния
        checkSavedState();
        
        // Настройка страницы оплаты
        setupPaymentPage();
        
        // Настройка логотипа
        setupLogoClick();
        
        console.log('Все компоненты инициализированы');
        
    } catch (error) {
        console.error('Ошибка инициализации:', error);
    }
    
    // --- 9. РАЗБЛОКИРОВКА СИСТЕМЫ ---
    setTimeout(() => {
        window.AMG_State.systemReady = true;
        window.AMG_State.scrollAllowed = true;
        console.log('✅ Система АМГ готова к работе');
    }, 300);
}

// ===== ТОЧКА ВХОДА =====

// Блокируем систему при загрузке
window.AMG_State.systemReady = false;
window.AMG_State.scrollAllowed = false;

// Ждём загрузки DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM загружен, инициализация системы');
        initializeAMGSystem();
    });
} else {
    console.log('DOM уже загружен, немедленная инициализация');
    setTimeout(initializeAMGSystem, 0);
}

// Аварийная разблокировка через 5 секунд (на всякий случай)
setTimeout(() => {
    if (!window.AMG_State.systemReady) {
        console.warn('Аварийная разблокировка системы');
        window.AMG_State.systemReady = true;
        window.AMG_State.scrollAllowed = true;
    }
}, 5000);

console.log('✅ script.js загружен');
