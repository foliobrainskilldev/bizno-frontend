document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
});

async function loadOrders() {
    document.getElementById('skeleton-view').style.display = 'block';
    document.getElementById('content-view').style.display = 'none';

    const ordersList = document.getElementById('orders-list');
    ordersList.innerHTML = '';

    try {
        const result = await apiFetch('/orders');
        renderOrders(result.orders);
    } catch (error) {
        ordersList.innerHTML = `<p class="no-data-message">Erro ao carregar pedidos: ${error.message}</p>`;
    } finally {
        document.getElementById('skeleton-view').style.display = 'none';
        document.getElementById('content-view').style.display = 'block';
    }
}

function renderOrders(orders) {
    const ordersList = document.getElementById('orders-list');
    if (!orders || orders.length === 0) {
        ordersList.innerHTML = '<p class="no-data-message">Você ainda não recebeu nenhum pedido.</p>';
        return;
    }

    orders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'interaction-card';
        orderCard.dataset.id = order.id;

        const orderDate = new Date(order.createdAt).toLocaleString('pt-PT', {
            day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        let statusHtml = '';
        let actionButtons = '';
        const status = order.status || 'pending';

        if (status === 'pending') {
            statusHtml = `<span style="color: var(--laranja-aviso); font-weight: bold; font-size: 0.9rem;">Pendente</span>`;
            actionButtons = `
                <button class="primary-btn sell-btn" style="background-color: var(--verde-sucesso); color: white; border: none; padding: 8px 15px; border-radius: 6px; font-weight: bold; cursor: pointer;">
                    <iconify-icon icon="solar:check-circle-bold"></iconify-icon> Vendido
                </button>
                <button class="primary-btn cancel-btn" style="background-color: var(--vermelho-alerta); color: white; border: none; padding: 8px 15px; border-radius: 6px; font-weight: bold; cursor: pointer;">
                    <iconify-icon icon="solar:close-circle-bold"></iconify-icon> Não Vendido
                </button>
            `;
        } else if (status === 'sold') {
            statusHtml = `<span style="color: var(--verde-sucesso); font-weight: bold; font-size: 0.9rem;">Vendido</span>`;
            actionButtons = `
                <button class="primary-btn receipt-btn" style="background-color: var(--azul-escuro); color: white; border: none; padding: 8px 15px; border-radius: 6px; font-weight: bold; cursor: pointer;">
                    <iconify-icon icon="solar:document-add-bold"></iconify-icon> Gerar Recibo PDF
                </button>
            `;
        } else {
            statusHtml = `<span style="color: var(--vermelho-alerta); font-weight: bold; font-size: 0.9rem;">Cancelado</span>`;
        }

        const cleanDetails = escapeHTML(order.details);

        orderCard.innerHTML = `
            <div class="interaction-card-header" style="display: flex; justify-content: space-between; align-items: center;">
                <strong>Pedido de ${orderDate}</strong>
                ${statusHtml}
            </div>
            <div class="interaction-card-body">
                <pre class="interaction-details" style="white-space: pre-wrap; word-break: break-word; font-family: inherit;">${cleanDetails}</pre>
            </div>
            <div class="interaction-card-footer" style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center; justify-content: flex-end;">
                ${actionButtons}
                <button class="secondary-btn copy-btn" style="border: 1px solid #ccc; padding: 8px 15px; border-radius: 6px; background: white; cursor: pointer; font-weight: bold;">
                    <iconify-icon icon="solar:copy-linear"></iconify-icon> Copiar
                </button>
            </div>
        `;
        ordersList.appendChild(orderCard);
    });
}

document.getElementById('orders-list').addEventListener('click', async function(event) {
    const card = event.target.closest('.interaction-card');
    if (!card) return;
    const orderId = card.dataset.id;

    if (event.target.closest('.copy-btn')) {
        const messageText = card.querySelector('.interaction-details').textContent;
        navigator.clipboard.writeText(messageText).then(() => {
            showToast('Mensagem copiada com sucesso!');
        }).catch(() => {
            showToast('Falha ao copiar a mensagem.', 'error');
        });
    }

    if (event.target.closest('.sell-btn')) {
        await updateOrderStatus(orderId, 'sold');
    }

    if (event.target.closest('.cancel-btn')) {
        await updateOrderStatus(orderId, 'cancelled');
    }

    if (event.target.closest('.receipt-btn')) {
        generateAndSendReceipt(card);
    }

    if (event.target.closest('.send-wa-btn')) {
        const url = event.target.closest('.send-wa-btn').dataset.url;
        window.open(url, '_blank');
    }
});

async function updateOrderStatus(orderId, status) {
    toggleLoader(true);
    try {
        await apiFetch(`/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        showToast(status === 'sold' ? 'Marcado como vendido! O estoque foi deduzido.' : 'Pedido cancelado.');
        loadOrders();
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        toggleLoader(false);
    }
}

function generateAndSendReceipt(card) {
    const { jsPDF } = window.jspdf;
    
    let baseHeight = 200;
    
    const storeName = localStorage.getItem('biznoUserName') || "LOJA BIZNO";
    const storeLink = localStorage.getItem('biznoUserName') ? sanitizeForURL(localStorage.getItem('biznoUserName')) + ".bizno.store" : "bizno.store";
    const details = card.querySelector('.interaction-details').textContent;
    const dateStr = card.querySelector('strong').textContent.replace('Pedido de ', '');
    const orderId = card.dataset.id ? card.dataset.id.substring(0, 8).toUpperCase() : Math.random().toString(36).substr(2, 8).toUpperCase();
    
    let totalValue = "0.00 MZN";
    let paymentMethod = "A combinar";
    let clientName = "-";
    let clientContact = "-";
    let clientAddress = "Levantamento no local";
    
    const items = [];
    
    const lines = details.split('\n').map(l => l.trim());
    let parsingItems = false;
    
    lines.forEach(line => {
        if (line.includes('-----------------------------')) {
            parsingItems = !parsingItems;
            return;
        }
        if (parsingItems && line !== '') {
            items.push(line);
        }
        if (line.startsWith('*Total:')) totalValue = line.replace(/\*/g, '').replace('Total:', '').trim();
        if (line.startsWith('Nome:')) clientName = line.replace('Nome:', '').trim();
        if (line.startsWith('Contacto:')) clientContact = line.replace('Contacto:', '').trim();
        if (line.startsWith('Endereço:')) clientAddress = line.replace('Endereço:', '').trim();
        if (line.startsWith('*Método de Pagamento:*')) paymentMethod = line.replace(/\*/g, '').replace('Método de Pagamento:', '').trim();
    });

    if (clientAddress.length > 250) {
        clientAddress = clientAddress.substring(0, 247) + '...';
    }

    const extraHeight = (items.length * 5) + (Math.ceil(clientAddress.length / 30) * 4);
    if (extraHeight > 40) baseHeight += (extraHeight - 40);

    const doc = new jsPDF({ unit: 'mm', format: [80, baseHeight] });

    doc.setFont("courier", "bold");
    let y = 15;
    
    doc.setFontSize(14);
    const splitStore = doc.splitTextToSize(storeName.toUpperCase(), 70);
    doc.text(splitStore, 40, y, { align: "center" });
    y += (splitStore.length * 6);
    
    doc.setFontSize(8);
    doc.setFont("courier", "normal");
    doc.text(storeLink, 40, y, { align: "center" });
    
    y += 8;
    doc.text("=========================================", 40, y, { align: "center" });
    
    y += 8;
    doc.setFont("courier", "bold");
    doc.setFontSize(10);
    doc.text("RECIBO DE COMPRA", 5, y);
    
    y += 8;
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.text(`Data:`, 5, y);
    y += 4;
    doc.text(dateStr.split(' às')[0] || dateStr, 5, y);
    
    y += 6;
    doc.text(`N. Pedido:`, 5, y);
    y += 4;
    doc.text(orderId, 5, y);
    
    y += 8;
    doc.text("=========================================", 40, y, { align: "center" });
    
    y += 8;
    items.forEach(item => {
        const parts = item.split(' - ');
        const itemName = parts[0];
        const itemPrice = parts[1] || "";
        
        doc.text(itemName.substring(0, 20), 5, y);
        doc.text(itemPrice, 75, y, { align: "right" });
        y += 5;
    });
    
    y += 3;
    doc.text("-----------------------------------------", 40, y, { align: "center" });
    
    y += 8;
    doc.setFont("courier", "bold");
    doc.setFontSize(11);
    doc.text("TOTAL PAGO:", 5, y);
    y += 5;
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    doc.text(totalValue, 5, y);
    
    y += 7;
    doc.setFontSize(8);
    doc.text(`Método:`, 5, y);
    y += 4;
    doc.text(paymentMethod, 5, y);

    y += 8;
    doc.text("=========================================", 40, y, { align: "center" });
    
    y += 8;
    doc.setFont("courier", "bold");
    doc.setFontSize(10);
    doc.text("DADOS DO CLIENTE:", 5, y);
    
    y += 6;
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.text("Nome:", 5, y);
    y += 4;
    doc.text(clientName.substring(0,35), 5, y);
    
    y += 6;
    doc.text("Contacto:", 5, y);
    y += 4;
    doc.text(clientContact, 5, y);
    
    y += 6;
    doc.text("Endereço/Levantamento:", 5, y);
    y += 4;
    
    const splitAddr = doc.splitTextToSize(clientAddress, 70);
    doc.text(splitAddr, 5, y);
    y += (splitAddr.length * 4);
    
    y += 8;
    doc.text("Obrigado pela preferência!", 40, y, { align: "center" });
    y += 4;
    doc.text(`Processado e gerido via Bizno.store`, 40, y, { align: "center" });
    
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `Recibo_${orderId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const footer = card.querySelector('.interaction-card-footer');
    footer.innerHTML = `
        <button class="primary-btn send-wa-btn" data-url="https://wa.me/${clientContact.replace(/\D/g, '')}?text=Ol%C3%A1!%20Muito%20obrigado%20pela%20sua%20compra.%20O%20seu%20recibo%20foi%20gerado%20com%20sucesso.%20Pode%20baixar%20o%20documento%20PDF%20que%20lhe%20enviei%20agora%20mesmo." style="background-color: #25D366; color: white; border: none; padding: 8px 15px; border-radius: 6px; font-weight: bold; cursor: pointer;">
            <iconify-icon icon="logos:whatsapp-icon"></iconify-icon> Enviar PDF pelo WhatsApp
        </button>
    `;
}

function sanitizeForURL(str) {
    return str.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
}