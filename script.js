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
        
        // Порядковый индекс (пока заглушка "A")
        return `AMG${yy}-${mm}${dd}${hh}${min}-A`;
    }


    // ===== 5. ЛОГИКА ГЛАВНОЙ СТРАНИЦЫ (INDEX.HTML) =====
    const tariffButtons = document.querySelectorAll('.pricing-card .btn');
    if (tariffButtons.length > 0) {
        tariffButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                // Если кнопка ведет на оплату (нет data-no-scroll)
                if (!this.hasAttribute('data-no-scroll')) {
                    e.preventDefault(); // Перехватываем для записи ID
                    
                    const plan = this.dataset.plan || 'extended';
                    const price = this.dataset.price || '1200';
                    const newID = generateOrderIdentifier();
                    
                    // Сохраняем "лид" в память (имитация записи в БД)
                    localStorage.setItem('lastOrderID', newID);
                    
                    console.log(`[ЗАГЛУШКА БД]: Создан заказ ${newID}. Переход на оплату...`);
                    
                    // Редирект с параметрами
                    window.location.href = `payment.html?plan=${plan}&price=${price}`;
                } else {
                    // Логика простого выделения карточки (если нужно)
                    document.querySelectorAll('.pricing-card').forEach(c => c.classList.remove('active-plan'));
                    this.closest('.pricing-card').classList.add('active-plan');
                }
            });
        });
    }


    // ===== 6. ЛОГИКА СТРАНИЦЫ ОПЛАТЫ (PAYMENT.HTML) =====
    if (window.location.pathname.includes('payment.html')) {
        const orderID = localStorage.getItem('lastOrderID');
        const priceDisplay = document.getElementById('selectedPlanPrice');
        const instrBlock = document.querySelector('.amount-instruction');
        
        // 1. Вывод ID в блок "Вы оплачиваете" (под цену)
        if (orderID && priceDisplay) {
            const idBlock = document.createElement('div');
            idBlock.style.marginTop = '15px';
            idBlock.style.borderTop = '1px dashed #ccc';
            idBlock.style.paddingTop = '10px';
            idBlock.innerHTML = `
                <span style="font-size: 0.8rem; color: #718096; display: block; letter-spacing: 1px; font-weight: bold;">ВАШ ИДЕНТИФИКАТОР</span>
                <span style="font-family: 'Courier New', monospace; font-size: 1.8rem; font-weight: bold; color: #2d3748; display: block;">${orderID}</span>
            `;
            priceDisplay.after(idBlock);
        }

        // 2. Вывод ID в блок "Внимание" (нижняя инструкция)
        if (orderID && instrBlock) {
            const idNotice = document.createElement('p');
            idNotice.style.color = '#e53e3e';
            idNotice.style.fontWeight = '700';
            idNotice.style.marginTop = '10px';
            idNotice.innerHTML = `<i class="fas fa-exclamation-circle"></i> ОБЯЗАТЕЛЬНО отправьте код <u>${orderID}</u> вместе с чеком в Telegram.`;
            instrBlock.appendChild(idNotice);
        }

        // 3. Обновление QR-кода с учетом ID
        const qrImg = document.getElementById('qrCodeImage');
        if (qrImg && orderID) {
            const currentUrl = new URL(qrImg.src);
            const dataParam = currentUrl.searchParams.get('data');
            if (dataParam) {
                // Добавляем ID в метку платежа для банка
                const updatedData = dataParam + encodeURIComponent(`&label=${orderID}`);
                qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${updatedData}`;
            }
        }
    }

    console.log("Адвокат Медного Гроша: Скрипт инициализирован.");
});
