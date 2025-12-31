// ===================================================================
// МОДУЛЬ: Конфигурация и утилиты
// ===================================================================

// --- ГЛОБАЛЬНЫЕ КОНСТАНТЫ ---
export const API_BASE = 'https://chea.onrender.com';

// --- ГЕНЕРАЦИЯ ОТПЕЧАТКА ---
export const getFP = () => {
    const s = window.screen;
    const b = navigator.userAgent;
    return btoa(`${s.width}${s.height}${b}${s.colorDepth}`).substring(0, 12);
};
export const userFP = getFP();

// --- ГЕНЕРАЦИЯ ID ДЛЯ ЗАКАЗА ---
export function generateOrderIdentifier(planKey) {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const planLetters = { 'basic': 'E', 'extended': 'S', 'subscription': 'V' };
    const planLetter = planLetters[planKey] || 'X';
    return `AMG25-${mm}${dd}${hh}${min}-${planLetter}${userFP.substring(0,2).toUpperCase()}`;
}

// --- ГЕНЕРАЦИЯ ID ДЛЯ ПРОМО-АКЦИИ ---
export function generatePromoIdentifier(packageType) {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const planLetters = { 'PROMO_BASIC': 'P', 'PROMO_EXTENDED': 'Q', 'PROMO_SUBSCRIPTION': 'R' };
    const planLetter = planLetters[packageType] || 'P';
    return `AMG25-${mm}${dd}${hh}${min}-${planLetter}${userFP.substring(0,2).toUpperCase()}`;
}

// --- ОПИСАНИЕ ТАРИФОВ ---
export const planDetails = {
    'basic': { 
        name: 'Базовый', 
        price: '500 ₽', 
        desc: 'Диагноз, план и 1 претензия. 7 вопросов боту.' 
    },
    'extended': { 
        name: 'Расширенный', 
        price: '1 200 ₽', 
        desc: 'Всё из Базового + расчёт неустойки и 3 документа. 20 вопросов.' 
    },
    'subscription': { 
        name: 'Профессиональный', 
        price: '2 500 ₽', 
        desc: 'Борьба с отписками, стратегия и сложные расчёты. 50 вопросов.' 
    }
};
