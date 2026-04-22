async function handleGoogleLogin(response) {
    toggleAuthSpinner(true);
    hideAuthMessage();

    try {
        const res = await fetch(`${API_URL}/google-auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: response.credential })
        });

        const data = await res.json();

        if (data.success) {
            localStorage.setItem('biznoToken', data.token);
            localStorage.setItem('biznoIsVerified', data.isVerified ? 'true' : 'false');
            window.location.href = '../dashboard/index';
        } else {
            showAuthMessage(data.message || 'Erro ao fazer login com o Google.', 'error');
            toggleAuthSpinner(false);
        }
    } catch (error) {
        showAuthMessage('Não foi possível ligar ao servidor.', 'error');
        toggleAuthSpinner(false);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        toggleAuthSpinner(true);
        hideAuthMessage();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('biznoToken', data.token);
                localStorage.setItem('biznoIsVerified', data.isVerified ? 'true' : 'false');
                localStorage.setItem('biznoUserEmail', email);
                window.location.href = '../dashboard/index';
            } else {
                showAuthMessage(data.message || 'Credenciais inválidas. Tente novamente.', 'error');
                toggleAuthSpinner(false);
            }

        } catch (error) {
            showAuthMessage('Não foi possível ligar ao servidor. Verifique a sua conexão.', 'error');
            toggleAuthSpinner(false);
        }
    });
});