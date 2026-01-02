// ===================================================================
// МОДУЛЬ: hero-renderer.js
// ОТВЕТСТВЕННОСТЬ: Рендеринг hero-карточки + управление связанными элементами
// 1. ПЛАТНЫЕ ТАРИФЫ (приоритет, если выбран ≤24h)
// 2. АКЦИИ (только если нет активного платного тарифа)
// 3. ДЕФОЛТ (пример расчёта 21000 руб.)
// 4. Управление блоком анализа (#questionnaire)
// ===================================================================

// Импорт зависимостей
import { hideQuestionnaireBlock, showQuestionnaireBlock } from './amg-dom-helpers.js';

/**
 * Основная функция рендеринга hero-карточки
 * @param {string} API_BASE - Базовый URL API
 * @param {object} planDetails - Детали тарифов
 * @param {object|null} campaignData - Данные активной кампании (или null)
 * @returns {object} Состояние пользователя для других модулей
 */
export async function renderHeroCard(API_BASE, planDetails, campaignData = null) {
    const cardHeader = document.querySelector('.card-header');
    const cardBody = document.querySelector('.card-body');
    
    if (!cardHeader || !cardBody) return { state: 'NO_CARD_ELEMENTS' };

    // ========== ПРИОРИТЕТ 1: ПРОВЕРКА ПЛАТНОГО ТАРИФА ==========
    const savedOrderID = localStorage.getItem('lastOrderID');
    const savedPlan = localStorage.getItem('selectedPlan');
    const lockTime = localStorage.getItem('lockTime');

    // Есть данные о платном тарифе
    if (savedOrderID && savedPlan && lockTime) {
        
        // Проверяем, не прошло ли 24 часа
        const timePassed = Date.now() - parseInt(lockTime);
        const isWithin24h = timePassed < 24 * 60 * 60 * 1000;
        
        if (isWithin24h) {
            try {
                const response = await fetch(`${API_BASE}/check-status?code=${savedOrderID}`);
                const status = await response.json();

                // 1А. ПЛАТНЫЙ ТАРИФ АКТИВИРОВАН
                if (status.code && status.active === true) {
                    showActivatedCard(cardHeader, cardBody, savedOrderID);
                    hideQuestionnaireBlock();
                    return { 
                        state: 'ACTIVATED', 
                        orderID: savedOrderID, 
                        plan: savedPlan 
                    };
                }

                // 1Б. ПЛАТНЫЙ ТАРИФ ВЫБРАН, НО НЕ АКТИВИРОВАН
                showWaitingCard(cardHeader, cardBody, savedOrderID, savedPlan, planDetails);
                hideQuestionnaireBlock();
                return { 
                    state: 'WAITING', 
                    orderID: savedOrderID, 
                    plan: savedPlan 
                };

            } catch (error) {
                console.error('❌ hero-renderer: Ошибка проверки платного тарифа:', error);
                // При ошибке сети - показываем дефолт
            }
        } else {
            // Время вышло (>24h) - очищаем localStorage
            localStorage.removeItem('lastOrderID');
            localStorage.removeItem('selectedPlan');
            localStorage.removeItem('lockTime');
        }
    }

    // ========== ПРИОРИТЕТ 2: АКЦИИ (только если нет активного платного) ==========
    if (campaignData && campaignData.active) {
        // Проверяем, участвует ли пользователь уже в акции
        const lastPromoCode = localStorage.getItem('lastPromoCode');
        const promoTime = localStorage.getItem('promoTime');
        
        if (lastPromoCode && promoTime) {
            const timePassed = Date.now() - parseInt(promoTime);
            const promoExpiresDays = campaignData.expires_days || 30;
            const isPromoActive = timePassed < promoExpiresDays * 24 * 60 * 60 * 1000;
            
            if (isPromoActive) {
                // 2А. ПОЛЬЗОВАТЕЛЬ УЖЕ УЧАСТВУЕТ В АКЦИИ
                renderPromoWaitingState(cardHeader, cardBody, lastPromoCode, campaignData);
                hideQuestionnaireBlock();
                return { 
                    state: 'PROMO_WAITING', 
                    promoCode: lastPromoCode, 
                    campaign: campaignData 
                };
            } else {
                // Срок акции истёк - очищаем
                localStorage.removeItem('lastPromoCode');
                localStorage.removeItem('promoTime');
            }
        }
        
        // 2Б. АКЦИЯ АКТИВНА, НО ПОЛЬЗОВАТЕЛЬ ЕЩЁ НЕ УЧАСТВУЕТ
        renderPromoOfferState(cardHeader, cardBody, campaignData);
        hideQuestionnaireBlock();
        return { 
            state: 'PROMO_OFFER', 
            campaign: campaignData 
        };
    }

    // ========== ПРИОРИТЕТ 3: НОВЫЙ ПОЛЬЗОВАТЕЛЬ (дефолт) ==========
    showDefaultCard(cardHeader, cardBody);
    showQuestionnaireBlock();
    return { state: 'DEFAULT' };
}

// ===================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ПЛАТНЫХ ТАРИФОВ
// ===================================================================

function showDefaultCard(header, body) {
    header.innerHTML = `<i class="fas fa-bolt"></i> Пример расчёта`;
    body.innerHTML = `
        <p><strong>Задержка ремонта на 14 дней</strong><br>Стоимость: 50 000 руб.</p>
        <div class="calculation">
            <p>50 000 × 3% × 14 дней =</p>
            <div class="result">21 000 руб.</div>
            <p class="note">Ваша компенсация (ст. 28 ЗоЗПП)</p>
        </div>
    `;
}

function showWaitingCard(header, body, orderID, planKey, planDetails) {
    const plan = planDetails[planKey] || planDetails.extended;
    
    header.innerHTML = `<i class="fas fa-clock"></i> Ваш выбор: ${plan.name}`;
    body.innerHTML = `
        <div style="text-align: left;">
            <p style="font-weight: bold; color: #e67e22; margin-bottom: 10px;">
                <i class="fas fa-hourglass-half"></i> Статус: ОЖИДАНИЕ ПОДТВЕРЖДЕНИЯ
            </p>
            <p style="margin-bottom: 15px;">${plan.desc}</p>
            <p style="font-size: 0.9rem; margin-bottom: 10px;">
                <strong>Бот забронирован.</strong> Отправьте ID и чеки в Telegram:
            </p>
            <a href="https://t.me/chearu252?text=${encodeURIComponent('Мой ID: ' + orderID + '. Прикрепите чек к сообщению!')}" 
               target="_blank" 
               style="display: block; background: #0088cc; color: white; padding: 12px; border-radius: 6px; text-decoration: none; text-align: center; font-weight: 600;">
               <i class="fab fa-telegram"></i> ПОДТВЕРДИТЬ В TELEGRAM
            </a>
            <p style="font-size: 0.8rem; color: #718096; margin-top: 10px;">
                ID для справки: ${orderID}
            </p>
        </div>
    `;
}

function showActivatedCard(header, body, orderID) {
    header.innerHTML = `<i class="fas fa-check-circle"></i> Статус: АКТИВИРОВАН`;
    body.innerHTML = `
        <div style="text-align: center;">
            <p style="margin-bottom: 20px; font-weight: 600;">
                <strong>Ваш пакет полностью готов.</strong> Все инструменты цифрового помощника разблокированы. Перейдите в личный кабинет, дождитесь загрузки.
            </p>
            <a href="https://bothub-bridge.onrender.com/?access_code=${orderID}" 
               target="_blank"
               style="display: block; background: #27ae60; color: white; padding: 15px; border-radius: 8px; text-decoration: none; font-weight: 600;">
               ВХОД В ЛИЧНЫЙ КАБИНЕТ
            </a>
            <p style="font-size: 0.9rem; color: #718096; margin-top: 15px;">
                Код доступа: <code>${orderID}</code>
            </p>
        </div>
    `;
}

// ===================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ АКЦИЙ
// ===================================================================

function renderPromoWaitingState(header, body, promoCode, campaign) {
    const planName = getPromoPlanName(campaign.package);
    const { actionText, telegramText, buttonText } = getPromoTexts(campaign, promoCode);
    
    header.innerHTML = `<i class="fas fa-clock"></i> Акция: ${planName}`;
    body.innerHTML = `
        <div style="text-align: left;">
            <p style="font-weight: bold; color: #e67e22; margin-bottom: 10px;">
                <i class="fas fa-hourglass-half"></i> Статус: ОЖИДАНИЕ ПОДТВЕРЖДЕНИЯ
            </p>
            <p style="margin-bottom: 10px;">Вы участвуете в акции. Сохраните ваш код:</p>
            <div style="background: #f7fafc; padding: 10px; border-radius: 6px; margin-bottom: 15px; font-family: monospace; font-weight: bold; text-align: center;">
                ${promoCode}
            </div>
            <p style="font-size: 0.9rem; margin-bottom: 15px;">
                <strong>${actionText}</strong>
            </p>
            <a href="https://t.me/chearu252?text=${encodeURIComponent(telegramText)}" 
               target="_blank" 
               style="display: block; background: #0088cc; color: white; padding: 12px; border-radius: 6px; text-decoration: none; text-align: center; font-weight: 600;">
               <i class="fab fa-telegram"></i> ${buttonText}
            </a>
            <p style="font-size: 0.8rem; color: #718096; margin-top: 15px;">
                ⚠️ После активации код будет действовать ${campaign.expires_days || 30} дней
            </p>
        </div>
    `;
}

function renderPromoOfferState(header, body, campaign) {
    header.innerHTML = `<i class="fas fa-gift"></i> ${campaign.title || 'Акция'}`;
    body.innerHTML = `
        <div style="text-align: left;">
            <p style="margin-bottom: 10px; font-weight: 600;">
                ${campaign.description || ''}
            </p>
            <p style="color: #718096; font-size: 0.9rem; margin-bottom: 10px;">
                ⚠️ Код будет активирован вручную после проверки
            </p>
            <p style="color: #718096; font-size: 0.9rem; margin-bottom: 5px;">
                ⏱️ Доступ действует ${campaign.expires_days || 30} дней
            </p>
            <p style="color: #2d3748; font-size: 0.9rem; margin-top: 15px; font-style: italic;">
                <i class="fas fa-mouse-pointer"></i> Нажмите кнопку "Участвовать" в баннере ниже
            </p>
        </div>
    `;
}

// ===================================================================
// УТИЛИТЫ ДЛЯ АКЦИЙ (ИСПРАВЛЕННЫЕ)
// ===================================================================

function getPromoPlanName(packageType) {
    const names = {
        'PROMO_BASIC': 'Базовый',
        'PROMO_EXTENDED': 'Расширенный', 
        'PROMO_SUBSCRIPTION': 'Профессиональный'
    };
    return names[packageType] || 'Акционный';
}

function getPromoTexts(campaign, promoCode) {
    const title = campaign.title || '';
    const description = campaign.description || '';
    
    if (title.includes('тестировщик') || description.includes('тестировщик')) {
        return {
            actionText: "Напишите в Telegram для получения доступа:",
            telegramText: 'Хочу участвовать в тестировании. Код: ' + promoCode,
            buttonText: "НАПИСАТЬ ДЛЯ УЧАСТИЯ"
        };
    }
    
    if (title.includes('лотерея') || description.includes('лотерея')) {
        return {
            actionText: "Отправьте данные для участия в лотерее:",
            telegramText: 'Участвую в лотерее. Код: ' + promoCode,
            buttonText: "УЧАСТВОВАТЬ В ЛОТЕРЕЕ"
        };
    }
    
    if (title.includes('подписк') || description.includes('подписк')) {
        return {
            actionText: "Отправьте скриншот подписки и этот код в Telegram:",
            telegramText: 'Промо-акция! Код: ' + promoCode + '. Скриншот прикреплён.',
            buttonText: "ОТПРАВИТЬ СКРИНШОТ В TELEGRAM"
        };
    }
    
    return {
        actionText: "Отправьте данные для участия в акции:",
        telegramText: 'Промо-акция! Код: ' + promoCode,
        buttonText: "УЧАСТВОВАТЬ В АКЦИИ"
    };
}
