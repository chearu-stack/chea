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
    // showWaitingStatus и showActivatedStatus УБРАНЫ - теперь в hero-renderer.js
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

    // 3. и 4. Статусы "Ожидание" и "Активирован" - ТЕПЕРЬ в hero-renderer.js

    // 5. Проверить активные акции и запустить рендеринг
    checkActiveCampaign(API_BASE, userFP).then(campaignData => {
        // Рендерим hero-карточку с учётом акций
        renderHeroCard(API_BASE, planDetails, campaignData);
        // Запускаем проверку активации
        startActivationCheck(API_BASE, userFP, planDetails, campaignData);
    });

    // 6. Инициализация страницы оплаты (если мы на ней)
    setupPaymentPage(planDetails);

    console.log('✅ Все модули запущены');
});
