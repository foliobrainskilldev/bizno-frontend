document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById("contact-form");
    const modalOverlay = document.getElementById("feedback-modal-overlay");
    const modalIcon = document.getElementById("feedback-modal-icon");
    const modalMessage = document.getElementById("feedback-modal-message");
    const modalCloseBtn = document.getElementById("feedback-modal-close-btn");

    const icons = {
        loading: `<svg class="spinner-icon" viewBox="0 0 50 50" style="width: 100%; height: 100%;"><circle cx="25" cy="25" r="20" fill="none" stroke-width="5" stroke="#D4AF37" stroke-linecap="round"></circle></svg>`,
        success: `<svg class="tick-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" style="width: 100%; height: 100%;"><circle cx="26" cy="26" r="25" fill="#28a745"/><path fill="none" stroke="#FFF" stroke-width="4" stroke-linecap="round" d="M14 27l5.9 5.9L38 18.2"/></svg>`,
        error: `<svg class="cross-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" style="width: 100%; height: 100%;"><circle cx="26" cy="26" r="25" fill="#dc3545"/><path fill="none" stroke="#FFF" stroke-width="4" stroke-linecap="round" d="M16 16l20 20M36 16L16 36"/></svg>`
    };

    const showModal = (state, message) => {
        modalIcon.innerHTML = icons[state];
        modalMessage.textContent = message;
        modalOverlay.classList.add('visible');
        modalCloseBtn.style.display = (state === 'error') ? 'inline-block' : 'none';
    };

    const hideModal = () => { modalOverlay.classList.remove('visible'); };

    modalCloseBtn.addEventListener('click', hideModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay && modalCloseBtn.style.display !== 'none') hideModal();
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const submitButton = event.target.querySelector('button[type="submit"]');
        
        showModal('loading', 'A Enviar...');
        submitButton.disabled = true;
        
        const data = new FormData(event.target);
        
        try {
            const response = await fetch(event.target.action, {
                method: form.method,
                body: data,
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                showModal('success', 'Mensagem enviada com sucesso!');
                form.reset();
                setTimeout(hideModal, 2500);
            } else {
                throw new Error("Ocorreu um problema no servidor.");
            }
        } catch (error) {
            showModal('error', `Erro: ${error.message || "Não foi possível enviar a sua mensagem."}`);
        } finally {
            submitButton.disabled = false;
        }
    });
});