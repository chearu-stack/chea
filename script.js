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
    checkAndBlockTariffs,
    showWaitingStatus,
    showActivatedStatus
} from './modules/amg-tariff-buttons.js';

import {
    checkActiveCampaign,
    showPromoActivatedStatus
} from './modules/amg-promo-campaign.js';

import {
    startActivationCheck
} from './modules/amg-activation-check.js';

import {
    setupPaymentPage
} from './modules/amg-payment-page.js';

import {
    hideQuestionnaireBlock,
    showQuestionnaireBlock,
    blockTariffButtons,
    unlockTariffButtons,
    restoreOriginalHeroCard
} from './modules/amg-dom-helpers.js';

import {
    renderHeroCard
} from './modules/hero-renderer.js';

// --- ИНИЦИАЛИЗАЦИЯ ---
document.addEventListener('DOMContentLoaded', function() {
    console.log('💰 Адвокат медного гроша: запуск');

    // 1. Настройка кнопок тарифов
    setupTariffButtons(API_BASE, userFP, generateOrderIdentifier, planDetails);

    // 2. Проверка и блокировка тарифов
    checkAndBlockTariffs(API_BASE, userFP);

    // 3. Показать статус "Ожидание" (если есть)
    showWaitingStatus(API_BASE, planDetails);

    // 4. Показать статус "Активирован" (если уже активен)
    showActivatedStatus(API_BASE);

    // 5. Проверить активные акции и запустить проверку активации с полученными данными
    checkActiveCampaign(API_BASE, userFP).then(campaignData => {
        startActivationCheck(API_BASE, userFP, planDetails, campaignData);
    });

    // 6. Инициализация страницы оплаты (если мы на ней)
    setupPaymentPage(planDetails);

    console.log('✅ Все модули запущены');
});
