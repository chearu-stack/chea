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
            // РАЗДЕЛЕНИЕ: промо-код проверяем по коду, платный — по fingerprint
            const lastPromoCode = localStorage.getItem('lastPromoCode');
            const lastOrderID = localStorage.getItem('lastOrderID');

            let response;

            if (lastPromoCode) {
                // ПРОМО-АКЦИЯ: проверяем по коду (fingerprint игнорируется)
                response = await fetch(`${API_BASE}/check-status?code=${lastPromoCode}`);
                console.log('🔄 Проверка промо-кода:', lastPromoCode);
            } else if (lastOrderID) {
                // ПЛАТНЫЙ ТАРИФ: проверяем по fingerprint
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
                    showActivatedStatus(API_BASE);
                }
                clearInterval(window.activationCheckInterval);
                window.activationCheckInterval = null;
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
