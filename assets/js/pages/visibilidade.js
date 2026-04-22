let currentContactData = {};

document.addEventListener('DOMContentLoaded', () => {
    loadVisibilityData();
    document.getElementById('visibility-form').addEventListener('submit', handleVisibilitySubmit);
});

async function loadVisibilityData() {
    document.getElementById('skeleton-view').style.display = 'block';
    document.getElementById('visibility-form').style.display = 'none';

    try {
        const result = await apiFetch('/contacts');
        currentContactData = result; 
        
        if (result.contacts) {
            document.getElementById('showPhone').checked = result.contacts.showPhone === true;
            document.getElementById('showSocials').checked = result.contacts.showSocials === true;
            document.getElementById('customWhatsappMessage').value = result.contacts.customWhatsappMessage || '';
            
            if (result.contacts.socials) {
                document.getElementById('facebookLink').value = result.contacts.socials.facebook || '';
                document.getElementById('instagramLink').value = result.contacts.socials.instagram || '';
                document.getElementById('tiktokLink').value = result.contacts.socials.tiktok || '';
            }
        }
        
        document.getElementById('skeleton-view').style.display = 'none';
        document.getElementById('visibility-form').style.display = 'block';
    } catch (error) {
        showToast("Não foi possível carregar os dados.", 'error');
        document.getElementById('skeleton-view').style.display = 'none';
    }
}

async function handleVisibilitySubmit(event) {
    event.preventDefault();
    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.classList.add('btn-loading');
    
    const data = {
        showPhone: document.getElementById('showPhone').checked,
        showEmail: currentContactData.contacts && currentContactData.contacts.showEmail ? true : false,
        showSocials: document.getElementById('showSocials').checked,
        customWhatsappMessage: document.getElementById('customWhatsappMessage').value,
        socials: { 
            facebook: document.getElementById('facebookLink').value, 
            instagram: document.getElementById('instagramLink').value, 
            tiktok: document.getElementById('tiktokLink').value 
        },
        paymentMethods: currentContactData.contacts && currentContactData.contacts.paymentMethods ? currentContactData.contacts.paymentMethods : { mpesa: false, emola: false, transfer: false, onDelivery: false },
        deliverySettings: currentContactData.deliverySettings ? currentContactData.deliverySettings : { isDeliveryEnabled: false, freeDeliveryThreshold: 0, provinceShipping: { enabled: false, cost: 0 } }
    };
    
    try {
        await apiFetch('/contacts', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        showToast('Redes e Contatos atualizados!', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        submitButton.classList.remove('btn-loading');
    }
}