document.addEventListener('DOMContentLoaded', () => {
    const verifyForm = document.getElementById('verifyForm');
    const resendCodeBtn = document.getElementById('resendCodeBtn');
    const userEmailDisplay = document.getElementById('userEmailDisplay');
    
    let userEmail = '';

    // Extrair o email da URL
    const urlParams = new URLSearchParams(window.location.search);
    userEmail = urlParams.get('email');
    
    // Se a URL não tiver e-mail, tenta recuperar da memória
    if (!userEmail) {
        userEmail = localStorage.getItem('biznoUserEmail');
    }

    if (userEmail) {
        userEmailDisplay.textContent = userEmail;
    } else {
        showAuthMessage('E-mail não encontrado. Volte à página de login.', 'error');
    }
    
    verifyForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!userEmail) return;

        toggleAuthSpinner(true);
        hideAuthMessage();

        const code = document.getElementById('verificationCode').value;

        try {
            const response = await fetch(`${API_URL}/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, code })
            });

            const data = await response.json();

            if (data.success && data.token) {
                // Atualiza a memória
                localStorage.setItem('biznoToken', data.token);
                localStorage.setItem('biznoIsVerified', 'true'); 
                
                showAuthMessage('Conta verificada! A aceder ao seu painel...', 'success');
                
                setTimeout(() => {
                    // Redireciona para URL limpa
                    window.location.href = '../dashboard/index'; 
                }, 1500);
            } else {
                showAuthMessage(data.message || 'Código inválido ou expirado.', 'error');
            }

        } catch (error) {
            showAuthMessage('Falha na comunicação com o servidor.', 'error');
        } finally {
            toggleAuthSpinner(false);
        }
    });
    
    resendCodeBtn.addEventListener('click', async () => {
        if (!userEmail) return;

        toggleAuthSpinner(true);
        hideAuthMessage();
        resendCodeBtn.disabled = true;

        try {
            const response = await fetch(`${API_URL}/resend-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail })
            });

            const data = await response.json();
             
            if (data.success) {
                showAuthMessage('Um novo código foi enviado para o seu e-mail.', 'success');
            } else {
                showAuthMessage(data.message || 'Não foi possível reenviar o código.', 'error');
            }

        } catch (error) {
             showAuthMessage('Falha na comunicação com o servidor.', 'error');
        } finally {
            toggleAuthSpinner(false);
            setTimeout(() => {
                resendCodeBtn.disabled = false;
            }, 30000); // Impede reenvios por 30 segundos
        }
    });
});