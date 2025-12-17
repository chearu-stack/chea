/**
 * АДВОКАТ МЕДНОГО ГРОША — Чистый скрипт интерфейса
 */

document.addEventListener('DOMContentLoaded', () => {

    // ===== 1. ЗАГЛУШКА ДЛЯ АДМИНКИ (БУДУЩЕЕ ВНЕДРЕНИЕ) =====
    // По умолчанию функция ничего не меняет, пока ты не пропишешь логику в syncWithAdmin()
    const syncWithAdmin = () => {
        const heroCard = document.querySelector('.hero-card');
        if (!heroCard) return;

        // Здесь в будущем будет fetch() из твоей админки
        const isExternalContentReady = false; // Переключишь на true, когда админка будет готова

        if (isExternalContentReady) {
            // Только здесь сработает замена контента
            console.log("Система: обнаружен контент из админки. Начинаю внедрение...");
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


    // ===== 3. АНИМАЦИЯ ПОЯВЛЕНИЯ ЭЛЕМЕНТОВ =====
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target); // Один раз анимируем и забываем
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.feature-card, .step, .pricing-card, .truth-card')
            .forEach(el => scrollObserver.observe(el));


    // ===== 4. ПРИМЕР РАСЧЕТА (ОСТАЕТСЯ СТАТИЧНЫМ) =====
    const updateStaticCalc = () => {
        const result = document.querySelector('.result');
        // Если в HTML что-то поменяется, скрипт просто подстрахует формат вывода
        if (result && result.textContent === '21 000 руб.') {
            // Оставляем как есть, расчет уже вшит в HTML
        }
    };
    updateStaticCalc();


    // ===== 5. ТАРИФЫ (ОБРАБОТКА КЛИКОВ) =====
    document.querySelectorAll('.pricing-card .btn').forEach(button => {
        button.addEventListener('click', function(e) {
            // Если кнопка без перехода (data-no-scroll), просто логируем выбор
            if (this.hasAttribute('data-no-scroll')) {
                e.preventDefault();
                const plan = this.closest('.pricing-card').querySelector('h3').textContent;
                console.log(`Выбран тариф: ${plan}`);
            }
        });
    });

});
