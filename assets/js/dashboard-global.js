const urlParams = new URLSearchParams(window.location.search);
const magicToken = urlParams.get('magic_token');

if (magicToken) {
    localStorage.setItem('biznoToken', magicToken);
    window.history.replaceState({}, document.title, window.location.pathname);
}

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isLocalhost ? 'http://localhost:3000/api' : 'https://biznoserverbs.onrender.com/api';
const token = localStorage.getItem('biznoToken');

if (!token && !window.location.pathname.includes('login')) {
    window.location.href = '/auth/login';
}

const escapeHTML = (str) => {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        } [tag])
    );
};

function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<iconify-icon icon="${type === 'success' ? 'solar:check-circle-linear' : 'solar:danger-circle-linear'}"></iconify-icon> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function toggleLoader(show) {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = show ? 'flex' : 'none';
}

async function apiFetch(endpoint, options = {}) {
    const defaultHeaders = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
    };

    if (options.body && !(options.body instanceof FormData)) {
        defaultHeaders['Content-Type'] = 'application/json';
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('biznoToken');
            window.location.href = '/auth/login';
            throw new Error('Sessão expirada.');
        }

        const data = await response.json();

        if (!response.ok || (data.hasOwnProperty('success') && !data.success)) {
            throw new Error(data.message || 'Ocorreu um erro.');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

async function setupGlobalUserAvatar() {
    let avatarUrl = localStorage.getItem('biznoUserAvatar');
    let userName = localStorage.getItem('biznoUserName');

    try {
        const [accountData, visualData] = await Promise.all([apiFetch('/my-account'), apiFetch('/visual')]);
        userName = accountData.account.displayName || accountData.account.storeName;
        avatarUrl = visualData.visual?.userAvatar?.url || '';

        localStorage.setItem('biznoUserName', userName);
        if (avatarUrl) localStorage.setItem('biznoUserAvatar', avatarUrl);

        const whatsappBanner = document.getElementById('whatsapp-warning-banner');
        if (whatsappBanner && accountData.account.whatsapp === '258000000000') {
            whatsappBanner.style.display = 'flex';
        }
    } catch {}

    document.querySelectorAll('.global-user-avatar').forEach(container => {
        if (avatarUrl) container.innerHTML = `<img src="${avatarUrl}" alt="Avatar">`;
    });

    const sidebarMenu = document.querySelector('.sidebar-menu');
    if (sidebarMenu && !document.querySelector('.sidebar-user-profile')) {
        sidebarMenu.insertAdjacentHTML('afterbegin', `
            <a href="/dashboard/ajustes" class="sidebar-user-profile">
                <div class="global-user-avatar">${avatarUrl ? `<img src="${avatarUrl}">` : `<iconify-icon icon="solar:user-bold-duotone"></iconify-icon>`}</div>
                <div class="user-info">
                    <strong>${escapeHTML(userName) || 'Ajustes'}</strong>
                    <span>Minha Conta</span>
                </div>
            </a>
        `);
    }
}

function setupSidebarAndMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const desktopToggleBtn = document.getElementById('sidebar-toggle');
    const mobileToggleBtn = document.getElementById('hamburger-btn');

    if (desktopToggleBtn) desktopToggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        document.getElementById('main-content').classList.toggle('full-width');
    });

    if (mobileToggleBtn) mobileToggleBtn.addEventListener('click', () => sidebar.classList.toggle('show'));

    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 992 && sidebar?.classList.contains('show')) {
            if (!sidebar.contains(e.target) && e.target !== mobileToggleBtn && !mobileToggleBtn.contains(e.target)) {
                sidebar.classList.remove('show');
            }
        }
    });

    document.getElementById('logout-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = '/auth/login';
    });

    setupGlobalUserAvatar();
}

document.addEventListener('DOMContentLoaded', setupSidebarAndMobileMenu);