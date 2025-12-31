// ===================================================================
// МОДУЛЬ: Проверка активации (общий для тарифов и промо)
// ===================================================================

// Импорт необходимых функций
import { showActivatedStatus } from './amg-tariff-buttons.js';
import { showPromoActivatedStatus } from './amg-promo-campaign.js';

// --- ЗАПУСК ПРОВЕРКИ АКТИВАЦИИ ---
export function startActivationCheck(API_BASE, userFP) {
    // Очищаем предыдущий интервал, если есть
    if (window.activationCheckInterval) {
        clearInterval(window.activationCheckInterval);
    }

    window.activationCheckInterval = setInterval(async () => {
        try {
            // ПРОВЕРКА ДВУХ ТИПОВ КОДОВ: платный тариф И промо-акция
            const lastPromoCode = localStorage.getItem('lastPromoCode');
            const lastOrderID = localStorage.getItem('lastOrderID');

            // 1. Сначала проверяем промо-код (если есть)
            if (lastPromoCode) {
                const promoResponse = await fetch(`${API_BASE}/check-status?code=${lastPromoCode}`);
                console.log('🔄 Проверка промо-кода:', lastPromoCode);
                const promoData = await promoResponse.json();
                
                // ИСПРАВЛЕНИЕ: проверяем поле active (маленькая буква)
                if (promoData.active === true) {
                    showPromoActivatedStatus(API_BASE, lastPromoCode);
                    clearInterval(window.activationCheckInterval);
                    window.activationCheckInterval = null;
                    return;
                }
            }

            // 2. Затем проверяем платный тариф (если есть)
            if (lastOrderID) {
                const orderResponse = await fetch(`${API_BASE}/check-status?code=${lastOrderID}`);
                console.log('🔄 Проверка платного тарифа по коду:', lastOrderID);
                const orderData = await orderResponse.json();
                
                // ИСПРАВЛЕНИЕ: проверяем поле active (маленькая буква)
                if (orderData.active === true) {
                    showActivatedStatus(API_BASE);
                    clearInterval(window.activationCheckInterval);
                    window.activationCheckInterval = null;
                    return;
                }
            }

        } catch (error) {
            console.log('Ошибка проверки активации:', error);
        }
    }, 10000); // Проверка каждые 10 секунд

    // Сохраняем ссылку на интервал в глобальной области для возможной очистки
    return window.activationCheckInterval;
}

// --- ОСТАНОВКА ПРОВЕРКИ ---
export function stopActivationCheck() {
    if (window.activationCheckInterval) {
        clearInterval(window.activationCheckInterval);
        window.activationCheckInterval = null;
        console.log('Проверка активации остановлена');
    }
}
