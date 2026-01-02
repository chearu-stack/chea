// ===================================================================
// PREVIEW-WIDGET.JS - ВЕРСИЯ С ИСПРАВЛЕННОЙ НЕКОРРЕКТНОЙ КНОПКОЙ ОПЛАТЫ
// ===================================================================

(function() {
    'use strict';
    
    console.log('🎯 Виджет: запуск версии с исправленной кнопкой оплаты');
    
    // Конфигурация
    const CONFIG = {
        CONSUMER_KEYWORDS: [
            'купил', 'куплен', 'приобрел', 'приобретен', 'покупк', 'товар', 'услуг',
            'продавец', 'магазин', 'гаранти', 'брак', 'некачествен', 'не работ',
            'сломал', 'дефект', 'возврат', 'деньги', 'замени', 'ремонт', 'почин'
        ],
        COMPLEX_KEYWORDS: [
            'суд', 'прокуратур', 'адвокат', 'юрист', 'моральн', 'здоровье', 'травм'
        ],
        // Новое: даты для проверки давности
        MAX_YEARS_AGO: 3, // Максимальная давность в годах
        CURRENT_YEAR: new Date().getFullYear()
    };
    
    // Вопросы с примерами-подсказками
    const QUESTIONS = [
        {
            id: 'problem',
            text: 'Опишите проблему коротко (что произошло, с каким товаром/услугой)?',
            example: 'Например: Купил телефон, быстро разряжается, магазин не отвечает',
            maxLength: 200
        },
        {
            id: 'amount',
            text: 'Укажите сумму покупки, ущерба или стоимость услуги (в рублях)?',
            example: 'Например: 25000, 100000, 5000 рублей',
            maxLength: 20,
            validator: (value) => {
                const num = parseInt(value.replace(/\D/g, '')) || 0;
                return num > 0 && num < 100000000; // До 100 млн
            }
        },
        {
            id: 'date',
            text: 'Когда это произошло (укажите дату или срок в днях/месяцах)?',
            example: 'Например: 2 недели назад, в марте 2024, 10.05.2023',
            maxLength: 100,
            validator: (value) => {
                return extractYearFromText(value) > 0;
            }
        }
    ];
    
    // Состояние
    let currentStep = 0;
    let answers = {};
    
    // Вспомогательные функции
    function extractYearFromText(text) {
        // Ищем год в тексте (2017, 2020, 2023 и т.д.)
        const yearMatch = text.match(/\b(19|20)\d{2}\b/);
        if (yearMatch) return parseInt(yearMatch[0]);
        
        // Ищем "год назад", "месяц назад" и т.д.
        if (text.includes('год') || text.includes('лет')) {
            const numMatch = text.match(/\d+/);
            const yearsAgo = numMatch ? parseInt(numMatch[0]) : 1;
            return CONFIG.CURRENT_YEAR - yearsAgo;
        }
        
        return 0;
    }
    
    function isDateTooOld(year) {
        if (!year || year < 2000) return false; // Не определили
        return (CONFIG.CURRENT_YEAR - year) > CONFIG.MAX_YEARS_AGO;
    }
    
    // Функции виджета
    function showQuestion() {
        const container = document.querySelector('.bot-widget-placeholder');
        if (!container) return;
        
        const question = QUESTIONS[currentStep];
        
        container.innerHTML = `
            <div class="widget-container" style="
                background: #f8f9fa;
                border-radius: 12px;
                padding: 24px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                margin: 20px 0;
            ">
                <!-- ЗАГОЛОВОК ВИДЖЕТА (ранее скрытый) -->
                <div style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white !important;
                    padding: 16px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    text-align: center;
                ">
                    <h3 style="margin: 0 0 8px 0; font-size: 20px; color: white !important;">
                        Проанализируйте ситуацию за 2 минуты
                    </h3>
                    <p style="margin: 0; opacity: 0.9; font-size: 14px; color: white !important;">
                        Задайте 3 вопроса → получите диагноз нарушения → выберите вариант оплаты
                    </p>
                </div>
                
                <!-- Прогресс-бар -->
                <div style="margin-bottom: 20px;">
                    <div style="height: 6px; background: #e9ecef; border-radius: 3px;">
                        <div style="height: 100%; background: #007bff; width: ${((currentStep + 1) / QUESTIONS.length) * 100}%;"></div>
                    </div>
                    <div style="text-align: center; margin-top: 8px; color: #666 !important;">
                        Вопрос ${currentStep + 1} из ${QUESTIONS.length}
                    </div>
                </div>
                
                <!-- Вопрос -->
                <div style="font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #212529 !important;">
                    ${question.text}
                </div>
                
                <!-- ПОДСКАЗКА/ПРИМЕР -->
                <div style="
                    background: #e7f3ff;
                    border-left: 4px solid #007bff;
                    padding: 10px 12px;
                    margin-bottom: 16px;
                    border-radius: 0 4px 4px 0;
                    color: #2c5282 !important;
                    font-size: 14px;
                ">
                    💡 ${question.example}
                </div>
                
                <!-- Поле ввода -->
                <textarea id="widget-input" style="
                    width: 100%;
                    min-height: 100px;
                    padding: 12px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    font-size: 16px;
                    margin-bottom: 10px;
                    color: #212529 !important;"
                    placeholder="Введите ответ..." 
                    maxlength="${question.maxLength}"></textarea>
                
                <!-- Счетчик символов -->
                <div style="text-align: right; font-size: 12px; color: #666 !important; margin-bottom: 16px;">
                    <span id="char-count">0</span> / ${question.maxLength} символов
                </div>
                
                <!-- Кнопки навигации -->
                <div style="display: flex; gap: 10px;">
                    ${currentStep > 0 ? `
                    <button id="prev-btn" style="
                        flex: 1;
                        padding: 12px;
                        background: #6c757d;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 500;">
                        Назад
                    </button>
                    ` : '<div style="flex: 1"></div>'}
                    
                    <button id="next-btn" style="
                        flex: 1;
                        padding: 12px;
                        background: #007bff;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 500;">
                        ${currentStep < QUESTIONS.length - 1 ? 'Далее' : 'Анализировать'}
                    </button>
                </div>
            </div>
        `;
        
        // Обработчики
        document.getElementById('prev-btn')?.addEventListener('click', prevStep);
        document.getElementById('next-btn')?.addEventListener('click', nextStep);
        
        // Счетчик символов
        const input = document.getElementById('widget-input');
        const charCount = document.getElementById('char-count');
        
        if (input && charCount) {
            input.addEventListener('input', function() {
                charCount.textContent = this.value.length;
                // Изменение цвета при приближении к лимиту
                if (this.value.length > question.maxLength * 0.9) {
                    charCount.style.color = '#dc3545';
                } else if (this.value.length > question.maxLength * 0.7) {
                    charCount.style.color = '#ffc107';
                } else {
                    charCount.style.color = '#666';
                }
            });
            
            // ФИКС: preventScroll при фокусе
            setTimeout(() => {
                const scrollY = window.scrollY;
                try {
                    input.focus({ preventScroll: true });
                } catch (e) {
                    input.focus();
                    window.scrollTo(0, scrollY);
                }
            }, 150);
        }
    }
    
    function prevStep() {
        if (currentStep > 0) {
            currentStep--;
            showQuestion();
        }
    }
    
    function nextStep() {
        const input = document.getElementById('widget-input');
        const question = QUESTIONS[currentStep];
        
        if (!input || !input.value.trim()) {
            // Визуальная индикация вместо alert
            input.style.borderColor = '#dc3545';
            input.style.boxShadow = '0 0 0 0.2rem rgba(220, 53, 69, 0.25)';
            
            const scrollY = window.scrollY;
            try {
                input.focus({ preventScroll: true });
            } catch (e) {
                input.focus();
                window.scrollTo(0, scrollY);
            }
            
            setTimeout(() => {
                input.style.borderColor = '#ddd';
                input.style.boxShadow = 'none';
            }, 2000);
            
            return;
        }
        
        // Валидация если есть
        if (question.validator && !question.validator(input.value.trim())) {
            input.style.borderColor = '#ffc107';
            input.style.boxShadow = '0 0 0 0.2rem rgba(255, 193, 7, 0.25)';
            
            const scrollY = window.scrollY;
            try {
                input.focus({ preventScroll: true });
            } catch (e) {
                input.focus();
                window.scrollTo(0, scrollY);
            }
            
            setTimeout(() => {
                input.style.borderColor = '#ddd';
                input.style.boxShadow = 'none';
            }, 2000);
            
            return;
        }
        
        answers[question.id] = input.value.trim();
        
        if (currentStep < QUESTIONS.length - 1) {
            currentStep++;
            showQuestion();
        } else {
            analyzeAnswers();
        }
    }
    
    function analyzeAnswers() {
        const problemText = (answers.problem || '').toLowerCase();
        const amount = parseInt((answers.amount || '').replace(/\D/g, '')) || 0;
        const eventYear = extractYearFromText(answers.date || '');
        
        // Улучшенная логика анализа
        const hasConsumerKeywords = CONFIG.CONSUMER_KEYWORDS.some(kw => 
            problemText.includes(kw)
        );
        
        const hasComplexCase = CONFIG.COMPLEX_KEYWORDS.some(kw =>
            problemText.includes(kw)
        );
        
        const isDateValid = !isDateTooOld(eventYear);
        const hasAmount = amount > 0;
        const hasProblemDescription = problemText.length > 10;
        
        // ОСНОВНАЯ ЛОГИКА ПРИНЯТИЯ РЕШЕНИЯ
        let isSolvable = false;
        let reason = '';
        
        if (hasComplexCase) {
            reason = 'Обнаружены признаки сложного случая (суд, адвокат и т.д.)';
        } else if (!hasConsumerKeywords && !hasAmount) {
            reason = 'Не обнаружено признаков потребительской проблемы и не указана сумма';
        } else if (!isDateValid && eventYear > 0) {
            reason = `Событие произошло слишком давно (${eventYear} год)`;
            isSolvable = false;
        } else if (hasConsumerKeywords && hasAmount) {
            reason = 'Обнаружены признаки нарушения прав потребителя с указанием суммы';
            isSolvable = true;
        } else if (hasConsumerKeywords && !hasAmount) {
            reason = 'Обнаружены признаки нарушения, но не указана сумма';
            isSolvable = true; // но с ограничением
        } else if (!hasConsumerKeywords && hasAmount) {
            reason = 'Указана сумма, но не обнаружено ключевых слов о покупке';
            isSolvable = false; // требует уточнения
        }
        
        // Определение тарифа (логика сохранена для аналитики)
        let planId = 'extended';
        if (amount > 0) {
            if (amount < 20000) planId = 'basic';
            if (amount > 100000) planId = 'subscription';
        }
        
        // Сохранение данных
        try {
            sessionStorage.setItem('preliminary_answers', JSON.stringify({
                problem: answers.problem,
                amount: amount,
                date: answers.date,
                eventYear: eventYear,
                isSolvable: isSolvable,
                reason: reason,
                recommendedPlan: planId,
                hasConsumerKeywords: hasConsumerKeywords,
                hasComplexCase: hasComplexCase,
                isDateValid: isDateValid,
                collectedAt: new Date().toISOString()
            }));
        } catch (e) {
            console.warn('Не удалось сохранить в sessionStorage:', e);
        }
        
        // Показываем результат
        showResult(isSolvable, planId, amount, reason, eventYear);
    }
    
    function showResult(isSolvable, planId, amount, reason, eventYear) {
        const container = document.querySelector('.bot-widget-placeholder');
        if (!container) return;
        
        const planNames = {
            basic: 'Базовый (500 ₽)',
            extended: 'Расширенный (1 200 ₽)',
            subscription: 'Профессиональный (2 500 ₽)'
        };
        
        container.innerHTML = `
            <div class="widget-container" style="
                background: ${isSolvable ? '#d4edda' : '#f8d7da'};
                border: 2px solid ${isSolvable ? '#28a745' : '#dc3545'};
                border-radius: 12px;
                padding: 24px;
                margin: 20px 0;
            ">
                <h3 style="margin-top: 0; color: #212529 !important;">
                    ${isSolvable ? '✅ Анализ завершён' : '❌ Требуется больше данных'}
                </h3>
                
                <p style="color: #212529 !important;"><strong>Результат:</strong> ${reason}</p>
                
                ${amount > 0 ? `<p style="color: #212529 !important;"><strong>Сумма:</strong> ${amount.toLocaleString('ru-RU')} руб.</p>` : ''}
                
                ${eventYear > 0 ? `<p style="color: #212529 !important;"><strong>Год события:</strong> ${eventYear}</p>` : ''}
                
                ${isSolvable ? `
                <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0; color: #212529 !important;">
                    <strong>Рекомендуемый план:</strong><br>
                    ${planNames[planId]}
                </div>
                
                <div style="
                    background: #f8f9fa;
                    padding: 12px;
                    border-radius: 6px;
                    margin: 16px 0;
                    text-align: center;
                    color: #666 !important;
                    font-size: 14px;">
                    ⚠️ Тариф будет активирован после уточнения деталей на странице оплаты
                </div>
                ` : ''}
                
                <div style="
                    width: 100%;
                    padding: 12px;
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    margin-top: 10px;
                    text-align: center;
                    font-weight: 500;
                    color: #495057;">
                    ${isSolvable ? 'Оплатите рекомендуемый пакет' : 'Уточните данные для анализа'}
                </div>
            </div>
        `;
    }
    
    // Инициализация
    function init() {
        const container = document.querySelector('.bot-widget-placeholder');
        if (container) {
            showQuestion();
            console.log('✅ Виджет запущен (кнопка оплаты удалена)');
        }
    }
    
    // Запуск
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 500);
    }
    
})();
