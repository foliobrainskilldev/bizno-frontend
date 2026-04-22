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
            showAuthMessage(data.message || 'Erro ao processar conta Google.', 'error');
            toggleAuthSpinner(false);
        }
    } catch (error) {
        showAuthMessage('Não foi possível ligar ao servidor.', 'error');
        toggleAuthSpinner(false);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const nextBtn = document.getElementById('next-btn');
    const backBtn = document.getElementById('back-btn');
    const stepDescription = document.getElementById('step-description');

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const storeNameInput = document.getElementById('storeName');
    const whatsappInput = document.getElementById('whatsapp');

    nextBtn.addEventListener('click', () => {
        if (emailInput.checkValidity() && passwordInput.checkValidity()) {
            step1.style.display = 'none';
            step2.style.display = 'block';
            stepDescription.textContent = 'Passo 2 de 2: Dados da Loja';
            storeNameInput.required = true;
            whatsappInput.required = true;
        } else {
            emailInput.reportValidity();
            passwordInput.reportValidity();
        }
    });

    backBtn.addEventListener('click', () => {
        step2.style.display = 'none';
        step1.style.display = 'block';
        stepDescription.textContent = 'Passo 1 de 2: Dados de Acesso';
        storeNameInput.required = false;
        whatsappInput.required = false;
    });

    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        toggleAuthSpinner(true);
        hideAuthMessage();

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    storeName: storeNameInput.value, 
                    whatsapp: whatsappInput.value, 
                    email: emailInput.value, 
                    password: passwordInput.value 
                })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('biznoToken', data.token);
                localStorage.setItem('biznoIsVerified', 'false'); 
                localStorage.setItem('biznoUserEmail', emailInput.value); 
                window.location.href = '../dashboard/index'; 
            } else {
                showAuthMessage(data.message || 'Ocorreu um erro. Tente novamente.', 'error');
                toggleAuthSpinner(false);
            }

        } catch (error) {
            showAuthMessage('Não foi possível ligar ao servidor. Verifique a sua conexão.', 'error');
            toggleAuthSpinner(false);
        }
    });
});