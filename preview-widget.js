// ===== КРИТИЧЕСКАЯ ОТЛАДКА: ИЩЕМ ВСЕ СКРОЛЛИНГИ =====
console.log("🔍 Отладка: поиск всех скроллингов...");

// 1. Блокируем ВСЕ скроллинги до загрузки
window.scrollTo = function() {
    console.warn("❌ БЛОКИРОВКА window.scrollTo вызвана:", arguments, new Error().stack);
    return;
};

// 2. Блокируем scrollIntoView
Element.prototype.scrollIntoView = function() {
    console.warn("❌ БЛОКИРОВКА scrollIntoView вызвана на элементе:", this, arguments, new Error().stack);
    return;
};

// 3. Перехватываем ВСЕ addEventListener для скролла
const originalAddEventListener = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function(type, handler, options) {
    if (type.includes('scroll') || type.includes('hash') || type.includes('click')) {
        console.warn("⚠️ Регистрация обработчика:", type, "на элементе:", this);
    }
    return originalAddEventListener.call(this, type, handler, options);
};

// 4. Проверяем, не было ли уже вызвано что-то
console.log("📍 Текущая позиция скролла:", window.scrollY);
console.log("📍 Хэш в URL:", window.location.hash);

// 5. Восстанавливаем функции через 3 секунды (чтобы виджет заработал)
setTimeout(() => {
    console.log("✅ Восстанавливаем нормальные функции скролла");
    window.scrollTo = function(x, y) {
        window.scrollX = x;
        window.scrollY = y;
        console.log("✅ Разрешённый скролл к:", x, y);
    };
    
    Element.prototype.scrollIntoView = function(options) {
        console.log("✅ Разрешённый scrollIntoView для:", this);
        const rect = this.getBoundingClientRect();
        window.scrollTo(rect.left, rect.top);
    };
}, 3000);
// preview-widget.js
// Виджет предварительного анализа для главной страницы

// ===== КРИТИЧЕСКИЙ ФИКС: УСТРАНЕНИЕ ПРИНУДИТЕЛЬНОЙ ПРОКРУТКИ ПРИ ЗАГРУЗКЕ =====
// ВЫПОЛНЯЕТСЯ СРАЗУ, ДО ВСЕГО ОСТАЛЬНОГО КОДА
(function() {
    'use strict';
    
    // 1. ФИКС НА САМОМ ВЕРХУ: если страница загрузилась с #start
    if (window.location.hash === '#start') {
        // МГНОВЕННАЯ прокрутка наверх (до загрузки DOM)
        window.scrollTo(0, 0);
        
        // Убираем якорь из URL через микротаск
        setTimeout(function() {
            try {
                window.history.replaceState(null, null, 
                    window.location.pathname + window.location.search);
            } catch(e) {
                // Игнорируем ошибки для старых браузеров
            }
        }, 0);
    }
})();

// ===== ОСНОВНОЙ КОД ВИДЖЕТА С ИСПРАВЛЕННЫМ УПРАВЛЕНИЕМ СКРОЛЛОМ =====
(function() {
    'use strict';
    
    // ===== 1. УПРАВЛЕНИЕ КНОПКАМИ "СТАРТ" (РАБОТАЕТ С ПЕРВОГО КЛИКА) =====
    function setupScrollButtons() {
        // Находим все кнопки с классом .start-scroll-btn
        const startButtons = document.querySelectorAll('.start-scroll-btn');
        const ctaSection = document.getElementById('start-section');
        
        if (!ctaSection) return;
        
        // Функция прокрутки
        function scrollToWidget() {
            ctaSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
            
            // Фокус на поле ввода через небольшой таймаут
            setTimeout(() => {
                const textarea = document.querySelector('.answer-input');
                if (textarea) {
                    textarea.focus();
                    // Подсветка секции
                    ctaSection.style.boxShadow = '0 0 0 3px #4CAF50';
                    setTimeout(() => {
                        ctaSection.style.boxShadow = '';
                    }, 2000);
                }
            }, 500);
        }
        
        // Вешаем обработчики на ВСЕ кнопки "Старт"
        startButtons.forEach(button => {
            // Удаляем все существующие обработчики (чистый лист)
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            // Вешаем ОДИН надежный обработчик
            newButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopImmediatePropagation(); // Блокируем ВСЕ другие обработчики
                scrollToWidget();
                return false;
            }, true); // Используем capture phase для приоритета
        });
        
        // Дополнительно: глобальная функция для вызова из других мест
        window.scrollToPreviewWidget = scrollToWidget;
    }
    
    // ===== 2. ФИКС: ЕСЛИ ВСЁ ЖЕ ПОПАЛИ С ЯКОРЕМ #start ПОСЛЕ ЗАГРУЗКИ =====
    function checkInitialHash() {
        if (window.location.hash === '#start' && window.scrollY > 100) {
            window.scrollTo(0, 0);
            setTimeout(() => {
                try {
                    window.history.replaceState(null, null, 
                        window.location.pathname + window.location.search);
                } catch(e) {}
            }, 10);
        }
    }
    
    // ===== 3. ВАШ ОРИГИНАЛЬНЫЙ КОД ВИДЖЕТА (БЕЗ ИЗМЕНЕНИЙ) =====
    
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
                
                if (window.GuardConfig && window.GuardConfig.validate) {
                    const guardResult = window.GuardConfig.validate(value);
                    if (guardResult !== true) return guardResult;
                }
                
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

    // === СОСТОЯНИЕ ВИДЖЕТА ===
    let currentStep = 0;
    let answers = {};
    let isProcessing = false;

    // Очищаем предыдущие состояния при загрузке
    try {
        sessionStorage.removeItem('preview_widget_state');
        sessionStorage.removeItem('preview_restore_state');
        sessionStorage.removeItem('preliminary_answers');
    } catch (e) {
        // Игнорируем ошибки очистки
    }

    // ===== ФУНКЦИИ ДЛЯ ПРОВЕРКИ СРОКА ДАВНОСТИ =====
    function checkStatuteOfLimitations(dateText) {
        if (!dateText) return { isValid: true, warning: 'Дата не указана, требуется уточнение' };
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let violationDate = null;
        
        const patterns = [
            /(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+(\d{4})/i,
            /(\d{1,2})\.(\d{1,2})\.(\d{4})/,
            /(\d{4})-(\d{1,2})-(\d{1,2})/,
            /(\d{4})\s*год[а]?/i
        ];
        
        const monthNames = {
            'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3, 'мая': 4, 'июня': 5,
            'июля': 6, 'августа': 7, 'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11
        };
        
        for (const pattern of patterns) {
            const match = dateText.match(pattern);
            if (match) {
                if (pattern === patterns[0]) {
                    const day = parseInt(match[1]);
                    const month = monthNames[match[2].toLowerCase()];
                    const year = parseInt(match[3]);
                    violationDate = new Date(year, month, day);
                } else if (pattern === patterns[1]) {
                    const day = parseInt(match[1]);
                    const month = parseInt(match[2]) - 1;
                    const year = parseInt(match[3]);
                    violationDate = new Date(year, month, day);
                } else if (pattern === patterns[2]) {
                    const year = parseInt(match[1]);
                    const month = parseInt(match[2]) - 1;
                    const day = parseInt(match[3]);
                    violationDate = new Date(year, month, day);
                } else if (pattern === patterns[3]) {
                    const year = parseInt(match[1]);
                    violationDate = new Date(year, 0, 1);
                }
                break;
            }
        }
        
        if (!violationDate || isNaN(violationDate.getTime())) {
            return { 
                isValid: true, 
                warning: 'Не удалось точно определить дату. Требуется уточнение при анализе.',
                date: null
            };
        }
        
        const timeDiff = today.getTime() - violationDate.getTime();
        const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
        
        const LIMIT_DAYS = 1095;
        const WARNING_DAYS = 1000;
        
        if (daysDiff > LIMIT_DAYS) {
            const yearsOver = (daysDiff - LIMIT_DAYS) / 365.25;
            return { 
                isValid: false, 
                reason: `С момента нарушения прошло ${Math.floor(daysDiff/365.25)} ${getRussianYears(Math.floor(daysDiff/365.25))} (${daysDiff} дней). Срок исковой давности (3 года) истёк ${Math.floor(yearsOver*12)} месяцев назад.`,
                daysDiff: daysDiff,
                date: violationDate
            };
        } else if (daysDiff > WARNING_DAYS) {
            const daysLeft = LIMIT_DAYS - daysDiff;
            return { 
                isValid: true, 
                warning: `Внимание: до истечения срока исковой давности осталось ${daysLeft} ${getRussianDays(daysLeft)}.`,
                daysDiff: daysDiff,
                date: violationDate
            };
        }
        
        return { 
            isValid: true, 
            daysDiff: daysDiff,
            date: violationDate
        };
    }

    function getRussianYears(number) {
        if (number % 10 === 1 && number % 100 !== 11) return 'год';
        if ([2, 3, 4].includes(number % 10) && ![12, 13, 14].includes(number % 100)) return 'года';
        return 'лет';
    }

    function getRussianDays(number) {
        if (number % 10 === 1 && number % 100 !== 11) return 'день';
        if ([2, 3, 4].includes(number % 10) && ![12, 13, 14].includes(number % 100)) return 'дня';
        return 'дней';
    }

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
        
        container.appendChild(header);
        container.appendChild(questionArea);
        container.appendChild(answerArea);
        container.appendChild(buttonsArea);
        
        return { container, header, questionArea, answerArea, buttonsArea };
    }

    // Обновление отображения
    function updateDisplay() {
        const { header, questionArea, answerArea, buttonsArea } = window.previewWidget;
        
        const progressFill = header.querySelector('.bot-progress-fill');
        const stepCounter = header.querySelector('.step-counter');
        if (progressFill) {
            progressFill.style.width = `${((currentStep) / QUESTIONS.length) * 100}%`;
        }
        if (stepCounter) {
            stepCounter.textContent = `Вопрос ${currentStep + 1} из ${QUESTIONS.length}`;
        }
        
        questionArea.innerHTML = '';
        answerArea.innerHTML = '';
        buttonsArea.innerHTML = '';
        
        const question = QUESTIONS[currentStep];
        
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
        
        function updateCharCounter() {
            const length = input.value.length;
            charCounter.textContent = `${length} / ${question.maxLength}`;
            charCounter.style.color = length >= question.maxLength * 0.9 ? '#dc3545' : '#888';
        }
        
        updateCharCounter();
        input.addEventListener('input', updateCharCounter);
        
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
            
            const validationResult = question.validator(value);
            if (validationResult !== true) {
                input.style.borderColor = '#dc3545';
                errorMessage.textContent = validationResult;
                errorMessage.style.display = 'block';
                return;
            }
            
            input.style.borderColor = '#dee2e6';
            errorMessage.style.display = 'none';
            
            answers[question.id] = value;
            
            if (currentStep < QUESTIONS.length - 1) {
                currentStep++;
                updateDisplay();
            } else {
                analyzeAnswers();
            }
        });
        
        buttonsArea.appendChild(nextButton);
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                nextButton.click();
            }
        });
        
        setTimeout(() => input.focus(), 100);
    }

    // Анализ ответов
    function analyzeAnswers() {
        isProcessing = true;
        updateDisplay();
        
        setTimeout(() => {
            const problemText = answers.problem.toLowerCase();
            const amount = Number(answers.amount.replace(/\s/g, '').replace('₽', '').replace('руб', ''));
            const dateText = answers.date;
            
            const dateCheck = checkStatuteOfLimitations(dateText);
            
            const isComplexCase = COMPLEX_KEYWORDS.some(keyword => 
                problemText.includes(keyword)
            );
            
            let recommendedPlan = 'extended';
            let planName = 'Расширенный';
            let planPrice = '1 200 ₽';
            let reason = '';
            
            if (amount < 20000 && !isComplexCase && dateCheck.isValid) {
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
            
            const hasConsumerKeywords = CONSUMER_KEYWORDS.some(keyword => 
                problemText.includes(keyword)
            );
            
            const isAmountValid = !isNaN(amount) && amount > 0;
            const isDateValid = dateText && dateText.trim().length >= 2;
            
            const isSolvable = hasConsumerKeywords && isAmountValid && isDateValid && dateCheck.isValid;
            
            if (isSolvable && dateCheck.isValid) {
                try {
                    sessionStorage.setItem('preliminary_answers', JSON.stringify({
                        problem: answers.problem,
                        amount: amount,
                        date: answers.date,
                        dateCheck: dateCheck,
                        collectedAt: new Date().toISOString()
                    }));
                } catch (e) {
                    console.warn('Не удалось сохранить ответы:', e);
                }
            }
            
            displayResult(isSolvable, dateCheck, recommendedPlan, planName, planPrice, reason);
            isProcessing = false;
        }, 800);
    }

    // Отображение результата
    function displayResult(isSolvable, dateCheck, planId, planName, planPrice, reason) {
        const { questionArea, answerArea, buttonsArea } = window.previewWidget;
        
        questionArea.innerHTML = '';
        answerArea.innerHTML = '';
        buttonsArea.innerHTML = '';
        
        if (!dateCheck.isValid) {
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
                    <i class="fas fa-hourglass-end"></i> Проблема со сроком давности
                </h3>
                <p><strong>${dateCheck.reason}</strong></p>
                
                <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 15px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #721c24;">
                        <i class="fas fa-exclamation-circle"></i> <strong>Юридическое заключение:</strong> 
                        Шансы на успешное досудебное урегулирование <strong>крайне низки</strong>. 
                        Суд, вероятно, откажет в иске по причине истечения срока давности.
                    </p>
                </div>
                
                <p><strong>Рекомендация:</strong></p>
                <ul style="margin: 10px 0 20px 20px;">
                    <li>Обратитесь к юристу для консультации о возможности восстановления срока</li>
                    <li>Рассмотрите альтернативные способы решения проблемы (переговоры, жалобы)</li>
                    <li>В будущем обращайтесь за защитой прав своевременно</li>
                </ul>
                
                <p style="font-size: 14px; color: #6c757d;">
                    <i class="fas fa-info-circle"></i> Срок исковой давности по делам о защите прав потребителей — 3 года со дня обнаружения нарушения.
                </p>
            `;
            
            const restartButton = document.createElement('button');
            restartButton.className = 'btn btn-secondary';
            restartButton.style.cssText = 'width: 100%; margin-top: 15px;';
            restartButton.innerHTML = '<i class="fas fa-redo"></i> Описать другую ситуацию';
            restartButton.addEventListener('click', () => {
                currentStep = 0;
                answers = {};
                updateDisplay();
            });
            
            answerArea.appendChild(resultContainer);
            buttonsArea.appendChild(restartButton);
            return;
        }
        
        let dateWarning = '';
        if (dateCheck.warning) {
            dateWarning = `
                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px 15px; margin: 15px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #856404; font-size: 14px;">
                        <i class="fas fa-clock"></i> <strong>${dateCheck.warning}</strong>
                    </p>
                </div>
            `;
        }
        
        const resultContainer = document.createElement('div');
        resultContainer.className = 'diagnosis-content';
        
        if (isSolvable) {
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
                    <i class="fas fa-search"></i> Признаки возможного нарушения потребительских прав обнаружены
                </h3>
                <p><strong>На основе вашего описания ситуация <u>может подпадать</u> под действие Закона о защите прав потребителей.</strong></p>
                
                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px 15px; margin: 15px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #856404; font-size: 14px;">
                        <i class="fas fa-exclamation-triangle"></i> <strong>Внимание:</strong> Это предварительная оценка на основе ключевых слов. 
                        Точный правовой анализ будет выполнен после оплаты.
                    </p>
                </div>
                
                ${dateWarning}
                
                <p><strong>Предварительная оценка:</strong></p>
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
                        ${planId === 'basic' ? 'Для типовых ситуаций с суммой до 20 000 руб.' : ''}
                        ${planId === 'extended' ? 'Включает расчёт неустойки и полный пакет документов.' : ''}
                        ${planId === 'subscription' ? 'Для сложных споров и крупных сумм.' : ''}
                    </p>
                </div>
                
                <p><strong>После оплата вы получите:</strong></p>
                <ul style="margin: 10px 0 20px 20px; font-size: 14px;">
                    <li>Юридический анализ соответствия вашей ситуации ЗоЗПП</li>
                    <li>Расчёт законных требований (если применимо)</li>
                    <li>Готовые документы для досудебного урегулирования</li>
                </ul>
                
                <p><strong>Выберите подходящий тариф ниже для проведения полного юридического анализа.</strong></p>
                
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
                        if (planElement && planElement.closest('.pricing-card')) {
                            const card = planElement.closest('.pricing-card');
                            card.style.boxShadow = '0 0 0 3px #28a745, 0 8px 25px rgba(0,0,0,0.15)';
                            card.style.transition = 'box-shadow 0.5s ease';
                            
                            setTimeout(() => {
                                card.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                            }, 2000);
                        }
                    }, 500);
                }
            });
            
            buttonsArea.appendChild(goToPricing);
            
        } else {
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
                    <i class="fas fa-exclamation-triangle"></i> Не удалось обнаружить признаков нарушения потребительских прав
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

    // ===== 4. ИНИЦИАЛИЗАЦИЯ ВСЕГО ВИДЖЕТА =====
    function init() {
        // Настраиваем кнопки скролла
        setupScrollButtons();
        
        // Проверяем, не загрузились ли мы с якорем
        checkInitialHash();
        
        // Создаем интерфейс виджета
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
