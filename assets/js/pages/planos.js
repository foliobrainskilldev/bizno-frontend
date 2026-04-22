let allPlans = [];
let currentUserPlan = {};
let currentUsage = { productCount: 0 };

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentRef = urlParams.get('reference') || urlParams.get('id') || urlParams.get('tx_ref');

    setupCustomDropdowns();

    if (paymentRef) {
        verifyPaymentSecurely(paymentRef, 1);
    } else {
        loadPageData();
        setupEventListeners();
    }
});

function setupCustomDropdowns() {
    const customSelects = document.querySelectorAll('.custom-select-container');
    
    customSelects.forEach(select => {
        const selected = select.querySelector('.select-selected');
        const itemsList = select.querySelector('.select-items');
        const textSpan = selected.querySelector('span');

        selected.addEventListener('click', function(e) {
            e.stopPropagation();
            closeAllSelects(select);
            itemsList.classList.toggle('select-hide');
            selected.classList.toggle('select-arrow-active');
        });

        itemsList.addEventListener('click', function(e) {
            const option = e.target.closest('.select-option');
            if (!option) return;

            textSpan.innerHTML = option.innerHTML; 
            select.setAttribute('data-value', option.getAttribute('data-value'));
            
            const siblings = itemsList.querySelectorAll('.select-option');
            siblings.forEach(sib => sib.classList.remove('same-as-selected'));
            option.classList.add('same-as-selected');

            itemsList.classList.add('select-hide');
            selected.classList.remove('select-arrow-active');
        });
    });

    document.addEventListener('click', closeAllSelects);
}

function closeAllSelects(exceptThis) {
    const selects = document.querySelectorAll('.select-items');
    const selecteds = document.querySelectorAll('.select-selected');
    
    selects.forEach((list, index) => {
        if (list.parentElement !== exceptThis) {
            list.classList.add('select-hide');
            selecteds[index].classList.remove('select-arrow-active');
        }
    });
}

async function verifyPaymentSecurely(reference, attempt = 1) {
    const verifyOverlay = document.getElementById('payment-verify-overlay');
    const verifyCard = document.getElementById('verify-card-content');
    
    verifyOverlay.style.display = 'flex'; 
    
    if (attempt === 3) {
        document.getElementById('verify-title').textContent = 'A aguardar operadora...';
        document.getElementById('verify-desc').textContent = 'Se inseriu o PIN errado ou tem saldo insuficiente, a operadora pode demorar até 1 minuto a confirmar a falha. Aguarde...';
    }

    try {
        const verifyRes = await fetch(`${API_URL}/payment/verify/${reference}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const verifyData = await verifyRes.json();

        if (verifyData.success) {
            if (verifyData.status === 'approved') {
                verifyCard.innerHTML = `
                    <iconify-icon icon="solar:check-circle-bold" style="font-size: 5rem; margin-bottom:10px;"></iconify-icon>
                    <h2>Pagamento Aprovado!</h2>
                    <p>O seu plano já está ativo e a funcionar.</p>
                `;
                verifyCard.className = 'verify-card success-mode'; 
                
                setTimeout(() => finalizeVerification(verifyOverlay), 3000);
            } 
            else if (verifyData.status === 'pending') {
                if (attempt < 24) {
                    setTimeout(() => verifyPaymentSecurely(reference, attempt + 1), 5000);
                } else {
                    showToast('A operadora demorou muito a responder. Atualizaremos assim que a confirmação chegar.', 'info');
                    finalizeVerification(verifyOverlay);
                }
            } 
            else {
                verifyCard.innerHTML = `
                    <iconify-icon icon="solar:danger-circle-bold" style="font-size: 5rem; margin-bottom:10px;"></iconify-icon>
                    <h2>Pagamento Falhou</h2>
                    <p>${verifyData.message || 'Transação recusada por saldo insuficiente ou PIN incorreto.'}</p>
                `;
                verifyCard.className = 'verify-card error-mode'; 
                
                setTimeout(() => finalizeVerification(verifyOverlay), 4000);
            }
        } else {
            verifyCard.innerHTML = `
                <iconify-icon icon="solar:close-circle-bold" style="font-size: 5rem; margin-bottom:10px;"></iconify-icon>
                <h2>Erro ao Verificar</h2>
                <p>${verifyData.message || 'Ocorreu um problema ao comunicar com o servidor.'}</p>
            `;
            verifyCard.className = 'verify-card error-mode';
            
            setTimeout(() => finalizeVerification(verifyOverlay), 4000);
        }
    } catch (e) {
        if (attempt < 24) {
            setTimeout(() => verifyPaymentSecurely(reference, attempt + 1), 5000);
        } else {
            verifyCard.innerHTML = `
                <iconify-icon icon="solar:wifi-router-minimalistic-bold" style="font-size: 5rem; margin-bottom:10px;"></iconify-icon>
                <h2>Falha de Conexão</h2>
                <p>Verifique o seu histórico de pagamentos mais tarde.</p>
            `;
            verifyCard.className = 'verify-card error-mode';
            setTimeout(() => finalizeVerification(verifyOverlay), 4000);
        }
    }
}

function finalizeVerification(verifyOverlay) {
    window.history.replaceState({}, document.title, window.location.pathname);
    verifyOverlay.style.display = 'none';
    
    const card = document.getElementById('verify-card-content');
    card.className = 'verify-card';
    card.innerHTML = `
        <div class="spinner" id="verify-spinner" style="margin: 0 auto 20px;"></div>
        <h2 id="verify-title">A confirmar a transação...</h2>
        <p id="verify-desc">Por favor, aguarde enquanto validamos o seu pagamento com a operadora.</p>
    `;

    loadPageData();
    setupEventListeners();
}

async function loadPageData() {
    document.getElementById('overview-skeleton').style.display = 'grid';
    document.getElementById('overview-content').style.display = 'none';
    document.getElementById('plans-skeleton-grid').style.display = 'grid';
    document.getElementById('plans-grid').style.display = 'none';

    try {
        const [plansRes, myPlanRes, dashboardRes] = await Promise.all([
            fetch(`${API_URL}/plans`),
            fetch(`${API_URL}/my-plan`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_URL}/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (myPlanRes.status === 401) {
            localStorage.removeItem('biznoToken');
            window.location.href = '../auth/';
            return;
        }

        const plansData = await plansRes.json();
        const myPlanData = await myPlanRes.json();
        const dashData = await dashboardRes.json();

        if (plansData.success) allPlans = plansData.plans;
        if (myPlanData.success) currentUserPlan = myPlanData.plan;
        if (dashData.success) currentUsage.productCount = dashData.data.productCount;
        
        renderOverview();
        renderPlanCards();
        populatePlanDropdown();

        document.getElementById('overview-skeleton').style.display = 'none';
        document.getElementById('overview-content').style.display = 'grid';
        document.getElementById('plans-skeleton-grid').style.display = 'none';
        document.getElementById('plans-grid').style.display = 'grid';

    } catch (error) {
        showToast("Erro ao carregar os dados. Verifique a sua ligação.", "error");
    }
}

function renderOverview() {
    document.getElementById('current-plan-name').textContent = currentUserPlan.name || 'Desconhecido';
    
    const statusBadge = document.getElementById('plan-status-badge');
    statusBadge.textContent = currentUserPlan.status === 'free' ? 'Gratuito' : (currentUserPlan.status === 'active' ? 'Ativo' : 'Inativo');
    statusBadge.style.backgroundColor = currentUserPlan.status === 'active' ? 'var(--verde-sucesso)' : (currentUserPlan.status === 'free' ? 'var(--azul-info)' : 'var(--vermelho-alerta)');

    const expiryEl = document.getElementById('plan-expiry-text');
    if (currentUserPlan.expiresAt) {
        const date = new Date(currentUserPlan.expiresAt);
        expiryEl.textContent = `Expira em: ${date.toLocaleDateString('pt-PT')}`;
        if (date < new Date()) {
            expiryEl.textContent = "EXPIRADO";
            expiryEl.style.color = "#ff6b6b";
            expiryEl.style.fontWeight = "bold";
        }
    } else {
        expiryEl.textContent = "Vitalício / Sem validade";
    }

    const limit = currentUserPlan.productLimit;
    const count = currentUsage.productCount;
    const bar = document.getElementById('products-progress-bar');
    const text = document.getElementById('products-usage-text');

    if (limit === -1) {
        text.textContent = `${count} / Ilimitado`;
        bar.style.width = '100%';
        bar.style.backgroundColor = 'var(--verde-sucesso)';
    } else {
        text.textContent = `${count} / ${limit}`;
        const percentage = Math.min((count / limit) * 100, 100);
        bar.style.width = `${percentage}%`;
        
        if (percentage >= 100) { bar.className = 'progress-fill danger'; } 
        else if (percentage >= 80) { bar.className = 'progress-fill warning'; } 
        else { bar.className = 'progress-fill'; }
    }
}

function renderPlanCards() {
    const grid = document.getElementById('plans-grid');
    grid.innerHTML = '';
    
    allPlans.forEach(plan => {
        if (!plan.isVisible || plan.isCustom) return;
        
        const isCurrent = plan.name === currentUserPlan.name;
        const isFeatured = plan.name === 'Starter'; 
        
        const checkIcon = `<iconify-icon icon="solar:check-circle-bold" class="feature-check"></iconify-icon>`;
        const addIcon = `<iconify-icon icon="solar:add-circle-bold" class="feature-check"></iconify-icon>`;
        const crossIcon = `<iconify-icon icon="solar:close-circle-bold" class="feature-cross"></iconify-icon>`;
        
        let features = [];
        
        features.push({ name: plan.productLimit === -1 ? 'Produtos Ilimitados' : `Até ${plan.productLimit} produtos ativos`, allowed: true, icon: plan.productLimit > 5 ? addIcon : checkIcon });
        features.push({ name: plan.imageLimitPerProduct === -1 ? 'Fotos Ilimitadas' : `${plan.imageLimitPerProduct} foto(s) por produto`, allowed: true, icon: plan.imageLimitPerProduct > 1 ? addIcon : checkIcon });
        features.push({ name: 'Personalização de Cores', allowed: plan.hasColorCustomization, icon: plan.hasColorCustomization ? addIcon : crossIcon });
        features.push({ name: 'Produtos em Destaque', allowed: plan.hasFeaturedProducts, icon: plan.hasFeaturedProducts ? addIcon : crossIcon });
        features.push({ name: 'Suporte a Vídeos', allowed: plan.videoLimit > 0 || plan.videoLimit === -1, icon: (plan.videoLimit > 0 || plan.videoLimit === -1) ? addIcon : crossIcon });

        let supportStr = 'Suporte Básico';
        if (plan.hasSupport === 'priority') supportStr = 'Suporte Prioritário 24/7';
        if (plan.hasSupport === 'dedicated') supportStr = 'Gestor de Conta Dedicado';
        if (plan.hasSupport === 'faqs') supportStr = 'Suporte via FAQs';
        
        features.push({ name: supportStr, allowed: true, icon: plan.hasSupport === 'faqs' ? checkIcon : addIcon });

        let featuresHtml = features.map(f => `
            <li class="${!f.allowed ? 'feature-text disabled' : ''}">
                ${f.icon} ${f.name}
            </li>
        `).join('');

        const card = document.createElement('div');
        card.className = `plan-card ${isCurrent ? 'active-plan' : ''} ${isFeatured && !isCurrent ? 'featured' : ''}`;
        
        let badgeHtml = '';
        if (isCurrent) badgeHtml = '<div class="plan-badge current">Plano Atual</div>';
        else if (isFeatured) badgeHtml = '<div class="plan-badge recommended">Recomendado</div>';

        const buttonHtml = isCurrent 
            ? `<button class="primary-btn select-plan-btn" disabled>Seu Plano</button>`
            : `<button class="primary-btn select-plan-btn" data-plan-id="${plan.id}" data-plan-name="${plan.name}" ${plan.price === 0 ? 'disabled' : ''}>${plan.price === 0 ? 'Grátis' : 'Selecionar'}</button>`;

        card.innerHTML = `
            ${badgeHtml}
            <h2>${plan.name}</h2>
            <div class="price">${plan.price} <span>MZN/mês</span></div>
            <ul class="plan-features">${featuresHtml}</ul>
            ${buttonHtml}
        `;
        grid.appendChild(card);
    });
}

function populatePlanDropdown() {
    const list = document.getElementById('plan-options-list');
    list.innerHTML = ''; 
    
    allPlans.forEach(plan => {
        if (plan.price > 0) {
            const option = document.createElement('div');
            option.className = 'select-option';
            option.setAttribute('data-value', plan.id);
            option.innerHTML = `<strong>${plan.name}</strong> <span style="margin-left:auto; color:var(--texto-secundario);">${plan.price} MZN</span>`;
            list.appendChild(option);
        }
    });
}

async function handlePaymentSubmit(event) {
    event.preventDefault();
    const planSelect = document.getElementById('custom-plan-select');
    const providerSelect = document.getElementById('custom-provider-select');
    
    const planId = planSelect.getAttribute('data-value');
    const provider = providerSelect.getAttribute('data-value');
    
    if (!planId || !provider) {
        showToast('Por favor, selecione o plano e o método de pagamento.', 'error'); 
        return;
    }
    
    toggleLoader(true);
    
    try {
        const response = await fetch(`${API_URL}/payment/initiate`, {
            method: 'POST', 
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ planId, provider })
        });
        
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message);
        
        showToast('A redirecionar para a página de pagamento...', 'success');
        setTimeout(() => { window.location.href = result.checkoutUrl; }, 1500);

    } catch (error) {
        showToast(`${error.message}`, 'error');
        toggleLoader(false);
    }
}

function setupEventListeners(){
    document.getElementById('payment-form').addEventListener('submit', handlePaymentSubmit);

    document.getElementById('plans-grid').addEventListener('click', (e) => {
        const button = e.target.closest('.select-plan-btn');
        if (button && !button.disabled) {
            const planId = button.dataset.planId;
            const planName = button.dataset.planName;
            
            const selectContainer = document.getElementById('custom-plan-select');
            selectContainer.setAttribute('data-value', planId);
            
            const option = selectContainer.querySelector(`.select-option[data-value="${planId}"]`);
            if(option) {
                document.getElementById('plan-select-text').innerHTML = option.innerHTML;
                
                selectContainer.querySelectorAll('.select-option').forEach(s => s.classList.remove('same-as-selected'));
                option.classList.add('same-as-selected');
            }

            showToast(`Plano selecionado. Preencha o método de pagamento.`, 'success');
            document.querySelector('.payment-section').scrollIntoView({ behavior: 'smooth' });
        }
    });
}