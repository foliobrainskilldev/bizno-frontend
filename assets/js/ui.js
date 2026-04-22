const applyTheme = () => {
    if (!currentStore?.visual) return;
    const root = document.documentElement;
    ['corPrimaria', 'corFundo', 'corTexto', 'corCards'].forEach(key => {
        if (currentStore.visual[key]) root.style.setProperty(`--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, currentStore.visual[key]);
    });
};

const formatPrice = val => new Intl.NumberFormat('pt-MZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
}).format(val || 0);

const setupWhatsappFab = () => {
    const fab = document.getElementById('whatsapp-fab');
    if (!fab) return;
    const isHome = ['/', ''].includes(window.location.pathname) || window.location.pathname.includes('catalogo');
    if (currentStore.contacts?.showPhone && isHome) {
        fab.href = getSanitizedWhatsappUrl(currentStore.whatsapp, currentStore.contacts.customWhatsappMessage || 'Olá!');
        fab.classList.add('visible');
    } else {
        fab.classList.remove('visible');
    }
};

const createProductCard = (p, type = 'grid') => {
    const card = document.createElement('div');
    card.className = `product-card ${!p.stock ? 'out-of-stock' : ''} ${type === 'horizontal' ? 'product-card-horizontal' : ''}`;

    card.innerHTML = `
        <a href="/produto/${p.id}" class="product-card-image-wrapper">
            ${!p.stock ? '<div class="out-of-stock-overlay">Esgotado</div>' : ''}
            ${p.promotion?.discountPercentage ? `<div class="promotion-badge">-${p.promotion.discountPercentage}%</div>` : ''}
            <img src="${p.images?.[0]?.url || 'https://via.placeholder.com/180'}">
        </a>
        <div class="product-info">
            <div>
                <h3>${escapeHTML(p.name)}</h3>
                <div class="product-price">
                    ${p.promotion?.originalPrice ? `<span class="original-price">${formatPrice(p.promotion.originalPrice)} MZN</span> ` : ''}
                    ${formatPrice(p.price || 0)} MZN
                </div>
            </div>
            <div class="product-actions">
                <a href="/produto/${p.id}" class="interest-btn" ${!p.stock ? 'style="pointer-events:none;background:#ccc;"' : ''}>Comprar</a>
                <p class="product-stock-status ${!p.stock ? 'stock-out' : ''}">${!p.stock ? 'Esgotado' : `Estoque: ${p.stock}`}</p>
            </div>
        </div>`;
    return card;
};

const renderDeliveryInfo = () => {
    const marquee = document.getElementById('delivery-marquee');
    const settings = currentStore.deliverySettings;
    if (!settings?.isDeliveryEnabled) {
        marquee.style.display = 'none';
        document.body.classList.remove('delivery-active');
        return;
    }
    const msgs = [
        settings.freeDeliveryThreshold > 0 ? `Entregas grátis a partir de ${formatPrice(settings.freeDeliveryThreshold)} MZN` : 'Entrega local disponível',
        settings.provinceShipping?.enabled ? `Envios provinciais por ${formatPrice(settings.provinceShipping.cost)} MZN` : null
    ].filter(Boolean).join(' • ');

    document.getElementById('delivery-marquee-text').textContent = msgs;
    document.getElementById('delivery-marquee-text-clone').textContent = msgs;
    marquee.style.display = 'block';
    document.body.classList.add('delivery-active');
};

const renderHomepageContent = () => {
    const container = document.getElementById('homepage-sections');
    container.innerHTML = '';

    const tops = allProducts.filter(p => p.isFeatured).slice(0, 4);
    const topProducts = tops.length ? tops : allProducts.slice(0, 4);

    if (topProducts.length) {
        const wrap = document.createElement('div');
        wrap.className = 'horizontal-scroll-wrapper';
        wrap.style.marginBottom = '25px';
        topProducts.forEach(p => wrap.appendChild(createProductCard(p, 'horizontal')));
        container.appendChild(wrap);
    }

    if (allCategories?.length) {
        const cats = document.createElement('div');
        cats.className = 'category-bubbles-container';
        cats.innerHTML = allCategories.map(cat => `
            <div class="category-bubble" data-id="${cat.id}">
                ${cat.image?.url ? `<img src="${cat.image.url}" class="category-bubble-img">` : `<div class="category-bubble-icon"><iconify-icon icon="solar:box-minimalistic-bold-duotone"></iconify-icon></div>`}
                <span>${escapeHTML(cat.name)}</span>
            </div>`).join('');
        cats.querySelectorAll('.category-bubble').forEach(b => b.onclick = (e) => {
            e.preventDefault();
            showStoreView('grid', b.dataset.id);
            closeAllModals();
        });
        container.appendChild(cats);
    }

    if (allProducts.length) {
        const grid = document.createElement('div');
        grid.className = 'products-grid';
        grid.style.marginTop = '25px';
        allProducts.forEach(p => grid.appendChild(createProductCard(p, 'grid')));
        container.appendChild(grid);
    } else {
        container.innerHTML = '<p style="text-align:center; padding:40px; color:var(--texto-secundario);">Loja sem produtos.</p>';
    }
};

const renderGridProducts = (products, title) => {
    document.getElementById('grid-title').textContent = title;
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';
    if (!products?.length) grid.innerHTML = '<p class="no-products-message" style="grid-column: 1/-1; text-align: center;">Nenhum produto encontrado.</p>';
    else products.forEach(p => grid.appendChild(createProductCard(p, 'grid')));
};

const renderSidebar = () => {
    document.getElementById('sidebar').innerHTML = `
        <header class="sidebar-header">
            <h2>${escapeHTML(currentStore.displayName || currentStore.storeName)}</h2>
            <button class="header-btn" id="sidebar-close-btn"><iconify-icon icon="solar:close-circle-linear"></iconify-icon></button>
        </header>
        <div class="sidebar-menu">
            <h3>Categorias</h3>
            <ul id="sidebar-category-list">
                <li><a href="/" class="sidebar-category-link" data-filter="all"><iconify-icon icon="solar:widget-5-linear"></iconify-icon> Todas Categorias</a></li>
                <li><a href="/" class="sidebar-category-link" data-filter="featured"><iconify-icon icon="solar:star-bold" style="color:var(--cor-dourado);"></iconify-icon> Destaques</a></li>
                <li><a href="/" class="sidebar-category-link" data-filter="promotions"><iconify-icon icon="solar:sale-bold" style="color:var(--cor-dourado);"></iconify-icon> Promoções</a></li>
                ${allCategories.map(cat => `<li><a href="/" class="sidebar-category-link" data-filter="${cat.id}">${cat.image?.url ? `<img src="${cat.image.url}" style="width:24px;height:24px;border-radius:50%;object-fit:cover;margin-right:15px;">` : `<iconify-icon icon="solar:tag-linear"></iconify-icon>`} ${escapeHTML(cat.name)}</a></li>`).join('')}
            </ul>
        </div>`;
};

const renderFooter = () => {
    const c = currentStore.contacts || {};
    const s = c.socials || {};
    document.getElementById('catalog-footer').innerHTML = `
        <h3 style="margin-bottom:15px;">${escapeHTML(currentStore.displayName || currentStore.storeName)}</h3>
        <div class="footer-contacts">
            ${c.showPhone ? `<a href="${getSanitizedWhatsappUrl(currentStore.whatsapp)}"><iconify-icon icon="logos:whatsapp-icon"></iconify-icon> Contactar via WhatsApp</a>` : ''}
            ${c.showEmail ? `<a href="mailto:${currentStore.email}"><iconify-icon icon="solar:letter-linear"></iconify-icon> Enviar E-mail</a>` : ''}
        </div>
        <div class="footer-socials">
            ${s.facebook ? `<a href="${s.facebook}" target="_blank"><iconify-icon icon="logos:facebook"></iconify-icon></a>` : ''}
            ${s.instagram ? `<a href="${s.instagram}" target="_blank"><iconify-icon icon="skill-icons:instagram"></iconify-icon></a>` : ''}
            ${s.tiktok ? `<a href="${s.tiktok}" target="_blank"><iconify-icon icon="logos:tiktok-icon"></iconify-icon></a>` : ''}
        </div>
        <div class="footer-bottom-wrapper"><p class="footer-copyright">&copy; ${new Date().getFullYear()} Todos os direitos reservados.</p></div>`;
};

const handleThumbnailClick = t => {
    document.querySelectorAll('.pdp-thumbnail').forEach(el => el.classList.remove('active'));
    t.classList.add('active');
    const v = document.getElementById('pdp-media-viewer');
    if (plyrPlayer) {
        plyrPlayer.destroy();
        plyrPlayer = null;
    }
    if (t.dataset.videoUrl) {
        v.innerHTML = `<video id="plyr-player" class="pdp-main-media" playsinline controls><source src="${t.dataset.videoUrl}" type="video/mp4"></video>`;
        plyrPlayer = new Plyr('#plyr-player');
    } else {
        v.innerHTML = `<img src="${t.src}" class="pdp-main-media">`;
    }
};

const showNotification = (t, m, success = true) => {
    document.getElementById('notification-title').textContent = t;
    document.getElementById('notification-message').textContent = m;
    document.getElementById('notification-icon').innerHTML = `<iconify-icon icon="solar:${success ? 'check' : 'danger'}-circle-bold" style="color:var(--${success ? 'whatsapp-cor' : 'vermelho-alerta'});"></iconify-icon>`;
    document.getElementById('notification-overlay').classList.add('visible');
};

const updatePriceRealTime = bp => {
    const el = document.querySelector('.pdp-price-box .price');
    if (el) el.textContent = `${formatPrice(bp + Array.from(document.querySelectorAll('.addon-checkbox:checked')).reduce((s, cb) => s + parseFloat(cb.value), 0))} MZN`;
};

const loadCrossSell = async id => {
    try {
        const res = await fetch(`${API_URL}/product/${id}/cross-sell`);
        const data = await res.json();
        const sec = document.getElementById('cross-sell-section');
        if (data.success && data.products.length) {
            sec.innerHTML = `<div class="section-header-wrapper"><h2 class="section-title">Quem viu isto, também levou</h2></div><div class="horizontal-scroll-wrapper"></div>`;
            const wrap = sec.querySelector('.horizontal-scroll-wrapper');
            data.products.forEach(p => wrap.appendChild(createProductCard(p, 'horizontal')));
            sec.style.display = 'block';
        } else sec.style.display = 'none';
    } catch {}
};

const showProductDetailView = async id => {
    const view = document.getElementById('product-detail-view');
    view.style.opacity = 0;
    try {
        const p = allProducts.find(x => x.id === id);
        if (!p) throw new Error("Produto não encontrado.");

        document.getElementById('pdp-media-viewer').innerHTML = '';
        document.getElementById('pdp-thumbnails').innerHTML = '';

        const medias = [...(p.images || [])];
        if (p.video) medias.push({
            ...p.video,
            isVideo: true
        });

        document.getElementById('pdp-thumbnails').innerHTML = medias.map((m, i) => `
            <div class="pdp-thumbnail-wrapper">
                <img src="${m.isVideo ? (p.images[0]?.url || '') : m.url}" class="pdp-thumbnail ${i === 0 ? 'active' : ''}" data-video-url="${m.isVideo ? m.url : ''}">
                ${m.isVideo ? "<div class='play-icon'><iconify-icon icon='solar:play-bold'></iconify-icon></div>" : ""}
            </div>`).join('');

        document.getElementById('pdp-media-viewer').innerHTML = medias.length ? (medias[0].isVideo ? `<video id="plyr-player" class="pdp-main-media" playsinline controls><source src="${medias[0].url}" type="video/mp4"></video>` : `<img src="${medias[0].url}" class="pdp-main-media">`) : '';
        document.getElementById('pdp-product-name').textContent = p.name;
        document.getElementById('pdp-price-box').innerHTML = p.promotion?.originalPrice ? `<span class="original-price">${formatPrice(p.promotion.originalPrice)} MZN</span> <span class="price">${formatPrice(p.price)} MZN</span>` : `<span class="price">${formatPrice(p.price)} MZN</span>`;
        document.getElementById('pdp-product-description').innerHTML = escapeHTML(p.description || '').replace(/- (.*)/g, '<li>$1</li>').replace(/(<li>.*<\/li>)/s, '<ul style="padding-left:20px;">$1</ul>');

        const actions = document.getElementById('pdp-actions');
        actions.innerHTML = '';

        const vHtml = (p.variants || []).map(v => `<div class="variant-wrapper" style="margin-bottom:15px;"><label style="display:block;font-weight:700;color:var(--cor-primaria);">${escapeHTML(v.name)}</label><div class="variant-pills">${v.options.map(o => `<label class="variant-pill"><input type="radio" name="variant-${escapeHTML(v.name)}" value="${escapeHTML(o)}" style="display:none;"><span class="pill-text">${escapeHTML(o)}</span></label>`).join('')}</div></div>`).join('');
        const aHtml = (p.addons || []).length ? `<div style="padding-top:15px; border-top:1px solid var(--borda-suave);"><label style="display:block;font-weight:700;color:var(--cor-primaria);margin-bottom:10px;">Adicionais</label>${p.addons.map(a => `<label class="addon-row"><span style="display:flex;align-items:center;"><input type="checkbox" class="addon-checkbox" id="addon-${escapeHTML(a.name)}" value="${a.price}" style="display:none;" onchange="updatePriceRealTime(${p.price})"><span class="custom-checkbox"></span>${escapeHTML(a.name)}</span><strong style="color:var(--cor-primaria);">+${formatPrice(a.price)} MZN</strong></label>`).join('')}</div>` : '';

        if (vHtml || aHtml) {
            const ext = document.createElement('div');
            ext.innerHTML = vHtml + aHtml;
            actions.appendChild(ext);
        }

        actions.insertAdjacentHTML('beforeend', !p.stock ?
            `<button class="pdp-btn add-to-cart-btn" disabled style="background:#ccc;"><iconify-icon icon='solar:close-circle-linear'></iconify-icon> Esgotado</button>` :
            `<button class="pdp-btn add-to-cart-btn" data-product-id='${JSON.stringify(p).replace(/'/g, "&#39;")}'>Adicionar ao Carrinho</button><button class="pdp-btn order-now-btn" data-product-id='${JSON.stringify(p).replace(/'/g, "&#39;")}'>Fazer Pedido</button>`
        );

        if (!document.getElementById('cross-sell-section')) document.querySelector('.pdp-container').insertAdjacentHTML('beforeend', '<section id="cross-sell-section" class="related-products-section fade-in"></section>');
        loadCrossSell(id);
        if (medias[0]?.isVideo && typeof Plyr !== 'undefined') plyrPlayer = new Plyr('#plyr-player');
        view.style.opacity = 1;
    } catch (e) {
        view.innerHTML = `<p style="text-align:center;padding:40px;">${e.message}</p>`;
    }
};

const showStoreView = (mode = 'homepage', filter = 'all', search = '') => {
    document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
    document.getElementById('store-view').classList.add('active');

    if (mode === 'grid') {
        document.getElementById('homepage-sections').style.display = 'none';
        document.getElementById('grid-view-content').style.display = 'block';

        let list = [...allProducts];
        let title = "Todos os Produtos";

        if (filter === 'featured') {
            list = list.filter(p => p.isFeatured);
            title = "Destaques";
        } else if (filter === 'promotions') {
            list = list.filter(p => p.promotion);
            title = "Promoções";
        } else if (filter !== 'all') {
            list = list.filter(p => p.categoryId === filter);
            title = allCategories.find(c => c.id === filter)?.name || title;
        }

        if (search) {
            list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
            title = `Resultados para: "${search}"`;
        }
        renderGridProducts(list, title);
    } else {
        document.getElementById('homepage-sections').style.display = 'block';
        document.getElementById('grid-view-content').style.display = 'none';
        renderHomepageContent();
    }
    setupWhatsappFab();
};