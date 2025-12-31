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
