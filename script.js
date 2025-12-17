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


    // ===== 3. АНИМАЦИЯ ПОЯВЛЕНИЯ (ПРИНУДИТЕЛЬНЫЙ ПОКАЗ) =====
    const animElements = document.querySelectorAll('.feature-card, .step, .pricing-card, .truth-card, .hero-content');
    
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                // Дополнительная страховка: убираем инлайновое скрытие
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                scrollObserver.unobserve(entry.target); 
            }
        });
    }, { threshold: 0.01 });

    animElements.forEach(el => {
        // ПРИНУДИТЕЛЬНО: Если элемент уже на экране или близко — показываем сразу
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
            el.classList.add('animated');
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        } else {
            scrollObserver.observe(el);
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
