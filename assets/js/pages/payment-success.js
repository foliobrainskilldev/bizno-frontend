document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference') || urlParams.get('id') || urlParams.get('tx_ref');

    if (!reference) {
        showStatus('failed', 'Dados não encontrados', 'Não recebemos a referência do pagamento para verificação automática.');
        return;
    }

    verifyPaymentLoop(reference);
});

async function verifyPaymentLoop(ref, attempt = 1) {
    try {
        const response = await fetch(`${API_URL}/payment/verify/${ref}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('biznoToken')}` }
        });
        const data = await response.json();

        if (data.success) {
            if (data.status === 'approved') {
                showStatus('confirmed', 'Pagamento Aprovado!', 'O seu plano foi atualizado com sucesso. As limitações foram removidas.');
                document.getElementById('payment-details').style.display = 'block';
                document.getElementById('ref-value').textContent = `#${ref.substring(0, 12)}`;
                document.getElementById('status-value').textContent = 'Confirmado';
                document.getElementById('status-value').style.color = 'var(--verde-sucesso)';
            } 
            else if (data.status === 'pending' && attempt < 20) {
                setTimeout(() => verifyPaymentLoop(ref, attempt + 1), 4000);
            } 
            else if (data.status === 'rejected') {
                showStatus('failed', 'Pagamento Recusado', data.message || 'A operadora recusou a transação ou houve falta de saldo.');
            }
            else if (attempt >= 20) {
                showStatus('failed', 'Verificação Demorada', 'O pagamento ainda está pendente na operadora. Verifique o histórico mais tarde no painel.');
            }
        } else {
            showStatus('failed', 'Pagamento Não Encontrado', 'Não conseguimos localizar este pagamento no sistema.');
        }
    } catch (error) {
        showStatus('failed', 'Erro de Conexão', 'Não conseguimos comunicar com o servidor para validar o pagamento.');
    }
}

function showStatus(state, title, desc) {
    const card = document.getElementById('status-card');
    const icon = document.getElementById('status-icon').querySelector('iconify-icon');
    const circle = document.getElementById('status-icon').querySelector('.main-circle');
    const titleEl = document.getElementById('status-title');
    const descEl = document.getElementById('status-desc');

    titleEl.textContent = title;
    descEl.textContent = desc;

    icon.classList.remove('spinning-icon');
    circle.classList.add('pulse-animation');

    if (state === 'confirmed') {
        card.classList.add('confirmed');
        icon.setAttribute('icon', 'solar:check-circle-bold');
    } else if (state === 'failed') {
        card.classList.add('failed');
        icon.setAttribute('icon', 'solar:danger-circle-bold');
    }
}