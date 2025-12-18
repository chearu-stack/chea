// ==================== bot-widget.js ====================
// ЛОГИКА ВИДЖЕТА "3 ВОПРОСА → ПРОВЕРКА КОДА → ЧАТ"
// Подключается только на главной странице (index.html)

// ===== БЛОК 1: СБРОС СКРОЛЛА =====
window.scrollTo(0, 0);
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

// ===== БЛОК 2: ОСНОВНАЯ НАСТРОЙКА =====
document.addEventListener('DOMContentLoaded', function() {
    const ctaForm = document.getElementById('problemForm');
    const CODE_VERIFY_ENDPOINT = 'https://chea.onrender.com/verify-code';
    
    // ===== БЛОК 3: СПИСОК ВОПРОСОВ =====
    const questions = [
        { 
            text: 'Опишите проблему коротко (до 200 символов)', 
            key: 'problem', 
            max: 200,
            example: "Купил телефон, он сломался через неделю. Магазин отказывается менять. Стоимость 30 000 руб."
        },
        { 
            text: 'Укажите сумму спора и дату (до 50 символов)', 
            key: 'amount_date', 
            max: 50,
            example: "30 000 руб., 15 мая 2025 г."
        },
        { 
            text: 'Что вы уже предприняли? (до 100 символов)', 
            key: 'actions', 
            max: 100,
            example: "Писал претензию, мне отказали устно. Чек и договор есть."
        }
    ];
    
    // ===== БЛОК 4: ПЕРЕМЕННЫЕ =====
    let currentStep = 0;
    let userAnswers = {};
    let currentTextarea = null;
    
    // ===== БЛОК 5: РЕНДЕР ВОПРОСА =====
    function renderStep() {
        const q = questions[currentStep];
        ctaForm.innerHTML = `
            <div class="bot-widget">
                <div class="bot-progress">
                    <span class="bot-step-indicator">Вопрос ${currentStep + 1} из 3</span>
                    <div class="bot-progress-bar">
                        <div class="bot-progress-fill" style="width: ${((currentStep + 1) / 3) * 100}%"></div>
                    </div>
                </div>
                <div class="bot-question">
                    <p><strong>${q.text}</strong></p>
                    <p class="bot-example"><i class="fas fa-lightbulb"></i> Пример: ${q.example}</p>
                </div>
                <div class="bot-input-container">
                    <textarea 
                        id="botTextarea"
                        class="bot-textarea"
                        rows="3"
                        maxlength="${q.max}"
                        placeholder="Опишите вашу проблему согласно примеру...."
                        >${userAnswers[q.key] || ''}</textarea>
                    <div class="bot-char-counter">
                        <span id="charCount">${userAnswers[q.key] ? userAnswers[q.key].length : 0}</span> / ${q.max}
                    </div>
                </div>
                <div class="bot-buttons">
                    <button type="button" class="btn btn-primary" onclick="window.botWidget.nextStep()">
                        ${currentStep < 2 ? 'Далее <i class="fas fa-arrow-right"></i>' : '<i class="fas fa-stethoscope"></i> Получить диагноз'}
                    </button>
                </div>
            </div>
        `;
        
        currentTextarea = document.getElementById('botTextarea');
        const charCounter = document.querySelector('.bot-char-counter span');
        
        currentTextarea.addEventListener('input', function() {
            const len = this.value.length;
            charCounter.textContent = len;
            if (len > q.max * 0.9) charCounter.style.color = '#e74c3c';
            else charCounter.style.color = '';
            userAnswers[q.key] = this.value;
        });
        
        if (userAnswers[q.key]) charCounter.textContent = userAnswers[q.key].length;
    }
    
    // ===== БЛОК 6: СЛЕДУЮЩИЙ ШАГ =====
    function nextStep() {
        const q = questions[currentStep];
        const answer = currentTextarea ? currentTextarea.value.trim() : '';

        if (!answer) {
            showAlert('Пожалуйста, задайте вопрос', 'warning');
            currentTextarea.focus();
            return;
        }
        if (answer.length > q.max) {
            showAlert(`Превышен лимит в ${q.max} символов. Сократите ответ.`, 'warning');
            return;
        }

        userAnswers[q.key] = answer;

        // Если это последний вопрос — ПРОВЕРЯЕМ КОД ДОСТУПА
        if (currentStep >= 2) {
            const userAccessCode = prompt("Для анализа введите код доступа, который вы получили после оплаты:\n\n(Если у вас нет кода, нажмите 'Отмена'. Вы получите базовую информацию.)");
            if (userAccessCode) {
                verifyAccessCode(userAccessCode);
            } else {
                showFinalScreenNoCode();
            }
            return;
        }

        currentStep++;
        renderStep();
    }

    // ===== БЛОК 7: ФИНАЛЬНЫЙ ЭКРАН (БЕЗ КОДА) =====
    function showFinalScreenNoCode() {
        const submitBtn = ctaForm.querySelector('.btn-primary');
        submitBtn.disabled = true;

        ctaForm.innerHTML = `
            <div class="bot-diagnosis">
                <div class="diagnosis-header">
                    <i class="fas fa-info-circle diagnosis-icon"></i>
                    <h3>Бесплатный анализ завершён</h3>
                </div>
                <div class="diagnosis-content">
                    <p><strong>Вы предоставили достаточно информации для первичной оценки.</strong></p>
                    <p>На основе вашего описания ситуация подпадает под <strong>статью 18 Закона «О защите прав потребителей»</strong>.</p>
                    <p>Для получения полного пошагового плана, расчёта неустойки и готовых документов требуется оплата пакета помощи.</p>
                    <div class="diagnosis-actions">
                        <a href="payment.html" class="btn btn-primary btn-large">
                            <i class="fas fa-shield-alt"></i> Перейти к оплате
                        </a>
                        <p style="margin-top: 15px; font-size: 0.9em; color: #666;">
                            <i class="fas fa-lock"></i> Этот сеанс анализа завершён.
                        </p>
                    </div>
                </div>
            </div>
        `;
        // Стираем возможность сброса
        window.botWidget = {};
    }

    // ===== БЛОК 8: ПРОВЕРКА КОДА ДОСТУПА =====
    async function verifyAccessCode(accessCode) {
        const submitBtn = ctaForm.querySelector('.btn-primary');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Проверяем доступ...';

        try {
            const response = await fetch(CODE_VERIFY_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: accessCode })
            });
            const result = await response.json();

            if (response.ok && result.valid && result.status === 'active') {
                showAlert('✅ Доступ подтвержден! Перенаправляем в чат...', 'success');
                setTimeout(() => {
                    window.location.href = `chat.html?access_code=${encodeURIComponent(accessCode)}`;
                }, 1500);
            } else {
                const errorMsg = result.error || 'Неверный или истёкший код доступа.';
                showAlert(`❌ ${errorMsg}`, 'error');
                showFinalScreenNoCode();
            }
        } catch (error) {
            console.error('Ошибка проверки кода:', error);
            showAlert('⚠️ Ошибка сети. Попробуйте позже.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
    
    // ===== БЛОК 9: УВЕДОМЛЕНИЯ =====
    function showAlert(message, type = 'info') {
        const alertEl = document.createElement('div');
        alertEl.className = `bot-alert bot-alert-${type}`;
        alertEl.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        ctaForm.insertBefore(alertEl, ctaForm.firstChild);
        setTimeout(() => {
            if (alertEl.parentNode) alertEl.parentNode.removeChild(alertEl);
        }, 5000);
    }
    
    // ===== БЛОК 10: ЗАПУСК =====
    renderStep();
    
    // ===== БЛОК 11: ЭКСПОРТ ФУНКЦИЙ =====
    window.botWidget = {
        nextStep // ТОЛЬКО ОДНА ФУНКЦИЯ, resetWidget УДАЛЕН
    };
});
