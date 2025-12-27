// ===================================================================
// PREVIEW-WIDGET.JS - ИСПРАВЛЕННАЯ ВЕРСИЯ
// ===================================================================

(function() {
    'use strict';
    
    console.log('🎯 Виджет: запуск исправленной версии');
    
    // Конфигурация
    const CONFIG = {
        CONSUMER_KEYWORDS: [
            'купил', 'куплен', 'приобрел', 'приобретен', 'покупк', 'товар', 'услуг',
            'продавец', 'магазин', 'гаранти', 'брак', 'некачествен', 'не работ',
            'сломал', 'дефект', 'возврат', 'деньги', 'замени', 'ремонт', 'почин'
        ],
        COMPLEX_KEYWORDS: [
            'суд', 'прокуратур', 'адвокат', 'юрист', 'моральн', 'здоровье', 'травм'
        ]
    };
    
    // Вопросы
    const QUESTIONS = [
        {
            id: 'problem',
            text: 'Опишите проблему коротко (что произошло, с каким товаром/услугой)?',
            maxLength: 200
        },
        {
            id: 'amount',
            text: 'Укажите сумму покупки, ущерба или стоимость услуги (в рублях)?',
            maxLength: 20
        },
        {
            id: 'date',
            text: 'Когда это произошло или какой срок был нарушен?',
            maxLength: 100
        }
    ];
    
    // Состояние
    let currentStep = 0;
    let answers = {};
    
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
                <div style="margin-bottom: 20px;">
                    <div style="height: 6px; background: #e9ecef; border-radius: 3px;">
                        <div style="height: 100%; background: #007bff; width: ${((currentStep + 1) / QUESTIONS.length) * 100}%;"></div>
                    </div>
                    <div style="text-align: center; margin-top: 8px; color: #666;">
                        Вопрос ${currentStep + 1} из ${QUESTIONS.length}
                    </div>
                </div>
                
                <div style="font-size: 18px; font-weight: 600; margin-bottom: 20px;">
                    ${question.text}
                </div>
                
                <textarea id="widget-input" style="
                    width: 100%;
                    min-height: 100px;
                    padding: 12px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    font-size: 16px;
                    margin-bottom: 10px;"
                    placeholder="Введите ответ..."></textarea>
                
                <div style="display: flex; gap: 10px;">
                    ${currentStep > 0 ? `
                    <button id="prev-btn" style="
                        flex: 1;
                        padding: 12px;
                        background: #6c757d;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;">
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
                        cursor: pointer;">
                        ${currentStep < QUESTIONS.length - 1 ? 'Далее' : 'Анализировать'}
                    </button>
                </div>
            </div>
        `;
        
        // Обработчики
        document.getElementById('prev-btn')?.addEventListener('click', prevStep);
        document.getElementById('next-btn')?.addEventListener('click', nextStep);
        
        // ФИКС 1: preventScroll при фокусе
        setTimeout(() => {
            const input = document.getElementById('widget-input');
            if (input) {
                // Сохраняем позицию скролла
                const scrollY = window.scrollY;
                
                // Пробуем modern API
                if (input.focus && typeof input.focus === 'function') {
                    try {
                        input.focus({ preventScroll: true });
                    } catch (e) {
                        // Fallback для старых браузеров
                        input.focus();
                        window.scrollTo(0, scrollY);
                    }
                } else {
                    input.focus();
                    window.scrollTo(0, scrollY);
                }
            }
        }, 150); // Увеличил задержку для надёжности
    }
    
    function prevStep() {
        if (currentStep > 0) {
            currentStep--;
            showQuestion();
        }
    }
    
    function nextStep() {
        const input = document.getElementById('widget-input');
        if (!input || !input.value.trim()) {
            // ФИКС 4: Заменяем alert на визуальную индикацию
            input.style.borderColor = '#dc3545';
            input.style.boxShadow = '0 0 0 0.2rem rgba(220, 53, 69, 0.25)';
            
            // ФИКС 1: preventScroll при повторном фокусе
            const scrollY = window.scrollY;
            try {
                input.focus({ preventScroll: true });
            } catch (e) {
                input.focus();
                window.scrollTo(0, scrollY);
            }
            
            // Убираем подсветку через 2 секунды
            setTimeout(() => {
                input.style.borderColor = '#ddd';
                input.style.boxShadow = 'none';
            }, 2000);
            
            return;
        }
        
        const question = QUESTIONS[currentStep];
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
        
        // ФИКС 3: Улучшенная логика анализа
        const hasConsumerKeywords = CONFIG.CONSUMER_KEYWORDS.some(kw => 
            problemText.includes(kw)
        );
        
        // Новая логика: ключевые слова ИЛИ указана сумма
        const isSolvable = hasConsumerKeywords || amount > 0;
        
        let planId = 'extended';
        if (amount > 0 && amount < 20000) planId = 'basic';
        if (amount > 100000) planId = 'subscription';
        
        // ФИКС 5: Читаем сохранённые данные при следующем анализе
        try {
            const storedData = sessionStorage.getItem('preliminary_answers');
            if (storedData) {
                console.log('📊 Предыдущие ответы:', JSON.parse(storedData));
            }
            
            sessionStorage.setItem('preliminary_answers', JSON.stringify({
                problem: answers.problem,
                amount: amount,
                date: answers.date,
                isSolvable: isSolvable,
                recommendedPlan: planId,
                collectedAt: new Date().toISOString(),
                hasConsumerKeywords: hasConsumerKeywords,
                // Добавляем для будущего анализа
                keywordsFound: CONFIG.CONSUMER_KEYWORDS.filter(kw => problemText.includes(kw))
            }));
        } catch (e) {
            console.warn('Не удалось сохранить в sessionStorage:', e);
        }
        
        // Показываем результат
        showResult(isSolvable, planId, amount, hasConsumerKeywords);
    }
    
    function showResult(isSolvable, planId, amount, hasKeywords) {
        const container = document.querySelector('.bot-widget-placeholder');
        if (!container) return;
        
        const planNames = {
            basic: 'Базовый (500 ₽)',
            extended: 'Расширенный (1 200 ₽)',
            subscription: 'Профессиональный (2 500 ₽)'
        };
        
        // Улучшенное сообщение в зависимости от данных
        let message = '';
        if (amount > 0 && !hasKeywords) {
            message = 'Указана сумма, но не обнаружено ключевых слов о покупке. Рекомендуем уточнить детали.';
        } else if (hasKeywords && amount === 0) {
            message = 'Обнаружены признаки потребительской проблемы, но сумма не указана.';
        } else if (hasKeywords && amount > 0) {
            message = 'Ситуация может подпадать под действие Закона о защите прав потребителей.';
        } else {
            message = 'На основе описания не выявлено признаков нарушения прав потребителя.';
        }
        
        container.innerHTML = `
            <div class="widget-container" style="
                background: ${isSolvable ? '#d4edda' : '#f8d7da'};
                border: 2px solid ${isSolvable ? '#28a745' : '#dc3545'};
                border-radius: 12px;
                padding: 24px;
                margin: 20px 0;
                color: ${isSolvable ? '#155724' : '#721c24'};
            ">
                <h3 style="margin-top: 0;">
                    ${isSolvable ? '✅ Анализ завершён' : '❌ Требуется больше данных'}
                </h3>
                
                <p>${message}</p>
                
                ${amount > 0 ? `<p><strong>Сумма:</strong> ${amount.toLocaleString('ru-RU')} руб.</p>` : ''}
                
                ${isSolvable && amount > 0 ? `
                <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <strong>Рекомендуем:</strong><br>
                    ${planNames[planId]}
                </div>
                ` : ''}
                
                <button id="restart-btn" style="
                    width: 100%;
                    padding: 12px;
                    background: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    margin-top: 10px;
                    cursor: pointer;">
                    ${isSolvable ? 'Новый анализ' : 'Попробовать снова'}
                </button>
            </div>
        `;
        
        document.getElementById('restart-btn').addEventListener('click', function() {
            currentStep = 0;
            answers = {};
            showQuestion();
        });
    }
    
    // Инициализация
    function init() {
        const container = document.querySelector('.bot-widget-placeholder');
        if (container) {
            showQuestion();
            console.log('✅ Виджет запущен (исправленная версия)');
        }
    }
    
    // ФИКС 6: Более безопасная инициализация
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM уже готов
        setTimeout(init, 500); // Задержка для избежания конфликтов
    }
    
})();
