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
            
            // СКРЫТИЕ БЛОКА АНАЛИЗА КАК В МОНОЛИТЕ
            const questionnaire = document.getElementById('questionnaire');
            if (questionnaire) questionnaire.style.display = 'none';
            
            // ЗАПУСК ПРОВЕРКИ АКТИВАЦИИ КАК В МОНОЛИТЕ
            if (typeof startActivationCheck === 'function') {
                startActivationCheck();
            }
        }
    } else {
        // ПОКАЗ БЛОКА АНАЛИЗА КАК В МОНОЛИТЕ
        const questionnaire = document.getElementById('questionnaire');
        if (questionnaire) questionnaire.style.display = 'block';
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
            
            // СКРЫТИЕ БЛОКА АНАЛИЗА КАК В МОНОЛИТЕ
            const questionnaire = document.getElementById('questionnaire');
            if (questionnaire) questionnaire.style.display = 'none';
        }

    } catch (error) {
        console.error('Ошибка проверки кода:', error);
    }
}
