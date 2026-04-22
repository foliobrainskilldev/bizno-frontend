let productsCache = [],
    categoriesCache = [],
    productToDeleteId = null,
    currentCategoryIdView = null;

document.addEventListener('DOMContentLoaded', () => {
    loadInitialData();
    document.getElementById('back-to-categories-btn')?.addEventListener('click', () => {
        currentCategoryIdView = null;
        toggleViews();
    });
    document.getElementById('category-detail-view')?.addEventListener('click', handleActions);
    document.getElementById('confirm-cancel-btn')?.addEventListener('click', () => document.getElementById('confirm-modal')?.classList.remove('open'));
    document.getElementById('confirm-delete-btn')?.addEventListener('click', executeDelete);
});

async function loadInitialData() {
    document.getElementById('skeleton-view').style.display = 'block';

    try {
        const [prodData, catData] = await Promise.all([apiFetch('/products'), apiFetch('/categories')]);
        productsCache = prodData.products;
        categoriesCache = catData.categories;
        toggleViews();
    } catch {
        showToast("Não foi possível carregar o catálogo.", 'error');
        document.getElementById('skeleton-view').style.display = 'none';
    }
}

function toggleViews() {
    document.getElementById('skeleton-view').style.display = 'none';
    const isEmpty = !productsCache.length && !categoriesCache.length;

    document.getElementById('empty-state-view').style.display = isEmpty ? 'block' : 'none';
    document.getElementById('add-product-btn-desktop').style.display = isEmpty ? 'none' : 'inline-flex';

    if (!isEmpty) {
        if (currentCategoryIdView !== null) {
            document.getElementById('categories-grid-view').style.display = 'none';
            document.getElementById('category-detail-view').style.display = 'block';
            renderProducts(currentCategoryIdView);
        } else {
            document.getElementById('category-detail-view').style.display = 'none';
            document.getElementById('categories-grid-view').style.display = 'block';
            renderCategoriesGrid();
        }
    }
}

function renderCategoriesGrid() {
    const grid = document.getElementById('categories-grid');
    grid.innerHTML = '';

    const generalProducts = productsCache.filter(p => !p.categoryId);
    if (generalProducts.length) grid.appendChild(createCategoryCard('general', 'Catálogo Geral', generalProducts));

    categoriesCache.forEach(cat => {
        grid.appendChild(createCategoryCard(cat.id, cat.name, productsCache.filter(p => p.categoryId === cat.id)));
    });
}

function createCategoryCard(id, name, products) {
    const card = document.createElement('div');
    card.className = 'category-card';

    let previewsHtml = products.slice(0, 3).map(p => `<img class="category-preview-img" src="${p.images[0]?.url || 'https://via.placeholder.com/150'}">`).join('');
    if (products.length > 3) previewsHtml += `<div class="category-preview-more">+${products.length - 3}</div>`;
    else if (!products.length) previewsHtml = `<div class="category-preview-more" style="grid-column: 1/-1; background: transparent;">Sem produtos</div>`;

    card.innerHTML = `
        <div class="category-card-header">
            <div class="category-card-title">${escapeHTML(name)}</div>
            <div class="category-card-count">${products.length}</div>
        </div>
        <div class="category-previews">${previewsHtml}</div>
    `;

    card.onclick = () => {
        currentCategoryIdView = id;
        document.getElementById('current-category-title').textContent = name;
        toggleViews();
    };
    return card;
}

function renderProducts(categoryId) {
    const tbody = document.getElementById('products-tbody');
    const mobileList = document.getElementById('products-list-mobile');
    tbody.innerHTML = '';
    mobileList.innerHTML = '';

    const filtered = categoryId === 'general' ? productsCache.filter(p => !p.categoryId) : productsCache.filter(p => p.categoryId === categoryId);

    if (!filtered.length) {
        const msg = `<p class="no-data-message">Nenhum produto nesta categoria.</p>`;
        tbody.innerHTML = `<tr><td colspan="5">${msg}</td></tr>`;
        mobileList.innerHTML = msg;
        return;
    }

    filtered.forEach(p => {
        const actions = `<button class="feature-btn ${p.isFeatured ? 'featured' : ''}" data-id="${p.id}"><iconify-icon icon="solar:star-bold"></iconify-icon></button><a href="/dashboard/produto-editor?id=${p.id}" class="edit-btn"><iconify-icon icon="solar:pen-new-square-linear"></iconify-icon></a><button class="delete-btn" data-id="${p.id}"><iconify-icon icon="solar:trash-bin-trash-linear"></iconify-icon></button>`;
        const nameHtml = escapeHTML(p.name) + (p.video ? ' <iconify-icon class="video-indicator" icon="solar:video-frame-play-horizontal-linear"></iconify-icon>' : '');
        const imgUrl = p.images[0]?.url || 'https://via.placeholder.com/60';

        tbody.insertAdjacentHTML('beforeend', `<tr><td><img src="${imgUrl}" class="product-image"></td><td>${nameHtml}</td><td>${p.price} MZN</td><td>${p.stock}</td><td class="actions-cell">${actions}</td></tr>`);
        mobileList.insertAdjacentHTML('beforeend', `<div class="product-card-mobile"><img src="${imgUrl}"><div class="info"><h3>${nameHtml}</h3><p>${p.price} MZN - Stock: ${p.stock}</p></div><div class="actions-cell">${actions}</div></div>`);
    });
}

function handleActions(e) {
    const target = e.target.closest('button');
    if (!target || !target.dataset.id) return;

    if (target.matches('.delete-btn')) {
        productToDeleteId = target.dataset.id;
        document.getElementById('confirm-modal').classList.add('open');
    } else if (target.matches('.feature-btn')) {
        toggleFeature(target);
    }
}

async function toggleFeature(btn) {
    btn.disabled = true;
    try {
        await apiFetch(`/products/${btn.dataset.id}/toggle-feature`, {
            method: 'POST'
        });
        const idx = productsCache.findIndex(p => p.id === btn.dataset.id);
        if (idx !== -1) productsCache[idx].isFeatured = !productsCache[idx].isFeatured;
        renderProducts(currentCategoryIdView);
    } catch (e) {
        showToast(e.message, 'error');
    } finally {
        btn.disabled = false;
    }
}

async function executeDelete() {
    if (!productToDeleteId) return;
    document.getElementById('skeleton-view').style.display = 'block';
    try {
        await apiFetch(`/products/${productToDeleteId}`, {
            method: 'DELETE'
        });
        productsCache = productsCache.filter(p => p.id !== productToDeleteId);
        toggleViews();
    } catch (e) {
        showToast(e.message, 'error');
        document.getElementById('skeleton-view').style.display = 'none';
    } finally {
        document.getElementById('confirm-modal').classList.remove('open');
    }
}