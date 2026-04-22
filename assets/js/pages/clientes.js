document.addEventListener('DOMContentLoaded', () => {
    loadCustomers();
});

async function loadCustomers() {
    document.getElementById('skeleton-view').style.display = 'block';
    document.getElementById('content-view').style.display = 'none';

    try {
        const data = await apiFetch('/customers');
        renderCustomers(data.customers);
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        document.getElementById('skeleton-view').style.display = 'none';
        document.getElementById('content-view').style.display = 'block';
    }
}

function renderCustomers(customers) {
    const tbody = document.getElementById('customers-tbody');
    const mobileList = document.getElementById('customers-list-mobile');
    if(!tbody || !mobileList) return;

    tbody.innerHTML = ''; 
    mobileList.innerHTML = '';
    
    if (!customers || customers.length === 0) {
        const noDataMsg = `
            <div class="onboarding-container" style="margin-top:0; padding: 40px 15px; grid-column: 1/-1; text-align: center;">
                <iconify-icon icon="solar:users-group-two-rounded-bold-duotone" style="color:var(--borda-suave); font-size:4rem;"></iconify-icon>
                <h3 style="color: var(--texto-secundario); margin-top: 15px;">Ainda não tem clientes registados</h3>
                <p style="color: var(--texto-secundario);">Os clientes aparecerão aqui automaticamente quando fizerem o primeiro pedido no seu catálogo.</p>
            </div>`;
        tbody.innerHTML = `<tr><td colspan="5">${noDataMsg}</td></tr>`;
        mobileList.innerHTML = noDataMsg;
        return;
    }

    customers.forEach(customer => {
        const safeName = escapeHTML(customer.name);
        const isVip = customer.totalPurchases >= 3;
        const vipHtml = isVip ? `<span class="vip-badge"><iconify-icon icon="solar:star-bold"></iconify-icon> VIP</span>` : '';
        const lastPurchase = customer.lastPurchaseAt ? new Date(customer.lastPurchaseAt).toLocaleDateString('pt-PT') : '-';
        
        let cleanPhone = customer.phone ? customer.phone.replace(/\D/g, '') : '';
        if (cleanPhone && !cleanPhone.startsWith('258')) cleanPhone = '258' + cleanPhone;
        
        const waMessage = `Olá ${safeName}! Temos novidades no nosso catálogo que vai adorar. Posso enviar o link?`;
        const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMessage)}`;

        const actionsHtml = `
            <a href="${waLink}" target="_blank" class="whatsapp-btn">
                <iconify-icon icon="logos:whatsapp-icon"></iconify-icon> Mensagem
            </a>
        `;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${safeName}</strong> ${vipHtml}</td>
            <td>${escapeHTML(customer.phone)}</td>
            <td><strong style="color:var(--azul-escuro); font-size: 1.1rem;">${customer.totalPurchases}</strong></td>
            <td>${lastPurchase}</td>
            <td style="text-align:right;">${actionsHtml}</td>`;
        tbody.appendChild(tr);

        const card = document.createElement('div');
        card.className = 'card-mobile';
        card.style.cssText = "background: white; padding: 20px; border-radius: 12px; margin-bottom: 15px; display: flex; flex-direction:column; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid var(--borda-suave);";
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; width:100%; border-bottom:1px solid var(--fundo-pagina); padding-bottom:15px; margin-bottom:15px;">
                <div>
                    <strong style="font-size: 1.2rem; color:var(--azul-escuro); display:block; margin-bottom: 5px;">${safeName} ${vipHtml}</strong>
                    <span style="color:var(--texto-secundario); font-weight:600;"><iconify-icon icon="solar:phone-bold"></iconify-icon> ${escapeHTML(customer.phone)}</span>
                </div>
                <div style="text-align: right;">
                    <span style="font-size: 0.85rem; color:var(--texto-secundario); display:block;">Compras</span>
                    <strong style="font-size: 1.4rem; color:var(--dourado);">${customer.totalPurchases}</strong>
                </div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                <span style="font-size:0.85rem; color:var(--texto-secundario);">Última vez: ${lastPurchase}</span>
                ${actionsHtml}
            </div>
        `;
        mobileList.appendChild(card);
    });
}