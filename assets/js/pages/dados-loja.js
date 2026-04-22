document.addEventListener('DOMContentLoaded', () => {
    loadAccountData();
    
    document.getElementById('account-form').addEventListener('submit', handleAccountSubmit);
    
    const storeNameInput = document.getElementById('storeName');
    if (storeNameInput) {
        storeNameInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
        });
    }
});

async function loadAccountData() {
    document.getElementById('skeleton-view').style.display = 'block';
    document.getElementById('account-form').style.display = 'none';

    try {
        const result = await apiFetch('/my-account');
        document.getElementById('displayName').value = result.account.displayName || '';
        document.getElementById('storeName').value = result.account.storeName || '';
        document.getElementById('whatsapp').value = result.account.whatsapp || '';

        document.getElementById('skeleton-view').style.display = 'none';
        document.getElementById('account-form').style.display = 'block';
    } catch (error) {
        showToast("Não foi possível carregar os dados.", 'error');
        document.getElementById('skeleton-view').style.display = 'none';
    }
}

async function handleAccountSubmit(event) {
    event.preventDefault();
    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.classList.add('btn-loading');
    
    const bodyData = {
        displayName: document.getElementById('displayName').value,
        storeName: document.getElementById('storeName').value,
        whatsapp: document.getElementById('whatsapp').value,
    };
    
    try {
        await apiFetch('/my-account', { method: 'PUT', body: JSON.stringify(bodyData) });
        
        showToast('Conta atualizada com sucesso!', 'success');
        localStorage.setItem('biznoUserName', bodyData.displayName);
        setupGlobalUserAvatar();
        
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        submitButton.classList.remove('btn-loading');
    }
}