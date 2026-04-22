let currentContactData = {};

document.addEventListener('DOMContentLoaded', () => {
    loadPageData();
    setupEventListeners();

    document.getElementById('logout-btn-mobile')?.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = '../auth/login';
    });
});

async function loadPageData() {
    document.getElementById('skeleton-view').style.display = 'block';
    document.getElementById('forms-container').style.display = 'none';
    try {
        const [accountData, contactsData] = await Promise.all([
            apiFetch('/my-account'),
            apiFetch('/contacts')
        ]);

        document.getElementById('displayName').value = accountData.account.displayName || '';
        document.getElementById('storeName').value = accountData.account.storeName || '';
        document.getElementById('whatsapp').value = accountData.account.whatsapp || '';

        currentContactData = contactsData; 

        const { contacts, deliverySettings } = contactsData;
        if (contacts) {
            document.getElementById('showPhone').checked = !!contacts.showPhone;
            document.getElementById('showSocials').checked = !!contacts.showSocials;
            document.getElementById('customWhatsappMessage').value = contacts.customWhatsappMessage || '';
            
            if (contacts.paymentMethods) {
                document.getElementById('acceptMpesa').checked = !!contacts.paymentMethods.mpesa;
                document.getElementById('acceptEmola').checked = !!contacts.paymentMethods.emola;
                document.getElementById('acceptTransfer').checked = !!contacts.paymentMethods.transfer;
            }
        }
        if (deliverySettings) {
            document.getElementById('isDeliveryEnabled').checked = !!deliverySettings.isDeliveryEnabled;
            document.getElementById('freeDeliveryThreshold').value = deliverySettings.freeDeliveryThreshold || '';
        }
        
        document.getElementById('skeleton-view').style.display = 'none';
        document.getElementById('forms-container').style.display = 'block';
    } catch (error) {
        showToast("Não foi possível carregar as suas configurações.", 'error');
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
        const result = await apiFetch('/my-account', { method: 'PUT', body: JSON.stringify(bodyData) });
        showToast(result.message, 'success');
        localStorage.setItem('biznoUserName', bodyData.displayName);
        setupGlobalUserAvatar();
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        submitButton.classList.remove('btn-loading');
    }
}

async function handleContactsSubmit(event) {
    event.preventDefault();
    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.classList.add('btn-loading');
    
    const bodyData = {
        showPhone: document.getElementById('showPhone').checked,
        showEmail: false, 
        showSocials: document.getElementById('showSocials').checked,
        customWhatsappMessage: document.getElementById('customWhatsappMessage').value,
        socials: currentContactData.contacts?.socials || { facebook: '', instagram: '', tiktok: '' },
        paymentMethods: {
            mpesa: document.getElementById('acceptMpesa').checked,
            emola: document.getElementById('acceptEmola').checked,
            transfer: document.getElementById('acceptTransfer').checked,
            onDelivery: false
        },
        deliverySettings: {
            isDeliveryEnabled: document.getElementById('isDeliveryEnabled').checked,
            freeDeliveryThreshold: document.getElementById('freeDeliveryThreshold').value,
            provinceShipping: { enabled: false, cost: 0 }
        }
    };
    
    try {
        await apiFetch('/contacts', { method: 'POST', body: JSON.stringify(bodyData) });
        showToast('Configurações salvas com sucesso!');
    } catch (error) {
        showToast(`Erro ao salvar: ${error.message}`, 'error');
    } finally {
        submitButton.classList.remove('btn-loading');
    }
}

function setupEventListeners() {
    document.getElementById('account-form')?.addEventListener('submit', handleAccountSubmit);
    document.getElementById('contacts-form')?.addEventListener('submit', handleContactsSubmit);
    
    document.getElementById('storeName')?.addEventListener('input', (e) => {
        e.target.value = e.target.value.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
    });
}