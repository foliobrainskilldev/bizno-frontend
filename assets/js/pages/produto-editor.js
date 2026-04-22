let isEditMode = false;
let productId = null;
let categoriesCache = [];
let imageLimit = 1,
    videoLimit = 0;
let selectedFiles = [],
    existingImages = [],
    productVariants = [],
    productAddons = [];

document.addEventListener('DOMContentLoaded', () => {
    productId = new URLSearchParams(window.location.search).get('id');
    isEditMode = !!productId;
    if (isEditMode) document.getElementById('page-title').textContent = 'Editar Produto';
    initializePage();
    setupEventListeners();
});

async function initializePage() {
    toggleLoader(true);
    try {
        const [categoriesRes, planRes] = await Promise.all([apiFetch('/categories'), apiFetch('/my-plan')]);

        if (planRes.success && planRes.plan) {
            imageLimit = planRes.plan.imageLimitPerProduct;
            videoLimit = planRes.plan.videoLimit;
            document.getElementById('image-limit').textContent = imageLimit === -1 ? 'Ilimitado' : imageLimit;
        }

        if (categoriesRes.success) {
            categoriesCache = categoriesRes.categories;
            populateCategoryDropdown();
        }

        if (isEditMode) {
            await loadProductData();
            document.getElementById('advanced-options').style.display = 'block';
            document.getElementById('toggle-advanced-btn').style.display = 'none';
            document.getElementById('advanced-actions-header').style.display = 'block';
        }

        updateImageCountUI();
        renderVariantsUI();
        renderAddonsUI();
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        toggleLoader(false);
    }
}

function populateCategoryDropdown() {
    const trigger = document.getElementById('category-trigger');
    const inputNew = document.getElementById('new-category-name');
    const list = document.getElementById('category-toast-list');

    if (categoriesCache.length === 0) {
        trigger.style.display = 'none';
        inputNew.style.display = 'block';
        inputNew.value = 'Catálogo Geral';
        return;
    }

    trigger.style.display = 'flex';
    inputNew.style.display = 'none';
    list.innerHTML = '';

    categoriesCache.forEach(cat => {
        const item = document.createElement('div');
        item.className = 'category-toast-item';
        item.textContent = cat.name;
        item.addEventListener('click', () => {
            document.getElementById('category').value = cat.id;
            document.getElementById('category-trigger-text').textContent = cat.name;
            document.querySelectorAll('.category-toast-item').forEach(el => el.classList.remove('selected'));
            item.classList.add('selected');
            document.getElementById('category-toast-overlay').classList.remove('open');
        });
        list.appendChild(item);
    });
}

function setupEventListeners() {
    document.getElementById('product-form').addEventListener('submit', handleFormSubmit);

    document.getElementById('toggle-advanced-btn').addEventListener('click', (e) => {
        document.getElementById('advanced-options').style.display = 'block';
        document.getElementById('advanced-actions-header').style.display = 'block';
        e.target.style.display = 'none';
    });

    document.getElementById('category-trigger')?.addEventListener('click', () => document.getElementById('category-toast-overlay').classList.add('open'));
    document.getElementById('close-category-toast').addEventListener('click', () => document.getElementById('category-toast-overlay').classList.remove('open'));

    const varModalOverlay = document.getElementById('variants-modal-overlay');
    document.getElementById('open-variants-btn').addEventListener('click', () => varModalOverlay.classList.add('open'));
    document.getElementById('close-variants-modal').addEventListener('click', () => varModalOverlay.classList.remove('open'));
    document.getElementById('save-variants-modal').addEventListener('click', () => varModalOverlay.classList.remove('open'));

    document.getElementById('add-variant-btn').addEventListener('click', () => {
        productVariants.push({
            name: '',
            options: ''
        });
        renderVariantsUI();
    });
    document.getElementById('add-addon-btn').addEventListener('click', () => {
        productAddons.push({
            name: '',
            price: 0
        });
        renderAddonsUI();
    });

    const descInput = document.getElementById('description');
    if (descInput) {
        descInput.addEventListener('input', () => {
            const counterEl = document.getElementById('desc-char-counter') || (descInput.parentNode.appendChild(Object.assign(document.createElement('small'), {
                id: 'desc-char-counter',
                style: "display: block; text-align: right; color: var(--texto-secundario); font-weight: 600; margin-top: 5px;"
            })));
            counterEl.textContent = `${descInput.value.length}/300 caracteres`;
            counterEl.style.color = descInput.value.length >= 300 ? "var(--vermelho-alerta)" : "var(--texto-secundario)";
        });
    }

    document.getElementById('images').addEventListener('change', (e) => {
        Array.from(e.target.files).forEach(file => {
            if (file.size > 5 * 1024 * 1024) return showToast(`A imagem excede 5MB.`, 'error');
            if (existingImages.length + selectedFiles.length >= imageLimit && imageLimit !== -1) return showToast(`Máximo de ${imageLimit} imagens.`, 'error');
            selectedFiles.push(file);
            renderImagePreview(URL.createObjectURL(file), null, false, file);
        });
        e.target.value = '';
        updateImageCountUI();
    });

    document.getElementById('video').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (videoLimit === 0) {
                e.target.value = '';
                return showToast("Plano não permite vídeos.", "error");
            }
            if (file.size > 10 * 1024 * 1024) {
                e.target.value = '';
                return showToast("Vídeo excede 10MB.", "error");
            }
            document.getElementById('video-preview').textContent = `Vídeo selecionado: ${file.name}`;
        }
    });
}

function renderVariantsUI() {
    const container = document.getElementById('variants-container');
    container.innerHTML = '';
    productVariants.forEach((variant, index) => {
        container.insertAdjacentHTML('beforeend', `<div class="variant-row"><div class="input-group"><label>Nome</label><input type="text" value="${escapeHTML(variant.name)}" onchange="productVariants[${index}].name=this.value"></div><div class="input-group" style="flex: 2;"><label>Opções (separadas por vírgula)</label><input type="text" value="${escapeHTML(variant.options)}" onchange="productVariants[${index}].options=this.value"></div><button type="button" class="remove-variant-btn" onclick="productVariants.splice(${index}, 1); renderVariantsUI();"><iconify-icon icon="solar:trash-bin-trash-bold"></iconify-icon></button></div>`);
    });
}

function renderAddonsUI() {
    const container = document.getElementById('addons-container');
    container.innerHTML = '';
    productAddons.forEach((addon, index) => {
        container.insertAdjacentHTML('beforeend', `<div class="variant-row"><div class="input-group" style="flex: 2;"><label>Nome do Extra</label><input type="text" value="${escapeHTML(addon.name)}" onchange="productAddons[${index}].name=this.value"></div><div class="input-group"><label>Preço Extra</label><input type="number" value="${addon.price}" onchange="productAddons[${index}].price=this.value"></div><button type="button" class="remove-variant-btn" onclick="productAddons.splice(${index}, 1); renderAddonsUI();"><iconify-icon icon="solar:trash-bin-trash-bold"></iconify-icon></button></div>`);
    });
}

function renderImagePreview(url, public_id, isExisting, fileObj) {
    const item = document.createElement('div');
    item.className = 'image-preview-item';
    item.innerHTML = `<img src="${url}"><button type="button" class="remove-image-btn"><iconify-icon icon="solar:trash-bin-trash-bold"></iconify-icon></button>`;
    item.querySelector('.remove-image-btn').onclick = () => {
        item.remove();
        isExisting ? existingImages = existingImages.filter(i => i.public_id !== public_id) : selectedFiles = selectedFiles.filter(f => f !== fileObj);
        updateImageCountUI();
    };
    document.getElementById('image-gallery-container').insertBefore(item, document.getElementById('add-image-btn'));
}

function updateImageCountUI() {
    const total = existingImages.length + selectedFiles.length;
    document.getElementById('image-count').textContent = total;
    document.getElementById('add-image-btn').style.display = (total >= imageLimit && imageLimit !== -1) ? 'none' : 'flex';
}

async function handleFormSubmit(event) {
    event.preventDefault();
    if (!existingImages.length && !selectedFiles.length) return showToast('Adicione pelo menos 1 foto.', 'error');

    const videoFile = document.getElementById('video').files[0];
    if (videoFile && videoLimit === 0) return showToast('Plano não permite vídeos.', 'error');

    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.classList.add('btn-loading');

    try {
        let finalCatId = document.getElementById('category').value;
        if (!categoriesCache.length) {
            const catRes = await apiFetch('/categories', {
                method: 'POST',
                body: JSON.stringify({
                    name: document.getElementById('new-category-name').value || 'Catálogo Geral'
                })
            });
            finalCatId = catRes.category.id;
        }
        if (!finalCatId) throw new Error("Selecione uma categoria.");

        const formData = new FormData();
        formData.append('name', document.getElementById('name').value);
        formData.append('description', document.getElementById('description').value);
        formData.append('seoDescription', document.getElementById('seoDescription').value);
        formData.append('price', document.getElementById('price').value || "0");
        formData.append('originalPrice', document.getElementById('originalPrice').value);
        formData.append('category', finalCatId);
        formData.append('stock', document.getElementById('stock').value || "1");

        formData.append('variants', JSON.stringify(productVariants.filter(v => v.name.trim() && v.options.trim()).map(v => ({
            name: v.name.trim(),
            options: v.options.split(',').map(o => o.trim()).filter(o => o)
        }))));
        formData.append('addons', JSON.stringify(productAddons.filter(a => a.name.trim()).map(a => ({
            name: a.name.trim(),
            price: parseFloat(a.price) || 0
        }))));

        existingImages.forEach(img => formData.append('existingImages', img.public_id));
        selectedFiles.forEach(f => formData.append('images', f));

        const res = await apiFetch(isEditMode ? `/products/${productId}` : `/products`, {
            method: isEditMode ? 'PUT' : 'POST',
            body: formData
        });

        if (videoFile) {
            const vData = new FormData();
            vData.append('video', videoFile);
            await apiFetch(`/products/${isEditMode ? productId : res.product.id}/video`, {
                method: 'POST',
                body: vData
            });
        }

        showToast('Produto guardado!');
        setTimeout(() => window.location.href = '/dashboard/produtos', 1500);
    } catch (e) {
        showToast(e.message, 'error');
        submitBtn.classList.remove('btn-loading');
    }
}

async function loadProductData() {
    const res = await apiFetch('/products');
    const product = res.products.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('name').value = product.name;
    document.getElementById('description').value = product.description || '';
    document.getElementById('seoDescription').value = product.seoDescription || '';
    document.getElementById('price').value = product.price;
    document.getElementById('originalPrice').value = product.promotion?.originalPrice || '';
    document.getElementById('stock').value = product.stock;

    if (product.category?.id && categoriesCache.length) {
        document.getElementById('category').value = product.category.id;
        document.getElementById('category-trigger-text').textContent = categoriesCache.find(c => c.id === product.category.id)?.name || '';
    }

    if (product.variants) productVariants = product.variants.map(v => ({
        name: v.name,
        options: v.options.join(', ')
    }));
    if (product.addons) productAddons = product.addons;

    product.images?.forEach(img => {
        existingImages.push(img);
        renderImagePreview(img.url, img.public_id, true);
    });
    if (product.video) document.getElementById('video-preview').innerHTML = `<a href="${product.video.url}" target="_blank">Ver vídeo atual</a>`;
}