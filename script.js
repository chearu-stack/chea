// ===== 1. ОБРАБОТКА ФОРМЫ (заглушка) =====
document.addEventListener('DOMContentLoaded', function() {
    const problemForm = document.getElementById('problemForm');
    
    if (problemForm) {
        problemForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Останавливаем реальную отправку
            
            const textarea = this.querySelector('textarea');
            const problemText = textarea.value.trim();
            
            if (!problemText) {
                alert('Пожалуйста, опишите вашу проблему.');
                return;
            }
            
            // Меняем кнопку на "обработка"
            const submitButton = this.querySelector('button');
            const originalText = submitButton.innerHTML;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Анализируем ситуацию...';
            submitButton.disabled = true;
            
            // Имитация отправки на сервер (заглушка)
            setTimeout(() => {
                // В реальности здесь будет fetch запрос к backend
                alert('✅ Ситуация проанализирована! В реальной версии бота вы получите пошаговый план действий с расчётом неустойки.\n\nВаш запрос: "' + problemText.substring(0, 100) + '..."');
                
                // Восстанавливаем кнопку
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
                
                // Очищаем поле
                textarea.value = '';
                
                // Прокручиваем к тарифам (как будто следующий шаг)
                document.querySelector('#pricing').scrollIntoView({
                    behavior: 'smooth'
                });
                
            }, 1500); // Имитируем задержку обработки
        });
    }
    
    // ===== 2. ПЛАВНАЯ ПРОКРУТКА ТОЛЬКО ДЛЯ ВНУТРЕННИХ ЯКОРЕЙ =====
    // НЕ перехватываем ссылки с data-no-scroll или ведущие на другие страницы
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(event) {
            // Если у ссылки есть data-no-scroll - пропускаем
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
                
                // Анимация появления
                setTimeout(() => {
                    element.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }, 100);
            }
        });
    };
    
    // Запускаем при загрузке и при прокрутке
    window.addEventListener('load', animateOnScroll);
    window.addEventListener('scroll', animateOnScroll);
    
    // ===== 4. ПРОСТОЙ КАЛЬКУЛЯТОР НЕУСТОЙКИ (пример в карточке) =====
    function updateCalculationExample() {
        const amount = 50000; // Сумма договора
        const days = 14;      // Дни просрочки
        const percent = 3;    // 3% за каждый день просрочки
        
        const penalty = (amount * percent / 100) * days;
        
        const resultElement = document.querySelector('.result');
        if (resultElement) {
            resultElement.textContent = penalty.toLocaleString('ru-RU') + ' руб.';
        }
    }
    
    // Запускаем пример расчёта
    updateCalculationExample();
    
    // ===== 5. ПОДСВЕТКА ВЫБРАННОГО ТАРИФА (только для кнопок без data-no-scroll) =====
    document.querySelectorAll('.pricing-card .btn:not([data-no-scroll])').forEach(button => {
        button.addEventListener('click', function(event) {
            event.preventDefault();
            
            // Снимаем выделение со всех карточек
            document.querySelectorAll('.pricing-card').forEach(card => {
                card.style.boxShadow = '';
            });
            
            // Подсвечиваем выбранную карточку
            const card = this.closest('.pricing-card');
            card.style.boxShadow = '0 15px 40px rgba(197, 48, 48, 0.3)';
            
            // Показываем сообщение
            const planName = card.querySelector('h3').textContent;
            alert(`Вы выбрали тариф "${planName}". В реальной версии здесь будет переход к оплате.`);
        });
    });
});
