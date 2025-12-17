/**
 * АДВОКАТ МЕДНОГО ГРОША — Финальный скрипт
 */

document.addEventListener('DOMContentLoaded', () => {

    // ===== 1. ЗАГЛУШКА ДЛЯ АДМИНКИ (БУДУЩЕЕ ВНЕДРЕНИЕ) =====
    const syncWithAdmin = () => {
        const heroCard = document.querySelector('.hero-card');
        if (!heroCard) return;

        // Место для будущего fetch()
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


    // ===== 3. АНИМАЦИЯ ПОЯВЛЕНИЯ (ФИКС ВИДИМОСТИ) =====
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // Если элемент пересекает экран хотя бы на 5%
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                scrollObserver.unobserve(entry.target); 
            }
        });
    }, { 
        threshold: 0.05, // Срабатывает почти сразу при появлении края
        rootMargin: '0px 0px -50px 0px' 
    });

    // Находим все элементы, которые в CSS помечены как скрытые (opacity: 0)
    const animElements = document.querySelectorAll('.feature-card, .step, .pricing-card, .truth-card, .hero-content');
    
    animElements.forEach(el => {
        scrollObserver.observe(el);
        
        // СТРАХОВКА: если пользователь уже проскроллил до середины при загрузке
        if (el.getBoundingClientRect().top < window.innerHeight) {
            el.classList.add('animated');
        }
    });


    // ===== 4. ПРИМЕР РАСЧЕТА (СТАТИКА) =====
    // Здесь ничего не меняем, расчет берется из HTML. 
    // Скрипт просто подтверждает наличие блока.
    console.log("Система: расчет компенсации активен.");


    // ===== 5. ТАРИФЫ (ОБРАБОТКА КЛИКОВ) =====
    document.querySelectorAll('.pricing-card .btn').forEach(button => {
        button.addEventListener('click', function(e) {
            // Если у кнопки НЕТ атрибута 'data-no-scroll', мы ВООБЩЕ ничего не делаем.
            // Браузер просто перейдет по ссылке (на оплату), как и должен.
            if (!this.hasAttribute('data-no-scroll')) return;

            // Только если атрибут ЕСТЬ, мы блокируем переход (для красоты выбора)
            e.preventDefault();
            
            // Убираем активный класс у всех и даем этой карточке
            document.querySelectorAll('.pricing-card').forEach(c => c.classList.remove('active-plan'));
            this.closest('.pricing-card').classList.add('active-plan');
            
            console.log("Выбран тариф для внутреннего взаимодействия");
        });
    });
