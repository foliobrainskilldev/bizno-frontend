document.addEventListener('DOMContentLoaded', () => {
    loadProfileData();
    document.getElementById('logout-btn-action')?.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '../auth/login';
    });
});

async function loadProfileData() {
    document.getElementById('skeleton-view').style.display = 'block';
    document.getElementById('content-view').style.display = 'none';

    try {
        const [accountData, visualData, planData] = await Promise.all([
            apiFetch('/my-account'), apiFetch('/visual'), apiFetch('/my-plan')
        ]);

        document.getElementById('profile-name').textContent = accountData.account.displayName || accountData.account.storeName;
        document.getElementById('profile-email').textContent = accountData.account.email;

        if (visualData.visual?.profileImage?.url) {
            document.getElementById('profile-avatar-preview').innerHTML = `<img src="${visualData.visual.profileImage.url}">`;
            localStorage.setItem('biznoUserAvatar', visualData.visual.profileImage.url);
        }

        const expiryEl = document.getElementById('profile-plan-expiry');
        document.getElementById('profile-plan-name').textContent = planData.plan?.name || 'Sem Subscrição';

        if (planData.plan?.expiresAt) {
            const expDate = new Date(planData.plan.expiresAt);
            if (expDate < new Date()) {
                expiryEl.textContent = "EXPIRADO";
                expiryEl.style.color = "var(--vermelho-alerta)";
            } else {
                expiryEl.textContent = `Expira: ${expDate.toLocaleDateString('pt-PT')}`;
                expiryEl.style.color = "var(--dourado)";
            }
        } else if (planData.plan) {
            expiryEl.textContent = `Vitalício`;
            expiryEl.style.color = "var(--dourado)";
        }

        document.getElementById('skeleton-view').style.display = 'none';
        document.getElementById('content-view').style.display = 'block';
    } catch {
        showToast("Falha ao carregar perfil.", 'error');
        document.getElementById('skeleton-view').style.display = 'none';
    }
}