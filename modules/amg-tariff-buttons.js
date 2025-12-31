// --- ПОКАЗ СТАТУСА "ОЖИДАНИЕ" ИЛИ "АКТИВИРОВАН" ---
export async function showWaitingStatus(API_BASE, planDetails) {
    const savedOrderID = localStorage.getItem('lastOrderID');
    const savedPlan = localStorage.getItem('selectedPlan');
    const lockTime = localStorage.getItem('lockTime');

    const cardHeader = document.querySelector('.card-header');
    const cardBody = document.querySelector('.card-body');
    
    if (!cardHeader || !cardBody) {
        return;
    }

    // Если нет данных о выборе тарифа - ВОССТАНАВЛИВАЕМ ИСХОДНУЮ КАРТОЧКУ
    if (!savedOrderID || !savedPlan || !lockTime) {
        // Возвращаем оригинальную карточку с примером расчёта
        cardHeader.innerHTML = `<i class="fas fa-bolt"></i> Пример расчёта`;
        cardBody.innerHTML = `
            <p><strong>Задержка ремонта на 14 дней</strong><br>Стоимость: 50 000 руб.</p>
            <div class="calculation">
                <p>50 000 × 3% × 14 дней =</p>
                <div class="result">21 000 руб.</div>
                <p class="note">Ваша компенсация (ст. 28 ЗоЗПП)</p>
            </div>
        `;
        return;
    }

    // Если прошло больше 24 часов - очищаем и восстанавливаем исходную карточку
    if (Date.now() - lockTime > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('lastOrderID');
        localStorage.removeItem('selectedPlan');
        localStorage.removeItem('lockTime');
        
        // Восстанавливаем исходную карточку
        cardHeader.innerHTML = `<i class="fas fa-bolt"></i> Пример расчёта`;
        cardBody.innerHTML = `
            <p><strong>Задержка ремонта на 14 дней</strong><br>Стоимость: 50 000 руб.</p>
            <div class="calculation">
                <p>50 000 × 3% × 14 дней =</p>
                <div class="result">21 000 руб.</div>
                <p class="note">Ваша компенсация (ст. 28 ЗоЗПП)</p>
            </div>
        `;
        return;
    }

    try {
        // Проверяем текущий статус в БД
        const response = await fetch(`${API_BASE}/check-status?code=${savedOrderID}`);
        const status = await response.json();

        // Если тариф АКТИВИРОВАН - показываем статус "АКТИВИРОВАН"
        if (status.code && status.active === true) {
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
            return;
        }

        // Если тариф НЕ активирован (или код удалён) - показываем статус "ОЖИДАНИЕ"
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
                <a href="https://t.me/chearu252?text=${encodeURIComponent('Мой ID: ' + savedOrderID + '. Прикрепите чек к сообщению!')}" 
                   target="_blank" 
                   style="display: block; background: #0088cc; color: white; padding: 12px; border-radius: 6px; text-decoration: none; text-align: center; font-weight: 600;">
                   <i class="fab fa-telegram"></i> ПОДТВЕРДИТЬ В TELEGRAM
                </a>
                <p style="font-size: 0.8rem; color: #718096; margin-top: 10px;">
                    ID для справки: ${savedOrderID}
                </p>
            </div>
        `;

    } catch (error) {
        console.error('Ошибка проверки статуса:', error);
        // В случае ошибки оставляем как есть или можно показать сообщение об ошибке
    }
}
