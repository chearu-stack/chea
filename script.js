/**
 * АДВОКАТ МЕДНОГО ГРОША — script.js
 */

document.addEventListener('DOMContentLoaded', () => {

    // 1. АДМИНКА
    const syncWithAdmin = () => {
        const heroCard = document.querySelector('.hero-card');
        if (heroCard && false) console.log("Админка готова.");
    };
    syncWithAdmin();

    // 2. ПЛАВНАЯ ПРОКРУТКА
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

    // 3. АНИМАЦИЯ
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

    // 4. ГЕНЕРАТОР (A, B, C...)
    function generateOrderIdentifier() {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        
        let lastLetter = localStorage.getItem('lastUsedLetter') || 'Z'; 
        let nextCharCode = lastLetter.charCodeAt(0) + 1;
        if (nextCharCode > 90) nextCharCode = 65; 
        
        const nextLetter = String.fromCharCode(nextCharCode);
        localStorage.setItem('lastUsedLetter', nextLetter);
        
        return `AMG${yy}-${mm}${dd}${hh}${min}-${nextLetter}`;
    }

    // 5. ГЛАВНАЯ (INDEX.HTML)
    const tariffButtons = document.querySelectorAll('.pricing-card .btn');
    tariffButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (!this.hasAttribute('data-no-scroll')) {
                e.preventDefault(); 
                const card = this.closest('.pricing-card');
                const plan = card.querySelector('h3').innerText.includes('Базовый') ? 'basic' : 
                             card.querySelector('h3').innerText.includes('Расширенный') ? 'extended' : 'subscription';
                const price = card.querySelector('.price-amount').innerText.replace(/\s/g, '');
                
                const newID = generateOrderIdentifier();
                localStorage.setItem('lastOrderID', newID);
                
                window.location.href = `payment.html?plan=${plan}&price=${price}`;
            }
        });
    });

    // 6. СТРАНИЦА ОПЛАТЫ (PAYMENT.HTML)
    if (window.location.pathname.includes('payment.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const planKey = urlParams.get('plan') || 'extended';
        const price = urlParams.get('price') || '1200';
        
        let orderID = localStorage.getItem('lastOrderID');
        if (!orderID) {
            orderID = generateOrderIdentifier();
            localStorage.setItem('lastOrderID', orderID);
        }

        const planDetails = {
            'basic': { name: 'Базовый пакет помощи', desc: 'Анализ ситуации + пошаговый план + 1 шаблон документа' },
            'extended': { name: 'Расширенный пакет помощи', desc: 'Расчёт неустойки + 3 шаблона документов + жалоба' },
            'subscription': { name: 'Подписка на месяц', desc: 'Неограниченные консультации + все шаблоны' }
        };

        const currentPlan = planDetails[planKey] || planDetails['extended'];

        if (document.getElementById('selectedPlanName')) document.getElementById('selectedPlanName').textContent = currentPlan.name;
        if (document.getElementById('selectedPlanDesc')) document.getElementById('selectedPlanDesc').textContent = currentPlan.desc;
        if (document.getElementById('stepAmount')) document.getElementById('stepAmount').textContent = price;
        if (document.getElementById('instructionAmount')) document.getElementById('instructionAmount').textContent = price;

        const priceDisplay = document.getElementById('selectedPlanPrice');
        if (priceDisplay) {
            priceDisplay.innerHTML = `${price} ₽`; 
            const idBox = document.createElement('div');
            idBox.style.cssText = "margin-top: 20px; padding: 12px; background: #f8fafc; border-left: 4px solid #1a202c; border-radius: 4px; text-align: left;";
            idBox.innerHTML = `
                <span style="font-size: 0.7rem; color: #64748b; display: block; font-weight: 800; text-transform: uppercase;">ID ТРАНЗАКЦИИ</span>
                <span style="font-family: monospace; font-size: 1.5rem; font-weight: bold; color: #1e293b;">${orderID}</span>
            `;
            priceDisplay.after(idBox);
        }

        // --- ТЕЛЕГРАМ: РАЗДЕЛЯЕМ ЛОГИКУ ---

        // 1. Кнопки «Я оплатил» (в блоке кнопок действий)
        const paymentMsg = encodeURIComponent(`Здравствуйте! Мой ID: ${orderID}. Оплатил ${price} ₽. Прилагаю чек.`);
        document.querySelectorAll('.payment-actions a[href*="t.me/chearu252"]').forEach(link => {
            link.href = `https://t.me/chearu252?text=${paymentMsg}`;
        });

        // 2. Блок «Если QR не срабатывает» (техподдержка)
        const supportMsg = encodeURIComponent(`Здравствуйте! У меня возникла проблема с QR-кодом (ID: ${orderID}). Пришлите, пожалуйста, реквизиты для оплаты.`);
        document.querySelectorAll('.qr-fallback a[href*="t.me/chearu252"]').forEach(link => {
            link.href = `https://t.me/chearu252?text=${supportMsg}`;
        });

        // QR
        const qrImg = document.getElementById('qrCodeImage');
        if (qrImg) {
            const baseQR = 'https://www.sberbank.ru/ru/choise_bank?requisiteNumber=79108777700&bankCode=100000000111';
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(baseQR + '&sum=' + price + '&label=' + orderID)}`;
        }
    }
});
