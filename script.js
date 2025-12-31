// ===================================================================
// АДВОКАТ МЕДНОГО ГРОША — ГЛАВНЫЙ СКРИПТ (ТОЧКА ВХОДЫ)
// ТОЛЬКО импорты и вызовы
// ===================================================================

// Импорт модулей
import {
    API_BASE,
    userFP,
    generateOrderIdentifier,
    generatePromoIdentifier,
    planDetails
} from './modules/amg-config.js';

import {
    setupTariffButtons,
    checkAndBlockTariffs
} from './modules/amg-tariff-buttons.js';

import { checkActiveCampaign } from './modules/amg-promo-campaign.js';
import { startActivationCheck } from './modules/amg-activation-check.js';
import { setupPaymentPage } from './modules/amg-payment-page.js';
import { renderHeroCard } from './modules/hero-renderer.js';

// --- ИНИЦИАЛИЗАЦИЯ ---
document.addEventListener('DOMContentLoaded', function() {
    console.log('💰 Адвокат медного гроша: запуск');

    // 1. Настройка кнопок тарифов
    setupTariffButtons(API_BASE, userFP, generateOrderIdentifier, planDetails);

    // 2. Проверка и блокировка тарифов
    checkAndBlockTariffs(API_BASE, userFP);

    // 3. Проверить активные акции И отрендерить hero-карточку
    checkActiveCampaign(API_BASE, userFP).then(campaignData => {
        renderHeroCard(API_BASE, planDetails, campaignData);
    });

    // 4. Инициализация страницы оплаты
    setupPaymentPage(planDetails);

    // 5. Запуск периодической проверки активации
    startActivationCheck();

    console.log('✅ Все модули запущены');
});
