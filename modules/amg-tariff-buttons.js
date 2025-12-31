// ===================================================================
// МОДУЛЬ: Логика тарифов и кнопок
// ===================================================================

// --- НАСТРОЙКА КНОПОК ТАРИФОВ ---
export function setupTariffButtons(API_BASE, userFP, generateOrderIdentifier, planDetails) {
    const tariffButtons = document.querySelectorAll('.pricing-card .btn[data-plan]');
    console.log(`💰 Найдено кнопок тарифов: ${tariffButtons.length}`);

    tariffButtons.forEach(button => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        newButton.addEventListener('click', function (e) {
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

            // УДАЛИЛ блокировку здесь - она будет при следующей загрузке главной страницы

            const href = this.getAttribute('href');
            if (href) {
                setTimeout(() => {
                    window.location.href = href; // ← ПЕРЕХОД НА СТРАНИЦУ ОПЛАТЫ
                }, 100);
            }

            return false;
        });
    });
}

// --- БЛОКИРОВКА КНОПОК ---
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

// --- РАЗБЛОКИРОВКА КНОПОК ---
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

// --- ПРОВЕРКА И БЛОКИРОВКА ТАРИФОВ ПРИ ЗАГРУЗКЕ ---
export async function checkAndBlockTariffs(API_BASE, userFP) {
    const savedOrderID = localStorage.getItem('lastOrderID');
    const savedPlan = localStorage.getItem('selectedPlan');
    const lockTime = localStorage.getItem('lockTime');

    if (!savedOrderID || !savedPlan || !lockTime) {
        unlockTariffButtons();
        return;
    }

    const timePassed = Date.now() - parseInt(lockTime);
    
    // Если прошло больше 24 часов - разблокировать
    if (timePassed > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('lastOrderID');
        localStorage.removeItem('selectedPlan');
        localStorage.removeItem('lockTime');
        unlockTariffButtons();
        console.log('⌛ Время блокировки истекло (24 часа)');
        return;
    }

    // Проверяем статус кода
    try {
        const response = await fetch(`${API_BASE}/check-status?code=${savedOrderID}`);
        const status = await response.json();

        // Если код удален из БД - разблокировать
        if (!status.code) {
            console.log('🗑️ Код удалён из БД → разблокировка');
            localStorage.removeItem('lastOrderID');
            localStorage.removeItem('selectedPlan');
            localStorage.removeItem('lockTime');
            unlockTariffButtons();
            return;
        }

        // Блокируем кнопки с сообщением о времени
        const hoursLeft = Math.ceil((24 * 60 * 60 * 1000 - timePassed) / (60 * 60 * 1000));
        blockTariffButtons(`Тариф выбран. Смена через ${hoursLeft}ч`);
        console.log(`⏳ Тарифы заблокированы на ${hoursLeft} часов`);

    } catch (error) {
        console.error('Ошибка проверки блокировки:', error);
        unlockTariffButtons();
    }
}

// --- ПОКАЗ СТАТУСА "ОЖИДАНИЕ" ---
export function showWaitingStatus(API_BASE, planDetails) {
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
        }
    }
}

// --- ПОКАЗ СТАТУСА "АКТИВИРОВАН" ДЛЯ ПЛАТНЫХ ТАРИФОВ ---
export async function showActivatedStatus(API_BASE) {
    const savedOrderID = localStorage.getItem('lastOrderID');
    if (!savedOrderID) return;

    try {
        const response = await fetch(`${API_BASE}/check-status?code=${savedOrderID}`);
        const status = await response.json();

        if (!status.code || !status.active) return;

        const cardHeader = document.querySelector('.card-header');
        const cardBody = document.querySelector('.card-body');

        if (cardHeader && cardBody) {
            cardHeader.innerHTML = `<i class="fas fa-check-circle"></i> Статус: АКТИВИРОВАН`;
            cardBody.innerHTML = `
                <div style="text-align: center;">
                    <p style="margin-bottom: 20px; font-weight: 600;">
                        <strong>Ваш пакет полностью готов.</strong> Все инструменты цифрового адвоката разблокированы.
                    </p>
                    <a href="https://chearu-stack.github.io/chea/chat.html?access_code=${savedOrderID}" 
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
    }
}
