let categoriesCache = [];
let categoryToDeleteId = null;
let isEditMode = false;

document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    setupEventListeners();
});

async function loadCategories() {
    document.getElementById('skeleton-view').style.display = 'block';
    document.getElementById('content-view').style.display = 'none';

    try {
        const data = await apiFetch('/categories');
        categoriesCache = data.categories;
        renderCategories();
        
        document.getElementById('skeleton-view').style.display = 'none';
        document.getElementById('content-view').style.display = 'block';
    } catch (error) {
        showToast(error.message, 'error');
        document.getElementById('skeleton-view').style.display = 'none';
    }
}

function renderCategories() {
    const tbody = document.getElementById('categories-tbody');
    const mobileList = document.getElementById('categories-list-mobile');
    if(!tbody || !mobileList) return;

    tbody.innerHTML = ''; 
    mobileList.innerHTML = '';
    
    if (categoriesCache.length === 0) {
        const noDataMsg = `
            <div class="onboarding-container" style="margin-top:0; padding: 30px 15px;">
                <iconify-icon icon="solar:archive-down-minimlistic-bold-duotone"></iconify-icon>
                <h3>Sem Categorias</h3>
                <p>Organize o seu catálogo adicionando a primeira categoria.</p>
            </div>`;
        tbody.innerHTML = `<tr><td colspan="3">${noDataMsg}</td></tr>`;
        mobileList.innerHTML = noDataMsg;
        return;
    }

    categoriesCache.forEach(cat => {
        const safeName = escapeHTML(cat.name);
        const imageUrl = cat.image?.url || 'https://via.placeholder.com/50';
        
        const actionsHtml = `
            <button class="edit-btn" data-id="${cat.id}" title="Editar" style="background: none; border: none; color: var(--laranja-aviso); font-size: 1.5rem; cursor: pointer; margin-right: 10px;"><iconify-icon icon="solar:pen-new-square-linear"></iconify-icon></button>
            <button class="delete-btn" data-id="${cat.id}" title="Apagar" style="background: none; border: none; color: var(--vermelho-alerta); font-size: 1.5rem; cursor: pointer;"><iconify-icon icon="solar:trash-bin-trash-bold"></iconify-icon></button>
        `;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="width: 70px;"><img src="${imageUrl}" class="category-img-cell" alt="${safeName}"></td>
            <td><strong style="word-break: break-word;">${safeName}</strong></td>
            <td style="text-align:right;">${actionsHtml}</td>`;
        tbody.appendChild(tr);

        const card = document.createElement('div');
        card.className = 'card-mobile';
        card.style.cssText = "background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; display: flex; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: hidden;";
        card.innerHTML = `
            <img src="${imageUrl}" style="width: 50px; height: 50px; border-radius: 8px; object-fit: cover; margin-right: 15px;" alt="${safeName}">
            <span style="font-weight: 700; font-size: 1.1rem; word-break: break-word; flex-grow: 1;">${safeName}</span>
            <div style="display:flex;">${actionsHtml}</div>
        `;
        mobileList.appendChild(card);
    });
}

function openModal(categoryId = null) {
    const form = document.getElementById('category-form');
    const title = document.getElementById('modal-title');
    const preview = document.getElementById('category-image-preview');
    
    form.reset();
    isEditMode = !!categoryId;

    if (isEditMode) {
        title.textContent = 'Editar Categoria';
        const category = categoriesCache.find(c => c.id === categoryId);
        document.getElementById('category-id').value = category.id;
        document.getElementById('name').value = category.name;
        
        if (category.image?.url) {
            preview.innerHTML = `<img src="${category.image.url}">`;
        } else {
            preview.innerHTML = `<iconify-icon icon="solar:gallery-linear" style="font-size: 2.5rem; color: var(--texto-secundario);"></iconify-icon>`;
        }
    } else {
        title.textContent = 'Nova Categoria';
        document.getElementById('category-id').value = '';
        preview.innerHTML = `<iconify-icon icon="solar:gallery-linear" style="font-size: 2.5rem; color: var(--texto-secundario);"></iconify-icon>`;
    }

    document.getElementById('category-modal').classList.add('open');
}

function closeModal() {
    document.getElementById('category-modal').classList.remove('open');
}

async function handleFormSubmit(event) {
    event.preventDefault();
    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.classList.add('btn-loading');

    const formData = new FormData();
    formData.append('name', document.getElementById('name').value);
    
    const fileInput = document.getElementById('category-image');
    if (fileInput.files.length > 0) {
        formData.append('image', fileInput.files[0]);
    }

    const categoryId = document.getElementById('category-id').value;
    const url = isEditMode ? `/categories/${categoryId}` : '/categories';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
        await apiFetch(url, {
            method: method,
            body: formData
        });
        
        showToast(`Categoria ${isEditMode ? 'atualizada' : 'criada'} com sucesso!`);
        closeModal();
        await loadCategories(); 
    } catch (error) {
        showToast(`Erro: ${error.message}`, 'error');
    } finally {
        submitButton.classList.remove('btn-loading');
    }
}

function setupEventListeners() {
    document.getElementById('add-category-btn-desktop')?.addEventListener('click', () => openModal());
    document.getElementById('add-category-btn-mobile')?.addEventListener('click', () => openModal());
    document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
    document.getElementById('modal-cancel-btn')?.addEventListener('click', closeModal);
    document.getElementById('category-modal')?.addEventListener('click', (e) => {
        if(e.target === e.currentTarget) closeModal();
    });
    
    document.getElementById('category-image')?.addEventListener('change', function(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('category-image-preview');
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.innerHTML = `<img src="${e.target.result}">`;
            }
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('category-form')?.addEventListener('submit', handleFormSubmit);
    
    document.querySelector('.content-container')?.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-btn');
        const editBtn = e.target.closest('.edit-btn');
        
        if (deleteBtn) openConfirmModal(deleteBtn.dataset.id);
        if (editBtn) openModal(editBtn.dataset.id);
    });
    
    document.getElementById('confirm-cancel-btn')?.addEventListener('click', closeConfirmModal);
    document.getElementById('confirm-delete-btn')?.addEventListener('click', executeDelete);
    document.getElementById('confirm-modal')?.addEventListener('click', (e) => {
        if(e.target === e.currentTarget) closeConfirmModal();
    });
}

function openConfirmModal(categoryId) {
    categoryToDeleteId = categoryId;
    document.getElementById('confirm-modal').classList.add('open');
}
function closeConfirmModal() {
    categoryToDeleteId = null;
    document.getElementById('confirm-modal').classList.remove('open');
}

async function executeDelete() {
    if (!categoryToDeleteId) return;
    
    const confirmBtn = document.getElementById('confirm-delete-btn');
    confirmBtn.classList.add('btn-loading');

    try {
        await apiFetch(`/categories/${categoryToDeleteId}`, { method: 'DELETE' });
        showToast('Categoria apagada com sucesso!');
        categoriesCache = categoriesCache.filter(c => c.id !== categoryToDeleteId);
        renderCategories();
    } catch (error) {
        showToast(`Erro: ${error.message}`, 'error');
    } finally {
        confirmBtn.classList.remove('btn-loading');
        closeConfirmModal();
    }
}