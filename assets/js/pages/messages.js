document.addEventListener('DOMContentLoaded', () => {
    loadMessages();
});

async function loadMessages() {
    document.getElementById('skeleton-view').style.display = 'block';
    document.getElementById('content-view').style.display = 'none';
    
    const messagesList = document.getElementById('messages-list');
    messagesList.innerHTML = '';

    try {
        const result = await apiFetch('/messages');
        renderMessages(result.messages);
    } catch (error) {
        messagesList.innerHTML = `<p class="no-data-message">Erro ao carregar mensagens: ${error.message}</p>`;
    } finally {
        document.getElementById('skeleton-view').style.display = 'none';
        document.getElementById('content-view').style.display = 'block';
    }
}

function renderMessages(messages) {
    const messagesList = document.getElementById('messages-list');
    if (messages.length === 0) {
        messagesList.innerHTML = '<p class="no-data-message">Você ainda não recebeu nenhuma mensagem de contato.</p>';
        return;
    }

    messages.forEach(message => {
        const messageCard = document.createElement('div');
        messageCard.className = 'interaction-card';

        const messageDate = new Date(message.createdAt).toLocaleString('pt-PT', {
            day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        
        messageCard.innerHTML = `
            <div class="interaction-card-header">
                <strong>Mensagem de ${messageDate}</strong>
            </div>
            <div class="interaction-card-body">
                <pre class="interaction-details">${message.details}</pre>
            </div>
            <div class="interaction-card-footer">
                <button class="primary-btn copy-btn">
                    <iconify-icon icon="solar:copy-linear"></iconify-icon> Copiar Mensagem
                </button>
            </div>
        `;
        messagesList.appendChild(messageCard);
    });
}

document.getElementById('messages-list').addEventListener('click', function(event) {
    const copyBtn = event.target.closest('.copy-btn');
    if (copyBtn) {
        const messageCard = copyBtn.closest('.interaction-card');
        const messageText = messageCard.querySelector('.interaction-details').textContent;
        
        navigator.clipboard.writeText(messageText).then(() => {
            showToast('Mensagem copiada!');
        }).catch(err => {
            showToast('Falha ao copiar a mensagem.', 'error');
        });
    }
});