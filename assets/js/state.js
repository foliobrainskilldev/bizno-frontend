const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_URL = isLocalhost ? 'http://localhost:3000/api' : 'https://biznoserverbs.onrender.com/api';

let currentStore = {};
let allProducts = [];
let allCategories = [];
let cart = [];
let cartStorageKey = 'biznoCart_default';
let plyrPlayer = null;

const getSanitizedWhatsappUrl = (phone, text = '') => {
    let cleanPhone = (phone || '').replace(/\D/g, '');
    if (cleanPhone && !cleanPhone.startsWith('258')) cleanPhone = '258' + cleanPhone;
    return text ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}` : `https://wa.me/${cleanPhone}`;
};

const escapeHTML = (str) => {
    return String(str || '').replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    } [tag]));
};