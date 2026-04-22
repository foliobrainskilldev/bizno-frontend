document.addEventListener('DOMContentLoaded', () => {
    fetchDashboardData();
    setupEmailVerificationBanner();

    document.getElementById('copy-url-btn')?.addEventListener('click', () => {
        const urlDesk = document.getElementById('nav-public-store-desk');
        if (urlDesk && urlDesk.href) {
            navigator.clipboard.writeText(urlDesk.href).then(() => showToast('URL copiada!'));
        }
    });
});

function setupEmailVerificationBanner() {
    if (localStorage.getItem('biznoIsVerified') === 'false') {
        const banner = document.getElementById('email-verify-banner');
        if (banner) banner.style.display = 'flex';
    }

    document.getElementById('btn-verify-now')?.addEventListener('click', async () => {
        const userEmail = localStorage.getItem('biznoUserEmail');
        if (!userEmail) return window.location.href = '../auth/verify';

        toggleLoader(true);
        try {
            await fetch(`${API_URL}/resend-verification`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: userEmail })
            });
        } catch {}
        window.location.href = `../auth/verify?email=${encodeURIComponent(userEmail)}`;
    });
}

function startTour(hasProducts) {
    if (localStorage.getItem('biznoTourDone') === 'true') return;

    const tour = new Shepherd.Tour({
        useModalOverlay: true, defaultStepOptions: { cancelIcon: { enabled: true }, scrollTo: { behavior: 'smooth', block: 'center' } }
    });

    tour.addStep({
        id: 'welcome', title: 'Bem-vindo(a) ao Bizno! 🎉', text: 'Vamos dar uma volta rápida pelo seu painel?',
        buttons: [{ text: 'Pular', action: tour.cancel, classes: 'shepherd-button-secondary' }, { text: 'Vamos lá!', action: tour.next }]
    });

    if (!hasProducts) {
        tour.addStep({ id: 'add-product', title: 'O Primeiro Passo', text: 'Tudo começa ao adicionar o seu primeiro produto!', attachTo: { element: '#tour-onboarding', on: 'bottom' }, buttons: [{ text: 'Entendido!', action: tour.next }]});
    } else {
        tour.addStep({ id: 'store-link', title: 'Partilhe a sua Loja', text: 'Copie e envie o seu link aos clientes pelo WhatsApp.', attachTo: { element: '#tour-link', on: 'bottom' }, buttons: [{ text: 'Próximo', action: tour.next }]});
        tour.addStep({ id: 'store-stats', title: 'Acompanhe as Vendas', text: 'Veja as suas visitas e pedidos diários aqui.', attachTo: { element: '#tour-stats', on: 'top' }, buttons: [{ text: 'Mãos à Obra!', action: tour.next }]});
    }

    const markDone = () => localStorage.setItem('biznoTourDone', 'true');
    tour.on('complete', markDone);
    tour.on('cancel', markDone);
    tour.start();
}

async function fetchDashboardData() {
    document.getElementById('skeleton-view').style.display = 'block';
    document.getElementById('dashboard-view').style.display = 'none';
    document.getElementById('onboarding-view').style.display = 'none';

    try {
        const res = await apiFetch('/dashboard');
        document.getElementById('skeleton-view').style.display = 'none';
        populateDashboard(res.data);
        setTimeout(() => startTour(res.data.productCount > 0), 500);
    } catch {
        document.getElementById('skeleton-view').style.display = 'none';
        showToast('Erro de conexão ao carregar o painel.', 'error');
    }
}

function populateDashboard(data) {
    const safeStoreName = escapeHTML(data.storeName || 'loja');
    const storeUrl = `https://${safeStoreName.toLowerCase().replace(/\s+/g, '-')}.bizno.store`;

    const deskLink = document.getElementById('nav-public-store-desk');
    const urlDisplay = document.getElementById('store-url-display');
    if (deskLink) deskLink.href = storeUrl;
    if (urlDisplay) urlDisplay.textContent = storeUrl.replace('https://', '');

    if (data.productCount === 0) {
        document.getElementById('onboarding-view').style.display = 'block';
        document.getElementById('welcome-message-new').textContent = `Bem-vindo(a), ${safeStoreName}!`;
    } else {
        document.getElementById('dashboard-view').style.display = 'block';
        document.getElementById('welcome-message').textContent = `Bem-vindo(a) de volta, ${safeStoreName}!`;
        document.getElementById('stat-products').textContent = data.productCount;
        document.getElementById('stat-orders').textContent = data.orderCount;
        document.getElementById('stat-visits').textContent = data.totalVisits;
        handlePlanNotifications(data);
    }
}

function handlePlanNotifications(data) {
    const notification = document.getElementById('plan-notification');
    const upgradeBtn = notification.querySelector('.upgrade-btn');
    if (!notification) return;

    document.getElementById('downgrade-free-btn')?.remove();
    const isExpired = data.planExpiresAt && new Date(data.planExpiresAt) < new Date();

    if (isExpired) {
        notification.style.display = 'flex';
        notification.className = 'plan-notification danger';
        document.getElementById('notification-icon').setAttribute('icon', 'solar:danger-triangle-bold-duotone');
        document.getElementById('notification-title').textContent = 'O seu plano expirou!';
        document.getElementById('notification-text').textContent = 'A loja está offline. Renove ou volte ao plano grátis.';
        if (upgradeBtn) { upgradeBtn.textContent = 'Renovar Plano'; upgradeBtn.href = '/dashboard/planos'; }

        const btnGroup = document.createElement('div');
        btnGroup.id = 'downgrade-free-btn';
        btnGroup.style.cssText = 'display:flex; gap:10px;';
        
        const downgradeBtn = document.createElement('button');
        downgradeBtn.textContent = 'Voltar ao Free';
        downgradeBtn.className = 'secondary-btn';
        downgradeBtn.style.cssText = 'border:none; padding:10px 20px; border-radius:6px; font-weight:800; cursor:pointer;';
        
        downgradeBtn.onclick = async () => {
            downgradeBtn.textContent = 'Aguarde...';
            downgradeBtn.disabled = true;
            try {
                const res = await fetch(`${API_URL}/my-plan/downgrade`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }});
                const result = await res.json();
                if (result.success) setTimeout(() => window.location.reload(), 1500);
                else { showToast(result.message, 'error'); downgradeBtn.textContent = 'Voltar ao Free'; downgradeBtn.disabled = false; }
            } catch {
                showToast('Erro ao processar.', 'error');
                downgradeBtn.disabled = false;
            }
        };

        if (upgradeBtn) upgradeBtn.parentNode.insertBefore(btnGroup, upgradeBtn);
        btnGroup.append(downgradeBtn, upgradeBtn);

    } else if (data.currentPlan === 'Free') {
        notification.style.display = 'flex';
        notification.className = 'plan-notification warning';
        document.getElementById('notification-icon').setAttribute('icon', 'solar:info-circle-bold-duotone');
        document.getElementById('notification-title').textContent = 'Plano Grátis';
        document.getElementById('notification-text').textContent = 'Aproveite o catálogo! Faça upgrade quando estiver pronto.';
        if (upgradeBtn) { upgradeBtn.textContent = 'Ver Planos'; upgradeBtn.href = '/dashboard/planos'; }
    } else {
        notification.style.display = 'none';
    }
}