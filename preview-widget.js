// ===================================================================
// PREVIEW-WIDGET.JS - СТАБИЛЬНАЯ ВЕРСИЯ (БЕЗ ЗАВИСАНИЙ)
// ===================================================================

// ГЛОБАЛЬНЫЙ ОБЪЕКТ СОСТОЯНИЯ СИСТЕМЫ
window.AMG_State = window.AMG_State || {
    systemReady: false,
    scrollAllowed: false,
    widgetActive: false,
    currentPlan: null,
    userFP: null,
    
    blockSystem: function(reason) {
        console.log(`🔒 [AMG_State] Блокировка системы: ${reason}`);
        this.systemReady = false;
        this.scrollAllowed = false;
    },
    
    unblockSystem: function() {
        console.log('✅ [AMG_State] Система разблокирована');
        this.systemReady = true;
        this.scrollAllowed = true;
    }
};

// ===================================================================
// ОСНОВНОЙ КОД ВИДЖЕТА
// ===================================================================

(function() {
    'use strict';
    
    console.log('🔄 [PreviewWidget] Загрузка модуля');
    
    // === КОНСТАНТЫ И КОНФИГУРАЦИЯ ===
    const CONFIG = {
        SYSTEM_WAIT_TIMEOUT: 10000,
        SCROLL_DEBOUNCE: 300,
        
        WIDGET_CONTAINER: '.bot-widget-placeholder',
        START_BUTTONS: '.start-scroll-btn',
        SCROLL_TO_BUTTONS: '[data-scroll-to]',
        
        CONSUMER_KEYWORDS: [
            'купил', 'куплен', 'приобрел', 'приобретен', 'покупк', 'товар', 'услуг',
            'продавец', 'магазин', 'гаранти', 'брак', 'некачествен', 'не работ',
            'сломал', 'дефект', 'возврат', 'деньги', 'замени', 'ремонт', 'почин',
            'задержк', 'срок', 'нарушен', 'претензи', 'жалоб', 'заявлен', 'договор',
            'исполнен', 'оказан', 'обман', 'ввели в заблужден', 'продаж', 'касс',
            'чек', 'отказ', 'отказывается', 'вернут', 'обмен', 'компенсац', 'ущерб',
            'убытк', 'пеня', 'неустойка', 'закон о защите прав потребителей'
        ],
        
        COMPLEX_KEYWORDS: [
            'суд', 'прокуратур', 'адвокат', 'юрист отказал', 'многолетн', 'систематическ',
            'моральн', 'здоровье', 'травм', 'строительств', 'арбитраж', 'исков',
            'заседан', 'затяжн', 'крупн', 'значительн', 'серьезн', 'опасн', 'угроз'
        ]
    };
    
    // === ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ВИДЖЕТА ===
    let widgetState = {
        isInitialized: false,
        currentStep: 0,
        answers: {},
        isProcessing: false,
        interface: null
    };
    
    // ВОПРОСЫ ВИДЖЕТА
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
                
                const lowerValue = value.toLowerCase();
                const hasConsumerKeywords = CONFIG.CONSUMER_KEYWORDS.some(keyword => 
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
    
    // === СИСТЕМНЫЕ ФУНКЦИИ ===
    
    /**
     * Очистка hash без скролла
     */
    function safeHashCleanup() {
        if (window.location.hash) {
            console.log('🧹 [HashCleanup] Очистка hash:', window.location.hash);
            
            const scrollY = window.pageYOffset;
            
            try {
                history.replaceState(
                    null,
                    null,
                    window.location.pathname + window.location.search
                );
            } catch(error) {}
            
            if (window.pageYOffset !== scrollY) {
                window.scrollTo(0, scrollY);
            }
        }
    }
    
    /**
     * Ожидание готовности системы
     */
    function waitForSystemReady(callback) {
        const startTime = Date.now();
        
        function check() {
            const elapsed = Date.now() - startTime;
            
            if (elapsed > CONFIG.SYSTEM_WAIT_TIMEOUT) {
                console.warn('⚠️ [SystemWait] Таймаут ожидания системы');
                // Аварийная разблокировка
                if (window.AMG_State) {
                    window.AMG_State.systemReady = true;
                    window.AMG_State.scrollAllowed = true;
                }
                if (callback) callback();
                return;
            }
            
            if (window.AMG_State && window.AMG_State.systemReady) {
                console.log(`✅ [SystemWait] Система готова через ${elapsed}мс`);
                if (callback) callback();
                return;
            }
            
            setTimeout(check, 100);
        }
        
        check();
    }
    
    /**
     * Настройка обработчиков скролла
     */
    function setupScrollHandlers() {
        console.log('🎯 [ScrollHandlers] Настройка обработчиков');
        
        // ЛОГОТИП - СКРОЛЛ К ВЕРХУ
        const navLogo = document.getElementById('navLogo');
        if (navLogo) {
            console.log('🔘 [ScrollHandlers] Логотип найден');
            
            navLogo.style.cursor = 'pointer';
            if (!navLogo.title) navLogo.title = 'Вернуться наверх';
            
            navLogo.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                
                console.log('🖱️ [ScrollHandlers] Клик по логотипу');
                
                // Визуальная обратная связь
                this.classList.add('clicked');
                setTimeout(() => this.classList.remove('clicked'), 300);
                
                // Скролл к верху
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                return false;
            }, true);
        }
        
        // КНОПКИ "СТАРТ"
        const startButtons = document.querySelectorAll(CONFIG.START_BUTTONS);
        console.log(`🔘 [ScrollHandlers] Кнопок "Старт": ${startButtons.length}`);
        
        startButtons.forEach((button, index) => {
            const cleanButton = button.cloneNode(true);
            button.parentNode.replaceChild(cleanButton, button);
            
            cleanButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                
                console.log(`🖱️ [ScrollHandlers] Клик по "Старт" #${index + 1}`);
                
                // Скролл к виджету
                const startSection = document.getElementById('start-section');
                if (startSection) {
                    startSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    
                    setTimeout(() => {
                        const textarea = document.querySelector('.answer-input');
                        if (textarea) textarea.focus();
                    }, 500);
                }
                
                return false;
            }, true);
        });
        
        // НАВИГАЦИЯ
        const scrollButtons = document.querySelectorAll(CONFIG.SCROLL_TO_BUTTONS);
        console.log(`🔘 [ScrollHandlers] Кнопок навигации: ${scrollButtons.length}`);
        
        scrollButtons.forEach((button, index) => {
            const cleanButton = button.cloneNode(true);
            button.parentNode.replaceChild(cleanButton, button);
            
            cleanButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                
                const targetId = this.getAttribute('data-scroll-to');
                console.log(`🖱️ [ScrollHandlers] Клик к #${targetId}`);
                
                const target = document.getElementById(targetId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                
                return false;
            }, true);
        });
        
        // Блокировка нативных якорей
        let blockNativeAnchors = true;
        window.addEventListener('click', function(e) {
            if (!blockNativeAnchors) return;
            
            const anchor = e.target.closest('a');
            if (anchor && anchor.hash) {
                e.preventDefault();
                e.stopImmediatePropagation();
            }
        }, true);
        
        setTimeout(() => {
            blockNativeAnchors = false;
        }, 1000);
    }
    
    /**
     * Создание интерфейса виджета
     */
    function createWidgetInterface(container) {
        console.log('🎨 [WidgetInterface] Создание интерфейса');
        
        const widgetElement = document.createElement('div');
        widgetElement.className = 'preview-widget';
        widgetElement.style.cssText = `
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
        header.innerHTML = `
            <div class="progress-container" style="margin-bottom: 12px;">
                <div class="bot-progress-bar" style="height: 6px; background: #e9ecef; border-radius: 3px; overflow: hidden;">
                    <div class="bot-progress-fill" style="height: 100%; background: linear-gradient(90deg, #c53030, #dd6b20); transition: width 0.3s ease; width: 0%"></div>
                </div>
                <div class="step-counter" style="font-size: 14px; color: #6c757d; text-align: center; font-weight: 600;">Вопрос 1 из ${QUESTIONS.length}</div>
            </div>
        `;
        
        // Области контента
        const questionArea = document.createElement('div');
        questionArea.className = 'question-area';
        questionArea.style.marginBottom = '20px';
        
        const answerArea = document.createElement('div');
        answerArea.className = 'answer-area';
        answerArea.style.marginBottom = '20px';
        
        const buttonsArea = document.createElement('div');
        buttonsArea.className = 'buttons-area';
        buttonsArea.style.cssText = `
            display: flex;
            justify-content: space-between;
            gap: 12px;
        `;
        
        // Сборка
        widgetElement.appendChild(header);
        widgetElement.appendChild(questionArea);
        widgetElement.appendChild(answerArea);
        widgetElement.appendChild(buttonsArea);
        container.appendChild(widgetElement);
        
        // Сохраняем ссылки
        widgetState.interface = {
            element: widgetElement,
            header: header,
            questionArea: questionArea,
            answerArea: answerArea,
            buttonsArea: buttonsArea
        };
    }
    
    /**
     * Обновление отображения виджета
     */
    function updateWidgetDisplay() {
        if (!widgetState.interface) {
            console.error('❌ [WidgetDisplay] Интерфейс не инициализирован');
            return;
        }
        
        const { header, questionArea, answerArea, buttonsArea } = widgetState.interface;
        const question = QUESTIONS[widgetState.currentStep];
        
        // Прогресс
        const progressFill = header.querySelector('.bot-progress-fill');
        const stepCounter = header.querySelector('.step-counter');
        
        if (progressFill) {
            const progress = ((widgetState.currentStep) / QUESTIONS.length) * 100;
            progressFill.style.width = `${progress}%`;
        }
        
        if (stepCounter) {
            stepCounter.textContent = `Вопрос ${widgetState.currentStep + 1} из ${QUESTIONS.length}`;
        }
        
        // Очистка
        questionArea.innerHTML = '';
        answerArea.innerHTML = '';
        buttonsArea.innerHTML = '';
        
        // Текст вопроса
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
        
        // Пример
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
        
        // Поле ввода
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
        input.value = widgetState.answers[question.id] || '';
        
        // Счётчик символов
        const charCounter = document.createElement('div');
        charCounter.className = 'bot-char-counter';
        charCounter.style.cssText = `
            text-align: right;
            font-size: 14px;
            color: #888;
            margin-top: 6px;
        `;
        
        // Ошибка
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.style.cssText = `
            color: #dc3545;
            font-size: 14px;
            margin-top: 6px;
            display: none;
        `;
        
        // Обновление счётчика
        function updateCharCounter() {
            const length = input.value.length;
            charCounter.textContent = `${length} / ${question.maxLength}`;
            charCounter.style.color = length >= question.maxLength * 0.9 ? '#dc3545' : '#888';
        }
        
        // Сборка
        answerArea.appendChild(input);
        answerArea.appendChild(charCounter);
        answerArea.appendChild(errorMessage);
        
        updateCharCounter();
        input.addEventListener('input', updateCharCounter);
        
        // Кнопка "Назад"
        if (widgetState.currentStep > 0) {
            const prevButton = document.createElement('button');
            prevButton.className = 'btn btn-secondary widget-button';
            prevButton.style.flex = '1';
            prevButton.textContent = '← Назад';
            prevButton.addEventListener('click', () => {
                widgetState.currentStep--;
                updateWidgetDisplay();
            });
            buttonsArea.appendChild(prevButton);
        }
        
        // Кнопка "Далее"
        const nextButton = document.createElement('button');
        nextButton.className = `btn ${widgetState.currentStep < QUESTIONS.length - 1 ? 'btn-primary' : 'btn-success'} widget-button`;
        nextButton.style.flex = '1';
        nextButton.textContent = widgetState.currentStep < QUESTIONS.length - 1 ? 'Далее →' : 'Получить анализ';
        nextButton.disabled = widgetState.isProcessing;
        
        nextButton.addEventListener('click', () => {
            const value = input.value.trim();
            const validationResult = question.validator(value);
            
            if (validationResult !== true) {
                input.style.borderColor = '#dc3545';
                errorMessage.textContent = validationResult;
                errorMessage.style.display = 'block';
                return;
            }
            
            input.style.borderColor = '#dee2e6';
            errorMessage.style.display = 'none';
            widgetState.answers[question.id] = value;
            
            if (widgetState.currentStep < QUESTIONS.length - 1) {
                widgetState.currentStep++;
                updateWidgetDisplay();
            } else {
                analyzeAnswers();
            }
        });
        
        buttonsArea.appendChild(nextButton);
        
        // Обработка Enter
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                nextButton.click();
            }
        });
        
        // Фокус
        setTimeout(() => input.focus(), 100);
        
        console.log(`📊 [WidgetDisplay] Показан вопрос ${widgetState.currentStep + 1}`);
    }
    
    /**
     * ПРОСТОЙ АНАЛИЗ ОТВЕТОВ (без зависаний)
     */
    function analyzeAnswers() {
        console.log('🔍 [WidgetAnalysis] Начало анализа ответов');
        widgetState.isProcessing = true;
        updateWidgetDisplay();
        
        // Имитация обработки
        setTimeout(() => {
            try {
                const problemText = widgetState.answers.problem.toLowerCase();
                const amount = Number(widgetState.answers.amount.replace(/\s/g, '').replace('₽', '').replace('руб', ''));
                const dateText = widgetState.answers.date;
                
                // Проверка ключевых слов
                const hasConsumerKeywords = CONFIG.CONSUMER_KEYWORDS.some(keyword => 
                    problemText.includes(keyword)
                );
                
                const isComplexCase = CONFIG.COMPLEX_KEYWORDS.some(keyword => 
                    problemText.includes(keyword)
                );
                
                const isAmountValid = !isNaN(amount) && amount > 0;
                const isDateValid = dateText && dateText.trim().length >= 2;
                
                const isSolvable = hasConsumerKeywords && isAmountValid && isDateValid;
                
                // Выбор тарифа
                let recommendedPlan = 'extended';
                let planName = 'Расширенный';
                let planPrice = '1 200 ₽';
                
                if (amount < 20000 && !isComplexCase) {
                    recommendedPlan = 'basic';
                    planName = 'Базовый';
                    planPrice = '500 ₽';
                } else if (amount > 100000 || isComplexCase) {
                    recommendedPlan = 'subscription';
                    planName = 'Профессиональный';
                    planPrice = '2 500 ₽';
                }
                
                // Сохранение
                try {
                    sessionStorage.setItem('preliminary_answers', JSON.stringify({
                        problem: widgetState.answers.problem,
                        amount: amount,
                        date: dateText,
                        isSolvable: isSolvable,
                        recommendedPlan: recommendedPlan,
                        collectedAt: new Date().toISOString()
                    }));
                    console.log('💾 [WidgetAnalysis] Ответы сохранены');
                } catch (e) {
                    console.warn('⚠️ [WidgetAnalysis] Ошибка сохранения:', e);
                }
                
                // Показ результата
                displayResult(isSolvable, recommendedPlan, planName, planPrice);
                
            } catch (error) {
                console.error('❌ [WidgetAnalysis] Критическая ошибка:', error);
                displayError();
            } finally {
                widgetState.isProcessing = false;
                console.log('✅ [WidgetAnalysis] Анализ завершён');
            }
        }, 800);
    }
    
    /**
     * Отображение результата анализа (упрощённое)
     */
    function displayResult(isSolvable, planId, planName, planPrice) {
        if (!widgetState.interface) return;
        
        const { questionArea, answerArea, buttonsArea } = widgetState.interface;
        
        questionArea.innerHTML = '';
        answerArea.innerHTML = '';
        buttonsArea.innerHTML = '';
        
        if (isSolvable) {
            const resultContainer = document.createElement('div');
            resultContainer.className = 'diagnosis-content';
            resultContainer.style.cssText = `
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                animation: fadeIn 0.5s ease;
                background: linear-gradient(135deg, #d4edda, #c3e6cb);
                border: 2px solid #28a745;
                color: #155724;
            `;
            
            resultContainer.innerHTML = `
                <h3 style="margin-top: 0; color: #155724;">
                    <i class="fas fa-search"></i> Возможное нарушение прав потребителя обнаружено
                </h3>
                <p><strong>Ситуация может подпадать под действие Закона о защите прав потребителей.</strong></p>
                
                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px 15px; margin: 15px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #856404; font-size: 14px;">
                        <i class="fas fa-exclamation-triangle"></i> <strong>Внимание:</strong> Это предварительная оценка.
                    </p>
                </div>
                
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
                </div>
                
                <p><strong>Для полного анализа:</strong></p>
                <ul style="margin: 10px 0 20px 20px; font-size: 14px;">
                    <li>Юридический анализ соответствия ЗоЗПП</li>
                    <li>Расчёт законных требований</li>
                    <li>Готовые документы для досудебного урегулирования</li>
                </ul>
            `;
            
            // Кнопка выбора тарифа
            const goToPricing = document.createElement('button');
            goToPricing.className = 'btn btn-primary';
            goToPricing.style.cssText = 'width: 100%; margin-top: 15px;';
            goToPricing.innerHTML = '<i class="fas fa-tags"></i> Выбрать тариф';
            goToPricing.addEventListener('click', () => {
                const pricingSection = document.getElementById('pricing');
                if (pricingSection) {
                    pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    
                    setTimeout(() => {
                        const planElement = document.querySelector(`[data-plan="${planId}"]`);
                        if (planElement) {
                            const card = planElement.closest('.pricing-card');
                            if (card) {
                                card.style.boxShadow = '0 0 0 3px #28a745';
                                setTimeout(() => {
                                    card.style.boxShadow = '';
                                }, 2000);
                            }
                        }
                    }, 500);
                }
            });
            
            // Кнопка повтора
            const restartButton = document.createElement('button');
            restartButton.className = 'btn btn-secondary';
            restartButton.style.cssText = 'width: 100%; margin-top: 10px;';
            restartButton.innerHTML = '<i class="fas fa-redo"></i> Новый анализ';
            restartButton.addEventListener('click', () => {
                widgetState.currentStep = 0;
                widgetState.answers = {};
                updateWidgetDisplay();
            });
            
            answerArea.appendChild(resultContainer);
            buttonsArea.appendChild(goToPricing);
            buttonsArea.appendChild(restartButton);
            
        } else {
            // Если не решаемо
            const resultContainer = document.createElement('div');
            resultContainer.className = 'diagnosis-content';
            resultContainer.style.cssText = `
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                animation: fadeIn 0.5s ease;
                background: linear-gradient(135deg, #f8d7da, #f5c6cb);
                border: 2px solid #dc3545;
                color: #721c24;
            `;
            
            resultContainer.innerHTML = `
                <h3 style="margin-top: 0; color: #721c24;">
                    <i class="fas fa-exclamation-triangle"></i> Не удалось обнаружить признаков нарушения
                </h3>
                <p><strong>На основе описания не обнаружено признаков нарушения прав потребителя.</strong></p>
                <p>Если вы считаете, что произошла ошибка, опишите ситуацию более подробно.</p>
            `;
            
            const restartButton = document.createElement('button');
            restartButton.className = 'btn btn-secondary';
            restartButton.style.cssText = 'width: 100%; margin-top: 15px;';
            restartButton.innerHTML = '<i class="fas fa-redo"></i> Попробовать снова';
            restartButton.addEventListener('click', () => {
                widgetState.currentStep = 0;
                widgetState.answers = {};
                updateWidgetDisplay();
            });
            
            answerArea.appendChild(resultContainer);
            buttonsArea.appendChild(restartButton);
        }
    }
    
    /**
     * Отображение ошибки
     */
    function displayError() {
        if (!widgetState.interface) return;
        
        const { answerArea, buttonsArea } = widgetState.interface;
        
        answerArea.innerHTML = '';
        buttonsArea.innerHTML = '';
        
        const errorContainer = document.createElement('div');
        errorContainer.style.cssText = `
            padding: 20px;
            border-radius: 8px;
            background: #f8d7da;
            border: 2px solid #dc3545;
            color: #721c24;
            text-align: center;
        `;
        
        errorContainer.innerHTML = `
            <h3><i class="fas fa-exclamation-circle"></i> Ошибка анализа</h3>
            <p>Попробуйте ещё раз или обновите страницу.</p>
        `;
        
        const restartButton = document.createElement('button');
        restartButton.className = 'btn btn-secondary';
        restartButton.style.cssText = 'width: 100%; margin-top: 15px;';
        restartButton.innerHTML = '<i class="fas fa-redo"></i> Попробовать снова';
        restartButton.addEventListener('click', () => {
            widgetState.currentStep = 0;
            widgetState.answers = {};
            updateWidgetDisplay();
        });
        
        answerArea.appendChild(errorContainer);
        buttonsArea.appendChild(restartButton);
    }
    
    /**
     * Инициализация виджета
     */
    function initWidget() {
        if (widgetState.isInitialized) {
            console.warn('⚠️ [WidgetInit] Виджет уже инициализирован');
            return;
        }
        
        console.log('🚀 [WidgetInit] Инициализация виджета');
        
        const widgetContainer = document.querySelector(CONFIG.WIDGET_CONTAINER);
        if (!widgetContainer) {
            console.error('❌ [WidgetInit] Контейнер не найден');
            return;
        }
        
        // Очистка
        widgetContainer.innerHTML = '';
        widgetContainer.style.minHeight = '300px';
        widgetContainer.classList.add('preview-container');
        
        // Настройка скроллов
        safeHashCleanup();
        setupScrollHandlers();
        
        // Создание интерфейса
        createWidgetInterface(widgetContainer);
        
        // Обновление состояния
        window.AMG_State.widgetActive = true;
        widgetState.isInitialized = true;
        
        // Показ первого вопроса
        updateWidgetDisplay();
        
        console.log('✅ [WidgetInit] Виджет успешно инициализирован');
    }
    
    // === ТОЧКА ВХОДА ===
    
    console.log('🎬 [PreviewWidget] Запуск');
    
    // Проверка контейнера
    const widgetContainer = document.querySelector(CONFIG.WIDGET_CONTAINER);
    
    if (!widgetContainer) {
        console.log('ℹ️ [PreviewWidget] Контейнер не найден, только скроллы');
        
        safeHashCleanup();
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupScrollHandlers);
        } else {
            setupScrollHandlers();
        }
        
        return;
    }
    
    // Если есть виджет - ждём систему
    console.log('🏗️ [PreviewWidget] Контейнер найден, ожидание системы...');
    
    waitForSystemReady(function() {
        console.log('🚀 [PreviewWidget] Запуск виджета');
        initWidget();
    });
    
    // Логирование статуса
    setTimeout(() => {
        console.log('📈 [PreviewWidget] Статус:', {
            systemReady: window.AMG_State ? window.AMG_State.systemReady : false,
            widgetInitialized: widgetState.isInitialized
        });
    }, 1000);
    
    console.log('✅ [PreviewWidget] Модуль загружен');
    
})();

// ===================================================================
// КОНЕЦ ФАЙЛА
// ===================================================================
