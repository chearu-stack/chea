/**
 * АДВОКАТ МЕДНОГО ГРОША — script.js
 * ВЕРСИЯ: FERRARI EDITION (С блокировкой и отпечатком)
 * ТОЛЬКО бизнес-логика — управление тарифами, платежами и статусами
 * ВСЁ про скролл удалено — управление скроллом только в preview-widget.js
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Система АМГ: Ferrari Mode активирована.");

    // --- 0. СТИЛИ ДЛЯ МЕРЦАНИЯ И КНОПОК ---
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
        .blink-status { animation: blink 2s infinite ease-in-out; color: #e67e22; font-weight: bold; display: block; margin: 10px 0; font-family: 'Open Sans', sans-serif; }
        .btn-cabinet { background: #27ae60; color: white; padding: 15px; border-radius: 5px; text-decoration: none; display: block; text-align: center; font-weight: bold; margin-top: 15px; transition: 0.3s; }
        .btn-cabinet:hover { background: #2ecc71; }
        .btn-tg-lock { background: #0088cc; color: white; padding: 12px; border-radius: 5px; text-decoration: none; display: block; text-align: center; font-weight: bold; margin-top: 10px; }
    `;
    document.head.appendChild(style);

    // --- 1. ГЕНЕРАЦИЯ ID И ОТПЕЧАТКА ---
    const getFP = () => {
        const s = window.screen;
        const b = navigator.userAgent;
        return btoa(`${s.width}${s.height}${b}${s.colorDepth}`).substring(0, 12);
    };
    const userFP = getFP();

    function generateOrderIdentifier(planKey) {
        const now = new Date();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const planLetters = { 'basic': 'E', 'extended': 'S', 'subscription': 'V' };
        const planLetter = planLetters[planKey] || 'X';
        return `AMG25-${mm}${dd}${hh}${min}-${planLetter}${userFP.substring(0,2).toUpperCase()}`;
    }

    const planDetails = {
        'basic': { name: 'Базовый', price: '500 ₽', desc: 'Диагноз, план и 1 претензия. 7 вопросов боту.' },
        'extended': { name: 'Расширенный', price: '1 200 ₽', desc: 'Всё из Базового + расчёт неустойки и 3 документа. 20 вопросов.' },
        'subscription': { name: 'Профессиональный', price: '2 500 ₽', desc: 'Борьба с отписками, стратегия и сложные расчёты. 50 вопросов.' }
    };

    // --- 2. ЛОГИКА ПОДМЕНЫ КАРТОЧКИ (ГЛАВНАЯ) ---
    function renderWaitingCard(planKey) {
        const plan = planDetails[planKey] || planDetails['extended'];
        const header = document.querySelector('.card-header'); // Твой блок "Пример расчета"
        const body = document.querySelector('.card-body');
        const orderID = localStorage.getItem('lastOrderID') || "ID ГЕНЕРИРУЕТСЯ...";

        if(header && body) {
            header.id = "hero-card-header";
            body.id = "hero-card-body";
            header.innerHTML = `<i class="fas fa-clock"></i> Ваш выбор: ${plan.name} — ${plan.price}`;
            body.innerHTML = `
                <p style="font-size: 0.9rem; font-weight: bold;">Статус: <span class="blink-status">ОЖИДАНИЕ ПОДТВЕРЖДЕНИЯ</span></p>
                <div style="text-align: left; font-size: 0.85rem; background: #fdf2e9; padding: 10px; border-radius: 5px; border-left: 4px solid #e67e22;">
                    ${plan.desc}
                </div>
                <p style="font-size: 0.8rem; margin-top: 10px;">Бот забронирован. Отправьте ID и чек в Telegram:</p>
                <a href="https://t.me/chearu252?text=${encodeURIComponent('Мой ID: ' + orderID + '. Прикрепите чек к сообщению!')}" target="_blank" class="btn-tg-lock">
                    <i class="fab fa-telegram-plane"></i> ПОДТВЕРДИТЬ В TELEGRAM
                </a>
                <p style="font-size: 0.7rem; color: #999; margin-top: 8px;">ID для справки: ${orderID}</p>
            `;
        }
    }

    async function checkActivation() {
        try {
            const response = await fetch(`https://chea.onrender.com/check-status?fp=${userFP}`);
            const data = await response.json();
            if (data.active) {
                const header = document.getElementById('hero-card-header');
                const body = document.getElementById('hero-card-body');
                if(header && body) {
                    header.innerHTML = `<i class="fas fa-check-circle"></i> Статус: АКТИВИРОВАН`;
                    body.innerHTML = `
                        <p><strong>Ваш пакет полностью готов.</strong> Все инструменты цифрового адвоката разблокированы.</p>
                        <a href="chat.html?fp=${userFP}" class="btn-cabinet">ВХОД В ЛИЧНЫЙ КАБИНЕТ</a>
                    `;
                }
            }
        } catch (e) { console.log("Проверка..."); }
    }

    // --- 3. ОБРАБОТКА ТАРИФОВ (ИСПРАВЛЕНО: ТЕПЕРЬ РЕГИСТРИРУЕМ В БАЗЕ) ---
    const tariffButtons = document.querySelectorAll('.pricing-card .btn');
    tariffButtons.forEach(button => {
        button.addEventListener('click', async function(e) {
            const card = this.closest('.pricing-card');
            const planKey = this.getAttribute('data-plan');
            const priceText = card.querySelector('.price').textContent.replace(/\s/g, '');
            const priceInt = parseInt(priceText);
            
            // 1. Генерируем данные локально
            const newID = generateOrderIdentifier(planKey);
            localStorage.setItem('lastOrderID', newID);
            localStorage.setItem('selectedPlan', planKey);
            localStorage.setItem('lockTime', Date.now());

            // 2. СРАЗУ отправляем "отпечаток" и заказ на сервер
            try {
                const capsLimits = { 'basic': 30000, 'extended': 60000, 'subscription': 90000 };
                
                // Это заставит сервер создать строку в Supabase
                fetch('https://chea.onrender.com/generate-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        code: newID,
                        package: planKey,
                        caps_limit: capsLimits[planKey] || 30000,
                        fingerprint: userFP // Тот самый отпечаток!
                    })
                });
                
                console.log("✅ Заказ предварительно зарегистрирован в БД");
            } catch (err) {
                console.error("❌ Ошибка связи с сервером:", err);
            }

            // Переход на payment.html не прерываем, всё идет штатно
        });
    });
    // --- 4. ПРОВЕРКА СОСТОЯНИЯ ПРИ ЗАГРУЗКЕ ---
    const savedPlan = localStorage.getItem('selectedPlan');
    const lockTime = localStorage.getItem('lockTime');

    if (savedPlan && lockTime && (Date.now() - lockTime < 24 * 60 * 60 * 1000)) {
        renderWaitingCard(savedPlan);
        setInterval(checkActivation, 10000); // "Бодрячок" для Render
    }

    // --- 5. ЛОГИКА СТРАНИЦЫ ОПЛАТЫ (Твой старый код для payment.html) ---
    if (window.location.pathname.includes('payment.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const planKey = urlParams.get('plan') || 'extended';
        const price = urlParams.get('price') || '1200';
        const orderID = localStorage.getItem('lastOrderID');

        // Обновление контента оплаты
        if (document.getElementById('selectedPlanName')) document.getElementById('selectedPlanName').textContent = planDetails[planKey].name;
        const priceEl = document.getElementById('selectedPlanPrice');
        if (priceEl) priceEl.innerHTML = `${price} ₽ <br><span style="color:red; font-size:1rem;">ID: ${orderID}</span>`;
        
        // QR-код
        const qrImg = document.getElementById('qrCodeImage');
        if (qrImg) {
            const baseQR = 'https://www.sberbank.ru/ru/choise_bank?requisiteNumber=79108777700&bankCode=100000000111';
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(baseQR + '&sum=' + price + '&label=' + orderID)}`;
        }
    }
});
