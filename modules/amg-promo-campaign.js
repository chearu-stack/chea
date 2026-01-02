// ===================================================================
// МОДУЛЬ: Логика промо-акций
// ===================================================================

// --- ПРОВЕРКА УЧАСТИЯ В АКЦИИ ---
function hasParticipatedInPromo() {
    const lastPromoCode = localStorage.getItem('lastPromoCode');
    const promoTime = localStorage.getItem('promoTime');
    
    if (!lastPromoCode || !promoTime) return false;
    
    const timePassed = Date.now() - parseInt(promoTime);
    return timePassed < 30 * 24 * 60 * 60 * 1000; // 30 дней
}

// --- ПОЛУЧЕНИЕ ВСЕХ КОДОВ ИЗ localStorage ---
function getAllCodesFromStorage() {
    const codes = [];
    
    // Основной платный код
    const accessCode = localStorage.getItem('access_code');
    if (accessCode) codes.push({code: accessCode, type: 'paid'});
    
    // Последний промо-код
    const lastPromoCode = localStorage.getItem('lastPromoCode');
    if (lastPromoCode) codes.push({code: lastPromoCode, type: 'promo'});
    
    // Коды из amg-codes (если есть такой модуль)
    try {
        const amgCodes = JSON.parse(localStorage.getItem('amg_codes') || '[]');
        amgCodes.forEach(codeObj => {
            if (codeObj.code) codes.push({code: codeObj.code, type: 'stored'});
        });
    } catch (e) {
        // Игнорируем ошибки парсинга
    }
    
    return codes;
}

// --- ПРОВЕРКА АКТИВНОЙ АКЦИИ ---
export async function checkActiveCampaign(API_BASE, userFP, helpers) {
    // СРАЗУ скрываем баннер при запуске
    const banner = document.getElementById('promo-banner');
    if (banner) {
        banner.style.display = 'none';
        banner.style.visibility = 'hidden';
        banner.style.opacity = '0';
        banner.style.height = '0';
        banner.style.margin = '0';
        banner.style.padding = '0';
        banner.style.overflow = 'hidden';
    }
    
    try {
        // === УСИЛЕННАЯ ПРОВЕРКА: Проверяем ВСЕ возможные коды ===
        const allCodes = getAllCodesFromStorage();
        console.log('🔍 Найдены коды в localStorage:', allCodes);
        
        if (allCodes.length > 0) {
            for (const codeObj of allCodes) {
                try {
                    console.log(`🔍 Проверяем код ${codeObj.code} (тип: ${codeObj.type})`);
                    const statusResponse = await fetch(`${API_BASE}/check-status?code=${codeObj.code}`);
                    const status = await statusResponse.json();
                    
                    // Если код существует в системе (не важно, активен или нет)
                    if (status.code) {
                        console.log(`🎫 Код ${codeObj.code} найден в системе (статус: ${status.active ? 'активен' : 'не активен'})`);
                        
                        // ГАРАНТИРОВАННОЕ СКРЫТИЕ БАННЕРА И ПРОМО-ЭЛЕМЕНТОВ
                        hideAllPromoElements();
                        
                        // Если это платный код (даже неактивный), не показываем промо
                        if (codeObj.type === 'paid' || status.package && !status.package.includes('PROMO')) {
                            console.log('🚫 Обнаружен платный код, промо-акция полностью скрыта');
                            return;
                        }
                        
                        // Если это промо-код и пользователь уже участвовал
                        if (codeObj.type === 'promo' && hasParticipatedInPromo()) {
                            console.log('🚫 Пользователь уже участвовал в промо-акции');
                            showPromoWaitingStatus(codeObj.code, window.currentCampaign || {});
                            helpers.startActivationCheck();
                            return;
                        }
                    }
                } catch (error) {
                    console.warn(`⚠️ Не удалось проверить код ${codeObj.code}:`, error);
                }
            }
        }
        // === КОНЕЦ УСИЛЕННОЙ ПРОВЕРКИ ===

        // Получаем активную кампанию только если нет запрещающих кодов
        const response = await fetch(`${API_BASE}/get-active-campaign`);
        const campaign = await response.json();

        console.log('🎁 Проверка акции:', campaign.active ? 'Активна' : 'Нет акций');
        console.log('🎁 Данные кампании с сервера:', campaign);

        window.currentCampaign = campaign;

        if (campaign.active) {
            if (!hasParticipatedInPromo()) {
                showPromoBanner(campaign);
                showPromoHeroCard(campaign);
            } else {
                const lastPromoCode = localStorage.getItem('lastPromoCode');
                if (lastPromoCode) {
                    showPromoWaitingStatus(lastPromoCode, campaign);
                    helpers.startActivationCheck();
                }
            }
        }
    } catch (error) {
        console.error('❌ Ошибка проверки акции:', error);
    }
}

// --- СКРЫТИЕ ВСЕХ ПРОМО-ЭЛЕМЕНТОВ ---
function hideAllPromoElements() {
    const banner = document.getElementById('promo-banner');
    if (banner) {
        banner.style.display = 'none';
        banner.style.visibility = 'hidden';
        banner.style.opacity = '0';
        banner.style.height = '0';
        banner.style.margin = '0';
        banner.style.padding = '0';
        banner.style.overflow = 'hidden';
        banner.style.position = 'absolute';
        banner.style.left = '-9999px';
    }
    
    // Дополнительно скрываем все элементы с промо-классами
    const promoElements = document.querySelectorAll('[id*="promo"], [class*="promo"], [id*="Promo"], [class*="Promo"]');
    promoElements.forEach(el => {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
    });
    
    console.log('✅ Все промо-элементы скрыты');
}

// --- ПОКАЗ БАННЕРА АКЦИИ ---
function showPromoBanner(campaign) {
    const banner = document.getElementById('promo-banner');
    const title = document.getElementById('promoTitle');
    const description = document.getElementById('promoDescription');
    const button = document.getElementById('promoBtn');

    if (!banner) return;

    title.textContent = campaign.title || '🎁 АКЦИЯ';
    description.textContent = campaign.description || 'Специальное предложение';
    banner.style.background = campaign.color || 'linear-gradient(90deg, #dd6b20, #ed8936)';

    button.onclick = () => participateInPromo(campaign);
    
    // Восстанавливаем стили только если баннер нужно показать
    banner.style.display = 'flex';
    banner.style.visibility = 'visible';
    banner.style.opacity = '1';
    banner.style.height = '';
    banner.style.margin = '';
    banner.style.padding = '';
    banner.style.overflow = '';
    banner.style.position = '';
    banner.style.left = '';
}

// --- ИЗМЕНЕНИЕ HERO-CARD ДЛЯ АКЦИИ ---
function showPromoHeroCard(campaign) {
    const cardHeader = document.querySelector('.card-header');
    const cardBody = document.querySelector('.card-body');

    if (!cardHeader || !cardBody) return;

    if (!window.originalHeroContent) {
        window.originalHeroContent = {
            header: cardHeader.innerHTML,
            body: cardBody.innerHTML
        };
    }

    cardHeader.innerHTML = `<i class="fas fa-gift"></i> ${campaign.title || 'Акция'}`;
    cardBody.innerHTML = `
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

// --- УЧАСТИЕ В АКЦИИ ---
async function participateInPromo(campaign) {
    console.log('🎁 Участие в промо-акции:', campaign);

    try {
        // Импортируем функцию генерации промо-кода динамически, чтобы избежать циклической зависимости
        const { generatePromoIdentifier } = await import('./amg-config.js');
        const promoCode = generatePromoIdentifier(campaign.package);

        const response = await fetch(`${API_BASE}/generate-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: promoCode,
                package: campaign.package,
                caps_limit: 30000,
                fingerprint: userFP,
                metadata: {
                    is_promo: true,
                    campaign_code: campaign.code
                }
            })
        });

        const data = await response.json();
        console.log('✅ Промо-код создан:', data);

        localStorage.setItem('lastPromoCode', promoCode);
        localStorage.setItem('promoTime', Date.now());

        // Явное скрытие баннера
        hideAllPromoElements();
        
        restoreOriginalHeroCard();
        showPromoWaitingStatus(promoCode, campaign);

        // startActivationCheck будет вызван из main script

    } catch (error) {
        console.error('❌ Ошибка участия в акции:', error);
        alert('Ошибка участия в акции. Попробуйте позже.');
    }
}

// --- ВОССТАНОВЛЕНИЕ ОРИГИНАЛЬНОЙ HERO-CARD ---
function restoreOriginalHeroCard() {
    if (!window.originalHeroContent) return;

    const cardHeader = document.querySelector('.card-header');
    const cardBody = document.querySelector('.card-body');

    if (cardHeader && cardBody) {
        cardHeader.innerHTML = window.originalHeroContent.header;
        cardBody.innerHTML = window.originalHeroContent.body;
    }
}

// --- СТАТУС "ОЖИДАНИЕ" ДЛЯ ПРОМО-КОДА ---
function showPromoWaitingStatus(code, campaign) {
    const cardHeader = document.querySelector('.card-header');
    const cardBody = document.querySelector('.card-body');

    if (!cardHeader || !cardBody) return;

    const planName = campaign.package === 'PROMO_BASIC' ? 'Базовый' :
        campaign.package === 'PROMO_EXTENDED' ? 'Расширенный' : 'Профессиональный';

    let actionText, telegramText, buttonText;
    const title = campaign.title || '';
    const description = campaign.description || '';

    if (title.includes('тестировщик') || title.includes('тестирование') ||
        description.includes('тестировщик') || description.includes('тестирование')) {
        actionText = "Напишите в Telegram для получения доступа:";
        telegramText = encodeURIComponent('Хочу участвовать в тестировании. Код: ' + code);
        buttonText = "НАПИСАТЬ ДЛЯ УЧАСТИЯ";
    }
    else if (title.includes('лотерея') || title.includes('розыгрыш') ||
        description.includes('лотерея') || description.includes('розыгрыш')) {
        actionText = "Отправьте данные для участия в лотерее:";
        telegramText = encodeURIComponent('Участвую в лотерее. Код: ' + code);
        buttonText = "УЧАСТВОВАТЬ В ЛОТЕРЕЕ";
    }
    else if (title.includes('подписк') || description.includes('подписк')) {
        actionText = "Отправьте скриншот подписки и этот код в Telegram:";
        telegramText = encodeURIComponent('Промо-акция! Код: ' + code + '. Скриншот прикреплён.');
        buttonText = "ОТПРАВИТЬ СКРИНШОТ В TELEGRAM";
    }
    else {
        actionText = "Отправьте данные для участия в акции:";
        telegramText = encodeURIComponent('Промо-акция! Код: ' + code);
        buttonText = "УЧАСТВОВАТЬ В АКЦИИ";
    }

    cardHeader.innerHTML = `<i class="fas fa-clock"></i> Акция: ${planName}`;
    cardBody.innerHTML = `
        <div style="text-align: left;">
            <p style="font-weight: bold; color: #e67e22; margin-bottom: 10px;">
                <i class="fas fa-hourglass-half"></i> Статус: ОЖИДАНИЕ ПОДТВЕРЖДЕНИЯ
            </p>
            <p style="margin-bottom: 10px;">Вы участвуете в акции. Сохраните ваш код:</p>
            <div style="background: #f7fafc; padding: 10px; border-radius: 6px; margin-bottom: 15px; font-family: monospace; font-weight: bold; text-align: center;">
                ${code}
            </div>
            <p style="font-size: 0.9rem; margin-bottom: 15px;">
                <strong>${actionText}</strong>
            </p>
            <a href="https://t.me/chearu252?text=${telegramText}" 
               target="_blank" 
               style="display: block; background: #0088cc; color: white; padding: 12px; border-radius: 6px; text-decoration: none; text-align: center; font-weight: 600;">
               <i class="fab fa-telegram"></i> ${buttonText}
            </a>
            <p style="font-size: 0.8rem; color: #718096; margin-top: 15px;">
                ⚠️ После активации код будет действовать ${campaign.expires_days || 30} дней
            </p>
        </div>
    `;

    // hideQuestionnaireBlock будет вызван из main script при необходимости
}

// --- СТАТУС "АКТИВИРОВАН" ДЛЯ ПРОМО-КОДА ---
export async function showPromoActivatedStatus(API_BASE, promoCode) {
    if (!promoCode) return;

    try {
        const response = await fetch(`${API_BASE}/check-status?code=${promoCode}`);
        const status = await response.json();

        if (!status.code || !status.active) {
            console.log('Промо-код не активен или удалён');
            return;
        }

        const cardHeader = document.querySelector('.card-header');
        const cardBody = document.querySelector('.card-body');

        if (cardHeader && cardBody) {
            cardHeader.innerHTML = `<i class="fas fa-check-circle"></i> Акция: АКТИВИРОВАНА`;
            cardBody.innerHTML = `
                <div style="text-align: center;">
                    <p style="margin-bottom: 20px; font-weight: 600;">
                        <strong>Ваш промо-доступ активирован!</strong> Все инструменты цифрового адвоката разблокированы.
                    </p>
                    <a href="https://chearu-stack.github.io/chea/chat.html?access_code=${promoCode}" 
                       target="_blank"
                       style="display: block; background: #27ae60; color: white; padding: 15px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                       ВХОД В ЛИЧНЫЙ КАБИНЕТ
                    </a>
                    <p style="font-size: 0.9rem; color: #718096; margin-top: 15px;">
                        Промо-код: <code>${promoCode}</code>
                    </p>
                    <p style="font-size: 0.8rem; color: #718096; margin-top: 10px;">
                        ⚠️ Доступ действует 30 дней с момента активации
                    </p>
                </div>
            `;
        }

    } catch (error) {
        console.error('Ошибка проверки промо-кода:', error);
    }
}
