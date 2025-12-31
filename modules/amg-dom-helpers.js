// ===================================================================
// МОДУЛЬ: DOM  хелперы
// ===================================================================

// --- УПРАВЛЕНИЕ БЛОКОМ АНАЛИЗА ---
export function hideQuestionnaireBlock() {
    const questionnaire = document.getElementById('questionnaire');
    if (questionnaire) {
        questionnaire.style.display = 'none';
        console.log('Блок анализа скрыт');
    }
}

export function showQuestionnaireBlock() {
    const questionnaire = document.getElementById('questionnaire');
    if (questionnaire) {
        questionnaire.style.display = 'block';
        console.log('Блок анализа показан');
    }
}

// --- УПРАВЛЕНИЕ КНОПКАМИ ТАРИФОВ ---
export function blockTariffButtons(message) {
    const buttons = document.querySelectorAll('.pricing-card .btn[data-plan]');
    buttons.forEach(btn => {
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
        btn.title = message;
        btn.setAttribute('disabled', 'disabled');
        btn.setAttribute('data-original-href', btn.getAttribute('href'));
        btn.removeAttribute('href');
    });
}

export function unlockTariffButtons() {
    const buttons = document.querySelectorAll('.pricing-card .btn[data-plan]');
    buttons.forEach(btn => {
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.title = '';
        btn.removeAttribute('disabled');
        const originalHref = btn.getAttribute('data-original-href');
        if (originalHref) {
            btn.setAttribute('href', originalHref);
            btn.removeAttribute('data-original-href');
        }
    });
}

// --- ВОССТАНОВЛЕНИЕ ОРИГИНАЛЬНОГО HERO-CARD ---
export function restoreOriginalHeroCard() {
    if (!window.originalHeroContent) return;

    const cardHeader = document.querySelector('.card-header');
    const cardBody = document.querySelector('.card-body');

    if (cardHeader && cardBody) {
        cardHeader.innerHTML = window.originalHeroContent.header;
        cardBody.innerHTML = window.originalHeroContent.body;
    }
}
