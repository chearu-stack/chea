// ==================== bot-widget.js ====================
// Логика виджета "3 вопроса → бот → диагноз"
// Подключается только на главной странице (index.html)

document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const ctaForm = document.getElementById('problemForm');
    const originalFormContent = ctaForm.innerHTML; // Сохраняем оригинал на случай сброса
    
    // Конфигурация
    const BOT_ENDPOINT = 'https://your-yandex-function-url/analyze'; // ЗАМЕНИ НА СВОЙ URL
    
    // Данные
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
    
    let currentStep = 0;
    let userAnswers = {};
    let currentTextarea = null;

    // ==================== ОСНОВНЫЕ ФУНКЦИИ ====================
    
    // Рендерим текущий шаг вопроса
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
                        placeholder="Введите ваш ответ здесь..."
                        autofocus>${userAnswers[q.key] || ''}</textarea>
                    <div class="bot-char-counter">
                        <span id="charCount">${userAnswers[q.key] ? userAnswers[q.key].length : 0}</span> / ${q.max}
                    </div>
                </div>
                
                <div class="bot-buttons">
                    ${currentStep > 0 ? 
                        `<button type="button" class="btn btn-outline" onclick="window.botWidget.prevStep()">
                            <i class="fas fa-arrow-left"></i> Назад
                        </button>` : ''
                    }
                    <button type="button" class="btn btn-primary" onclick="window.botWidget.nextStep()">
                        ${currentStep < 2 ? 'Далее <i class="fas fa-arrow-right"></i>' : '<i class="fas fa-stethoscope"></i> Получить диагноз'}
                    </button>
                </div>
                
                <p class="bot-note">
                    <i class="fas fa-lock"></i> Ваши ответы будут использованы только для анализа.
                </p>
            </div>
        `;
        
        // Инициализируем счётчик символов
        currentTextarea = document.getElementById('botTextarea');
        const charCounter = document.querySelector('.bot-char-counter span');
        
        currentTextarea.addEventListener('input', function() {
            const len = this.value.length;
            charCounter.textContent = len;
            
            // Меняем цвет при приближении к лимиту
            if (len > q.max * 0.9) {
                charCounter.style.color = '#e74c3c';
            } else {
                charCounter.style.color = '';
            }
            
            // Сохраняем ответ
            userAnswers[q.key] = this.value;
        });
        
        // Если уже есть ответ - обновляем счётчик
        if (userAnswers[q.key]) {
            charCounter.textContent = userAnswers[q.key].length;
        }
    }
    
    // Следующий шаг
    function nextStep() {
        const q = questions[currentStep];
        const answer = currentTextarea ? currentTextarea.value.trim() : '';
        
        // Валидация
        if (!answer) {
            showAlert('Пожалуйста, ответьте на вопрос', 'warning');
            currentTextarea.focus();
            return;
        }
        
        if (answer.length > q.max) {
            showAlert(`Превышен лимит в ${q.max} символов. Сократите ответ.`, 'warning');
            return;
        }
        
        // Сохраняем ответ
        userAnswers[q.key] = answer;
        
        // Если это последний вопрос - отправляем боту
        if (currentStep >= 2) {
            sendToBot();
            return;
        }
        
        // Иначе переходим к следующему вопросу
        currentStep++;
        renderStep();
    }
    
    // Предыдущий шаг
    function prevStep() {
        if (currentStep <= 0) return;
        currentStep--;
        renderStep();
    }
    
    // Сброс к начальному состоянию
    function resetWidget() {
        currentStep = 0;
        userAnswers = {};
        renderStep();
    }
    
    // Отправка данных боту
    async function sendToBot() {
        const submitBtn = ctaForm.querySelector('.btn-primary');
        const originalBtnText = submitBtn.innerHTML;
        
        // Блокируем кнопку
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Анализируем...';
        
        try {
            // Отправляем на твой бэкенд
            const response = await fetch(BOT_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userAnswers)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            // Показываем результат
            showDiagnosis(result);
            
        } catch (error) {
            console.error('Ошибка отправки боту:', error);
            showAlert('Не удалось получить диагноз. Пожалуйста, попробуйте позже.', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
    
    // Показать диагноз
    function showDiagnosis(result) {
        // В result должен быть объект с полем diagnosis
        const diagnosisText = result.diagnosis || 'Нарушение прав потребителя. Требуется досудебное урегулирование.';
        
        ctaForm.innerHTML = `
            <div class="bot-diagnosis">
                <div class="diagnosis-header">
                    <i class="fas fa-scale-balanced diagnosis-icon"></i>
                    <h3>Диагноз ситуации</h3>
                </div>
                
                <div class="diagnosis-content">
                    <p>${diagnosisText}</p>
                    
                    <div class="diagnosis-actions">
                        <a href="payment.html" class="btn btn-primary btn-large">
                            <i class="fas fa-shield-alt"></i> Продолжить с пакетом помощи
                        </a>
                        <button type="button" class="btn btn-outline" onclick="window.botWidget.resetWidget()">
                            <i class="fas fa-redo"></i> Задать другую ситуацию
                        </button>
                    </div>
                    
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
    
    // Показать алерт
    function showAlert(message, type = 'info') {
        // Создаём временное уведомление
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
    
    // ==================== ИНИЦИАЛИЗАЦИЯ ====================
    
    // Заменяем оригинальную форму на виджет
    renderStep();
    
    // Экспортируем функции в глобальную область видимости для вызова из onclick
    window.botWidget = {
        nextStep,
        prevStep,
        resetWidget
    };
});
