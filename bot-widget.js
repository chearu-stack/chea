// ==================== bot-widget.js ====================
// ЛОГИКА ВИДЖЕТА "3 ВОПРОСА → БОТ → ДИАГНОЗ"
// Подключается только на главной странице (index.html)

// ===== БЛОК 1: СБРОС СКРОЛЛА =====
// Фиксим баг с автоскроллом браузера
window.scrollTo(0, 0);
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

// ===== БЛОК 2: ОСНОВНАЯ НАСТРОЙКА =====
document.addEventListener('DOMContentLoaded', function() {
    // Находим форму на странице
    const ctaForm = document.getElementById('problemForm');
    
    // Твой URL для бота (замени на свой)
    const BOT_ENDPOINT = 'https://your-yandex-function-url/analyze';
    
    // ===== БЛОК 3: СПИСОК ВОПРОСОВ =====
    // Три вопроса с лимитами символов
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
    let currentStep = 0;          // Текущий вопрос (0, 1, 2)
    let userAnswers = {};         // Ответы пользователя
    let currentTextarea = null;   // Активное поле ввода
    
    // ===== БЛОК 5: РЕНДЕР ВОПРОСА =====
    // Показывает текущий вопрос
    function renderStep() {
        const q = questions[currentStep];
        
        // HTML виджета
        ctaForm.innerHTML = `
            <div class="bot-widget">
                <!-- Прогресс-бар -->
                <div class="bot-progress">
                    <span class="bot-step-indicator">Вопрос ${currentStep + 1} из 3</span>
                    <div class="bot-progress-bar">
                        <div class="bot-progress-fill" style="width: ${((currentStep + 1) / 3) * 100}%"></div>
                    </div>
                </div>
                
                <!-- Текст вопроса -->
                <div class="bot-question">
                    <p><strong>${q.text}</strong></p>
                    <p class="bot-example"><i class="fas fa-lightbulb"></i> Пример: ${q.example}</p>
                </div>
                
                <!-- Поле для ответа -->
                <div class="bot-input-container">
                    <textarea 
                        id="botTextarea"
                        class="bot-textarea"
                        rows="3"
                        maxlength="${q.max}"
                        placeholder="Опишите вашу проблему согласно примеру...."
                        autofocus>${userAnswers[q.key] || ''}</textarea>
                    <div class="bot-char-counter">
                        <span id="charCount">${userAnswers[q.key] ? userAnswers[q.key].length : 0}</span> / ${q.max}
                    </div>
                </div>
                
                <!-- КНОПКА ТОЛЬКО ВПЕРЁД (НАЗАД НЕТ!) -->
                <div class="bot-buttons">
                    <button type="button" class="btn btn-primary" onclick="window.botWidget.nextStep()">
                        ${currentStep < 2 ? 'Далее <i class="fas fa-arrow-right"></i>' : '<i class="fas fa-stethoscope"></i> Получить диагноз'}
                    </button>
                </div>
            </div>
        `;
        
        // Настройка счётчика символов
        currentTextarea = document.getElementById('botTextarea');
        const charCounter = document.querySelector('.bot-char-counter span');
        
        // Следим за вводом
        currentTextarea.addEventListener('input', function() {
            const len = this.value.length;
            charCounter.textContent = len;
            
            // Красный текст при приближении к лимиту
            if (len > q.max * 0.9) {
                charCounter.style.color = '#e74c3c';
            } else {
                charCounter.style.color = '';
            }
            
            // Сохраняем ответ
            userAnswers[q.key] = this.value;
        });
        
        // Если ответ уже есть — показываем длину
        if (userAnswers[q.key]) {
            charCounter.textContent = userAnswers[q.key].length;
        }
    }
    
    // ===== БЛОК 6: СЛЕДУЮЩИЙ ШАГ =====
    // Переход к следующему вопросу или отправка
    function nextStep() {
        const q = questions[currentStep];
        const answer = currentTextarea ? currentTextarea.value.trim() : '';
        
        // Проверка: пустой ответ
        if (!answer) {
            showAlert('Пожалуйста, задайте вопрос', 'warning');
            currentTextarea.focus();
            return;
        }
        
        // Проверка: превышен лимит
        if (answer.length > q.max) {
            showAlert(`Превышен лимит в ${q.max} символов. Сократите ответ.`, 'warning');
            return;
        }
        
        // Сохраняем ответ
        userAnswers[q.key] = answer;
        
        // Если это последний вопрос — отправляем боту
        if (currentStep >= 2) {
            sendToBot();
            return;
        }
        
        // Иначе следующий вопрос
        currentStep++;
        renderStep();
    }
    
    // ===== БЛОК 7: СБРОС ВИДЖЕТА =====
    // Начать заново (после диагноза)
    function resetWidget() {
        currentStep = 0;
        userAnswers = {};
        renderStep();
    }
    
    // ===== БЛОК 8: ОТПРАВКА БОТУ =====
    // Отправляем ответы на сервер
    async function sendToBot() {
        const submitBtn = ctaForm.querySelector('.btn-primary');
        const originalBtnText = submitBtn.innerHTML;
        
        // Блокируем кнопку
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Анализируем...';
        
        try {
            // Отправляем POST-запрос
            const response = await fetch(BOT_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userAnswers)
            });
            
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            
            const result = await response.json();
            
            // Показываем диагноз
            showDiagnosis(result);
            
        } catch (error) {
            console.error('Ошибка отправки боту:', error);
            showAlert('Не удалось получить диагноз. Пожалуйста, попробуйте позже.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
    
    // ===== БЛОК 9: ПОКАЗ ДИАГНОЗА =====
    // Выводим результат от бота
    function showDiagnosis(result) {
        const diagnosisText = result.diagnosis || 'Нарушение прав потребителя. Требуется досудебное урегулирование.';
        
        ctaForm.innerHTML = `
            <div class="bot-diagnosis">
                <div class="diagnosis-header">
                    <i class="fas fa-scale-balanced diagnosis-icon"></i>
                    <h3>Диагноз ситуации</h3>
                </div>
                
                <div class="diagnosis-content">
                    <p>${diagnosisText}</p>
                    
                    <!-- Кнопки действий -->
                    <div class="diagnosis-actions">
                        <a href="payment.html" class="btn btn-primary btn-large">
                            <i class="fas fa-shield-alt"></i> Продолжить с пакетом помощи
                        </a>
                        <button type="button" class="btn btn-outline" onclick="window.botWidget.resetWidget()">
                            <i class="fas fa-redo"></i> Задать другую ситуацию
                        </button>
                    </div>
                    
                    <!-- Что дальше -->
                    <div class="diagnosis-note">
                        <p><i class="fas fa-info-circle"></i> <strong>Что дальше?</strong> В пакете помощи вы получите:</p>
                        <ul>
                            <li>Пошаговый план действий</li>
                            <li>Расчёт неустойки</li>
                            <li>Готовые документы для отправки</li>
                            <li>Поддержку в чате</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }
    
    // ===== БЛОК 10: УВЕДОМЛЕНИЯ =====
    // Всплывающие сообщения об ошибках
    function showAlert(message, type = 'info') {
        const alertEl = document.createElement('div');
        alertEl.className = `bot-alert bot-alert-${type}`;
        alertEl.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        ctaForm.insertBefore(alertEl, ctaForm.firstChild);
        
        // Удаляем через 5 секунд
        setTimeout(() => {
            if (alertEl.parentNode) {
                alertEl.parentNode.removeChild(alertEl);
            }
        }, 5000);
    }
    
    // ===== БЛОК 11: ЗАПУСК =====
    // Запускаем виджет
    renderStep();
    
    // ===== БЛОК 12: ЭКСПОРТ ФУНКЦИЙ =====
    // Делаем функции доступными для onclick
    window.botWidget = {
        nextStep,      // Только вперёд
        resetWidget    // Сброс
        // prevStep — УДАЛЕН НАХУЙ
    };
});
