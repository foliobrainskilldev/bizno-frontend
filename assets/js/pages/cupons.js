let couponsCache = [];
let couponToDeleteId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadCoupons();
    setupEventListeners();
});

async function loadCoupons() {
    document.getElementById('skeleton-view').style.display = 'block';
    document.getElementById('content-view').style.display = 'none';

    try {
        const data = await apiFetch('/coupons');
        couponsCache = data.coupons;
        renderCoupons();
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        document.getElementById('skeleton-view').style.display = 'none';
        document.getElementById('content-view').style.display = 'block';
    }
}

function renderCoupons() {
    const tbody = document.getElementById('coupons-tbody');
    const mobileList = document.getElementById('coupons-list-mobile');
    if(!tbody || !mobileList) return;

    tbody.innerHTML = ''; 
    mobileList.innerHTML = '';
    
    if (couponsCache.length === 0) {
        const noDataMsg = `
            <div class="onboarding-container" style="margin-top:0; padding: 30px 15px; grid-column: 1/-1; text-align: center;">
                <iconify-icon icon="solar:sale-bold-duotone" style="color:var(--dourado); font-size:3rem;"></iconify-icon>
                <h3>Sem Cupons</h3>
                <p>Atraia mais clientes oferecendo descontos.</p>
            </div>`;
        tbody.innerHTML = `<tr><td colspan="5">${noDataMsg}</td></tr>`;
        mobileList.innerHTML = noDataMsg;
        return;
    }

    couponsCache.forEach(coupon => {
        const discount = coupon.discountPercentage ? `${coupon.discountPercentage}%` : `${coupon.discountFixed} MZN`;
        const uses = coupon.maxUses ? `${coupon.currentUses} / ${coupon.maxUses}` : `${coupon.currentUses} / ∞`;
        const valid = coupon.validUntil ? new Date(coupon.validUntil).toLocaleDateString('pt-PT') : 'Ilimitado';
        
        const actionsHtml = `
            <button class="delete-btn" data-id="${coupon.id}" title="Apagar" style="background: none; border: none; color: var(--vermelho-alerta); font-size: 1.5rem; cursor: pointer;"><iconify-icon icon="solar:trash-bin-trash-bold"></iconify-icon></button>
        `;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong style="color:var(--dourado); background:rgba(212,175,55,0.1); padding:5px 10px; border-radius:6px; letter-spacing:1px;">${coupon.code}</strong></td>
            <td>${discount}</td>
            <td>${uses}</td>
            <td>${valid}</td>
            <td style="text-align:right;">${actionsHtml}</td>`;
        tbody.appendChild(tr);

        const card = document.createElement('div');
        card.className = 'card-mobile';
        card.style.cssText = "background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; display: flex; flex-direction:column; box-shadow: 0 2px 4px rgba(0,0,0,0.05);";
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%; border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:10px;">
                <strong style="color:var(--dourado); background:rgba(212,175,55,0.1); padding:5px 10px; border-radius:6px;">${coupon.code}</strong>
                ${actionsHtml}
            </div>
            <div style="display:flex; justify-content:space-between; width:100%; font-size:0.9rem; color:var(--texto-secundario);">
                <span>Desconto: <b>${discount}</b></span>
                <span>Uso: <b>${uses}</b></span>
            </div>
        `;
        mobileList.appendChild(card);
    });
}

function openModal() {
    document.getElementById('coupon-form').reset();
    document.getElementById('coupon-modal').classList.add('open');
}

function closeModal() {
    document.getElementById('coupon-modal').classList.remove('open');
}

async function handleFormSubmit(event) {
    event.preventDefault();
    const submitButton = event.target.querySelector('button[type="submit"]');
    
    const perc = document.getElementById('discountPercentage').value;
    const fix = document.getElementById('discountFixed').value;

    if (!perc && !fix) {
        showToast('Informe um desconto percentual ou fixo.', 'error');
        return;
    }

    submitButton.classList.add('btn-loading');

    const bodyData = {
        code: document.getElementById('code').value,
        discountPercentage: perc,
        discountFixed: fix,
        maxUses: document.getElementById('maxUses').value,
        validUntil: document.getElementById('validUntil').value
    };

    try {
        await apiFetch('/coupons', {
            method: 'POST',
            body: JSON.stringify(bodyData)
        });
        
        showToast('Cupom criado com sucesso!');
        closeModal();
        await loadCoupons(); 
    } catch (error) {
        showToast(`Erro: ${error.message}`, 'error');
    } finally {
        submitButton.classList.remove('btn-loading');
    }
}

function setupEventListeners() {
    document.getElementById('add-coupon-btn-desktop')?.addEventListener('click', () => openModal());
    document.getElementById('add-coupon-btn-mobile')?.addEventListener('click', () => openModal());
    document.getElementById('modal-close-btn')?.addEventListener('click', closeModal);
    document.getElementById('coupon-modal')?.addEventListener('click', (e) => {
        if(e.target === e.currentTarget) closeModal();
    });
    
    document.getElementById('coupon-form')?.addEventListener('submit', handleFormSubmit);
    
    document.querySelector('.content-container')?.addEventListener('click', (e) => {
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) openConfirmModal(deleteBtn.dataset.id);
    });
    
    document.getElementById('confirm-cancel-btn')?.addEventListener('click', closeConfirmModal);
    document.getElementById('confirm-delete-btn')?.addEventListener('click', executeDelete);
    document.getElementById('confirm-modal')?.addEventListener('click', (e) => {
        if(e.target === e.currentTarget) closeConfirmModal();
    });
}

function openConfirmModal(couponId) {
    couponToDeleteId = couponId;
    document.getElementById('confirm-modal').classList.add('open');
}

function closeConfirmModal() {
    couponToDeleteId = null;
    document.getElementById('confirm-modal').classList.remove('open');
}

async function executeDelete() {
    if (!couponToDeleteId) return;
    const confirmBtn = document.getElementById('confirm-delete-btn');
    confirmBtn.classList.add('btn-loading');

    try {
        await apiFetch(`/coupons/${couponToDeleteId}`, { method: 'DELETE' });
        showToast('Cupom apagado com sucesso!');
        couponsCache = couponsCache.filter(c => c.id !== couponToDeleteId);
        renderCoupons();
    } catch (error) {
        showToast(`Erro: ${error.message}`, 'error');
    } finally {
        confirmBtn.classList.remove('btn-loading');
        closeConfirmModal();
    }
}