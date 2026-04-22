document.addEventListener('DOMContentLoaded', () => {
    loadHistoryData();
});

async function loadHistoryData() {
    // Garante que o Skeleton está visível
    document.getElementById('history-skeleton').style.display = 'block';
    document.getElementById('history-content').style.display = 'none';

    try {
        const response = await fetch(`${API_URL}/payment/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
            localStorage.removeItem('biznoToken');
            window.location.href = '/auth/login';
            return;
        }

        const data = await response.json();

        if (data.success) {
            renderHistory(data.history);
        } else {
            throw new Error(data.message || "Erro ao buscar histórico.");
        }

    } catch (error) {
        showToast("Não foi possível carregar o histórico de pagamentos.", "error");
        renderEmptyState("Ocorreu um erro ao carregar os dados.");
    } finally {
        // Remove os Skeletons e mostra o conteúdo real
        document.getElementById('history-skeleton').style.display = 'none';
        document.getElementById('history-content').style.display = 'block';
    }
}

function renderHistory(historyList) {
    const tbody = document.getElementById('history-tbody');
    const mobileList = document.getElementById('history-list-mobile');

    tbody.innerHTML = '';
    mobileList.innerHTML = '';

    if (!historyList || historyList.length === 0) {
        renderEmptyState("Nenhum pagamento registado na sua conta.");
        return;
    }

    const statusMap = { 
        'pending': 'Pendente', 
        'approved': 'Aprovado', 
        'rejected': 'Recusado' 
    };

    historyList.forEach(payment => {
        // Formatação de Data
        const dateObj = new Date(payment.createdAt);
        const formattedDate = dateObj.toLocaleDateString('pt-PT') + ' às ' + dateObj.toLocaleTimeString('pt-PT', {hour: '2-digit', minute:'2-digit'});
        
        const statusClass = `status-${payment.status}`;
        const statusText = statusMap[payment.status] || payment.status;
        
        const planName = payment.plan ? payment.plan.name : 'Plano Removido';
        const planPrice = payment.plan ? `${payment.plan.price} MZN` : '-';

        // --- Render Tabela (Desktop) ---
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formattedDate}</td>
            <td>${planName}</td>
            <td>${planPrice}</td>
            <td><span class="status ${statusClass}">${statusText}</span></td>
        `;
        tbody.appendChild(tr);

        // --- Render Cartões (Mobile) ---
        const card = document.createElement('div');
        card.className = 'history-card-mobile';
        card.innerHTML = `
            <div class="history-card-header">
                <span class="history-card-date"><iconify-icon icon="solar:calendar-bold"></iconify-icon> ${formattedDate}</span>
                <span class="status ${statusClass}">${statusText}</span>
            </div>
            <div class="history-card-body">
                <span class="history-card-plan">${planName}</span>
                <span class="history-card-price">${planPrice}</span>
            </div>
        `;
        mobileList.appendChild(card);
    });
}

function renderEmptyState(message) {
    const tbody = document.getElementById('history-tbody');
    const mobileList = document.getElementById('history-list-mobile');

    const emptyHtml = `
        <div class="no-data-msg">
            <iconify-icon icon="solar:wallet-money-bold-duotone" style="font-size: 4rem; color: var(--borda-suave); display:block; margin-bottom:15px;"></iconify-icon>
            ${message}
        </div>
    `;

    tbody.innerHTML = `<tr><td colspan="4">${emptyHtml}</td></tr>`;
    mobileList.innerHTML = emptyHtml;
}