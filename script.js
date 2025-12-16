// Простые функции для кнопок (заглушки - потом заменишь)
function scrollToPricing() {
    document.querySelector('.pricing').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

function buyAccess() {
    // ЭТУ ФУНКЦИЮ ПОТОМ ПЕРЕДЕЛАЕШЬ для реальной оплаты
    alert('Система оплаты в разработке. Скоро здесь будет подключена ЮKassa/CloudPayments. А пока тебе нужно создать backend для приёма платежей.');
}

// Можно добавить анимацию появления элементов при прокрутке
window.addEventListener('scroll', function() {
    const features = document.querySelectorAll('.feature');
    features.forEach(feature => {
        const position = feature.getBoundingClientRect();
        if(position.top < window.innerHeight - 100) {
            feature.style.opacity = '1';
            feature.style.transform = 'translateY(0)';
        }
    });
});

// Инициализация анимации
document.querySelectorAll('.feature').forEach(f => {
    f.style.opacity = '0';
    f.style.transform = 'translateY(20px)';
    f.style.transition = 'opacity 0.8s, transform 0.8s';
});

// Запуск анимации после загрузки
setTimeout(() => {
    document.querySelectorAll('.feature').forEach(f => {
        const position = f.getBoundingClientRect();
        if(position.top < window.innerHeight - 100) {
            f.style.opacity = '1';
            f.style.transform = 'translateY(0)';
        }
    });
}, 500);
