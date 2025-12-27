// ===================================================================
// PREVIEW-WIDGET.JS - УПРОЩЁННАЯ РАБОЧАЯ ВЕРСИЯ
// ТОЛЬКО ВИДЖЕТ И СКРОЛЛЫ
// ===================================================================

(function() {
    'use strict';
    
    console.log('🎯 Виджет: запуск упрощённой версии');
    
    // === КОНСТАНТЫ ===
    const CONFIG = {
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
    
    // === ВОПРОСЫ ===
    const QUESTIONS = [
        {
            id: 'problem',
            text: 'Опишите проблему коротко (что произошло, с каким товаром/услугой)?',
            example: 'Пример: Купил телефон, он сломался через неделю. Магазин отказывается менять.',
            maxLength: 200
        },
        {
            id: 'amount',
            text: 'Укажите сумму покупки, ущерба или стоимость услуги (в рублях)?',
            example: 'Пример: 30000',
            maxLength: 20
        },
        {
            id: 'date',
            text: 'Когда это произошло или какой срок был нарушен (дата, число дней)?',
            example: 'Пример: 15 марта 2024 года или задержка на 30 дней',
            maxLength: 100
        }
    ];
    
    // === СОСТОЯНИЕ ===
    let currentStep = 0;
    let answers = {};
    let widgetInterface = null;
    
    // === ОСНОВНЫЕ ФУНКЦИИ ===
    
    /**
     * Настройка скроллов (простая)
     */
    function setupScrollHandlers() {
        console.log('🎯 Настройка скроллов');
        
        // Логотип - наверх
        const navLogo = document.getElementById('navLogo');
        if (navLogo) {
            navLogo.addEventListener('click', function(e) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
        
        // Кнопки "Старт"
        document.querySelectorAll('.start-scroll-btn').forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const startSection = document.getElementById('start-section');
                if (startSection) {
                    startSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
        
        // Навигация
        document.querySelectorAll('[data-scroll-to]').forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('data-scroll-to');
                const target = document.getElementById(targetId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }
    
    /**
     * Создание интерфейса виджета
     */
    function createWidgetInterface() {
        const container = document.querySelector('.bot-widget-placeholder');
        if (!container) return null;
        
        // Очищаем
        container.innerHTML = '';
        
        // Создаём основной элемент
        const widget = document.createElement('div');
        widget.className = 'preview-widget';
        widget.style.cssText = `
            background: #f8f9fa;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            margin: 20px 0;
            font-family: 'Open Sans', sans-serif;
        `;
        
        container.appendChild(widget);
        
        return {
            element: widget,
            container: widget
        };
    }
    
    /**
     * Показать текущий вопрос
     */
    function showCurrentQuestion() {
        const container = document.querySelector('.bot-widget-placeholder');
        if (!container) return;
        
        const question = QUESTIONS[currentStep];
        
        container.innerHTML = `
            <div class="preview-widget" style="
                background: #f8f9fa;
                border-radius: 12px;
                padding: 24px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                margin: 20px 0;
                font-family: 'Open Sans', sans-serif;
            ">
                <div style="margin-bottom: 12px;">
                    <div style="height: 6px; background: #e9ecef; border-radius: 3px; overflow: hidden;">
                        <div style="height: 100%; background: linear-gradient(90deg, #c53030, #dd6b20); 
                            width: ${((currentStep + 1) / QUESTIONS.length) * 100}%;"></div>
                    </div>
                    <div style="font-size: 14px; color: #6c757d; text-align: center; font-weight: 600;">
                        Вопрос ${currentStep + 1} из ${QUESTIONS.length}
                    </div>
                </div>
                
                <div style="font-size: 18px; font-weight: 600; color: #1a365d; margin-bottom: 8px;">
                    ${question.text}
                </div>
                
                ${question.example ? `
                <div style="font-size: 14px; color: #666; background: #f8f9fa; 
                    padding: 10px 14px; border-radius: 8px; border-left: 3px solid #4361ee; 
                    margin-top: 12px; font-style: italic;">
                    ${question.example}
                </div>
                ` : ''}
                
                <textarea id="widget-input" style="
                    width: 100%; 
                    min-height: 80px; 
                    padding: 12px; 
                    border: 2px solid #dee2e6; 
                    border-radius: 8px; 
                    font-family: 'Open Sans', sans-serif; 
                    font-size: 15px; 
                    margin-top: 20px;
                    resize: vertical;"
                    placeholder="Введите ваш ответ здесь..."
                    maxlength="${question.maxLength}">${answers[question.id] || ''}</textarea>
                
                <div style="text-align: right; font-size: 14px; color: #888; margin-top: 6px;">
                    <span id="char-count">${answers[question.id] ? answers[question.id].length : 0}</span> / ${question.maxLength}
                </div>
                
                <div style="display: flex; justify-content: space-between; gap: 12px; margin-top: 20px;">
                    ${currentStep > 0 ? `
                    <button id="prev-btn" style="
                        flex: 1; 
                        padding: 12px; 
                        background: #6c757d; 
                        color: white; 
                        border: none; 
                        border-radius: 6px; 
                        cursor: pointer;">
                        ← Назад
                    </button>
                    ` : ''}
                    
                    <button id="next-btn" style="
                        flex: 1; 
                        padding: 12px; 
                        background: ${currentStep < QUESTIONS.length - 1 ? '#007bff' : '#28a745'}; 
                        color: white; 
                        border: none; 
                        border-radius: 6px; 
                        cursor: pointer;">
                        ${currentStep < QUESTIONS.length - 1 ? 'Далее →' : 'Получить анализ'}
                    </button>
                </div>
            </div>
        `;
        
        // Обработчики
        const textarea = document.getElementById('widget-input');
        const charCount = document.getElementById('char-count');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        
        if (textarea) {
            textarea.addEventListener('input', function() {
                charCount.textContent = this.value.length;
                charCount.style.color = this.value.length >= question.maxLength * 0.9 ? '#dc3545' : '#888';
            });
            
            // Автофокус
            setTimeout(() => textarea.focus(), 100);
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', goToPreviousStep);
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', goToNextStep);
        }
    }
    
    /**
     * Следующий шаг
     */
    function goToNextStep() {
        const textarea = document.getElementById('widget-input');
        if (!textarea) return;
        
        const question = QUESTIONS[currentStep];
        const value = textarea.value.trim();
        
        // Простая валидация
        if (!value) {
            alert('Пожалуйста, введите ответ');
            textarea.focus();
            return;
        }
        
        // Сохраняем ответ
        answers[question.id] = value;
        
        if (currentStep < QUESTIONS.length - 1) {
            currentStep++;
            showCurrentQuestion();
        } else {
            analyzeAnswers();
        }
    }
    
    /**
     * Предыдущий шаг
     */
    function goToPreviousStep() {
        if (currentStep > 0) {
            currentStep--;
            showCurrentQuestion();
        }
    }
    
    /**
     * Анализ ответов (упрощённый)
     */
    function analyzeAnswers() {
        console.log('🔍 Анализ ответов');
        
        const problemText = (answers.problem || '').toLowerCase();
        const amount = parseInt((answers.amount || '').replace(/\D/g, '')) || 0;
        
        // Проверка ключевых слов
        const hasConsumerKeywords = CONFIG.CONSUMER_KEYWORDS.some(keyword => 
            problemText.includes(keyword)
        );
        
        const isComplexCase = CONFIG.COMPLEX_KEYWORDS.some(keyword => 
            problemText.includes(keyword)
        );
        
        const isSolvable = hasConsumerKeywords && amount > 0;
        
        // Выбор тарифа
        let planId = 'extended';
        let planName = 'Расширенный';
        let planPrice = '1 200 ₽';
        
        if (amount < 20000 && !isComplexCase) {
            planId = 'basic';
            planName = 'Базовый';
            planPrice = '500 ₽';
        } else if (amount > 100000 || isComplexCase) {
            planId = 'subscription';
            planName = 'Профессиональный';
            planPrice = '2 500 ₽';
        }
        
        // Сохраняем в sessionStorage
        try {
            sessionStorage.setItem('preliminary_answers', JSON.stringify({
                problem: answers.problem,
                amount: amount,
                date: answers.date,
                isSolvable: isSolvable,
                recommendedPlan: planId,
                collectedAt: new Date().toISOString()
            }));
        } catch (e) {
            console.warn('Не удалось сохранить ответы:', e);
        }
        
        // Показываем результат
        showResult(isSolvable, planId, planName, planPrice);
    }
    
    /**
     * Показать результат анализа
     */
    function showResult(isSolvable, planId, planName, planPrice) {
        const container = document.querySelector('.bot-widget-placeholder');
        if (!container) return;
        
        if (isSolvable) {
            container.innerHTML = `
                <div class="preview-widget" style="
                    background: linear-gradient(135deg, #d4edda, #c3e6cb);
                    border: 2px solid #28a745;
                    border-radius: 12px;
                    padding: 24px;
                    margin: 20px 0;
                    color: #155724;
                ">
                    <h3 style="margin-top: 0; color: #155724;">
                        <i class="fas fa-search"></i> Возможное нарушение прав потребителя обнаружено
                    </h3>
                    
                    <p><strong>Ситуация может подпадать под действие Закона о защите прав потребителей.</strong></p>
                    
                    <div style="background: #fff3cd; border-left: 4px solid #ffc107; 
                        padding: 12px 15px; margin: 15px 0; border-radius: 4px;">
                        <p style="margin: 0; color: #856404;">
                            <i class="fas fa-exclamation-triangle"></i> 
                            <strong>Внимание:</strong> Это предварительная оценка.
                        </p>
                    </div>
                    
                    <div style="background: white; border-radius: 8px; padding: 15px; 
                        margin: 15px 0; border: 2px solid #ffc107;">
                        <div style="display: inline-block; background: #ffc107; color: #212529; 
                            padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; 
                            margin-bottom: 10px;">
                            РЕКОМЕНДУЕМ
                        </div>
                        <h4 style="margin: 5px 0; color: #212529;">Тариф «${planName}» — ${planPrice}</h4>
                    </div>
                    
                    <button id="go-to-tariffs" style="
                        width: 100%; 
                        padding: 12px; 
                        background: #007bff; 
                        color: white; 
                        border: none; 
                        border-radius: 6px; 
                        margin-top: 15px; 
                        cursor: pointer;">
                        <i class="fas fa-tags"></i> Выбрать тариф
                    </button>
                    
                    <button id="restart-btn" style="
                        width: 100%; 
                        padding: 12px; 
                        background: #6c757d; 
                        color: white; 
                        border: none; 
                        border-radius: 6px; 
                        margin-top: 10px; 
                        cursor: pointer;">
                        <i class="fas fa-redo"></i> Новый анализ
                    </button>
                </div>
            `;
            
            // Обработчики для кнопок результата
            document.getElementById('go-to-tariffs')?.addEventListener('click', function() {
                const pricingSection = document.getElementById('pricing');
                if (pricingSection) {
                    pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
            
            document.getElementById('restart-btn')?.addEventListener('click', function() {
                currentStep = 0;
                answers = {};
                showCurrentQuestion();
            });
            
        } else {
            // Не решаемо
            container.innerHTML = `
                <div class="preview-widget" style="
                    background: linear-gradient(135deg, #f8d7da, #f5c6cb);
                    border: 2px solid #dc3545;
                    border-radius: 12px;
                    padding: 24px;
                    margin: 20px 0;
                    color: #721c24;
                ">
                    <h3 style="margin-top: 0; color: #721c24;">
                        <i class="fas fa-exclamation-triangle"></i> Не удалось обнаружить признаков нарушения
                    </h3>
                    
                    <p><strong>На основе описания не обнаружено признаков нарушения прав потребителя.</strong></p>
                    <p>Если вы считаете, что произошла ошибка, опишите ситуацию более подробно.</p>
                    
                    <button id="restart-btn" style="
                        width: 100%; 
                        padding: 12px; 
                        background: #6c757d; 
                        color: white; 
                        border: none; 
                        border-radius: 6px; 
                        margin-top: 15px; 
                        cursor: pointer;">
                        <i class="fas fa-redo"></i> Попробовать снова
                    </button>
                </div>
            `;
            
            document.getElementById('restart-btn')?.addEventListener('click', function() {
                currentStep = 0;
                answers = {};
                showCurrentQuestion();
            });
        }
    }
    
    /**
     * Инициализация
     */
    function init() {
        console.log('🚀 Инициализация виджета');
        
        // 1. Настраиваем скроллы
        setupScrollHandlers();
        
        // 2. Показываем первый вопрос
        showCurrentQuestion();
        
        console.log('✅ Виджет готов');
    }
    
    // === ЗАПУСК ===
    
    // Ждём немного и запускаем
    setTimeout(init, 100);
    
    console.log('✅ Модуль виджета загружен');
    
})();
