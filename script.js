// ===================================================================
// АДВОКАТ МЕДНОГО ГРОША — ГЛАВНЫЙ СКРИПТ (ТОЧКА ВХОДЫ)
// Модульная архитектура v2.0 (аналог server.js)
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
    startActivationCheck,
    stopActivationCheck
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

// --- ГЛОБАЛЬНОЕ СОСТОЯНИЕ (привязано к точке входа) ---
window.currentCampaign = null;

// --- ЛОКАЛЬНЫЕ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
function clearLocalStorage() {
    localStorage.removeItem('selectedPlan');
    localStorage.removeItem('lockTime');
    localStorage.removeItem('lastOrderID');
    localStorage.removeItem('lastPromoCode');
    localStorage.removeItem('promoTime');
    console.log('localStorage очищен');
    showQuestionnaireBlock();
}

function unlockAndResetTariffButtons() {
    console.log('Разблокировка и сброс обработчиков');
    unlockTariffButtons();
    setupTariffButtons(API_BASE, userFP, generateOrderIdentifier, planDetails);
    showQuestionnaireBlock();
}

function hasParticipatedInPromo() {
    const lastPromoCode = localStorage.getItem('lastPromoCode');
    const promoTime = localStorage.getItem('promoTime');
    if (!lastPromoCode || !promoTime) return false;
    const timePassed = Date.now() - parseInt(promoTime);
    return timePassed < 30 * 24 * 60 * 60 * 1000;
}

// --- ИНИЦИАЛИЗАЦИЯ ---
document.addEventListener('DOMContentLoaded', function() {
    console.log('💰 Адвокат медного гроша: модульная инициализация');

    // 1. Настройка кнопок тарифов
    setupTariffButtons(API_BASE, userFP, generateOrderIdentifier, planDetails);

    // 2. Проверка и блокировка тарифов
    checkAndBlockTariffs(API_BASE, userFP, {
        clearLocalStorage,
        unlockAndResetTariffButtons,
        blockTariffButtons,
        unlockTariffButtons,
        hideQuestionnaireBlock,
        showQuestionnaireBlock
    });

    // 3. Показать статус "Ожидание" (если есть)
    showWaitingStatus(API_BASE, planDetails, {
        hideQuestionnaireBlock,
        startActivationCheck: () => startActivationCheck(API_BASE, userFP)
    });

    // 4. Проверить активные акции
    checkActiveCampaign(API_BASE, userFP, {
        hasParticipatedInPromo,
        showPromoBanner: (campaign) => {
            // Эти функции реализованы внутри amg-promo-campaign.js
            // Они будут вызваны из checkActiveCampaign
        },
        showPromoHeroCard: (campaign) => {
            // Реализовано внутри amg-promo-campaign.js
        },
        showPromoWaitingStatus: (code, campaign) => {
            // Реализовано внутри amg-promo-campaign.js
        },
        startActivationCheck: () => startActivationCheck(API_BASE, userFP),
        restoreOriginalHeroCard
    });

    // 5. Инициализация страницы оплаты (если мы на ней)
    setupPaymentPage(planDetails);

    console.log('✅ Все модули инициализированы');
});

// Экспортируем для возможного использования в других модулях (опционально)
export {
    clearLocalStorage,
    unlockAndResetTariffButtons,
    hasParticipatedInPromo
};
