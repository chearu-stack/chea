/**
 * АДВОКАТ МЕДНОГО ГРОША — Основной скрипт управления интерфейсом
 */

document.addEventListener('DOMContentLoaded', () => {
    // Инициализация всех систем
    App.init();
});

const App = {
    init() {
        this.setupSmoothScroll();
        this.initScrollAnimations();
        this.initPricingSelection();
        this.updateCalculationExample();
        
        // ЗАПУСК ИНТЕРАКТИВНОГО БЛОКА (Админка)
        this.loadDynamicContent();
    },

    /**
     * Плавная прокрутка к якорям
     */
    setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                if (anchor.hasAttribute('data-no-scroll')) return;
                
                const targetId = anchor.getAttribute('href');
                const target = document.querySelector(targetId);
                
                if (target) {
                    e.preventDefault();
                    const headerOffset = 80;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    },

    /**
     * Анимация появления элементов при скролле
     */
    initScrollAnimations() {
        const observerOptions = {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    observer.unobserve(entry.target); // Анимируем только один раз
                }
            });
        }, observerOptions);

        document.querySelectorAll('.feature-card, .step, .pricing-card, .truth-card, .hero-content')
                .forEach(el => observer.observe(el));
    },

    /**
     * Интерактивный калькулятор в Hero-секции
     */
    updateCalculationExample() {
        const resultElement = document.querySelector('.result');
        if (!resultElement) return;

        const amount = 50000;
        const days = 14;
        const penalty = (amount * 0.03) * days;
        resultElement.textContent = `${penalty.toLocaleString('ru-RU')} руб.`;
    },

    /**
     * Логика выбора тарифов
     */
    initPricingSelection() {
        const pricingButtons = document.querySelectorAll('.pricing-card .btn');
        
        pricingButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Если ссылка ведет на оплату, не блокируем переход, если нет data-no-scroll
                if (!btn.hasAttribute('data-no-scroll')) return;

                e.preventDefault();
                const card = btn.closest('.pricing-card');
                const planName = card.querySelector('h3').textContent;
                
                // Визуальный отклик
                document.querySelectorAll('.pricing-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                console.log(`Выбран план: ${planName}`);
            });
        });
    },

    /**
     * ДИНАМИЧЕСКИЙ БЛОК (Интеграция с админкой)
     * Здесь мы имитируем получение данных о лотереях и акциях
     */
    async loadDynamicContent() {
        const placeholder = document.querySelector('.hero-subtitle'); // Или любой другой блок
        
        // В будущем замени этот URL на свой API (например, Yandex Cloud Function или свой сервер)
        // const API_URL = 'https://your-api.com/get-promos';
        
        try {
            // Имитация задержки сети
            // const response = await fetch(API_URL);
            // const data = await response.json();

            const mockData = {
                type: 'promo', // 'lottery', 'announcement', 'promo'
                text: '🔥 Акция: Пакет «Расширенный» на 20% дешевле до конца недели!',
                link: '#pricing'
            };

            this.renderAnnouncement(mockData);
        } catch (err) {
            console.error('Ошибка загрузки объявлений:', err);
        }
    },

    renderAnnouncement(data) {
        const heroSection = document.querySelector('.hero-content');
        if (!heroSection) return;

        const promoEl = document.createElement('div');
        promoEl.className = `dynamic-announcement ${data.type}`;
        promoEl.innerHTML = `
            <div class="announcement-badge">NEW</div>
            <span>${data.text}</span>
            ${data.link ? `<a href="${data.link}">Узнать больше</a>` : ''}
        `;
        
        // Вставляем перед кнопками в Hero
        const buttons = heroSection.querySelector('.hero-buttons');
        heroSection.insertBefore(promoEl, buttons);
    }
};
