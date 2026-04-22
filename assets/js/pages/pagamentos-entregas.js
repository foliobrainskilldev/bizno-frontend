let currentContactData = {};

document.addEventListener('DOMContentLoaded', () => {
    loadPaymentData();
    document.getElementById('payments-form').addEventListener('submit', handlePaymentsSubmit);
});

async function loadPaymentData() {
    document.getElementById('skeleton-view').style.display = 'block';
    document.getElementById('payments-form').style.display = 'none';

    try {
        const result = await apiFetch('/contacts');
        currentContactData = result; 
        
        if (result.contacts && result.contacts.paymentMethods) {
            document.getElementById('acceptMpesa').checked = result.contacts.paymentMethods.mpesa === true;
            document.getElementById('acceptEmola').checked = result.contacts.paymentMethods.emola === true;
            document.getElementById('acceptTransfer').checked = result.contacts.paymentMethods.transfer === true;
        }
        
        if (result.deliverySettings) {
            document.getElementById('isDeliveryEnabled').checked = result.deliverySettings.isDeliveryEnabled === true;
            if (result.deliverySettings.freeDeliveryThreshold) {
                document.getElementById('freeDeliveryThreshold').value = result.deliverySettings.freeDeliveryThreshold;
            }
        }
        
        document.getElementById('skeleton-view').style.display = 'none';
        document.getElementById('payments-form').style.display = 'block';
    } catch (error) {
        showToast("Não foi possível carregar os dados.", 'error');
        document.getElementById('skeleton-view').style.display = 'none';
    }
}

async function handlePaymentsSubmit(event) {
    event.preventDefault();
    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.classList.add('btn-loading');
    
    const data = {
        showPhone: currentContactData.contacts && currentContactData.contacts.showPhone ? true : false,
        showEmail: currentContactData.contacts && currentContactData.contacts.showEmail ? true : false,
        showSocials: currentContactData.contacts && currentContactData.contacts.showSocials ? true : false,
        customWhatsappMessage: currentContactData.contacts && currentContactData.contacts.customWhatsappMessage ? currentContactData.contacts.customWhatsappMessage : '',
        socials: currentContactData.contacts && currentContactData.contacts.socials ? currentContactData.contacts.socials : { facebook: '', instagram: '', tiktok: '' },
        
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
        await apiFetch('/contacts', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        showToast('Pagamentos e Logística atualizados!', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        submitButton.classList.remove('btn-loading');
    }
}