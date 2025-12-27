// ===================================================================
// PREVIEW-WIDGET.JS - ТОЛЬКО ВИДЖЕТ (без скроллов)
// ===================================================================

(function() {
    'use strict';
    
    console.log('🎯 Виджет: запуск');
    
    // === КОНСТАНТЫ ===
    const CONFIG = {
        CONSUMER_KEYWORDS: ['купил', 'покупк', 'товар', 'услуг', 'продавец', 'магазин', 'гаранти', 'брак'],
        COMPLEX_KEYWORDS: ['суд', 'адвокат', 'юрист', 'моральн', 'здоровье', 'травм']
    };
    
    // === ВОПРОСЫ ===
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
    
    // === СОСТОЯНИЕ ===
    let currentStep = 0;
    let answers = {};
    
    // === ОСНОВНЫЕ ФУНКЦИИ ===
    
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
            ">
                <div style="margin-bottom: 12px;">
                    <div style="height: 6px; background: #e9ecef; border-radius: 3px;">
                        <div style="height: 100%; background: #007bff; width: ${((currentStep + 1) / QUESTIONS.length) * 100}%;"></div>
                    </div>
                    <div style="text-align: center; font-size: 14px; color: #666; margin-top: 8px;">
                        Вопрос ${currentStep + 1} из ${QUESTIONS.length}
                    </div>
                </div>
                
                <div style="font-size: 18px; font-weight: 600; color: #333; margin-bottom: 16px;">
                    ${question.text}
                </div>
                
                <textarea id="widget-input" style="
                    width: 100%; 
                    min-height: 100px; 
                    padding: 12px; 
                    border: 1px solid #ddd; 
                    border-radius: 8px; 
                    font-size: 16px;
                    margin-bottom: 12px;"
                    placeholder="Введите ответ..."
                    maxlength="${question.maxLength}">${answers[question.id] || ''}</textarea>
                
                <div style="text-align: right; font-size: 14px; color: #888;">
                    <span id="char-count">${answers[question.id] ? answers[question.id].length : 0}</span> / ${question.maxLength}
                </div>
                
                <div style="display: flex; gap: 12px; margin-top: 20px;">
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
        const textarea = document.getElementById('widget-input');
        const charCount = document.getElementById('char-count');
        
        if (textarea) {
            textarea.addEventListener('input', function() {
                charCount.textContent = this.value.length;
            });
            setTimeout(() => textarea.focus(), 100);
        }
        
        document.getElementById('prev-btn')?.addEventListener('click', goToPreviousStep);
        document.getElementById('next-btn')?.addEventListener('click', goToNextStep);
    }
    
    function goToPreviousStep() {
        if (currentStep > 0) {
            currentStep--;
            showCurrentQuestion();
        }
    }
    
    function goToNextStep() {
        const textarea = document.getElementById('widget-input');
        if (!textarea) return;
        
        const value = textarea.value.trim();
        if (!value) {
            alert('Пожалуйста, введите ответ');
            return;
        }
        
        const question = QUESTIONS[currentStep];
        answers[question.id] = value;
        
        if (currentStep < QUESTIONS.length - 1) {
            currentStep++;
            showCurrentQuestion();
        } else {
            analyzeAnswers();
        }
    }
    
    function analyzeAnswers() {
        const problemText = (answers.problem || '').toLowerCase();
        const amount = parseInt((answers.amount || '').replace(/\D/g, '')) || 0;
        
        const hasConsumerKeywords = CONFIG.CONSUMER_KEYWORDS.some(kw => problemText.includes(kw));
        const isSolvable = hasConsumerKeywords && amount > 0;
        
        let planId = 'extended';
        if (amount < 20000) planId = 'basic';
        if (amount > 100000) planId = 'subscription';
        
        // Сохраняем
        try {
            sessionStorage.setItem('preliminary_answers', JSON.stringify({
                problem: answers.problem,
                amount: amount,
                date: answers.date,
                isSolvable: isSolvable,
                recommendedPlan: planId
            }));
        } catch (e) {}
        
        // Показываем результат
        showResult(isSolvable, planId);
    }
    
    function showResult(isSolvable, planId) {
        const container = document.querySelector('.bot-widget-placeholder');
        if (!container) return;
        
        const planNames = {
            'basic': 'Базовый (500 ₽)',
            'extended': 'Расширенный (1 200 ₽)', 
            'subscription': 'Профессиональный (2 500 ₽)'
        };
        
        if (isSolvable) {
            container.innerHTML = `
                <div class="preview-widget" style="
                    background: #f0f9ff;
                    border: 2px solid #007bff;
                    border-radius: 12px;
                    padding: 24px;
                ">
                    <h3 style="color: #007bff; margin-top: 0;">
                        ✅ Возможное нарушение обнаружено
                    </h3>
                    <p>Ситуация может подпадать под действие Закона о защите прав потребителей.</p>
                    <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0;">
                        <strong>Рекомендуем:</strong><br>
                        ${planNames[planId]}
                    </div>
                    <button id="select-tariff" style="
                        width: 100%; 
                        padding: 12px; 
                        background: #28a745; 
                        color: white; 
                        border: none; 
                        border-radius: 6px;
                        cursor: pointer;">
                        Выбрать тариф
                    </button>
                    <button id="restart" style="
                        width: 100%; 
                        padding: 12px; 
                        background: #6c757d; 
                        color: white; 
                        border: none; 
                        border-radius: 6px;
                        margin-top: 10px;
                        cursor: pointer;">
                        Новый анализ
                    </button>
                </div>
            `;
            
            document.getElementById('select-tariff').addEventListener('click', function() {
                // ПРОСТО показываем тарифы, НЕ скроллим
                const pricing = document.getElementById('pricing');
                if (pricing) {
                    pricing.style.border = '3px solid #28a745';
                    pricing.style.padding = '20px';
                    setTimeout(() => {
                        pricing.style.border = '';
                        pricing.style.padding = '';
                    }, 2000);
                }
            });
            
        } else {
            container.innerHTML = `
                <div class="preview-widget" style="
                    background: #fff3f3;
                    border: 2px solid #dc3545;
                    border-radius: 12px;
                    padding: 24px;
                ">
                    <h3 style="color: #dc3545; margin-top: 0;">
                        ❌ Нарушение не обнаружено
                    </h3>
                    <p>На основе описания не выявлено признаков нарушения прав потребителя.</p>
                    <button id="restart" style="
                        width: 100%; 
                        padding: 12px; 
                        background: #6c757d; 
                        color: white; 
                        border: none; 
                        border-radius: 6px;
                        cursor: pointer;">
                        Попробовать снова
                    </button>
                </div>
            `;
        }
        
        document.getElementById('restart')?.addEventListener('click', function() {
            currentStep = 0;
            answers = {};
            showCurrentQuestion();
        });
    }
    
    // === ЗАПУСК ===
    setTimeout(() => {
        const container = document.querySelector('.bot-widget-placeholder');
        if (container) {
            showCurrentQuestion();
            console.log('✅ Виджет запущен');
        }
    }, 100);
    
})();
