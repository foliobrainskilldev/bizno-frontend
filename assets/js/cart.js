window.activeCoupon = null;

const updateCartIcon = () => {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) {
        cartCountEl.textContent = count;
        cartCountEl.classList.toggle('visible', count > 0);
    }
};

const addToCart = (productDataString) => {
    const product = JSON.parse(productDataString);
    if ((product.stock ?? 0) === 0) return showNotification('Indisponível', 'Produto esgotado.', false);

    const variants = (product.variants || []).map(v => {
        const checked = document.querySelector(`input[name="variant-${escapeHTML(v.name)}"]:checked`);
        return checked ? `${v.name}: ${checked.value}` : null;
    }).filter(Boolean);

    let extraPrice = 0;
    const addons = (product.addons || []).filter(a => {
        const el = document.getElementById(`addon-${escapeHTML(a.name)}`);
        if (el?.checked) {
            extraPrice += parseFloat(a.price);
            return true;
        }
        return false;
    }).map(a => a.name);

    const selectedVariantsStr = variants.join(" | ");
    const selectedAddonsStr = addons.join(", ");
    const uniqueCartId = `${product.id}-${selectedVariantsStr}-${selectedAddonsStr}`;
    const existingItem = cart.find(item => item.cartId === uniqueCartId);

    if (existingItem) existingItem.quantity++;
    else cart.push({
        ...product,
        cartId: uniqueCartId,
        quantity: 1,
        finalPrice: parseFloat(product.price) + extraPrice,
        selectedVariants: selectedVariantsStr,
        selectedAddons: selectedAddonsStr
    });

    localStorage.setItem(cartStorageKey, JSON.stringify(cart));
    updateCartIcon();
    showNotification('Sucesso!', `${escapeHTML(product.name)} adicionado ao carrinho.`);
};

const updateCartQuantity = (cartId, change) => {
    const item = cart.find(i => i.cartId === cartId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) cart = cart.filter(i => i.cartId !== cartId);
    }
    if (!cart.length) window.activeCoupon = null;
    localStorage.setItem(cartStorageKey, JSON.stringify(cart));
    updateCartIcon();
    showCartModal();
};

const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + ((item.finalPrice || item.price || 0) * item.quantity), 0);
    let discount = 0;
    if (window.activeCoupon) {
        discount = window.activeCoupon.discountPercentage ? subtotal * (window.activeCoupon.discountPercentage / 100) : window.activeCoupon.discountFixed;
        if (discount > subtotal) discount = subtotal;
    }
    return {
        subtotal,
        discount,
        total: subtotal - discount
    };
};

const applyCoupon = async () => {
    const code = document.getElementById('coupon-input')?.value.trim();
    if (!code) return;

    try {
        const res = await fetch(`${API_URL}/store/${currentStore.storeName}/coupon/${code}`);
        const data = await res.json();

        if (data.success) {
            window.activeCoupon = data.coupon;
            showNotification('Cupom Aplicado', 'Desconto adicionado com sucesso.', true);
        } else {
            showNotification('Erro', data.message || 'Cupom inválido.', false);
            window.activeCoupon = null;
        }
        showCartModal();
        if (document.getElementById('checkout-view').classList.contains('active')) showCheckoutView();
    } catch {
        showNotification('Erro', 'Não foi possível validar o cupom.', false);
    }
};

const showCartModal = () => {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('cart-modal');

    if (!cart.length) {
        modal.innerHTML = `<div class="modal-header"><h2>Meu Carrinho</h2></div><div class="modal-body" style="text-align: center; padding: 40px;">Carrinho vazio.</div><div class="modal-footer"><button class="modal-btn continue-shopping-btn">Continuar a Ver</button></div>`;
    } else {
        const totals = calculateTotals();
        modal.innerHTML = `
            <div class="modal-header"><h2>Meu Carrinho</h2></div>
            <div class="modal-body">
                ${cart.map(item => `
                    <div class="cart-item">
                        <img src="${item.images?.[0]?.url || 'https://via.placeholder.com/60'}">
                        <div class="cart-item-info">
                            <h4>${escapeHTML(item.name)}</h4>
                            ${item.selectedVariants ? `<p style="font-size: 0.8rem; margin: 2px 0;">${escapeHTML(item.selectedVariants)}</p>` : ''}
                            ${item.selectedAddons ? `<p style="font-size: 0.8rem; margin: 2px 0; color:var(--texto-secundario);">+ ${escapeHTML(item.selectedAddons)}</p>` : ''}
                            <p style="color: var(--cor-primaria); font-weight: 700; margin-top: 5px;">${formatPrice(item.finalPrice || item.price)} MZN</p>
                        </div>
                        <div class="cart-item-controls">
                            <button data-id="${item.cartId}" class="cart-quantity-btn decrease-qty">-</button> 
                            <span>${item.quantity}</span>
                            <button data-id="${item.cartId}" class="cart-quantity-btn increase-qty">+</button> 
                        </div>
                    </div>`).join('')}
                <div style="margin-top:15px; display:flex; gap:10px;">
                    <input type="text" id="coupon-input" placeholder="Tem um cupom?" style="flex:1; padding:8px; border:1px solid #ccc; border-radius:6px;" value="${window.activeCoupon?.code || ''}">
                    <button onclick="applyCoupon()" style="padding:8px 15px; background:var(--cor-primaria); color:#fff; border:none; border-radius:6px; cursor:pointer;">Aplicar</button>
                </div>
                <div class="cart-total">Subtotal: ${formatPrice(totals.subtotal)} MZN</div>
                ${totals.discount > 0 ? `<div class="cart-total" style="color: green; border-top:none; padding-top:5px;">Desconto: -${formatPrice(totals.discount)} MZN</div><div class="cart-total" style="border-top:none; padding-top:5px;">Total: ${formatPrice(totals.total)} MZN</div>` : ''}
            </div>
            <div class="modal-footer"><button class="modal-btn continue-shopping-btn">Continuar</button><a href="/checkout" class="modal-btn go-to-checkout-btn">Finalizar Pedido</a></div>`;
    }
    overlay.classList.add('open');
    modal.classList.add('open');
};

const showCheckoutView = () => {
    const summaryBox = document.getElementById('checkout-summary-box');
    const paymentBox = document.getElementById('payment-methods-box');
    const addressGroup = document.getElementById('address-form-group');

    if (!cart.length) {
        summaryBox.innerHTML = `<p style="text-align:center; padding: 20px;">Carrinho vazio.</p>`;
        document.getElementById('checkout-form').style.display = 'none';
        return;
    }

    document.getElementById('checkout-form').style.display = 'block';
    const totals = calculateTotals();

    summaryBox.innerHTML = `<h3 style="margin-bottom: 15px;">Resumo do Pedido</h3>` +
        cart.map(i => `<div class="summary-item"><span>${i.quantity}x ${escapeHTML(i.name)}</span> <span>${formatPrice((i.finalPrice || i.price) * i.quantity)} MZN</span></div>`).join('') +
        (totals.discount > 0 ?
            `<div class="summary-item summary-total"><span>Subtotal</span><span>${formatPrice(totals.subtotal)} MZN</span></div><div class="summary-item" style="color:green;"><span>Desconto</span><span>-${formatPrice(totals.discount)} MZN</span></div><div class="summary-item summary-total"><span>Total a Pagar</span><span>${formatPrice(totals.total)} MZN</span></div>` :
            `<div class="summary-item summary-total"><span>Total a Pagar</span><span>${formatPrice(totals.total)} MZN</span></div>`);

    const pm = currentStore.contacts?.paymentMethods || {};
    paymentBox.innerHTML = [
        pm.mpesa && `<label class="payment-option">M-Pesa<input type="radio" name="payment" value="M-Pesa" checked><span class="checkmark"></span></label>`,
        pm.emola && `<label class="payment-option">e-Mola<input type="radio" name="payment" value="e-Mola"><span class="checkmark"></span></label>`,
        pm.transfer && `<label class="payment-option">Transferência<input type="radio" name="payment" value="Transferência Bancária"><span class="checkmark"></span></label>`,
        pm.onDelivery && `<label class="payment-option">Na Entrega<input type="radio" name="payment" value="Pagamento na Entrega"><span class="checkmark"></span></label>`
    ].filter(Boolean).join('') || "<p style='color: #666;'>A combinar pelo WhatsApp.</p>";

    const isDel = currentStore.deliverySettings?.isDeliveryEnabled;
    addressGroup.style.display = isDel ? 'block' : 'none';
    document.getElementById('customerAddress').required = !!isDel;
    document.querySelector('.page-title').textContent = isDel ? 'Finalizar Pedido' : 'Finalizar Reserva';

    document.getElementById('customerContact')?.addEventListener('blur', async (e) => {
        if (e.target.value.length > 8 && cart.length) {
            try {
                await fetch(`${API_URL}/store/cart/abandoned`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        storeOwnerId: currentStore.id,
                        customerName: document.getElementById('customerName').value,
                        customerPhone: e.target.value,
                        items: cart,
                        totalValue: totals.total
                    })
                });
            } catch {}
        }
    });
};