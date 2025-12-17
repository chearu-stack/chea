/**
 * АДВОКАТ МЕДНОГО ГРОША — script.js
 */

document.addEventListener('DOMContentLoaded', () => {

    // ===== 1. ЗАГЛУШКА ДЛЯ АДМИНКИ (БУДУЩЕЕ ВНЕДРЕНИЕ) =====
    const syncWithAdmin = () => {
        const heroCard = document.querySelector('.hero-card');
        if (!heroCard) return;

        const isExternalContentReady = false; 
        if (isExternalContentReady) {
            console.log("Админка готова к внедрению.");
        }
    };
    syncWithAdmin();

    // ===== 2. ПЛАВНАЯ ПРОКРУТКА (ЯКОРЯ) =====
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

    // ===== 3. АНИМАЦИЯ ПОЯВЛЕНИЯ =====
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

    // ===== 4. ГЕНЕРАТОР EXCEL-ID (A, B, C...) =====
    function generateOrderIdentifier() {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        
        let lastLetter = localStorage.getItem('lastUsedLetter') || 'Z'; 
        let nextCharCode = lastLetter.charCodeAt(0) + 1;
        if (nextCharCode > 90) nextCharCode = 65; // После Z -> A
        
        const nextLetter = String.fromCharCode(nextCharCode);
        localStorage.setItem('lastUsedLetter', nextLetter);
        
        return `AMG${yy}-${mm}${dd}${hh}${min}-${nextLetter}`;
    }

    // ===== 5. ЛОГИКА ГЛАВНОЙ СТРАНИЦЫ =====
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
                
                const newID = generateOrderIdentifier();
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
        
        let orderID = localStorage.getItem('lastOrderID');
        if (!orderID) {
            orderID = generateOrderIdentifier();
            localStorage.setItem('lastOrderID', orderID);
        }

        const planDetails = {
            'basic': { name: 'Базовый пакет помощи', desc: 'Анализ ситуации + пошаговый план + 1 шаблон документа (претензия)' },
            'extended': { name: 'Расширенный пакет помощи', desc: 'Расчёт неустойки + 3 шаблона документов + жалоба в Роспотребнадзор' },
            'subscription': { name: 'Подписка на месяц', desc: 'Неограниченное число консультаций + все шаблоны + приоритетная поддержка' }
        };

        const currentPlan = planDetails[planKey] || planDetails['extended'];

        // Заполняем ID в существующие элементы твоего HTML
        if (document.getElementById('selectedPlanName')) document.getElementById('selectedPlanName').textContent = currentPlan.name;
        if (document.getElementById('selectedPlanDesc')) document.getElementById('selectedPlanDesc').textContent = currentPlan.desc;
        if (document.getElementById('stepAmount')) document.getElementById('stepAmount').textContent = price;
        if (document.getElementById('instructionAmount')) document.getElementById('instructionAmount').textContent = price;

        // Вписываем ID в цену (чтобы не дублировать "Вы оплачиваете")
        const priceEl = document.getElementById('selectedPlanPrice');
        if (priceEl) {
            priceEl.innerHTML = `${price} ₽ <br> <span style="font-size: 1.2rem; color: #e53e3e; display:block; margin-top:5px;">ID: ${orderID}</span>`;
        }

        // ВСТАВЛЯЕМ ID В БЛОК ВНИМАНИЕ (сразу после Личного перевода)
        const amountInstr = document.querySelector('.amount-instruction');
        if (amountInstr) {
            const idText = document.createElement('p');
            idText.innerHTML = `<i class="fas fa-id-card"></i> <strong>ОБЯЗАТЕЛЬНО</strong> отправьте ваш идентификатор <strong>${orderID}</strong> в Telegram вместе с чеком.`;
            idText.style.color = "#c53030";
            idText.style.marginTop = "10px";
            amountInstr.appendChild(idText);
        }

        // НАСТРОЙКА ТЕЛЕГРАМ (Авто-сообщение)
        const tgMsg = encodeURIComponent(`Здравствуйте! Мой ID: ${orderID}. Оплатил ${price} ₽. Прилагаю чек.`);
        document.querySelectorAll('a[href*="t.me/chearu252"]').forEach(link => {
            link.href = `https://t.me/chearu252?text=${tgMsg}`;
        });

        // ОБНОВЛЕНИЕ QR-КОДА
        const qrImg = document.getElementById('qrCodeImage');
        if (qrImg) {
            const baseQR = 'https://www.sberbank.ru/ru/choise_bank?requisiteNumber=79108777700&bankCode=100000000111';
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(baseQR + '&sum=' + price + '&label=' + orderID)}`;
        }
    }
});
