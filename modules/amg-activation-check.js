// ===================================================================
// МОДУЛЬ: Проверка активации (общий для тарифов и промо)
// ===================================================================

// Импорт необходимых функций
import { showPromoActivatedStatus } from './amg-promo-campaign.js';
import { renderHeroCard } from './hero-renderer.js';

// --- ЗАПУСК ПРОВЕРКИ АКТИВАЦИИ ---
export function startActivationCheck(API_BASE, userFP, planDetails, campaignData = null) {
    // Очищаем предыдущий интервал, если есть
    if (window.activationCheckInterval) {
        clearInterval(window.activationCheckInterval);
    }

    window.activationCheckInterval = setInterval(async () => {
        try {
            // РАЗДЕЛЕНИЕ: промо-код проверяем по коду, платный — по коду И fingerprint
            const lastPromoCode = localStorage.getItem('lastPromoCode');
            const lastOrderID = localStorage.getItem('lastOrderID');
            
            let response;
            
            if (lastPromoCode) {
                // ПРОМО-АКЦИЯ: проверяем по коду (fingerprint игнорируется)
                response = await fetch(`${API_BASE}/check-status?code=${lastPromoCode}`);
                console.log('🔄 Проверка промо-кода:', lastPromoCode);
            } else if (lastOrderID) {
                // ИСПРАВЛЕНО: ПЛАТНЫЙ ТАРИФ проверяем по КОДУ И FINGERPRINT
                response = await fetch(`${API_BASE}/check-status?code=${lastOrderID}&fp=${userFP}`);
                console.log('🔄 Проверка платного тарифа по code+fp:', lastOrderID, userFP.substring(0, 6) + '...');
            } else {
                return;
            }
            
            const data = await response.json();
            console.log('Результат проверки:', data);
            
            if (data.active === true) {
                if (lastPromoCode) {
                    showPromoActivatedStatus(API_BASE, lastPromoCode);
                } else {
                    // НАДЁЖНО: Вызываем renderHeroCard для обновления интерфейса
                    console.log('✅ Платный тариф активирован! Обновляем интерфейс...');
                    await renderHeroCard(API_BASE, planDetails, campaignData);
                }
                clearInterval(window.activationCheckInterval);
                window.activationCheckInterval = null;
            }
            
        } catch (error) {
            console.log('Ошибка проверки активации:', error);
        }
    }, 10000);

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
