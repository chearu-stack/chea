// ===================================================================
// МОДУЛЬ: Проверка активации (общий для тарифов и промо)
// ===================================================================

// Импорт необходимых функций
import { showPromoActivatedStatus } from './amg-promo-campaign.js';
// УБРАЛИ импорт showActivatedStatus из amg-tariff-buttons.js

// --- ЗАПУСК ПРОВЕРКИ АКТИВАЦИИ ---
export function startActivationCheck(API_BASE, userFP) {
    // Очищаем предыдущий интервал, если есть
    if (window.activationCheckInterval) {
        clearInterval(window.activationCheckInterval);
    }

    window.activationCheckInterval = setInterval(async () => {
        try {
            // РАЗДЕЛЕНИЕ: промо-код проверяем по коду, платный — по fingerprint (КАК В СТАРОМ КОДЕ)
            const lastPromoCode = localStorage.getItem('lastPromoCode');
            const lastOrderID = localStorage.getItem('lastOrderID');
            
            let response;
            
            if (lastPromoCode) {
                // ПРОМО-АКЦИЯ: проверяем по коду (fingerprint игнорируется)
                response = await fetch(`${API_BASE}/check-status?code=${lastPromoCode}`);
                console.log('🔄 Проверка промо-кода:', lastPromoCode);
            } else if (lastOrderID) {
                // ПЛАТНЫЙ ТАРИФ: проверяем по fingerprint (СТАРАЯ ЛОГИКА)
                response = await fetch(`${API_BASE}/check-status?fp=${userFP}`);
                console.log('🔄 Проверка платного тарифа по fingerprint');
            } else {
                // Ничего не проверяем
                return;
            }
            
            const data = await response.json();
            console.log('Результат проверки:', data);
            
            if (data.active === true) {
                if (lastPromoCode) {
                    showPromoActivatedStatus(API_BASE, lastPromoCode);
                } else {
                    // ВМЕСТО showActivatedStatus делаем релоад страницы или вызываем hero-renderer
                    console.log('✅ Платный тариф активирован!');
                    location.reload(); // Простой вариант
                }
                clearInterval(window.activationCheckInterval);
                window.activationCheckInterval = null;
            }
            
        } catch (error) {
            console.log('Ошибка проверки активации:', error);
        }
    }, 10000); // Проверка каждые 10 секунд

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
