/**
 * АДВОКАТ МЕДНОГО ГРОША — script.js
 * ФИНАЛЬНАЯ ВЕРСИЯ: ИСПРАВЛЕНЫ ТАРИФЫ (2500), ДАТЫ И БУКВЫ
 */

document.addEventListener('DOMContentLoaded', () => {

    // ===== 1. ИНИЦИАЛИЗАЦИЯ =====
    console.log("🚀 Система АМГ запущена. Сегодня: " + new Date().toLocaleDateString());

    // ===== 2. ПЛАВНАЯ ПРОКРУТКА =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            if (this.hasAttribute('data-no-scroll')) return;
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();
                window.scrollTo({
                    top: targetElement.getBoundingClientRect().top + window.pageYOffset - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ===== 3. ГЕНЕРАТОР ID (AMG25-ММДДЧЧММ-БукваТарифаБукваДня) =====
    function generateOrderIdentifier(planKey) {
        const now = new Date();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        
        // Буквы: E (Basic), S (Extended/Pro), V (Professional/VIP)
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

    // ===== 4. ОТПРАВКА В SUPABASE (ЧЕРЕЗ RENDER) =====
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

            const result = await response.json();
            return result.success ? result.code : orderID;
        } catch (error) {
            console.error('❌ Ошибка сети:', error);
            return orderID;
        }
    }

    // ===== 5. ЛОГИКА ГЛАВНОЙ СТРАНИЦЫ (ОПРЕДЕЛЕНИЕ ТАРИФОВ) =====
    const tariffButtons = document.querySelectorAll('.pricing-card .btn');
    tariffButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (!this.hasAttribute('data-no-scroll')) {
                e.preventDefault(); 
                const card = this.closest('.pricing-card');
                const title = card.querySelector('h3').innerText.toLowerCase();
                
                let plan = 'basic';
                if (title.includes('расширенный')) {
                    plan = 'extended';
                } else if (title.includes('профессиональный') || title.includes('сложный')) {
                    plan = 'subscription';
                }
                
                const price = card.querySelector('.price-amount').innerText.replace(/\s/g, '');
                const newID = generateOrderIdentifier(plan); 
                
                localStorage.setItem('lastOrderID', newID);
                window.location.href = `payment.html?plan=${plan}&price=${price}`;
            }
        });
    });

    // ===== 6. ЛОГИКА СТРАНИЦЫ ОПЛАТЫ (PAYMENT.HTML) =====
    if (window.location.pathname.includes('payment.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const planKey = urlParams.get('plan') || 'extended';
        const price = urlParams.get('price') || '1200';
        
        const now = new Date();
        const todayStr = String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
        
        let orderID = localStorage.getItem('lastOrderID');

        // Если дата в коде не совпадает с сегодня — обновляем!
        if (!orderID || !orderID.includes(todayStr)) {
            orderID = generateOrderIdentifier(planKey);
            localStorage.setItem('lastOrderID', orderID);
        }

        (async () => {
            const finalCode = await sendCodeToBackend(orderID, planKey);
            updatePageContent(finalCode, planKey, price);
        })();

        function updatePageContent(orderID, planKey, price) {
            const planDetails = {
                'basic': { name: 'Базовый пакет помощи', desc: 'Диагноз ситуации + план + 1 документ' },
                'extended': { name: 'Расширенный пакет помощи', desc: 'Расчёт неустойки + 3 документа + работа с отписками' },
                'subscription': { name: 'Профессиональный пакет', desc: 'Сложные споры + стратегия «ломаем отписки» + до 50 вопросов' }
            };

            const current = planDetails[planKey] || planDetails['extended'];

            if (document.getElementById('selectedPlanName')) document.getElementById('selectedPlanName').textContent = current.name;
            if (document.getElementById('selectedPlanDesc')) document.getElementById('selectedPlanDesc').textContent = current.desc;
            if (document.getElementById('stepAmount')) document.getElementById('stepAmount').textContent = price;
            if (document.getElementById('instructionAmount')) document.getElementById('instructionAmount').textContent = price;

            const priceEl = document.getElementById('selectedPlanPrice');
            if (priceEl) {
                priceEl.innerHTML = `${price} ₽ <br> <span style="font-size: 1.1rem; color: #e53e3e; display:block; margin-top:5px;">ID: ${orderID}</span>`;
            }

            const tgMsg = encodeURIComponent(`Здравствуйте! Мой ID: ${orderID}. Оплатил ${price} ₽. Прилагаю чек.`);
            document.querySelectorAll('a[href*="t.me/chearu252"]').forEach(link => {
                link.href = `https://t.me/chearu252?text=${tgMsg}`;
            });

            const qrImg = document.getElementById('qrCodeImage');
            if (qrImg) {
                const baseQR = 'https://www.sberbank.ru/ru/choise_bank?requisiteNumber=79108777700&bankCode=100000000111';
                qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(baseQR + '&sum=' + price + '&label=' + orderID)}`;
            }
        }
    }
});
