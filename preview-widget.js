// preview-widget.js
// Виджет предварительного анализа для главной страницы

(function() {
    // Проверяем, есть ли контейнер для виджета
    const widgetContainer = document.querySelector('.bot-widget-placeholder');
    if (!widgetContainer) return;

    // Очищаем контейнер
    widgetContainer.innerHTML = '';
    widgetContainer.style.minHeight = '300px';
    widgetContainer.classList.add('preview-container');

    // Ключевые слова для определения потребительской проблемы
    const CONSUMER_KEYWORDS = [
        'купил', 'куплен', 'приобрел', 'приобретен', 'покупк', 'товар', 'услуг',
        'продавец', 'магазин', 'гаранти', 'брак', 'некачествен', 'не работ',
        'сломал', 'дефект', 'возврат', 'деньги', 'замени', 'ремонт', 'почин',
        'задержк', 'срок', 'нарушен', 'претензи', 'жалоб', 'заявлен', 'договор',
        'исполнен', 'оказан', 'обман', 'ввели в заблужден', 'продаж', 'касс',
        'чек', 'отказ', 'отказывается', 'вернут', 'обмен', 'компенсац', 'ущерб',
        'убытк', 'пеня', 'неустойка', 'закон о защите прав потребителей'
    ];

    // Ключевые слова для сложных случаев
    const COMPLEX_KEYWORDS = [
        'суд', 'прокуратур', 'адвокат', 'юрист отказал', 'многолетн', 'систематическ',
        'моральн', 'здоровье', 'травм', 'строительств', 'арбитраж', 'исков',
        'заседан', 'затяжн', 'крупн', 'значительн', 'серьезн', 'опасн', 'угроз'
    ];

    // Вопросы опросника
    const QUESTIONS = [
        {
            id: 'problem',
            text: 'Опишите проблему коротко (что произошло, с каким товаром/услугой)?',
            example: 'Пример: Купил телефон, он сломался через неделю. Магазин отказывается менять.',
            maxLength: 200,
            validator: (value) => {
                if (!value || value.trim().length < 10) {
                    return 'Опишите проблему подробнее (минимум 10 символов)';
                }
                
                // Валидация через guard-config, если он подключен
                if (window.GuardConfig && window.GuardConfig.validate) {
                    const guardResult = window.GuardConfig.validate(value);
                    if (guardResult !== true) return guardResult;
                }
                
                // Дополнительная проверка на потребительскую тематику
                const lowerValue = value.toLowerCase();
                const hasConsumerKeywords = CONSUMER_KEYWORDS.some(keyword => 
                    lowerValue.includes(keyword)
                );
                
                if (!hasConsumerKeywords) {
                    return 'Опишите ситуацию с покупкой товара или услуги. Пример: "Купил холодильник, он не морозит"';
                }
                
                return true;
            }
        },
        {
            id: 'amount',
            text: 'Укажите сумму покупки, ущерба или стоимость услуги (в рублях)?',
            example: 'Пример: 30000',
            maxLength: 20,
            validator: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Укажите сумму цифрами';
                }
                
                // Убираем пробелы и знаки валюты
                const cleanValue = value.replace(/\s/g, '').replace('₽', '').replace('руб', '');
                const numValue = Number(cleanValue);
                
                if (isNaN(numValue) || numValue <= 0) {
                    return 'Введите корректную сумму цифрами (например: 25000)';
                }
                
                if (numValue > 10000000) {
                    return 'Сумма слишком велика для онлайн-анализа. Рекомендуем обратиться к юристу оффлайн.';
                }
                
                return true;
            }
        },
        {
            id: 'date',
            text: 'Когда это произошло или какой срок был нарушен (дата, число дней)?',
            example: 'Пример: 15 марта 2024 года или задержка на 30 дней',
            maxLength: 100,
            validator: (value) => {
                if (!value || value.trim().length < 2) {
                    return 'Укажите дату или срок';
                }
                
                if (value.length > 100) {
                    return 'Слишком длинный ответ. Укажите кратко';
                }
                
                return true;
            }
        }
    ];

    // Состояние виджета
    let currentStep = 0;
    let answers = {};
    let isProcessing = false;

    // Создаем интерфейс
    function createInterface() {
        const container = document.createElement('div');
        container.className = 'preview-widget';
        container.style.cssText = `
            background: #f8f9fa;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            margin: 20px 0;
            font-family: 'Open Sans', sans-serif;
        `;
        
        // Заголовок с прогрессом
        const header = document.createElement('div');
        header.className = 'preview-header';
        header.style.marginBottom = '24px';
        header.innerHTML = `
            <div class="progress-container" style="margin-bottom: 12px;">
                <div class="bot-progress-bar" style="height: 6px; background: #e9ecef; border-radius: 3px; overflow: hidden;">
                    <div class="bot-progress-fill" style="height: 100%; background: linear-gradient(90deg, #c53030, #dd6b20); transition: width 0.3s ease; width: ${((currentStep) / QUESTIONS.length) * 100}%"></div>
                </div>
                <div class="step-counter" style="font-size: 14px; color: #6c757d; text-align: center; font-weight: 600;">Вопрос ${currentStep + 1} из ${QUESTIONS.length}</div>
            </div>
        `;
        
        // Область вопроса
        const questionArea = document.createElement('div');
        questionArea.className = 'question-area';
        questionArea.style.marginBottom = '20px';
        
        // Область ответа
        const answerArea = document.createElement('div');
        answerArea.className = 'answer-area';
        answerArea.style.marginBottom = '20px';
        
        // Кнопки
        const buttonsArea = document.createElement('div');
        buttonsArea.className = 'buttons-area';
        buttonsArea.style.cssText = `
            display: flex;
            justify-content: space-between;
            gap: 12px;
        `;
        
        container.appendChild(header);
        container.appendChild(questionArea);
        container.appendChild(answerArea);
        container.appendChild(buttonsArea);
        
        return { container, header, questionArea, answerArea, buttonsArea };
    }

    // Обновление отображения
    function updateDisplay() {
        const { header, questionArea, answerArea, buttonsArea } = window.previewWidget;
        
        // Обновляем прогресс
        const progressFill = header.querySelector('.bot-progress-fill');
        const stepCounter = header.querySelector('.step-counter');
        if (progressFill) {
            progressFill.style.width = `${((currentStep) / QUESTIONS.length) * 100}%`;
        }
        if (stepCounter) {
            stepCounter.textContent = `Вопрос ${currentStep + 1} из ${QUESTIONS.length}`;
        }
        
        // Очищаем области
        questionArea.innerHTML = '';
        answerArea.innerHTML = '';
        buttonsArea.innerHTML = '';
        
        const question = QUESTIONS[currentStep];
        
        // Отображаем вопрос
        const questionText = document.createElement('div');
        questionText.className = 'question-text';
        questionText.style.cssText = `
            font-size: 18px;
            font-weight: 600;
            color: #1a365d;
            margin-bottom: 8px;
            line-height: 1.4;
        `;
        questionText.textContent = question.text;
        questionArea.appendChild(questionText);
        
        if (question.example) {
            const exampleText = document.createElement('div');
            exampleText.className = 'bot-example';
            exampleText.style.cssText = `
                font-size: 14px;
                color: #666;
                background: #f8f9fa;
                padding: 10px 14px;
                border-radius: 8px;
                border-left: 3px solid #4361ee;
                margin-top: 12px;
                font-style: italic;
            `;
            exampleText.textContent = question.example;
            questionArea.appendChild(exampleText);
        }
        
        // Создаем поле ввода
        const input = document.createElement('textarea');
        input.className = 'answer-input bot-textarea';
        input.style.cssText = `
            width: 100%;
            min-height: 80px;
            padding: 12px;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            font-family: 'Open Sans', sans-serif;
            font-size: 15px;
            resize: vertical;
            transition: border-color 0.2s;
        `;
        input.placeholder = 'Введите ваш ответ здесь...';
        input.maxLength = question.maxLength;
        input.value = answers[question.id] || '';
        
        const charCounter = document.createElement('div');
        charCounter.className = 'bot-char-counter';
        charCounter.style.cssText = `
            text-align: right;
            font-size: 14px;
            color: #888;
            margin-top: 6px;
        `;
        
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.style.cssText = `
            color: #dc3545;
            font-size: 14px;
            margin-top: 6px;
            display: none;
        `;
        
        answerArea.appendChild(input);
        answerArea.appendChild(charCounter);
        answerArea.appendChild(errorMessage);
        
        // Обновляем счетчик символов
        function updateCharCounter() {
            const length = input.value.length;
            charCounter.textContent = `${length} / ${question.maxLength}`;
            if (length >= question.maxLength * 0.9) {
                charCounter.style.color = '#dc3545';
            } else {
                charCounter.style.color = '#888';
            }
        }
        
        updateCharCounter();
        input.addEventListener('input', updateCharCounter);
        
        // Создаем кнопки
        if (currentStep > 0) {
            const prevButton = document.createElement('button');
            prevButton.className = 'btn btn-secondary widget-button';
            prevButton.style.flex = '1';
            prevButton.textContent = '← Назад';
            prevButton.addEventListener('click', () => {
                currentStep--;
                updateDisplay();
            });
            buttonsArea.appendChild(prevButton);
        }
        
        const nextButton = document.createElement('button');
        nextButton.className = `btn ${currentStep < QUESTIONS.length - 1 ? 'btn-primary' : 'btn-primary'} widget-button`;
        nextButton.style.flex = '1';
        nextButton.textContent = currentStep < QUESTIONS.length - 1 ? 'Далее →' : 'Получить анализ';
        nextButton.disabled = isProcessing;
        
        nextButton.addEventListener('click', () => {
            const value = input.value.trim();
            
            // Валидация
            const validationResult = question.validator(value);
            if (validationResult !== true) {
                input.style.borderColor = '#dc3545';
                errorMessage.textContent = validationResult;
                errorMessage.style.display = 'block';
                return;
            }
            
            // Убираем ошибку
            input.style.borderColor = '#dee2e6';
            errorMessage.style.display = 'none';
            
            // Сохраняем ответ
            answers[question.id] = value;
            
            // Переход к следующему шагу или анализ
            if (currentStep < QUESTIONS.length - 1) {
                currentStep++;
                updateDisplay();
            } else {
                analyzeAnswers();
            }
        });
        
        buttonsArea.appendChild(nextButton);
        
        // Enter для отправки (кроме Shift+Enter)
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                nextButton.click();
            }
        });
        
        // Автофокус
        setTimeout(() => input.focus(), 100);
    }

    // Анализ ответов и рекомендация
    function analyzeAnswers() {
        isProcessing = true;
        updateDisplay();
        
        setTimeout(() => {
            const problemText = answers.problem.toLowerCase();
            const amount = Number(answers.amount.replace(/\s/g, '').replace('₽', '').replace('руb', ''));
            const dateText = answers.date;
            
            // Проверка на сложный случай
            const isComplexCase = COMPLEX_KEYWORDS.some(keyword => 
                problemText.includes(keyword)
            );
            
            // Определяем рекомендуемый тариф
            let recommendedPlan = 'extended'; // по умолчанию расширенный
            let planName = 'Расширенный';
            let planPrice = '1 200 ₽';
            let reason = '';
            
            if (amount < 20000 && !isComplexCase) {
                recommendedPlan = 'basic';
                planName = 'Базовый';
                planPrice = '500 ₽';
                reason = 'небольшая сумма и типичная ситуация';
            } else if (amount > 100000 || isComplexCase) {
                recommendedPlan = 'subscription';
                planName = 'Профессиональный';
                planPrice = '2 500 ₽';
                reason = isComplexCase ? 'сложный характер спора' : 'крупная сумма';
            }
            
            // Определяем, решаема ли проблема
            const hasConsumerKeywords = CONSUMER_KEYWORDS.some(keyword => 
                problemText.includes(keyword)
            );
            
            const isAmountValid = !isNaN(amount) && amount > 0;
            const isDateValid = dateText && dateText.trim().length >= 2;
            
            const isSolvable = hasConsumerKeywords && isAmountValid && isDateValid;
            
            // Сохраняем ответы для передачи в основной бот
            if (isSolvable) {
                try {
                    sessionStorage.setItem('preliminary_answers', JSON.stringify({
                        problem: answers.problem,
                        amount: amount,
                        date: answers.date,
                        collectedAt: new Date().toISOString()
                    }));
                } catch (e) {
                    console.warn('Не удалось сохранить ответы в sessionStorage:', e);
                }
            }
            
            // Отображаем результат
            displayResult(isSolvable, recommendedPlan, planName, planPrice, reason);
            isProcessing = false;
        }, 800); // Имитация обработки
    }

    // Отображение результата
    function displayResult(isSolvable, planId, planName, planPrice, reason) {
        const { questionArea, answerArea, buttonsArea } = window.previewWidget;
        
        questionArea.innerHTML = '';
        answerArea.innerHTML = '';
        buttonsArea.innerHTML = '';
        
        const resultContainer = document.createElement('div');
        resultContainer.className = 'diagnosis-content';
        resultContainer.style.cssText = `
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            animation: fadeIn 0.5s ease;
            background: ${isSolvable ? 'linear-gradient(135deg, #d4edda, #c3e6cb)' : 'linear-gradient(135deg, #f8d7da, #f5c6cb)'};
            border: 2px solid ${isSolvable ? '#28a745' : '#dc3545'};
            color: ${isSolvable ? '#155724' : '#721c24'};
        `;
        
        if (isSolvable) {
            resultContainer.innerHTML = `
                <h3 style="margin-top: 0; color: #155724;">
                    <i class="fas fa-check-circle"></i> Нарушения потребительских прав обнаружены
                </h3>
                <p><strong>Ваша ситуация подпадает под действие Закона о защите прав потребителей.</strong></p>
                <p>На основе предоставленной информации:</p>
                <ul style="margin: 10px 0 20px 20px;">
                    <li>Сумма спора: <strong>${parseInt(answers.amount).toLocaleString('ru-RU')} руб.</strong></li>
                    <li>Характер: ${answers.problem.substring(0, 80)}${answers.problem.length > 80 ? '...' : ''}</li>
                    <li>Срок: ${answers.date}</li>
                </ul>
                
                <div class="recommended-plan" style="
                    background: white;
                    border-radius: 8px;
                    padding: 15px;
                    margin: 15px 0;
                    border: 2px solid #ffc107;
                    box-shadow: 0 3px 10px rgba(255, 193, 7, 0.2);
                ">
                    <div class="recommended-badge" style="
                        display: inline-block;
                        background: #ffc107;
                        color: #212529;
                        padding: 4px 10px;
                        border-radius: 4px;
                        font-size: 12px;
                        font-weight: bold;
                        margin-bottom: 10px;
                    ">РЕКОМЕНДУЕМ</div>
                    <h4 style="margin: 5px 0; color: #212529;">Тариф «${planName}» — ${planPrice}</h4>
                    <p style="margin: 8px 0; font-size: 14px;">
                        Рекомендуем этот тариф, так как ${reason}.
                        ${planId === 'extended' ? 'Включает расчёт неустойки и полный пакет документов.' : ''}
                        ${planId === 'subscription' ? 'Включает стратегию борьбы с отписками и расширенный расчёт.' : ''}
                    </p>
                </div>
                
                <p><strong>Выберите подходящий тариф ниже для подготовки документов и точного расчёта.</strong></p>
                
                <div class="scroll-hint" style="
                    text-align: center;
                    margin-top: 15px;
                    color: #6c757d;
                    font-size: 14px;
                    animation: pulse 2s infinite;
                ">
                    <i class="fas fa-arrow-down"></i> Прокрутите вниз к выбору тарифа
                </div>
            `;
            
            // Добавляем кнопку для быстрого перехода
            const goToPricing = document.createElement('button');
            goToPricing.className = 'btn btn-primary';
            goToPricing.style.cssText = 'width: 100%; margin-top: 15px;';
            goToPricing.innerHTML = '<i class="fas fa-tags"></i> Выбрать тариф';
            goToPricing.addEventListener('click', () => {
                // Плавный скролл к секции с тарифами
                const pricingSection = document.getElementById('pricing');
                if (pricingSection) {
                    pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    
                    // Подсветка рекомендуемого тарифа
                    setTimeout(() => {
                        const planElement = document.querySelector(`[data-plan="${planId}"]`);
                        if (planElement && planElement.closest('.pricing-card')) {
                            const card = planElement.closest('.pricing-card');
                            card.style.boxShadow = '0 0 0 3px #28a745, 0 8px 25px rgba(0,0,0,0.15)';
                            card.style.transition = 'box-shadow 0.5s ease';
                            
                            // Анимация пульсации
                            setTimeout(() => {
                                card.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                            }, 2000);
                        }
                    }, 500);
                }
            });
            
            buttonsArea.appendChild(goToPricing);
            
        } else {
            resultContainer.innerHTML = `
                <h3 style="margin-top: 0; color: #721c24;">
                    <i class="fas fa-exclamation-triangle"></i> Не удалось обнаружить нарушений потребительских прав
                </h3>
                <p><strong>На основе описания не обнаружено признаков нарушения прав потребителя, регулируемых ЗоЗПП РФ.</strong></p>
                <p>Возможные причины:</p>
                <ul style="margin: 10px 0 20px 20px;">
                    <li>Ситуация не связана с покупкой товаров или услуг</li>
                    <li>Отношения не подпадают под Закон о защите прав потребителей</li>
                    <li>В описании недостаточно информации для анализа</li>
                </ul>
                <p><strong>Сервис специализируется на спорах в сфере купли-продажи, оказания услуг, выполнения работ.</strong></p>
                <p>Если вы считаете, что произошла ошибка, попробуйте описать ситуацию более подробно, указав:</p>
                <ul style="margin: 10px 0; font-size: 14px;">
                    <li>Что именно было куплено или какая услуга оказана</li>
                    <li>В чём заключается нарушение со стороны продавца/исполнителя</li>
                    <li>Конкретные суммы и даты</li>
                </ul>
            `;
            
            // Кнопка для начала заново
            const restartButton = document.createElement('button');
            restartButton.className = 'btn btn-secondary';
            restartButton.style.cssText = 'width: 100%; margin-top: 15px;';
            restartButton.innerHTML = '<i class="fas fa-redo"></i> Попробовать снова';
            restartButton.addEventListener('click', () => {
                currentStep = 0;
                answers = {};
                updateDisplay();
            });
            
            buttonsArea.appendChild(restartButton);
        }
        
        answerArea.appendChild(resultContainer);
    }

    // Инициализация
    function init() {
        const interfaceElements = createInterface();
        widgetContainer.appendChild(interfaceElements.container);
        
        // Сохраняем ссылки на элементы
        window.previewWidget = interfaceElements;
        
        // Начинаем с первого вопроса
        updateDisplay();
    }

    // Запускаем после загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
