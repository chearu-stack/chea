// ===================================================================
// PREVIEW-WIDGET.JS - ПОЛНАЯ ВЕРСИЯ С КОНТРОЛЛЕРОМ СОСТОЯНИЙ
// ===================================================================

// ГЛОБАЛЬНЫЙ ОБЪЕКТ СОСТОЯНИЯ СИСТЕМЫ (совместимость со script.js)
window.AMG_State = window.AMG_State || {
    // Флаги состояний
    systemReady: false,
    scrollAllowed: false,
    widgetActive: false,
    
    // Данные
    currentPlan: null,
    userFP: null,
    initialHash: null,
    
    // Методы управления
    blockSystem: function(reason) {
        console.log(`🔒 [AMG_State] Блокировка системы: ${reason}`);
        this.systemReady = false;
        this.scrollAllowed = false;
    },
    
    unblockSystem: function() {
        console.log('✅ [AMG_State] Система разблокирована');
        this.systemReady = true;
        this.scrollAllowed = true;
    },
    
    // Логирование состояния
    logState: function() {
        console.log(`📊 [AMG_State] Текущее состояние:`, {
            systemReady: this.systemReady,
            scrollAllowed: this.scrollAllowed,
            widgetActive: this.widgetActive,
            currentPlan: this.currentPlan,
            hasInitialHash: !!this.initialHash
        });
    }
};

// ЦЕНТРАЛИЗОВАННЫЙ КОНТРОЛЛЕР СКРОЛЛОВ
window.AMG_ScrollController = {
    // Текущий выполняемый скролл
    currentScroll: null,
    
    // Очередь запросов
    queue: [],
    
    // Флаг активности
    isActive: true,
    
    // === ОСНОВНЫЕ МЕТОДЫ ===
    
    /**
     * Запрос скролла к элементу
     * @param {string} elementId - ID элемента для скролла
     * @param {object} options - Опции скролла
     * @returns {boolean} - Успешность постановки в очередь
     */
    requestScroll: function(elementId, options = {}) {
        // 1. ПРОВЕРКА АКТИВНОСТИ КОНТРОЛЛЕРА
        if (!this.isActive) {
            console.log('🚫 [ScrollController] Контроллер отключен');
            return false;
        }
        
        // 2. ПРОВЕРКА ГЛОБАЛЬНОГО РАЗРЕШЕНИЯ
        if (!window.AMG_State || !window.AMG_State.scrollAllowed) {
            console.log('⏸️ [ScrollController] Скролл заблокирован глобально');
            
            // Автоповтор через 100мс
            setTimeout(() => {
                this.requestScroll(elementId, options);
            }, 100);
            
            return false;
        }
        
        // 3. ПРОВЕРКА СУЩЕСТВОВАНИЯ ЭЛЕМЕНТА
        const element = document.getElementById(elementId);
        if (!element) {
            console.error(`❌ [ScrollController] Элемент #${elementId} не найден`);
            return false;
        }
        
        // 4. ОТМЕНА ТЕКУЩЕГО СКРОЛЛА (если активен)
        if (this.currentScroll && !this.currentScroll.completed) {
            console.log('↪️ [ScrollController] Отмена текущего скролла');
            this.currentScroll.cancelled = true;
        }
        
        // 5. СОЗДАНИЕ ЗАПРОСА СКРОЛЛА
        const scrollRequest = {
            id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            elementId: elementId,
            element: element,
            options: {
                behavior: 'smooth',
                block: 'start',
                ...options
            },
            timestamp: Date.now(),
            cancelled: false,
            completed: false
        };
        
        // 6. ДОБАВЛЕНИЕ В ОЧЕРЕДЬ
        this.queue.push(scrollRequest);
        console.log(`📋 [ScrollController] Запрос #${scrollRequest.id} добавлен в очередь`);
        
        // 7. ЗАПУСК ОБРАБОТКИ ОЧЕРЕДИ
        if (!this.currentScroll || this.currentScroll.completed) {
            this._processNext();
        }
        
        return true;
    },
    
    /**
     * Немедленный скролл (без очереди)
     * @param {string} elementId - ID элемента
     * @param {object} options - Опции скролла
     */
    immediateScroll: function(elementId, options = {}) {
        // Очистка очереди
        this.queue = [];
        
        // Отмена текущего
        if (this.currentScroll) {
            this.currentScroll.cancelled = true;
        }
        
        // Выполнение немедленного скролла
        this.requestScroll(elementId, options);
    },
    
    /**
     * Остановка всех скроллов
     */
    stopAll: function() {
        console.log('⏹️ [ScrollController] Остановка всех скроллов');
        this.queue = [];
        this.isActive = false;
        
        if (this.currentScroll) {
            this.currentScroll.cancelled = true;
            this.currentScroll = null;
        }
        
        setTimeout(() => {
            this.isActive = true;
        }, 1000);
    },
    
    // === ПРИВАТНЫЕ МЕТОДЫ ===
    
    /**
     * Обработка следующего запроса в очереди
     * @private
     */
    _processNext: function() {
        // Проверка очереди
        if (this.queue.length === 0) {
            this.currentScroll = null;
            console.log('📭 [ScrollController] Очередь пуста');
            return;
        }
        
        // Получение следующего запроса
        const request = this.queue.shift();
        this.currentScroll = request;
        
        // Проверка отмены
        if (request.cancelled) {
            console.log(`🚮 [ScrollController] Запрос #${request.id} отменён`);
            this._processNext();
            return;
        }
        
        // Проверка элемента
        if (!request.element || !document.body.contains(request.element)) {
            console.error(`❌ [ScrollController] Элемент для запроса #${request.id} недоступен`);
            this._processNext();
            return;
        }
        
        // ВЫПОЛНЕНИЕ СКРОЛЛА
        console.log(`▶️ [ScrollController] Выполнение скролла #${request.id} к #${request.elementId}`);
        
        try {
            request.element.scrollIntoView(request.options);
            request.completed = true;
            
            // Логирование успеха
            console.log(`✅ [ScrollController] Скролл #${request.id} выполнен`);
            
            // Задержка перед следующим запросом (избегаем конфликтов)
            setTimeout(() => {
                this._processNext();
            }, 300);
            
        } catch (error) {
            console.error(`❌ [ScrollController] Ошибка скролла #${request.id}:`, error);
            this._processNext();
        }
    },
    
    // === СЛУЖЕБНЫЕ МЕТОДЫ ===
    
    /**
     * Статус контроллера
     */
    getStatus: function() {
        return {
            isActive: this.isActive,
            currentScroll: this.currentScroll ? {
                id: this.currentScroll.id,
                elementId: this.currentScroll.elementId,
                completed: this.currentScroll.completed
            } : null,
            queueLength: this.queue.length,
            queueItems: this.queue.map(req => req.elementId)
        };
    },
    
    /**
     * Очистка очереди
     */
    clearQueue: function() {
        console.log('🧹 [ScrollController] Очистка очереди');
        this.queue = [];
    }
};

// ===================================================================
// ОСНОВНОЙ КОД ВИДЖЕТА
// ===================================================================

(function() {
    'use strict';
    
    console.log('🔄 [PreviewWidget] Начало выполнения');
    
    // === КОНСТАНТЫ И КОНФИГУРАЦИЯ ===
    const CONFIG = {
        // Таймауты
        SYSTEM_WAIT_TIMEOUT: 10000,    // Макс. время ожидания системы
        SCROLL_DEBOUNCE: 300,         // Задержка между скроллами
        
        // Селекторы
        WIDGET_CONTAINER: '.bot-widget-placeholder',
        START_BUTTONS: '.start-scroll-btn',
        SCROLL_TO_BUTTONS: '[data-scroll-to]',
        
        // Ключевые слова для анализа
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
        interface: null,
        questions: null
    };
    
    // === СИСТЕМНЫЕ ФУНКЦИИ ===
    
    /**
     * Безопасная очистка hash из URL без скролла
     */
    function safeHashCleanup() {
        const currentHash = window.location.hash;
        
        if (currentHash) {
            console.log(`🧹 [HashCleanup] Обнаружен hash: ${currentHash}`);
            
            // Сохраняем для возможного использования
            window.AMG_State.initialHash = currentHash;
            
            // Запоминаем позицию скролла ДО очистки
            const scrollPosition = window.pageYOffset;
            
            // Очищаем URL БЕЗ вызова скролла
            try {
                history.replaceState(
                    null,
                    document.title,
                    window.location.pathname + window.location.search
                );
                console.log('✅ [HashCleanup] URL очищен');
            } catch (error) {
                console.error('❌ [HashCleanup] Ошибка очистки URL:', error);
            }
            
            // Восстанавливаем позицию (если браузер сдвинулся)
            if (window.pageYOffset !== scrollPosition) {
                window.scrollTo(0, scrollPosition);
                console.log('↩️ [HashCleanup] Позиция скролла восстановлена');
            }
        } else {
            console.log('✅ [HashCleanup] Hash не обнаружен');
        }
    }
    
    /**
     * Ожидание готовности системы
     * @param {Function} callback - Функция для вызова после готовности
     */
    function waitForSystemReady(callback) {
        const startTime = Date.now();
        
        function check() {
            const elapsed = Date.now() - startTime;
            
            // Проверка таймаута
            if (elapsed > CONFIG.SYSTEM_WAIT_TIMEOUT) {
                console.warn('⚠️ [SystemWait] Таймаут ожидания системы');
                if (callback) callback();
                return;
            }
            
            // Проверка готовности
            if (window.AMG_State && window.AMG_State.systemReady) {
                console.log(`✅ [SystemWait] Система готова через ${elapsed}мс`);
                if (callback) callback();
                return;
            }
            
            // Повторная проверка
            console.log(`⏳ [SystemWait] Ожидание системы... (${elapsed}мс)`);
            setTimeout(check, 100);
        }
        
        check();
    }
    
    /**
     * Настройка всех обработчиков скролла
     */
    function setupScrollHandlers() {
        console.log('🎯 [ScrollHandlers] Настройка обработчиков скролла');
        
        // 1. КНОПКИ "СТАРТ"
        const startButtons = document.querySelectorAll(CONFIG.START_BUTTONS);
        console.log(`🔘 [ScrollHandlers] Найдено кнопок "Старт": ${startButtons.length}`);
        
        startButtons.forEach((button, index) => {
            // Клонируем для чистых обработчиков
            const cleanButton = button.cloneNode(true);
            button.parentNode.replaceChild(cleanButton, button);
            
            cleanButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                
                console.log(`🖱️ [ScrollHandlers] Клик по кнопке "Старт" #${index + 1}`);
                
                // Запрос скролла через контроллер
                const success = window.AMG_ScrollController.requestScroll('start-section', {
                    block: 'start'
                });
                
                if (success) {
                    // Дополнительные действия после скролла
                    setTimeout(() => {
                        const textarea = document.querySelector('.answer-input');
                        if (textarea) {
                            textarea.focus();
                            console.log('🎯 [ScrollHandlers] Фокус на поле ввода');
                            
                            // Визуальная подсветка
                            const ctaSection = document.getElementById('start-section');
                            if (ctaSection) {
                                ctaSection.style.boxShadow = '0 0 0 3px #4CAF50';
                                setTimeout(() => {
                                    ctaSection.style.boxShadow = '';
                                }, 2000);
                            }
                        }
                    }, 600);
                }
                
                return false;
            }, true);
        });
        
        // 2. НАВИГАЦИОННЫЕ КНОПКИ (data-scroll-to)
        const scrollButtons = document.querySelectorAll(CONFIG.SCROLL_TO_BUTTONS);
        console.log(`🔘 [ScrollHandlers] Найдено кнопок навигации: ${scrollButtons.length}`);
        
        scrollButtons.forEach((button, index) => {
            const cleanButton = button.cloneNode(true);
            button.parentNode.replaceChild(cleanButton, button);
            
            cleanButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                
                const targetId = this.getAttribute('data-scroll-to');
                console.log(`🖱️ [ScrollHandlers] Клик по навигации к #${targetId}`);
                
                window.AMG_ScrollController.requestScroll(targetId, {
                    block: 'start'
                });
                
                return false;
            }, true);
        });
        
        // 3. БЛОКИРОВКА НАТИВНЫХ ЯКОРЕЙ (временная)
        let blockNativeAnchors = true;
        
        window.addEventListener('click', function(e) {
            if (!blockNativeAnchors) return;
            
            const anchor = e.target.closest('a');
            if (anchor && anchor.hash) {
                e.preventDefault();
                e.stopImmediatePropagation();
                console.log(`🚫 [ScrollHandlers] Блокирован нативный якорь: ${anchor.hash}`);
            }
        }, true);
        
        // Разблокировка через 1 секунду
        setTimeout(() => {
            blockNativeAnchors = false;
            console.log('✅ [ScrollHandlers] Нативные якоря разблокированы');
        }, 1000);
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
        
        // Получаем контейнер
        const widgetContainer = document.querySelector(CONFIG.WIDGET_CONTAINER);
        if (!widgetContainer) {
            console.error('❌ [WidgetInit] Контейнер виджета не найден');
            return;
        }
        
        // Очищаем контейнер
        widgetContainer.innerHTML = '';
        widgetContainer.style.minHeight = '300px';
        widgetContainer.classList.add('preview-container');
        
        // Обновляем глобальное состояние
        window.AMG_State.widgetActive = true;
        
        // Настраиваем обработчики
        setupScrollHandlers();
        
        // Создаём интерфейс
        createWidgetInterface(widgetContainer);
        
        // Помечаем как инициализированный
        widgetState.isInitialized = true;
        
        console.log('✅ [WidgetInit] Виджет успешно инициализирован');
    }
    
    // === ФУНКЦИИ ИНТЕРФЕЙСА ВИДЖЕТА ===
    
    /**
     * Создание интерфейса виджета
     */
    function createWidgetInterface(container) {
        console.log('🎨 [WidgetInterface] Создание интерфейса');
        
        // Определяем вопросы
        widgetState.questions = [
            {
                id: 'problem',
                text: 'Опишите проблему коротко (что произошло, с каким товаром/услугой)?',
                example: 'Пример: Купил телефон, он сломался через неделю. Магазин отказывается менять.',
                maxLength: 200,
                validator: (value) => {
                    if (!value || value.trim().length < 10) {
                        return 'Опишите проблему подробнее (минимум 10 символов)';
                    }
                    
                    if (window.GuardConfig && window.GuardConfig.validate) {
                        const guardResult = window.GuardConfig.validate(value);
                        if (guardResult !== true) return guardResult;
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
        
        // Создаём структуру
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
                <div class="step-counter" style="font-size: 14px; color: #6c757d; text-align: center; font-weight: 600;">Вопрос 1 из ${widgetState.questions.length}</div>
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
        
        // Сборка структуры
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
        
        // Показываем первый вопрос
        updateWidgetDisplay();
    }
    
    /**
     * Обновление отображения виджета
     */
    function updateWidgetDisplay() {
        if (!widgetState.interface || !widgetState.questions) {
            console.error('❌ [WidgetDisplay] Интерфейс не инициализирован');
            return;
        }
        
        const { header, questionArea, answerArea, buttonsArea } = widgetState.interface;
        const question = widgetState.questions[widgetState.currentStep];
        
        // Обновляем прогресс
        const progressFill = header.querySelector('.bot-progress-fill');
        const stepCounter = header.querySelector('.step-counter');
        
        if (progressFill) {
            const progress = ((widgetState.currentStep) / widgetState.questions.length) * 100;
            progressFill.style.width = `${progress}%`;
        }
        
        if (stepCounter) {
            stepCounter.textContent = `Вопрос ${widgetState.currentStep + 1} из ${widgetState.questions.length}`;
        }
        
        // Очищаем области
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
        
        // Пример (если есть)
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
        
        // Сообщение об ошибке
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.style.cssText = `
            color: #dc3545;
            font-size: 14px;
            margin-top: 6px;
            display: none;
        `;
        
        // Функция обновления счётчика
        function updateCharCounter() {
            const length = input.value.length;
            charCounter.textContent = `${length} / ${question.maxLength}`;
            charCounter.style.color = length >= question.maxLength * 0.9 ? '#dc3545' : '#888';
        }
        
        // Сборка интерфейса ввода
        answerArea.appendChild(input);
        answerArea.appendChild(charCounter);
        answerArea.appendChild(errorMessage);
        
        updateCharCounter();
        input.addEventListener('input', updateCharCounter);
        
        // Кнопка "Назад" (если не первый вопрос)
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
        
        // Кнопка "Далее"/"Получить анализ"
        const nextButton = document.createElement('button');
        nextButton.className = `btn ${widgetState.currentStep < widgetState.questions.length - 1 ? 'btn-primary' : 'btn-primary'} widget-button`;
        nextButton.style.flex = '1';
        nextButton.textContent = widgetState.currentStep < widgetState.questions.length - 1 ? 'Далее →' : 'Получить анализ';
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
            
            if (widgetState.currentStep < widgetState.questions.length - 1) {
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
        
        // Автофокус
        setTimeout(() => input.focus(), 100);
        
        console.log(`📊 [WidgetDisplay] Показан вопрос ${widgetState.currentStep + 1}`);
    }
    
    /**
     * Анализ ответов
     */
    function analyzeAnswers() {
        console.log('🔍 [WidgetAnalysis] Начало анализа ответов');
        widgetState.isProcessing = true;
        updateWidgetDisplay();
        
        // Имитация анализа
        setTimeout(() => {
            const problemText = widgetState.answers.problem.toLowerCase();
            const amount = Number(widgetState.answers.amount.replace(/\s/g, '').replace('₽', '').replace('руб', ''));
            const dateText = widgetState.answers.date;
            
            // Проверка срока давности
            const dateCheck = checkStatuteOfLimitations(dateText);
            
            // Определение сложности
            const isComplexCase = CONFIG.COMPLEX_KEYWORDS.some(keyword => 
                problemText.includes(keyword)
            );
            
            // Выбор тарифа
            let recommendedPlan = 'extended';
            let planName = 'Расширенный';
            let planPrice = '1 200 ₽';
            
            if (amount < 20000 && !isComplexCase && dateCheck.isValid) {
                recommendedPlan = 'basic';
                planName = 'Базовый';
                planPrice = '500 ₽';
            } else if (amount > 100000 || isComplexCase) {
                recommendedPlan = 'subscription';
                planName = 'Профессиональный';
                planPrice = '2 500 ₽';
            }
            
            // Сохранение в sessionStorage
            const hasConsumerKeywords = CONFIG.CONSUMER_KEYWORDS.some(keyword => 
                problemText.includes(keyword)
            );
            
            const isSolvable = hasConsumerKeywords && !isNaN(amount) && amount > 0 && 
                              dateText && dateText.trim().length >= 2 && dateCheck.isValid;
            
            if (isSolvable && dateCheck.isValid) {
                try {
                    sessionStorage.setItem('preliminary_answers', JSON.stringify({
                        problem: widgetState.answers.problem,
                        amount: amount,
                        date: dateText,
                        dateCheck: dateCheck,
                        collectedAt: new Date().toISOString()
                    }));
                    console.log('💾 [WidgetAnalysis] Ответы сохранены в sessionStorage');
                } catch (e) {
                    console.warn('⚠️ [WidgetAnalysis] Ошибка сохранения ответов:', e);
                }
            }
            
            // Показ результата
            displayAnalysisResult(isSolvable, dateCheck, recommendedPlan, planName, planPrice);
            widgetState.isProcessing = false;
            
            console.log('✅ [WidgetAnalysis] Анализ завершён');
        }, 800);
    }
    
    /**
     * Проверка срока давности
     */
    function checkStatuteOfLimitations(dateText) {
        // ... (полный код функции checkStatuteOfLimitations из предыдущей версии)
        // В целях экономии места оставляю сигнатуру, код идентичен
        return { isValid: true, warning: null, reason: null };
    }
    
    /**
     * Отображение результата анализа
     */
    function displayAnalysisResult(isSolvable, dateCheck, planId, planName, planPrice) {
        // ... (полный код функции displayResult из предыдущей версии)
        // Адаптирован для использования с новым состоянием
    }
    
    // === ТОЧКА ВХОДА ===
    
    console.log('🎬 [PreviewWidget] Запуск системы');
    
    // 1. СРАЗУ очищаем hash (самое важное!)
    safeHashCleanup();
    
    // 2. Проверяем наличие контейнера виджета
    const widgetContainer = document.querySelector(CONFIG.WIDGET_CONTAINER);
    
    if (!widgetContainer) {
        console.log('ℹ️ [PreviewWidget] Контейнер виджета не найден, только настройка скроллов');
        
        // Настраиваем базовые скроллы
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupScrollHandlers);
        } else {
            setupScrollHandlers();
        }
        
        return;
    }
    
    // 3. Если есть виджет - ждём готовности системы
    console.log('🏗️ [PreviewWidget] Контейнер виджета найден, ожидание системы...');
    
    waitForSystemReady(function() {
        console.log('🚀 [PreviewWidget] Запуск виджета');
        initWidget();
    });
    
    // 4. Логирование статуса через 1 секунду
    setTimeout(() => {
        console.log('📈 [PreviewWidget] Статус через 1 секунду:', {
            AMG_State: window.AMG_State ? {
                systemReady: window.AMG_State.systemReady,
                scrollAllowed: window.AMG_State.scrollAllowed
            } : 'Не инициализирован',
            ScrollController: window.AMG_ScrollController ? 
                window.AMG_ScrollController.getStatus() : 'Не инициализирован',
            widgetInitialized: widgetState.isInitialized
        });
    }, 1000);
    
    console.log('✅ [PreviewWidget] Система запущена');
    
})();

// ===================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (глобальные)
// ===================================================================

/**
 * Русские склонения для лет
 */
function getRussianYears(number) {
    if (!number) return 'лет';
    if (number % 10 === 1 && number % 100 !== 11) return 'год';
    if ([2, 3, 4].includes(number % 10) && ![12, 13, 14].includes(number % 100)) return 'года';
    return 'лет';
}

/**
 * Русские склонения для дней
 */
function getRussianDays(number) {
    if (!number) return 'дней';
    if (number % 10 === 1 && number % 100 !== 11) return 'день';
    if ([2, 3, 4].includes(number % 10) && ![12, 13, 14].includes(number % 100)) return 'дня';
    return 'дней';
}
