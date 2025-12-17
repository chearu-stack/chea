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
        const orderID = localStorage.getItem('lastOrderID') || generateOrderIdentifier();

        const planDetails = {
            'basic': { name: 'Базовый пакет помощи', desc: 'Анализ ситуации + пошаговый план + 1 шаблон документа (претензия)' },
            'extended': { name: 'Расширенный пакет помощи', desc: 'Расчёт неустойки + 3 шаблона документов + жалоба в Роспотребнадзор' },
            'subscription': { name: 'Подписка на месяц', desc: 'Неограниченное число консультаций + все шаблоны + приоритетная поддержка' }
        };

        const currentPlan = planDetails[planKey] || planDetails['extended'];

        // Обновляем текстовые блоки (которые раньше обновлял скрипт в HTML)
        const nameEl = document.getElementById('selectedPlanName');
        const descEl = document.getElementById('selectedPlanDesc');
        const priceDisplay = document.getElementById('selectedPlanPrice');
        const stepAmt = document.getElementById('stepAmount');
        const instrAmt = document.getElementById('instructionAmount');

        if (nameEl) nameEl.textContent = currentPlan.name;
        if (descEl) descEl.textContent = currentPlan.desc;
        if (stepAmt) stepAmt.textContent = price;
        if (instrAmt) instrAmt.textContent = price;

        // Вставка ID (Тот самый блок со скрина)
        if (priceDisplay) {
            priceDisplay.innerHTML = `${price} ₽`; // Ставим цену
            const idBlock = document.createElement('div');
            idBlock.style.marginTop = '15px';
            idBlock.style.borderTop = '1px dashed #ccc';
            idBlock.style.paddingTop = '10px';
            idBlock.innerHTML = `
                <span style="font-size: 0.85rem; color: #718096; display: block; letter-spacing: 1px; font-weight: bold;">ВАШ ИДЕНТИФИКАТОР</span>
                <span style="font-family: 'Courier New', monospace; font-size: 1.8rem; font-weight: bold; color: #2d3748; display: block;">${orderID}</span>
            `;
            priceDisplay.after(idBlock);
        }

        // Вывод ID в блок "Внимание"
        const instrBlock = document.querySelector('.amount-instruction');
        if (orderID && instrBlock) {
            const idNotice = document.createElement('p');
            idNotice.style.cssText = "color:#e53e3e; font-weight:700; margin-top:10px; background:#fff5f5; padding:8px; border-left:4px solid #e53e3e;";
            idNotice.innerHTML = `<i class="fas fa-exclamation-circle"></i> ОБЯЗАТЕЛЬНО отправьте код <u>${orderID}</u> в Telegram.`;
            instrBlock.appendChild(idNotice);
        }

        // Обновление QR-кода
        const qrImg = document.getElementById('qrCodeImage');
        if (qrImg) {
            const baseQRUrl = 'https://www.sberbank.ru/ru/choise_bank?requisiteNumber=79108777700&bankCode=100000000111';
            const finalQRData = `${baseQRUrl}&sum=${price}&label=${orderID}`;
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(finalQRData)}`;
        }
    }

    console.log("Адвокат Медного Гроша: Скрипт полностью инициализирован.");
});
