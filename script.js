/**
 * АДВОКАТ МЕДНОГО ГРОША — script.js
 * ВЕРСИЯ С ПОЛНЫМ ИСПРАВЛЕНИЕМ ДАТ И ТАРИФОВ
 */

document.addEventListener('DOMContentLoaded', () => {

    // ===== 1. ЗАГЛУШКА ДЛЯ АДМИНКИ =====
    const syncWithAdmin = () => {
        const heroCard = document.querySelector('.hero-card');
        if (!heroCard) return;
        console.log("Система готова к работе.");
    };
    syncWithAdmin();

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

    // ===== 3. АНИМАЦИЯ =====
    const animElements = document.querySelectorAll('.feature-card, .step, .pricing-card, .truth-card, .hero-content');
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                scrollObserver.unobserve(entry.target); 
            }
        });
    }, { threshold: 0.1 });
    animElements.forEach(el => scrollObserver.observe(el));

    // ===== 4. ГЕНЕРАТОР "УМНОГО" ID (AMG25-ММДДЧЧММ-БукваТарифаБукваДня) =====
    function generateOrderIdentifier(planKey) {
        const now = new Date();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        
        // 1. Буква Тарифа: E - Basic, S - Extended (Pro), V - Subscription (Premium)
        const planLetters = { 'basic': 'E', 'extended': 'S', 'subscription': 'V' };
        const planLetter = planLetters[planKey] || 'X';

        // 2. Логика сброса буквы дня (A, B, C...)
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

    // ===== 5. ОТПРАВКА КОДА В БАЗУ (RENDER API) =====
    async function sendCodeToBackend(orderID, planKey) {
        try {
            const planMap = {
                'basic': 'basic',
                'extended': 'pro',
                'subscription': 'premium'
            };
            const backendPlan = planMap[planKey] || 'basic';
            const capsLimits = { 'basic': 30000, 'pro': 100000, 'premium': 300000 };
            const limit = capsLimits[backendPlan];

            console.log('📡 Регистрация в базе:', { orderID, backendPlan });

            const response = await fetch('https://chea.onrender.com/generate-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: orderID,
                    package: backendPlan,
                    caps_limit: limit
                })
            });

            const result = await response.json();
            return result.success ? result.code : orderID;
        } catch (error) {
            console.error('❌ Ошибка сети:', error);
            return orderID;
        }
    }

    // ===== 6. ЛОГИКА ГЛАВНОЙ СТРАНИЦЫ (ИСПРАВЛЕНО: ТАРИФЫ И БУКВЫ) =====
    const tariffButtons = document.querySelectorAll('.pricing-card .btn');
    tariffButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (!this.hasAttribute('data-no-scroll')) {
                e.preventDefault(); 
                const card = this.closest('.pricing-card');
                const planName = card.querySelector('h3').innerText;
                
                const plan = planName.includes('Базовый') ? 'basic' : 
                             planName.includes('Расширенный') ? 'extended' : 'subscription';
                
                const price = card.querySelector('.price-amount').innerText.replace(/\s/g, '');
                
                // Генерируем новый ID сразу с правильной буквой тарифа
                const newID = generateOrderIdentifier(plan); 
                localStorage.setItem('lastOrderID', newID);
                
                window.location.href = `payment.html?plan=${plan}&price=${price}`;
            }
        });
    });

    // ===== 7. ЛОГИКА СТРАНИЦЫ ОПЛАТЫ (ИСПРАВЛЕНО: ПРОВЕРКА ДАТЫ) =====
    if (window.location.pathname.includes('payment.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const planKey = urlParams.get('plan') || 'extended';
        const price = urlParams.get('price') || '1200';
        
        // Текущая дата для проверки (ММДД)
        const now = new Date();
        const todayStr = String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
        
        let orderID = localStorage.getItem('lastOrderID');

        // ЕСЛИ КОД СТАРЫЙ (не содержит сегодняшнюю дату ММДД), создаем новый
        if (!orderID || !orderID.includes(todayStr)) {
            orderID = generateOrderIdentifier(planKey);
            localStorage.setItem('lastOrderID', orderID);
        }

        (async () => {
            const finalCode = await sendCodeToBackend(orderID, planKey);
            orderID = finalCode; 
            localStorage.setItem('lastOrderID', finalCode);
            updatePageContent(finalCode, planKey, price);
        })();

        function updatePageContent(orderID, planKey, price) {
            const planDetails = {
                'basic': { name: 'Базовый пакет помощи', desc: 'Анализ ситуации + 1 шаблон документа' },
                'extended': { name: 'Расширенный пакет помощи', desc: 'Расчёт неустойки + 3 шаблона + жалоба' },
                'subscription': { name: 'Пакет «Всё включено»', desc: 'Стратегия «ломаем отписки» + все шаблоны' }
            };

            const currentPlan = planDetails[planKey] || planDetails['extended'];

            if (document.getElementById('selectedPlanName')) document.getElementById('selectedPlanName').textContent = currentPlan.name;
            if (document.getElementById('selectedPlanDesc')) document.getElementById('selectedPlanDesc').textContent = currentPlan.desc;
            if (document.getElementById('stepAmount')) document.getElementById('stepAmount').textContent = price;
            if (document.getElementById('instructionAmount')) document.getElementById('instructionAmount').textContent = price;

            const priceEl = document.getElementById('selectedPlanPrice');
            if (priceEl) {
                priceEl.innerHTML = `${price} ₽ <br> <span style="font-size: 1.2rem; color: #e53e3e; display:block; margin-top:5px;">ID: ${orderID}</span>`;
            }

            const amountInstr = document.querySelector('.amount-instruction');
            if (amountInstr) {
                const idText = document.createElement('p');
                idText.innerHTML = `<i class="fas fa-id-card"></i> <strong>ОБЯЗАТЕЛЬНО</strong> отправьте ваш ID <strong>${orderID}</strong> в Telegram с чеком.`;
                idText.style.color = "#c53030";
                idText.style.marginTop = "10px";
                amountInstr.appendChild(idText);
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
