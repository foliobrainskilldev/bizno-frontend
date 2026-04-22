document.addEventListener('DOMContentLoaded', () => {
    loadAbandonedCarts();
});

async function loadAbandonedCarts() {
    document.getElementById('skeleton-view').style.display = 'block';
    document.getElementById('content-view').style.display = 'none';

    try {
        const data = await apiFetch('/abandoned-carts');
        renderCarts(data.abandonedCarts);
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        document.getElementById('skeleton-view').style.display = 'none';
        document.getElementById('content-view').style.display = 'block';
    }
}

function renderCarts(carts) {
    const list = document.getElementById('carts-list');
    list.innerHTML = '';
    
    if (!carts || carts.length === 0) {
        list.innerHTML = `
            <div class="onboarding-container" style="padding: 50px 20px; text-align: center;">
                <iconify-icon icon="solar:cart-check-bold-duotone" style="color:var(--verde-sucesso); font-size:4rem; margin-bottom:15px;"></iconify-icon>
                <h3 style="color: var(--azul-escuro);">Ótimas Notícias!</h3>
                <p style="color: var(--texto-secundario);">Você não tem nenhum carrinho abandonado no momento. Todos os seus clientes estão a finalizar os pedidos.</p>
            </div>`;
        return;
    }

    carts.forEach(cart => {
        const customerName = cart.customer ? escapeHTML(cart.customer.name) : 'Visitante';
        const customerPhone = cart.customer ? escapeHTML(cart.customer.phone) : 'Sem Contacto';
        const dateObj = new Date(cart.createdAt);
        const dateStr = dateObj.toLocaleDateString('pt-PT') + ' às ' + dateObj.toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'});
        
        let itemsHtml = '';
        let itemsListForMessage = '';
        if (cart.items && Array.isArray(cart.items)) {
            cart.items.forEach(item => {
                const price = item.finalPrice || item.price || 0;
                const details = [item.selectedVariants, item.selectedAddons].filter(x => x).join(' | ');
                const detailsHtml = details ? `<br><span class="cart-item-desc">${escapeHTML(details)}</span>` : '';
                
                itemsHtml += `
                    <div class="cart-item">
                        <div>${item.quantity}x ${escapeHTML(item.name)}${detailsHtml}</div>
                        <div>${new Intl.NumberFormat('pt-MZ').format(price * item.quantity)} MZN</div>
                    </div>`;
                    
                itemsListForMessage += `- ${item.quantity}x ${item.name}\n`;
            });
        }

        let cleanPhone = customerPhone ? customerPhone.replace(/\D/g, '') : '';
        if (cleanPhone && !cleanPhone.startsWith('258')) cleanPhone = '258' + cleanPhone;
        
        const waMessage = `Olá ${customerName}! Notei que começou a fazer um pedido no nosso catálogo mas não finalizou.\n\nOs produtos foram:\n${itemsListForMessage}\nPosso ajudar em alguma dúvida ou aplicar um desconto especial para finalizarmos?`;
        const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;

        const card = document.createElement('div');
        card.className = 'abandoned-card';
        card.innerHTML = `
            <div class="abandoned-header">
                <div class="customer-info">
                    <h3><iconify-icon icon="solar:user-circle-bold"></iconify-icon> ${customerName}</h3>
                    <p><iconify-icon icon="solar:phone-bold" style="vertical-align:middle;"></iconify-icon> ${customerPhone}</p>
                    <span style="font-size:0.8rem; color:var(--texto-secundario); display:block; margin-top:5px;">Abandonado a: ${dateStr}</span>
                </div>
                <div class="cart-total">
                    <span>Valor a Recuperar</span>
                    <strong>${new Intl.NumberFormat('pt-MZ').format(cart.totalValue)} MZN</strong>
                </div>
            </div>
            
            <div class="cart-items">
                ${itemsHtml}
            </div>

            <a href="${waLink}" target="_blank" class="whatsapp-recover-btn">
                <iconify-icon icon="logos:whatsapp-icon"></iconify-icon> Enviar Mensagem para Recuperar Venda
            </a>
        `;
        list.appendChild(card);
    });
}