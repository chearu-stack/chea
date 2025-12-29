// ========== КОНФИГУРАЦИЯ ==========
const API_BASE = 'https://chea.onrender.com';
const ADMIN_PASS = "amg2025";

// ========== АВТОРИЗАЦИЯ ==========
window.addEventListener('DOMContentLoaded', function() {
    if (sessionStorage.getItem('adminAuth') === 'true') {
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('adminPage').style.display = 'block';
        loadPromoCodes();
        loadCampaigns();
    } else {
        document.getElementById('loginOverlay').style.display = 'flex';
        document.getElementById('adminPage').style.display = 'none';
        
        setTimeout(() => {
            const passInput = document.getElementById('adminPass');
            if (passInput) passInput.focus();
        }, 100);
    }
});

function checkAuth() {
    const input = document.getElementById('adminPass');
    const enteredPass = input ? input.value : '';
    
    if (enteredPass === ADMIN_PASS) {
        sessionStorage.setItem('adminAuth', 'true');
        
        const loginBtn = document.querySelector('.admin-login-btn');
        if (loginBtn) {
            loginBtn.textContent = '✅ Успешно!';
            loginBtn.style.background = '#38a169';
            loginBtn.disabled = true;
        }
        
        setTimeout(() => {
            location.reload();
        }, 800);
    } else {
        alert("❌ Неверный пароль");
        if (input) {
            input.value = '';
            input.focus();
            input.style.borderColor = '#e53e3e';
            setTimeout(() => input.style.borderColor = '', 2000);
        }
    }
}

document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && document.getElementById('loginOverlay').style.display !== 'none') {
        checkAuth();
    }
});

function logout() {
    sessionStorage.removeItem('adminAuth');
    location.reload();
}

// ========== ФОРМА СОЗДАНИЯ АКЦИИ ==========
function showCreateCampaignForm() {
    document.getElementById('createCampaignSection').style.display = 'block';
}

function hideCreateCampaignForm() {
    document.getElementById('createCampaignSection').style.display = 'none';
}

function selectColor(color) {
    document.getElementById('campaignColor').value = color;
}

// ========== УПРАВЛЕНИЕ АКЦИЯМИ (PROMO_CAMPAIGN) ==========
async function loadCampaigns() {
    const campaignsList = document.getElementById('campaignsList');
    if (!campaignsList) return;
    
    campaignsList.innerHTML = '<div class="empty-state">⏳ Загрузка акций...</div>';
    
    try {
        const response = await fetch(`${API_BASE}/get-active-campaign`);
        const campaign = await response.json();
        
        campaignsList.innerHTML = '';
        
        if (!campaign.active) {
            campaignsList.innerHTML = `
                <div class="empty-state">
                    <p>Нет активных акций</p>
                    <button onclick="showCreateCampaignForm()" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Создать первую акцию
                    </button>
                </div>
            `;
            return;
        }
        
        // Отображаем активную акцию
        campaignsList.innerHTML = `
            <div class="campaign-card" style="border-left: 4px solid ${campaign.color}">
                <div class="campaign-header">
                    <h3>${campaign.title}</h3>
                    <span class="status-badge status-active">АКТИВНА</span>
                </div>
                <div class="campaign-body">
                    <p>${campaign.description}</p>
                    <div class="campaign-details">
                        <div><strong>Тариф:</strong> ${campaign.package}</div>
                        <div><strong>Срок:</strong> ${campaign.expires_days} дней</div>
                        <div><strong>Цвет:</strong> <span class="color-dot" style="background: ${campaign.color}"></span></div>
                    </div>
                </div>
                <div class="campaign-actions">
                    <button onclick="deactivateCampaign()" class="btn btn-outline">
                        <i class="fas fa-pause"></i> Остановить акцию
                    </button>
                </div>
            </div>
        `;
        
    } catch (error) {
        campaignsList.innerHTML = `<div class="error-state">❌ Ошибка загрузки: ${error.message}</div>`;
    }
}

async function createCampaign() {
    const title = document.getElementById('campaignTitle').value.trim();
    const description = document.getElementById('campaignDescription').value.trim();
    const packageType = document.getElementById('campaignPackage').value;
    const expiresDays = document.getElementById('campaignExpiresDays').value;
    const color = document.getElementById('campaignColor').value;
    
    if (!title || !description) {
        alert('Заполните название и описание акции');
        return;
    }
    
    try {
        // Создаём запись PROMO_CAMPAIGN в БД
        const response = await fetch(`${API_BASE}/generate-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: `PROMO_CAMPAIGN_${Date.now()}`,
                package: 'PROMO_CAMPAIGN',
                caps_limit: 0,
                is_active: true,
                metadata: {
                    title: title,
                    description: description,
                    package: packageType,
                    expires_days: parseInt(expiresDays),
                    color: color,
                    created_at: new Date().toISOString()
                }
            })
        });
        
        const data = await response.json();
        
        if (data.success || response.ok) {
            alert('✅ Акция создана! Баннер появится на главной странице.');
            hideCreateCampaignForm();
            loadCampaigns();
        } else {
            throw new Error(data.error || 'Ошибка создания акции');
        }
        
    } catch (error) {
        alert(`❌ Ошибка: ${error.message}`);
    }
}

async function deactivateCampaign() {
    if (!confirm('Остановить акцию? Баннер исчезнет с главной страницы.')) return;
    
    try {
        // Находим и деактивируем запись PROMO_CAMPAIGN
        const response = await fetch(`${API_BASE}/get-active-campaign`);
        const campaign = await response.json();
        
        if (!campaign.active) {
            alert('Акция уже не активна');
            return;
        }
        
        // Деактивируем через стандартный эндпоинт
        const deactivateRes = await fetch(`${API_BASE}/activate-code?code=PROMO_CAMPAIGN&is_active=false`);
        
        if (deactivateRes.ok) {
            alert('✅ Акция остановлена');
            loadCampaigns();
        } else {
            throw new Error('Ошибка деактивации');
        }
        
    } catch (error) {
        alert(`❌ Ошибка: ${error.message}`);
    }
}

// ========== ПРОМО-КОДЫ (PROMO_%) ==========
async function loadPromoCodes() {
    const tbody = document.getElementById('promoCodesBody');
    const filter = document.getElementById('promoFilter')?.value || 'all';
    
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6">⏳ Загрузка промо-кодов...</td></tr>';
    
    try {
        const response = await fetch(`${API_BASE}/get-promo-codes`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        let promoCodes = await response.json();
        
        // Фильтрация
        if (filter !== 'all') {
            if (filter === 'pending') {
                promoCodes = promoCodes.filter(p => !p.is_active);
            } else if (filter === 'active') {
                promoCodes = promoCodes.filter(p => p.is_active);
            } else {
                promoCodes = promoCodes.filter(p => p.package === filter);
            }
        }
        
        tbody.innerHTML = '';
        
        if (!promoCodes || promoCodes.length === 0) {
            tbody.innerHTML = `
                <tr><td colspan="6" class="empty-row">
                    🤷 Нет промо-кодов
                    ${filter !== 'all' ? 'с выбранным фильтром' : ''}
                </td></tr>
            `;
            return;
        }
        
        // Сортировка по дате создания (новые сверху)
        promoCodes.sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
            const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
            return dateB - dateA;
        });
        
        promoCodes.forEach(promo => {
            const row = document.createElement('tr');
            
            // Определяем тип тарифа
            let tariffName = 'Базовый';
            if (promo.package === 'PROMO_EXTENDED') tariffName = 'Расширенный';
            if (promo.package === 'PROMO_SUBSCRIPTION') tariffName = 'Профессиональный';
            
            // Дата создания
            let createdDate = '—';
            if (promo.created_at) {
                const date = new Date(promo.created_at);
                createdDate = date.toLocaleDateString('ru-RU');
            }
            
            // Статус
            const status = promo.is_active ? 
                '<span class="status-badge status-active">АКТИВЕН</span>' : 
                '<span class="status-badge status-pending">ОЖИДАНИЕ</span>';
            
            // Кнопки действий
            let actionButton = '';
            if (!promo.is_active) {
                actionButton = `
                    <button onclick="activatePromoCode('${promo.code}', '${promo.package}')" class="btn-activate">
                        ✅ Активировать
                    </button>
                `;
            } else {
                actionButton = `
                    <button onclick="deactivatePromoCode('${promo.code}')" class="btn-deactivate">
                        ⏸️ Деактивировать
                    </button>
                `;
            }
            
            row.innerHTML = `
                <td><strong>${promo.code}</strong></td>
                <td><span class="package-badge">${tariffName}</span></td>
                <td>${status}</td>
                <td>${createdDate}</td>
                <td>${promo.caps_used || 0} / ${promo.caps_limit || 0}</td>
                <td>${actionButton}</td>
            `;
            tbody.appendChild(row);
        });
        
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" class="error-row">❌ Ошибка: ${error.message}</td></tr>`;
    }
}

// Активация промо-кода
async function activatePromoCode(code, packageType) {
    const capsLimits = {
        'PROMO_BASIC': 30000,
        'PROMO_EXTENDED': 60000,
        'PROMO_SUBSCRIPTION': 90000
    };
    
    const limit = capsLimits[packageType] || 30000;
    
    if (!confirm(`Активировать промо-код?\n\nКод: ${code}\nТариф: ${packageType}\nЛимит: ${limit} CAPS`)) {
        return;
    }
    
    try {
        const params = new URLSearchParams({
            code: code,
            caps_limit: limit.toString(),
            is_active: 'true'
        });
        
        const response = await fetch(`${API_BASE}/activate-code?${params.toString()}`);
        const data = await response.json();
        
        if (data.success || (response.ok && !data.error)) {
            alert(`✅ Промо-код активирован!\nДоступ на 30 дней.`);
            loadPromoCodes();
        } else {
            const errorMsg = data.error || data.message || 'Неизвестная ошибка';
            alert(`❌ Ошибка: ${errorMsg}`);
        }
    } catch (error) {
        console.error('❌ Ошибка сети:', error);
        alert('❌ Ошибка связи с сервером');
    }
}

// Деактивация промо-кода
async function deactivatePromoCode(code) {
    if (!confirm(`Деактивировать промо-код ${code}?\n\nПользователь потеряет доступ.`)) {
        return;
    }
    
    try {
        const params = new URLSearchParams({
            code: code,
            is_active: 'false'
        });
        
        const response = await fetch(`${API_BASE}/activate-code?${params.toString()}`);
        const data = await response.json();
        
        if (data.success || (response.ok && !data.error)) {
            alert(`✅ Промо-код деактивирован`);
            loadPromoCodes();
        } else {
            alert(`❌ Ошибка: ${data.error || data.message}`);
        }
    } catch (error) {
        alert('❌ Ошибка связи с сервером');
    }
}

// Автообновление
setInterval(() => {
    if (sessionStorage.getItem('adminAuth') === 'true') {
        loadPromoCodes();
        loadCampaigns();
    }
}, 30000);

// ========== ЭКСПОРТ ФУНКЦИЙ ==========
window.checkAuth = checkAuth;
window.logout = logout;
window.loadPromoCodes = loadPromoCodes;
window.showCreateCampaignForm = showCreateCampaignForm;
window.hideCreateCampaignForm = hideCreateCampaignForm;
window.selectColor = selectColor;
window.createCampaign = createCampaign;
window.deactivateCampaign = deactivateCampaign;
window.activatePromoCode = activatePromoCode;
window.deactivatePromoCode = deactivatePromoCode;
