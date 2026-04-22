document.addEventListener('DOMContentLoaded', () => {
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    let userEmail = '';

    const urlParams = new URLSearchParams(window.location.search);
    userEmail = urlParams.get('email');
    
    if (!userEmail) {
        showAuthMessage('E-mail não encontrado. Volte ao início do processo.', 'error');
    }

    resetPasswordForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!userEmail) return;

        toggleAuthSpinner(true);
        hideAuthMessage();

        const code = document.getElementById('code').value;
        const newPassword = document.getElementById('newPassword').value;

        try {
            const response = await fetch(`${API_URL}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, code, newPassword })
            });

            const data = await response.json();

            if (data.success) {
                showAuthMessage('Senha redefinida com sucesso!', 'success');
                setTimeout(() => {
                    window.location.href = '/auth/login';
                }, 2000);
            } else {
                showAuthMessage(data.message || 'Código inválido ou expirado.', 'error');
                toggleAuthSpinner(false);
            }
        } catch (error) {
            showAuthMessage('Falha na comunicação com o servidor.', 'error');
            toggleAuthSpinner(false);
        }
    });
});