/**
 * АДВОКАТ МЕДНОГО ГРОША — script.js
 * ВЕРСИЯ: ПРИВЯЗКА К ЦЕНЕ (ИСКЛЮЧАЕМ ОШИБКИ ТАРИФОВ)
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Система АМГ: Определение тарифа по цене включено.");

    // 1. ГЕНЕРАТОР ID
    function generateOrderIdentifier(planKey) {
        const now = new Date();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        
        // Буквы: E (500), S (1200), V (2500)
        const planLetters = { 'basic': 'E', 'extended': 'S', 'subscription': 'V' };
        const planLetter = planLetters[planKey] || 'X';

        const todayStr = `${mm}${dd}`;
        const lastDate = localStorage.getItem('lastGenerationDate');
        let lastLetter = localStorage.getItem('lastUsedLetter') || '@';

        if (lastDate !== todayStr) {
            lastLetter = '@';
            localStorage.setItem('lastGenerationDate', todayStr);
        }

        let nextCharCode = lastLetter.charCodeAt(0) + 1;
        if (nextCharCode > 90) nextCharCode = 65; 
        const nextLetter = String.fromCharCode(nextCharCode);
        localStorage.setItem('lastUsedLetter', nextLetter);
        
        return `AMG25-${mm}${dd}${hh}${min}-${planLetter}${nextLetter}`;
    }

    // 2. ОТПРАВКА В БАЗУ
    async function sendCodeToBackend(orderID, planKey) {
        try {
            const planMap = { 'basic': 'basic', 'extended': 'pro', 'subscription': 'premium' };
            const backendPlan = planMap[planKey] || 'basic';
            const capsLimits = { 'basic': 30000, 'pro': 100000, 'premium': 300000 };

            const response = await fetch('https://chea.onrender.com/generate-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: orderID,
                    package: backendPlan,
                    caps_limit: capsLimits[backendPlan]
                })
            });
            return await response.json();
        } catch (error) {
            return { success: false };
        }
    }

    // 3. ЛОГИКА ГЛАВНОЙ СТРАНИЦЫ (ОПРЕДЕЛЕНИЕ ПО ЦЕНЕ)
    const tariffButtons = document.querySelectorAll('.pricing-card .btn');
    tariffButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (!this.hasAttribute('data-no-scroll')) {
                e.preventDefault(); 
                const card = this.closest('.pricing-card');
                
                // Читаем цену напрямую из карточки
                const priceText = card.querySelector('.price-amount').innerText.replace(/\s/g, '');
                const priceInt = parseInt(priceText);
                
                let plan = 'basic';
                if (priceInt >= 2000) {
                    plan = 'subscription'; // Профессиональный (2500)
                } else if (priceInt >= 1000) {
                    plan = 'extended'; // Расширенный (1200)
                } else {
                    plan = 'basic'; // Базовый (500)
                }
                
                console.log(`✅ Нажата цена ${priceInt}. Определен план: ${plan}`);

                const newID = generateOrderIdentifier(plan); 
                localStorage.setItem('lastOrderID', newID);
                
                window.location.href = `payment.html?plan=${plan}&price=${priceInt}`;
            }
        });
    });

    // 4. ЛОГИКА СТРАНИЦЫ ОПЛАТЫ
    if (window.location.pathname.includes('payment.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const planKey = urlParams.get('plan') || 'extended';
        const price = urlParams.get('price') || '1200';
        
        const now = new Date();
        const currentMinute = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
        
        let orderID = localStorage.getItem('lastOrderID');

        // Если время не совпадает или буква "X" — пересоздаем по текущему времени
        if (!orderID || !orderID.includes(currentMinute) || orderID.includes('-X')) {
            orderID = generateOrderIdentifier(planKey);
            localStorage.setItem('lastOrderID', orderID);
        }

        (async () => {
            await sendCodeToBackend(orderID, planKey);
            updatePageContent(orderID, planKey, price);
        })();

        function updatePageContent(orderID, planKey, price) {
            const planDetails = {
                'basic': { name: 'Базовый пакет', desc: 'Анализ ситуации + 1 документ' },
                'extended': { name: 'Расширенный пакет', desc: 'Расчёт неустойки + 3 документа' },
                'subscription': { name: 'Профессиональный пакет', desc: 'Сложные споры + стратегия' }
            };
            const current = planDetails[planKey] || planDetails['extended'];

            if (document.getElementById('selectedPlanName')) document.getElementById('selectedPlanName').textContent = current.name;
            if (document.getElementById('selectedPlanDesc')) document.getElementById('selectedPlanDesc').textContent = current.desc;
            
            const priceEl = document.getElementById('selectedPlanPrice');
            if (priceEl) {
                priceEl.innerHTML = `${price} ₽ <br> <span style="font-size: 1.1rem; color: #e53e3e; display:block; margin-top:5px;">ID: ${orderID}</span>`;
            }

            const qrImg = document.getElementById('qrCodeImage');
            if (qrImg) {
                const baseQR = 'https://www.sberbank.ru/ru/choise_bank?requisiteNumber=79108777700&bankCode=100000000111';
                qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(baseQR + '&sum=' + price + '&label=' + orderID)}`;
            }
        }
    }
});
