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

   // Функция генерации ID (наш стандарт)
function generateOrderIdentifier() {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    
    // Пока заглушка индекса - "A"
    return `AMG${yy}-${mm}${dd}${hh}${min}-A`;
}

// 1. ЛОГИКА ДЛЯ ГЛАВНОЙ (index.html)
const tariffButtons = document.querySelectorAll('.pricing-card .btn'); // проверь свой селектор
tariffButtons.forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault(); // Стопим обычный переход
        
        const card = this.closest('.pricing-card');
        const plan = this.dataset.plan; // берем из data-plan="basic"
        const price = this.dataset.price;
        
        const newID = generateOrderIdentifier();
        
        // СОХРАНЯЕМ В ПАМЯТЬ (имитация записи в БД)
        localStorage.setItem('lastOrderID', newID);
        localStorage.setItem('selectedPrice', price);
        localStorage.setItem('selectedPlan', plan);
        
        console.log(`[ЗАГЛУШКА БД]: Сгенерирован ID ${newID}. Готов к отправке в Supabase.`);
        
        // Переходим на оплату
        window.location.href = `payment.html?plan=${plan}&price=${price}`;
    });
});

// 2. ЛОГИКА ДЛЯ ОПЛАТЫ (payment.html)
if (window.location.pathname.includes('payment.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        const orderID = localStorage.getItem('lastOrderID');
        const displayElement = document.getElementById('selectedPlanPrice');
        
        if (orderID && displayElement) {
            // Вставляем ID в верстку (как на твоем скрине)
            // Мы не меняем структуру, просто инжектим данные в нужные места
            const idBlock = document.createElement('div');
            idBlock.className = 'id-display-block';
            idBlock.innerHTML = `
                <div style="font-size: 1.2rem; color: #4a5568; margin-top:15px;">ВАШ ИДЕНТИФИКАТОР</div>
                <div style="font-size: 2.2rem; font-weight: bold; color: #2d3748;">${orderID}</div>
                <div style="font-size: 0.8rem; color: #e53e3e; margin-top:5px;">ВСТАВЬТЕ ВАШ ИДЕНТИФИКАТОР ПРИ ОТПРАВКЕ ЧЕКА</div>
            `;
            displayElement.after(idBlock);
        }
    });
}                       
