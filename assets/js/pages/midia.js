document.addEventListener('DOMContentLoaded', () => {
    loadPageData();
    setupEventListeners();
});

async function loadPageData() {
    document.getElementById('skeleton-view').style.display = 'block';
    document.getElementById('content-view').style.display = 'none';

    try {
        const result = await apiFetch('/visual');
        if (result.visual) {
            document.getElementById('storeDescription').value = result.visual.storeDescription || '';
            if (result.visual.profileImage) updatePreview('logo', result.visual.profileImage.url);
        }
        
        document.getElementById('skeleton-view').style.display = 'none';
        document.getElementById('content-view').style.display = 'block';
    } catch (error) {
        showToast("Não foi possível carregar os dados.", "error");
        document.getElementById('skeleton-view').style.display = 'none';
    }
}

function setupEventListeners() {
    document.getElementById('description-form').addEventListener('submit', handleDescriptionSubmit);
    document.getElementById('logo-file-input').addEventListener('change', (e) => handleFileUpload(e, 'logo', '/media/profile', 'profileImage'));
    
    const descInput = document.getElementById('storeDescription');
    if (descInput) {
        descInput.setAttribute('maxlength', '160');
        
        let counterEl = document.getElementById('desc-char-counter');
        if (!counterEl) {
            counterEl = document.createElement('small');
            counterEl.id = 'desc-char-counter';
            counterEl.className = 'char-counter';
            descInput.parentNode.appendChild(counterEl);
        }
        
        const updateCounter = () => {
            const currentLen = descInput.value.length;
            counterEl.textContent = `${currentLen}/160 caracteres`;
            if(currentLen >= 160) {
                counterEl.classList.add('limit-reached');
            } else {
                counterEl.classList.remove('limit-reached');
            }
        };
        
        descInput.addEventListener('input', updateCounter);
        setTimeout(updateCounter, 500); 
    }
}

async function handleDescriptionSubmit(event) {
    event.preventDefault();
    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.classList.add('btn-loading');
    
    const description = document.getElementById('storeDescription').value;

    try {
        await apiFetch('/visual', {
            method: 'POST',
            body: JSON.stringify({ storeDescription: description })
        });
        showToast('Descrição salva com sucesso!');
    } catch (error) {
        showToast(`Erro ao salvar: ${error.message}`, 'error');
    } finally {
        submitButton.classList.remove('btn-loading');
    }
}

async function handleFileUpload(event, type, endpointUrl, endpointKey) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        showToast('O ficheiro excede o limite de 5MB.', 'error');
        event.target.value = '';
        return;
    }
    if (!file.type.startsWith('image/')) {
        showToast('Por favor, selecione uma imagem válida.', 'error');
        event.target.value = '';
        return;
    }

    toggleLoader(true);

    const formData = new FormData();
    formData.append(endpointKey, file);

    try {
        const result = await apiFetch(endpointUrl, {
            method: 'POST',
            body: formData
        });
        
        showToast(`Imagem atualizada com sucesso!`);
        updatePreview(type, result.url);

    } catch (error) {
        showToast(`Erro ao enviar a imagem: ${error.message}`, 'error');
    } finally {
        toggleLoader(false);
        event.target.value = '';
    }
}

function updatePreview(type, url) {
    const previewEl = document.getElementById(`${type}-preview`);
    previewEl.innerHTML = `<img src="${url}" alt="Pré-visualização do ${type}">`;
}