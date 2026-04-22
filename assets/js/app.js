const showFilterModal = () => {
    const modal = document.getElementById('filter-modal');
    modal.innerHTML = `<div class="modal-header"><h2>Filtrar Categorias</h2></div><div class="modal-body"><ul style="list-style:none;padding:0;">
        <li><a href="/" class="sidebar-category-link" data-filter="all"><iconify-icon icon="solar:widget-5-bold" style="margin-right:12px;"></iconify-icon> Todas Categorias</a></li>
        <li><a href="/" class="sidebar-category-link promotion-option" data-filter="featured"><iconify-icon icon="solar:star-bold" style="color:var(--dourado);margin-right:12px;"></iconify-icon> Destaques</a></li>
        <li><a href="/" class="sidebar-category-link promotion-option" data-filter="promotions"><iconify-icon icon="solar:sale-bold" style="color:var(--dourado);margin-right:12px;"></iconify-icon> Promoções</a></li>
        ${allCategories.map(c => `<li><a href="/" class="sidebar-category-link" data-filter="${c.id}">${c.image?.url ? `<img src="${c.image.url}" style="width:26px;height:26px;border-radius:50%;object-fit:cover;margin-right:12px;flex-shrink:0;">` : `<iconify-icon icon="solar:tag-bold" style="margin-right:12px;"></iconify-icon>`} ${escapeHTML(c.name)}</a></li>`).join('')}
    </ul></div>`;
    document.getElementById('modal-overlay').classList.add('open');
    modal.classList.add('open');
};

const closeAllModals = () => {
    document.querySelectorAll('.modal-overlay, .cart-modal, .filter-modal').forEach(e => e.classList.remove('open'));
};

const injectSEOAndTracking = () => {
    if (!currentStore?.visual) return;
    const v = currentStore.visual;
    const name = escapeHTML(currentStore.displayName || currentStore.storeName);
    const desc = v.storeDescription || `Catálogo de ${name}`;
    const img = v.profileImage?.url || 'https://i.ibb.co/mV9zJD5N/1775299173254.jpg';

    const setMeta = (attr, val, content) => {
        let meta = document.querySelector(`meta[${attr}="${val}"]`) || document.head.appendChild(Object.assign(document.createElement('meta'), {
            [attr]: val
        }));
        meta.content = content;
    };

    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', name);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:image', img);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:url', window.location.href);
    setMeta('name', 'twitter:card', 'summary_large_image');

    let fav = document.getElementById("dynamic-favicon") || document.querySelector("link[rel*='icon']") || document.head.appendChild(document.createElement('link'));
    fav.id = 'dynamic-favicon';
    fav.rel = 'icon';
    fav.type = 'image/png';
    fav.href = img.includes('cloudinary.com') ? img.replace('/upload/', '/upload/w_64,h_64,c_fill,f_png/') : img;

    if (v.fbPixel && !window.fbq) {
        document.head.insertAdjacentHTML('beforeend', `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', '${escapeHTML(v.fbPixel)}');fbq('track', 'PageView');</script>`);
    }
    if (v.googleAnalytics && !document.querySelector(`script[src*="${escapeHTML(v.googleAnalytics)}"]`)) {
        document.head.insertAdjacentHTML('beforeend', `<script async src="https://www.googletagmanager.com/gtag/js?id=${escapeHTML(v.googleAnalytics)}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${escapeHTML(v.googleAnalytics)}');</script>`);
    }
};

const loadAndRoute = async () => {
    window.scrollTo(0, 0);
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'flex';

    const hostParts = window.location.hostname.split('.');
    const storeUrlName = window.location.hostname.includes('localhost') ? (new URLSearchParams(window.location.search).get('store') || hostParts[0]) : (hostParts[0] !== 'www' ? hostParts[0] : '');

    if (!storeUrlName) return document.body.innerHTML = `<h1 style="text-align:center;padding:50px;">Aceda pelo link correto.</h1>`;

    const view = window.location.pathname.split('/').filter(Boolean)[0] || 'home';
    const param = window.location.pathname.split('/').filter(Boolean)[1] || null;

    try {
        if (!currentStore.id || currentStore.storeName.toLowerCase() !== storeUrlName.toLowerCase()) {
            const res = await fetch(`${API_URL}/store/${storeUrlName}`);
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || 'Loja indisponível.');

            currentStore = data.store;
            allProducts = data.products;
            allCategories = data.categories;
            cartStorageKey = `biznoCart_${currentStore.id}`;
            cart = JSON.parse(localStorage.getItem(cartStorageKey)) || [];

            document.title = escapeHTML(currentStore.displayName || currentStore.storeName);
            document.getElementById('store-name').textContent = document.title;
            document.getElementById('store-name').style.display = 'block';

            let desc = escapeHTML(currentStore.visual?.storeDescription || '');
            document.getElementById('store-description').innerHTML = desc.includes('- ') ? `<ul>${desc.split('\n').map(l => l.trim().startsWith('- ') ? `<li>${l.substring(2)}</li>` : l).join('')}</ul>` : `<p>${desc}</p>`;
            document.getElementById('welcome-text-container').style.display = desc ? 'block' : 'none';
            document.getElementById('store-logo').src = currentStore.visual?.profileImage?.url || 'https://via.placeholder.com/100';

            [applyTheme, renderDeliveryInfo, renderSidebar, renderFooter, updateCartIcon].forEach(fn => fn?.());
            injectSEOAndTracking();
        }

        document.querySelectorAll('.page-view').forEach(v => v.classList.remove('active'));
        if (view === 'produto') {
            document.getElementById('product-detail-view').classList.add('active');
            await showProductDetailView(param);
        } else if (view === 'checkout') {
            document.getElementById('checkout-view').classList.add('active');
            showCheckoutView();
        } else {
            document.getElementById('store-view').classList.add('active');
            showStoreView('homepage');
        }
    } catch (err) {
        document.body.innerHTML = `<div style="text-align:center;padding:50px;"><iconify-icon icon="solar:shop-broken" style="font-size:5rem;color:#d9534f;margin-bottom:20px;"></iconify-icon><h2>${err.message}</h2></div>`;
    } finally {
        if (loader) loader.style.display = 'none';
    }
};

const navigate = path => {
    const isLocal = window.location.hostname.includes('localhost');
    window.history.pushState({}, '', isLocal ? `${path}?store=${new URLSearchParams(window.location.search).get('store')}` : path);
    loadAndRoute();
};

window.addEventListener('popstate', loadAndRoute);
document.addEventListener('DOMContentLoaded', loadAndRoute);

document.body.addEventListener('click', e => {
    const t = e.target,
        a = t.closest('a'),
        btn = t.closest('button');
    if (a?.classList.contains('ask-whatsapp-btn')) return;

    if (a?.hostname === location.hostname) {
        e.preventDefault();
        if (a.closest('#cart-button')) return showCartModal?.();
        if (a.classList.contains('go-to-checkout-btn')) closeAllModals();
        if (a.classList.contains('sidebar-category-link') || a.classList.contains('see-all-link')) {
            showStoreView?.('grid', a.dataset.filter);
            closeAllModals();
            document.getElementById('sidebar').classList.remove('open');
        } else navigate(a.pathname);
    }

    if (btn?.classList.contains('add-to-cart-btn')) addToCart?.(btn.dataset.productId);
    if (btn?.classList.contains('order-now-btn')) {
        addToCart?.(btn.dataset.productId);
        navigate('/checkout');
    }

    if (t.closest('#menu-toggle')) document.getElementById('sidebar').classList.add('open');
    if (t.closest('#sidebar-close-btn')) document.getElementById('sidebar').classList.remove('open');
    if (t.closest('#filter-btn')) showFilterModal();
    if (t.matches('.continue-shopping-btn') || t.closest('#modal-overlay') === t) closeAllModals();
    if (t.matches('.increase-qty')) updateCartQuantity?.(t.dataset.id, 1);
    if (t.matches('.decrease-qty')) updateCartQuantity?.(t.dataset.id, -1);
    if (t.closest('#notification-close-btn') || t.closest('#notification-overlay') === t) document.getElementById('notification-overlay').classList.remove('visible');
    if (t.closest('.pdp-thumbnail')) handleThumbnailClick?.(t.closest('.pdp-thumbnail'));
});

document.body.addEventListener('submit', async e => {
    if (e.target.matches('#checkout-form')) {
        e.preventDefault();
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'flex';

        const name = escapeHTML(document.getElementById('customerName').value).substring(0, 100);
        const contact = escapeHTML(document.getElementById('customerContact').value).substring(0, 50);
        const addr = escapeHTML(document.getElementById('customerAddress').value).substring(0, 250);
        const details = escapeHTML(document.getElementById('customerDetails').value).substring(0, 500);
        const pm = document.querySelector('input[name="payment"]:checked')?.value || "A combinar";
        const isDel = currentStore.deliverySettings?.isDeliveryEnabled;
        const sName = escapeHTML(currentStore.displayName || currentStore.storeName);

        const orderText = cart.map(i => `${i.quantity}x ${escapeHTML(i.name)} ${i.selectedVariants || i.selectedAddons ? `(${[i.selectedVariants, i.selectedAddons].filter(Boolean).join(' | ')})` : ''} - ${formatPrice((i.finalPrice || i.price) * i.quantity)} MZN`).join('\n');
        const totals = calculateTotals?.() || {
            total: 0,
            subtotal: 0,
            discount: 0
        };
        const totalsText = totals.discount > 0 ? `*Subtotal: ${formatPrice(totals.subtotal)} MZN*\n*Desconto: -${formatPrice(totals.discount)} MZN*\n*Total a Pagar: ${formatPrice(totals.total)} MZN*` : `*Total: ${formatPrice(totals.total)} MZN*`;

        const msg = `Olá, ${sName}! Gostaria de fazer a seguinte *${isDel ? "PEDIDO DE COMPRA" : "RESERVA"}*:\n-----------------------------\n${orderText}\n-----------------------------\n${totalsText}\n\n*Dados do Cliente:*\nNome: ${name}\nContacto: ${contact}\n${isDel ? `Endereço: ${addr}` : '(Para combinar o levantamento)'}\n${details ? `*Detalhes:*\n${details}\n` : ''}*Pagamento:* ${pm}\nObrigado!`;
        const meta = `\n\n===META===\n${JSON.stringify({ status: 'pending', items: cart.map(i => ({ id: i.id, quantity: i.quantity, variants: i.selectedVariants, addons: i.selectedAddons })), total: totals.total, coupon: window.activeCoupon?.code || null })}`;

        try {
            const res = await fetch(`${API_URL}/interaction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    storeOwnerId: currentStore.id,
                    type: 'order',
                    details: msg + meta,
                    customerPhone: contact,
                    customerName: name
                })
            });
            if (!res.ok) throw new Error('Falha no pedido.');

            cart = [];
            window.activeCoupon = null;
            localStorage.setItem(cartStorageKey, JSON.stringify(cart));
            updateCartIcon?.();
            window.fbq?.('track', 'Purchase', {
                value: totals.total,
                currency: 'MZN'
            });

            showNotification?.('Pedido Enviado!', 'Será redirecionado para o WhatsApp.');
            setTimeout(() => {
                window.open(getSanitizedWhatsappUrl(currentStore.whatsapp, msg), '_blank');
                navigate('/');
            }, 2000);
        } catch {
            if (loader) loader.style.display = 'none';
            showNotification?.('Erro', 'Não foi possível enviar o pedido.', false);
        }
    }
});

let searchTimeout;
document.getElementById('search-input')?.addEventListener('input', e => {
    const q = e.target.value,
        spinner = document.getElementById('search-spinner'),
        icon = document.getElementById('search-icon-svg'),
        grid = document.getElementById('grid-view-content');
    if (icon && spinner) {
        icon.style.display = 'none';
        spinner.style.display = 'block';
    }
    if (grid) grid.style.opacity = '0.5';

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        showStoreView?.('grid', 'all', q);
        if (icon && spinner) {
            spinner.style.display = 'none';
            icon.style.display = 'block';
        }
        if (grid) grid.style.opacity = '1';
    }, 600);
});