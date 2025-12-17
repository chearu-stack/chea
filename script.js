// ===== 0. БЛОКИРОВКА АВТОСКРОЛЛА ПРИ ЗАГРУЗКЕ С ЯКОРЕМ =====
(function() {
    // Если в URL есть якорь (например, #start)
    if (window.location.hash) {
        // Немедленно скроллим наверх
        window.scrollTo(0, 0);
        // Убираем якорь из URL без перезагрузки
        history.replaceState(null, null, window.location.pathname + window.location.search);
    }
})();

// ===== 1. ОБРАБОТКА ФОРМЫ (заглушка) =====
document.addEventListener('DOMContentLoaded', function() {
    const problemForm = document.getElementById('problemForm');
    
    if (problemForm) {
        problemForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const textarea = this.querySelector('textarea');
            const problemText = textarea.value.trim();
            
            if (!problemText) {
                alert('Пожалуйста, опишите вашу проблему.');
                return;
            }
            
            const submitButton = this.querySelector('button');
            const originalText = submitButton.innerHTML;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Анализируем ситуацию...';
            submitButton.disabled = true;
            
            setTimeout(() => {
                alert('✅ Ситуация проанализирована! В реальной версии бота вы получите пошаговый план действий с расчётом неустойки.\n\nВаш запрос: "' + problemText.substring(0, 100) + '..."');
                
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
                textarea.value = '';
                
                document.querySelector('#pricing').scrollIntoView({
                    behavior: 'smooth'
                });
            }, 1500);
        });
    }
    
    // ===== 2. ПЛАВНАЯ ПРОКРУТКА ТОЛЬКО ДЛЯ ВНУТРЕННИХ ЯКОРЕЙ =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(event) {
            if (this.hasAttribute('data-no-scroll')) return;
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                event.preventDefault();
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // ===== 3. АНИМАЦИЯ ПОЯВЛЕНИЯ ЭЛЕМЕНТОВ ПРИ ПРОКРУТКЕ =====
    const animateOnScroll = function() {
        const elements = document.querySelectorAll('.feature-card, .step, .pricing-card, .truth-card');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.2;
            
            if (elementPosition < screenPosition && !element.classList.contains('animated')) {
                element.classList.add('animated');
                element.style.opacity = '0';
                element.style.transform = 'translateY(30px)';
                
                setTimeout(() => {
                    element.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }, 100);
            }
        });
    };
    
    window.addEventListener('load', animateOnScroll);
    window.addEventListener('scroll', animateOnScroll);
    
    // ===== 4. ПРОСТОЙ КАЛЬКУЛЯТОР НЕУСТОЙКИ (пример в карточке) =====
    function updateCalculationExample() {
        const amount = 50000;
        const days = 14;
        const percent = 3;
        const penalty = (amount * percent / 100) * days;
        
        const resultElement = document.querySelector('.result');
        if (resultElement) {
            resultElement.textContent = penalty.toLocaleString('ru-RU') + ' руб.';
        }
    }
    
    updateCalculationExample();
    
    // ===== 5. ПОДСВЕТКА ВЫБРАННОГО ТАРИФА =====
    document.querySelectorAll('.pricing-card .btn:not([data-no-scroll])').forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            
            document.querySelectorAll('.pricing-card').forEach(card => {
                card.style.boxShadow = '';
            });
            
            const card = this.closest('.pricing-card');
            card.style.boxShadow = '0 15px 40px rgba(197, 48, 48, 0.3)';
            
            const planName = card.querySelector('h3').textContent;
            alert(`Вы выбрали тариф "${planName}". В реальной версии здесь будет переход к оплате.`);
        });
    });
    
    // ===== 6. ПОДСВЕТКА КАРТОЧЕК ПРИ СКРОЛЛЕ (МОБИЛЬНЫЕ) И ХОВЕРЕ (ДЕСКТОП) =====
    const featureCards = document.querySelectorAll('.feature-card');
    
    // Мобильные: подсветка при скролле
    if (window.innerWidth <= 768) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    featureCards.forEach(card => {
                        card.classList.remove('scroll-active');
                    });
                    entry.target.classList.add('scroll-active');
                }
            });
        }, {
            threshold: 0.6,
            rootMargin: '0px 0px -20% 0px'
        });

        featureCards.forEach(card => {
            observer.observe(card);
        });
    }
    
    // Десктоп: плавность ховера
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transition = 'all 0.4s ease';
        });
    });
});
