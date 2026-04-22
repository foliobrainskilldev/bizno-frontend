// Configuração Global da API para Autenticação
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isLocalhost ? 'http://localhost:3000/api' : 'https://biznoserverbs.onrender.com/api';

// Funções Utilitárias Globais
function showAuthMessage(message, type = 'error') {
    const messageBox = document.getElementById('messageBox');
    if (messageBox) {
        messageBox.textContent = message;
        messageBox.className = `message-box ${type}`;
        messageBox.style.display = 'block';
    }
}

function toggleAuthSpinner(show) {
    const spinner = document.getElementById('spinner');
    if (spinner) {
        spinner.style.display = show ? 'flex' : 'none';
    }
}

function hideAuthMessage() {
    const messageBox = document.getElementById('messageBox');
    if (messageBox) messageBox.style.display = 'none';
}