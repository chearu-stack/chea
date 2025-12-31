// ===================================================================
// АДВОКАТ МЕДНОГО ГРОША — ГЛАВНЫЙ СКРИПТ (ТОЧКА ВХОДЫ)
// Модульная архитектура v2.0 (аналог server.js)
// ===================================================================

// ДИАГНОСТИКА: проверка загрузки
console.log('🔧 script.js начал загрузку...');

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

console.log('🔧 Все модули импортированы');

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

// --- ДИАГНОСТИКА ДОМ-ЭЛЕМЕНТОВ ---
function checkDOMElements() {
    const elements = {
        'card-header': document.querySelector('.card-header'),
        'card-body': document.querySelector('.card-body'),
        'questionnaire': document.getElementById('questionnaire'),
        'promo-banner': document.getElementById('promo-banner'),
        'pricing-buttons': document.querySelectorAll('.pricing-card .btn[data-plan]').length
    };
    console.log('🔍 Проверка DOM элементов:', elements);
    return elements;
}

// --- ИНИЦИАЛИЗАЦИЯ ---
document.addEventListener('DOMContentLoaded', function() {
    console.log('💰 Адвокат медного гроша: модульная инициализация');
    
    // Диагностика
    const domElements = checkDOMElements();
    
    // Если нет карточки - выходим
    if (!domElements['card-header'] || !domElements['card-body']) {
        console.error('❌ Не найдены элементы карточки (.card-header, .card-body)');
        console.error('❌ Проверьте HTML-разметку');
        return;
    }

    // 1. Настройка кнопок тарифов
    console.log('🔧 Настройка кнопок тарифов...');
    setupTariffButtons(API_BASE, userFP, generateOrderIdentifier, planDetails);

    // 2. Проверка и блокировка тарифов
    console.log('🔧 Проверка блокировки тарифов...');
    checkAndBlockTariffs(API_BASE, userFP, {
        clearLocalStorage,
        unlockAndResetTariffButtons,
        blockTariffButtons,
        unlockTariffButtons,
        hideQuestionnaireBlock,
        showQuestionnaireBlock
    });

    // 3. Показать статус "Ожидание" (если есть)
    console.log('🔧 Проверка статуса ожидания...');
    showWaitingStatus(API_BASE, planDetails, {
        hideQuestionnaireBlock,
        startActivationCheck: () => startActivationCheck(API_BASE, userFP),
        showQuestionnaireBlock // ДОБАВЛЕНО: передаём функцию
    });

    // 4. Проверить активные акции
    console.log('🔧 Проверка акций...');
    checkActiveCampaign(API_BASE, userFP, {
        hasParticipatedInPromo,
        // Эти функции реализованы внутри amg-promo-campaign.js
        // Они будут вызваны из checkActiveCampaign
        showPromoBanner: () => {},
        showPromoHeroCard: () => {},
        showPromoWaitingStatus: () => {},
        startActivationCheck: () => startActivationCheck(API_BASE, userFP),
        restoreOriginalHeroCard
    });

    // 5. Инициализация страницы оплаты (если мы на ней)
    console.log('🔧 Проверка страницы оплаты...');
    setupPaymentPage(planDetails);

    // 6. Проверка localStorage для отладки
    console.log('📊 localStorage:', {
        lastOrderID: localStorage.getItem('lastOrderID'),
        selectedPlan: localStorage.getItem('selectedPlan'),
        lockTime: localStorage.getItem('lockTime'),
        lastPromoCode: localStorage.getItem('lastPromoCode')
    });

    console.log('✅ Все модули инициализированы');
});

// Запуск диагностики при загрузке (до DOMContentLoaded)
console.log('🔧 script.js загружен, ждём DOM...');
console.log('localStorage при загрузке:', {
    lastOrderID: localStorage.getItem('lastOrderID'),
    selectedPlan: localStorage.getItem('selectedPlan')
});

// Экспортируем для возможного использования в других модулях (опционально)
export {
    clearLocalStorage,
    unlockAndResetTariffButtons,
    hasParticipatedInPromo
};
