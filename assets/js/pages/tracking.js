document.addEventListener('DOMContentLoaded', () => {
    loadTrackingData();
    document.getElementById('tracking-form').addEventListener('submit', handleTrackingSubmit);
});

async function loadTrackingData() {
    document.getElementById('skeleton-view').style.display = 'block';
    document.getElementById('tracking-form').style.display = 'none';

    try {
        const result = await apiFetch('/visual');
        if (result.visual) {
            document.getElementById('fbPixel').value = result.visual.fbPixel || '';
            document.getElementById('googleAnalytics').value = result.visual.googleAnalytics || '';
        }
        
        document.getElementById('skeleton-view').style.display = 'none';
        document.getElementById('tracking-form').style.display = 'block';
    } catch (error) {
        showToast("Não foi possível carregar os dados de tracking.", "error");
        document.getElementById('skeleton-view').style.display = 'none';
    }
}

async function handleTrackingSubmit(event) {
    event.preventDefault();
    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.classList.add('btn-loading');
    
    const data = {
        fbPixel: document.getElementById('fbPixel').value,
        googleAnalytics: document.getElementById('googleAnalytics').value
    };

    try {
        await apiFetch('/visual', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        showToast('IDs de Tracking salvos com sucesso!', 'success');
    } catch (error) {
        showToast(`Erro ao salvar: ${error.message}`, 'error');
    } finally {
        submitButton.classList.remove('btn-loading');
    }
}