document.addEventListener('DOMContentLoaded', () => {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    
    forgotPasswordForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        toggleAuthSpinner(true);
        hideAuthMessage();

        const email = document.getElementById('email').value;

        try {
            const response = await fetch(`${API_URL}/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            
            if (data.success) {
                showAuthMessage('Pedido recebido. Se o seu e-mail estiver cadastrado, receberá um código.', 'success');
                setTimeout(() => {
                    window.location.href = `/auth/reset-password?email=${encodeURIComponent(email)}`;
                }, 2500);
            } else {
                showAuthMessage(data.message || 'Ocorreu um erro.', 'error');
                toggleAuthSpinner(false);
            }

        } catch (error) {
            showAuthMessage('Não foi possível ligar ao servidor. Verifique a sua conexão.', 'error');
            toggleAuthSpinner(false);
        }
    });
});