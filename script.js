// ===================================================================
// АДВОКАТ МЕДНОГО ГРОША — script.js
// ВЕРСИЯ С КОРРЕКТНОЙ БЛОКИРОВКОЙ, ПЕРЕВЕШИВАНИЕМ ОБРАБОТЧИКОВ И ПРОМО-АКЦИЯМИ
// ===================================================================

// Глобальные константы
const API_BASE = 'https://chea.onrender.com';

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
        
        showQuestionnaireBlock();
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

    // --- 2.1 ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ УПРАВЛЕНИЯ БЛОКОМ АНАЛИЗА ---
    function hideQuestionnaireBlock() {
        const questionnaire = document.getElementById('questionnaire');
        if (questionnaire) {
            questionnaire.style.display = 'none';
            console.log('Блок анализа скрыт');
        }
    }
    
    function showQuestionnaireBlock() {
        const questionnaire = document.getElementById('questionnaire');
        if (questionnaire) {
            questionnaire.style.display = 'block';
            console.log('Блок анализа показан');
        }
    }
    
    function unlockAndResetTariffButtons() {
        console.log('Разблокировка и сброс обработчиков');
        unlockTariffButtons();
        setupTariffButtons();
        showQuestionnaireBlock();
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
            
            const timePassed = Date.now() - parseInt(lockTime);
            if (timePassed > 24 * 60 * 60 * 1000) {
                clearLocalStorage();
                unlockAndResetTariffButtons();
                return;
            }
            
            const response = await fetch(`${API_BASE}/check-status?code=${savedOrderID}`);
            const status = await response.json();
            
            if (!status.code) {
                console.log('Код удалён из БД → разблокировка и сброс обработчиков');
                clearLocalStorage();
                unlockAndResetTariffButtons();
                return;
            }
            
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
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            newButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                if (this.hasAttribute('disabled')) {
                    console.log('Кнопка заблокирована, игнорируем клик');
                    return false;
                }
                
                console.log('💰 Клик по тарифу:', this.getAttribute('data-plan'));
                
                const planKey = this.getAttribute('data-plan');
                const newID = generateOrderIdentifier(planKey);
                localStorage.setItem('lastOrderID', newID);
                localStorage.setItem('selectedPlan', planKey);
                localStorage.setItem('lockTime', Date.now());

                try {
                    const capsLimits = { 'basic': 30000, 'extended': 60000, 'subscription': 90000 };
                    
                    fetch(`${API_BASE}/generate-code`, {
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

                checkAndBlockTariffs();

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
                
                hideQuestionnaireBlock();
                startActivationCheck();
            }
        } else {
            showQuestionnaireBlock();
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
                const response = await fetch(`${API_BASE}/check-status?fp=${userFP}`);
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
            const response = await fetch(`${API_BASE}/check-status?code=${savedOrderID}`);
            const status = await response.json();
            
            if (!status.code || !status.active) {
                console.log('Код удалён, скрываем статус');
                clearLocalStorage();
                return;
            }
            
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
            
            const price = plan.price.replace(' ₽', '').replace(/\s/g, '');
            
            if (document.getElementById('selectedPlanName')) {
                document.getElementById('selectedPlanName').textContent = plan.name;
            }
            
            const priceEl = document.getElementById('selectedPlanPrice');
            if (priceEl) {
                priceEl.innerHTML = `${price} ₽ <br><span style="color:red; font-size:1rem;">ID: ${orderID}</span>`;
            }
            
            const planIdEl = document.getElementById('selectedPlanId');
            if (planIdEl) {
                planIdEl.textContent = `ID: ${orderID}`;
            }
            
            const planDescEl = document.getElementById('selectedPlanDesc');
            if (planDescEl) {
                planDescEl.textContent = plan.desc;
            }
            
            const manualPriceEl = document.getElementById('manualPrice');
            if (manualPriceEl) {
                manualPriceEl.textContent = price;
            }
            
            const stepAmountEl = document.getElementById('stepAmount');
            if (stepAmountEl) {
                stepAmountEl.textContent = price;
            }
            
            const qrImg = document.getElementById('qrCodeImage');
            if (qrImg) {
                const baseQR = 'https://www.sberbank.ru/ru/choise_bank?requisiteNumber=79108777700&bankCode=100000000111';
                qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(baseQR + '&sum=' + price + '&label=' + orderID)}`;
            }
            
            console.log('💰 Данные обновлены:', { planKey, price, orderID });
        }
    }

    // ========== ПРОМО-АКЦИИ ==========

    // --- 9.1 ПРОВЕРКА АКТИВНОЙ АКЦИИ ---
    async function checkActiveCampaign() {
        try {
            const response = await fetch(`${API_BASE}/get-active-campaign`);
            const campaign = await response.json();
            
            console.log('🎁 Проверка акции:', campaign.active ? 'Активна' : 'Нет акций');
            
            if (campaign.active) {
                showPromoBanner(campaign);
                if (!hasParticipatedInPromo()) {
                    showPromoHeroCard(campaign);
                }
            }
        } catch (error) {
            console.error('❌ Ошибка проверки акции:', error);
        }
    }

    // --- 9.2 ПОКАЗ БАННЕРА ---
    function showPromoBanner(campaign) {
        const banner = document.getElementById('promo-banner');
        const title = document.getElementById('promoTitle');
        const description = document.getElementById('promoDescription');
        const button = document.getElementById('promoBtn');
        
        if (!banner) return;
        
        title.textContent = campaign.title || '🎁 АКЦИЯ';
        description.textContent = campaign.description || 'Специальное предложение';
        banner.style.background = campaign.color || 'linear-gradient(90deg, #dd6b20, #ed8936)';
        
        button.onclick = () => participateInPromo(campaign.package);
        banner.style.display = 'flex';
    }

    // --- 9.3 ИЗМЕНЕНИЕ HERO-CARD ДЛЯ АКЦИИ ---
    function showPromoHeroCard(campaign) {
        const cardHeader = document.querySelector('.card-header');
        const cardBody = document.querySelector('.card-body');
        
        if (!cardHeader || !cardBody) return;
        
        if (!window.originalHeroContent) {
            window.originalHeroContent = {
                header: cardHeader.innerHTML,
                body: cardBody.innerHTML
            };
        }
        
        cardHeader.innerHTML = `<i class="fas fa-gift"></i> ${campaign.title || 'Акция'}`;
        cardBody.innerHTML = `
            <div style="text-align: left;">
                <p style="margin-bottom: 10px; font-weight: 600;">
                    ${campaign.description || ''}
                </p>
                <p style="color: #718096; font-size: 0.9rem; margin-bottom: 15px;">
                    ⚠️ Код будет активирован сразу, но доступ действует только ${campaign.expires_days || 30} дней
                </p>
                <button id="promoHeroBtn" class="btn-promo-hero" style="width: 100%; padding: 12px; background: ${campaign.color || '#dd6b20'}; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                    <i class="fas fa-bolt"></i> Участвовать в акции
                </button>
            </div>
        `;
        
        document.getElementById('promoHeroBtn').onclick = () => participateInPromo(campaign.package);
    }

    // --- 9.4 ВОССТАНОВЛЕНИЕ ОРИГИНАЛЬНОГО HERO-CARD ---
    function restoreOriginalHeroCard() {
        if (!window.originalHeroContent) return;
        
        const cardHeader = document.querySelector('.card-header');
        const cardBody = document.querySelector('.card-body');
        
        if (cardHeader && cardBody) {
            cardHeader.innerHTML = window.originalHeroContent.header;
            cardBody.innerHTML = window.originalHeroContent.body;
        }
    }

    // --- 9.5 ПРОВЕРКА УЧАСТИЯ В АКЦИИ ---
    function hasParticipatedInPromo() {
        const lastPromoCode = localStorage.getItem('lastPromoCode');
        const promoTime = localStorage.getItem('promoTime');
        
        if (!lastPromoCode || !promoTime) return false;
        
        const timePassed = Date.now() - parseInt(promoTime);
        return timePassed < 30 * 24 * 60 * 60 * 1000;
    }

    // --- 9.6 УЧАСТИЕ В АКЦИИ ---
    async function participateInPromo(packageType) {
        console.log('🎁 Участие в промо-акции:', packageType);
        
        try {
            const response = await fetch(`${API_BASE}/generate-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: generatePromoIdentifier(packageType),
                    package: packageType,
                    caps_limit: 30000,
                    fingerprint: userFP,
                    metadata: { is_promo: true }
                })
            });
            
            const data = await response.json();
            console.log('✅ Промо-код создан:', data);
            
            localStorage.setItem('lastPromoCode', data.code);
            localStorage.setItem('promoTime', Date.now());
            
            document.getElementById('promo-banner').style.display = 'none';
            restoreOriginalHeroCard();
            showPromoWaitingStatus(data.code, packageType);
            
        } catch (error) {
            console.error('❌ Ошибка участия в акции:', error);
            alert('Ошибка участия в акции. Попробуйте позже.');
        }
    }

    // --- 9.7 ГЕНЕРАЦИЯ ПРОМО-КОДА ---
    function generatePromoIdentifier(packageType) {
        const now = new Date();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const planLetters = { 'PROMO_BASIC': 'P', 'PROMO_EXTENDED': 'Q', 'PROMO_SUBSCRIPTION': 'R' };
        const planLetter = planLetters[packageType] || 'P';
        return `AMG25-${mm}${dd}${hh}${min}-${planLetter}${userFP.substring(0,2).toUpperCase()}`;
    }

    // --- 9.8 СТАТУС "ОЖИДАНИЕ" ДЛЯ ПРОМО-КОДА ---
    function showPromoWaitingStatus(code, packageType) {
        const cardHeader = document.querySelector('.card-header');
        const cardBody = document.querySelector('.card-body');
        
        if (!cardHeader || !cardBody) return;
        
        const planName = packageType === 'PROMO_BASIC' ? 'Базовый' : 
                        packageType === 'PROMO_EXTENDED' ? 'Расширенный' : 'Профессиональный';
        
        cardHeader.innerHTML = `<i class="fas fa-clock"></i> Акция: ${planName}`;
        cardBody.innerHTML = `
            <div style="text-align: left;">
                <p style="font-weight: bold; color: #e67e22; margin-bottom: 10px;">
                    <i class="fas fa-hourglass-half"></i> Статус: ОЖИДАНИЕ ПОДТВЕРЖДЕНИЯ
                </p>
                <p style="margin-bottom: 10px;">Вы участвуете в акции. Сохраните ваш код:</p>
                <div style="background: #f7fafc; padding: 10px; border-radius: 6px; margin-bottom: 15px; font-family: monospace; font-weight: bold; text-align: center;">
                    ${code}
                </div>
                <p style="font-size: 0.9rem; margin-bottom: 15px;">
                    <strong>Отправьте скриншот подписки и этот код в Telegram:</strong>
                </p>
                <a href="https://t.me/chearu252?text=${encodeURIComponent('Промо-акция! Код: ' + code + '. Скриншот прикреплён.')}" 
                   target="_blank" 
                   style="display: block; background: #0088cc; color: white; padding: 12px; border-radius: 6px; text-decoration: none; text-align: center; font-weight: 600;">
                   <i class="fab fa-telegram"></i> ОТПРАВИТЬ СКРИНШОТ В TELEGRAM
                </a>
                <p style="font-size: 0.8rem; color: #718096; margin-top: 15px;">
                    ⚠️ После активации код будет действовать 30 дней
                </p>
            </div>
        `;
        
        hideQuestionnaireBlock();
    }

    // --- 10. ИНИЦИАЛИЗАЦИЯ ---
    try {
        console.log('💰 Начало инициализации...');
        
        setupTariffButtons();
        checkAndBlockTariffs();
        showWaitingStatus();
        checkActiveCampaign(); // ← ПРОВЕРКА АКЦИЙ ДОБАВЛЕНА
        setupPaymentPage();
        
        console.log('✅ Модуль инициализирован');
        
    } catch (error) {
        console.error('❌ Ошибка инициализации:', error);
    }
});

console.log('✅ script.js загружен (с промо-акциями)');
