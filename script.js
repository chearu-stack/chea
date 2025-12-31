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
    checkActiveCampaign
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

// --- ГЛОБАЛЬНОЕ СОСТОЯНИЕ (привязано к точке входа) ---
window.currentCampaign = null;
let activationCheckInterval = null;

// --- ЭКСПОРТ ГЛОБАЛЬНЫХ ПЕРЕМЕННЫХ ДЛЯ МОДУЛЕЙ (если нужно) ---
export { activationCheckInterval };

// --- ИНИЦИАЛИЗАЦИЯ ---
document.addEventListener('DOMContentLoaded', function() {
    console.log('💰 Адвокат медного гроша: модульная инициализация');

    // 1. Настройка кнопок тарифов
    setupTariffButtons(API_BASE, userFP, generateOrderIdentifier, planDetails);

    // 2. Проверка и блокировка тарифов (использует DOM-хелперы)
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
        startActivationCheck
    });

    // 4. Проверить активные акции
    checkActiveCampaign(API_BASE, userFP, {
        hasParticipatedInPromo,
        showPromoBanner,
        showPromoHeroCard,
        showPromoWaitingStatus,
        startActivationCheck,
        restoreOriginalHeroCard
    });

    // 5. Инициализация страницы оплаты (если мы на ней)
    setupPaymentPage(planDetails);

    console.log('✅ Все модули инициализированы');
});

// --- ЛОКАЛЬНЫЕ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (оставлены здесь, так как используют замыкания) ---
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

// Эти функции будут реализованы в amg-promo-campaign.js, но объявлены здесь для целостности
function showPromoBanner(campaign) {
    // Заглушка, реализация в модуле
    console.log('showPromoBanner called for:', campaign.title);
}

function showPromoHeroCard(campaign) {
    // Заглушка, реализация в модуле
    console.log('showPromoHeroCard called for:', campaign.title);
}

function showPromoWaitingStatus(code, campaign) {
    // Заглушка, реализация в модуле
    console.log('showPromoWaitingStatus called for:', code);
}
