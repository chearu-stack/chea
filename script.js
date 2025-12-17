/**
 * АДВОКАТ МЕДНОГО ГРОША — Финальный скрипт (Front-end Logic)
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
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                e.preventDefault();
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
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

    animElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
            el.classList.add('animated');
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        } else {
            scrollObserver.observe(el);
        }
    });


    // ===== 4. ГЕНЕРАТОР ИДЕНТИФИКАТОРА (AMG-STYLE) =====
    function generateOrderIdentifier() {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        
        return `AMG${yy}-${mm}${dd}${hh}${min}-A`;
    }


    // ===== 5. ЛОГИКА ГЛАВНОЙ СТРАНИЦЫ (INDEX.HTML) =====
    const tariffButtons = document.querySelectorAll('.pricing-card .btn');
    if (tariffButtons.length > 0) {
        tariffButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                if (!this.hasAttribute('data-no-scroll')) {
                    e.preventDefault(); 
                    
                    const card = this.closest('.pricing-card');
                    // Автоматически определяем план и цену из карточки
                    const plan = card.querySelector('h3').innerText.includes('Базовый') ? 'basic' : 
                                 card.querySelector('h3').innerText.includes('Расширенный') ? 'extended' : 'subscription';
                    const price = card.querySelector('.price-amount').innerText.replace(/\s/g, '');
                    
                    const newID = generateOrderIdentifier();
                    localStorage.setItem('lastOrderID', newID);
                    
                    console.log(`[ЗАГЛУШКА БД]: Создан заказ ${newID}. Переход на оплату...`);
                    window.location.href = `payment.html?plan=${plan}&price=${price}`;
                } else {
                    document.querySelectorAll('.pricing-card').forEach(c => c.classList.remove('active-plan'));
                    this.closest('.pricing-card').classList.add('active-plan');
                }
            });
        });
    }


    // ===== 6. ЛОГИКА СТРАНИЦЫ ОПЛАТЫ (PAYMENT.HTML) =====
    if (window.location.pathname.includes('payment.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const planKey = urlParams.get('plan') || 'extended';
        const price = urlParams.get('price') || '1200';
        const orderID = localStorage.getItem('lastOrderID') || "AMG-TEMP-A";

        // 1. Находим элементы
        const priceDisplay = document.getElementById('selectedPlanPrice');
        const stepAmt = document.getElementById('stepAmount');
        const instrAmt = document.getElementById('instructionAmount');

        // 2. Обновляем простые значения (без дублирования текста)
        if (stepAmt) stepAmt.textContent = price;
        if (instrAmt) instrAmt.textContent = price;

        // 3. Красивый блок ID под ценой (БЕЗ лишних слов "Вы оплачиваете")
        if (priceDisplay) {
            priceDisplay.innerHTML = `${price} ₽`; // Оставляем только саму цену
            
            const idCard = document.createElement('div');
            idCard.style.cssText = `
                margin-top: 20px;
                padding: 15px;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-left: 4px solid #2d3748;
                border-radius: 4px;
                text-align: left;
            `;
            idCard.innerHTML = `
                <span style="font-size: 0.7rem; color: #718096; display: block; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">ID транзакции</span>
                <span style="font-family: 'Courier New', monospace; font-size: 1.5rem; font-weight: bold; color: #1a202c;">${orderID}</span>
            `;
            priceDisplay.after(idCard);
        }

        // 4. Авто-текст для Telegram (t.me/chearu252)
        const tgMsg = encodeURIComponent(`Здравствуйте! Мой ID: ${orderID}. Оплатил ${price} ₽. Прилагаю чек.`);
        document.querySelectorAll('a[href*="t.me/chearu252"]').forEach(link => {
            link.href = `https://t.me/chearu252?text=${tgMsg}`;
        });

        // 5. Обновление QR-кода
        const qrImg = document.getElementById('qrCodeImage');
        if (qrImg) {
            const baseQR = 'https://www.sberbank.ru/ru/choise_bank?requisiteNumber=79108777700&bankCode=100000000111';
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(baseQR + '&sum=' + price + '&label=' + orderID)}`;
        }
    }
