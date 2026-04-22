let colorPickerPrimary, colorPickerBackground, colorPickerText, colorPickerCards;
const mainPreviewWrapper = document.getElementById('main-preview-wrapper');

const THEME_PRESETS = {
    luxo: { name: 'Padrão Bizno', colors: { primary: '#0C2340', background: '#FFFFFF', text: '#333333', cards: '#F8F9FA' }},
    moderno: { name: 'Moderno Escuro', colors: { primary: '#1A2E40', background: '#F0F2F5', text: '#333333', cards: '#FFFFFF' }},
    elegante: { name: 'Elegante Cinza', colors: { primary: '#403A3A', background: '#FFFFFF', text: '#403A3A', cards: '#F9F9F9' }},
    vibrante: { name: 'Vibrante Vermelho', colors: { primary: '#D9534F', background: '#FFFFFF', text: '#333333', cards: '#F7F7F7' }},
    porDoSol: { name: 'Pôr do Sol', colors: { primary: '#E87A5D', background: '#FFF9F5', text: '#4A3E3B', cards: '#FFFFFF' }},
    oceano: { name: 'Oceano Profundo', colors: { primary: '#005F73', background: '#E0FBFC', text: '#003440', cards: '#FFFFFF' }},
    floresta: { name: 'Folha de Chá', colors: { primary: '#4A6A5C', background: '#F4F4F4', text: '#2F4F4F', cards: '#FFFFFF' }},
    lavanda: { name: 'Campo de Lavanda', colors: { primary: '#6D23B6', background: '#F9F6FF', text: '#2D0F4D', cards: '#FFFFFF' }},
    menta: { name: 'Menta Fresca', colors: { primary: '#00B894', background: '#F0FFF4', text: '#004D3C', cards: '#FFFFFF' }},
    rosa: { name: 'Rosa Suave', colors: { primary: '#D6336C', background: '#FFF0F6', text: '#5D0E2D', cards: '#FFFFFF' }},
    areia: { name: 'Areia do Deserto', colors: { primary: '#C19A6B', background: '#FCFBF8', text: '#5A4A3B', cards: '#FFFFFF' }},
    ceu: { name: 'Céu de Verão', colors: { primary: '#3498DB', background: '#EFF8FF', text: '#153C59', cards: '#FFFFFF' }},
    onyx: { name: 'Luxo Onyx', colors: { primary: '#D4AF37', background: '#121212', text: '#EAEAEA', cards: '#1E1E1E' }},
    ardosia: { name: 'Grafite e Ardósia', colors: { primary: '#FFFFFF', background: '#34495E', text: '#ECF0F1', cards: '#4A657F' }},
    minimalista: { name: 'Minimalista', colors: { primary: '#222222', background: '#F9F9F9', text: '#333333', cards: '#FFFFFF' }},
    cafe: { name: 'Café Expresso', colors: { primary: '#6F4E37', background: '#F5EFE6', text: '#402E2D', cards: '#FFFFFF' }},
    vinho: { name: 'Vinho Tinto', colors: { primary: '#722F37', background: '#F9F2F3', text: '#4C1F25', cards: '#FFFFFF' }},
    terracota: { name: 'Argila Terracota', colors: { primary: '#E2725B', background: '#FFF6F2', text: '#643026', cards: '#FFFFFF' }},
    royal: { name: 'Ouro Royal', colors: { primary: '#0A3B66', background: '#FFFFFF', text: '#051A2E', cards: '#F0F5FA' }},
    esmeralda: { name: 'Jóia Esmeralda', colors: { primary: '#019B72', background: '#F0FFF7', text: '#004230', cards: '#FFFFFF' }}
};

document.addEventListener('DOMContentLoaded', () => {
    renderPresets();
    initializeColorPickers();
    loadVisualData();
    setupEventListeners();
});

function renderPresets() {
    const grid = document.getElementById('presets-grid');
    grid.innerHTML = '';
    for (const id in THEME_PRESETS) {
        const preset = THEME_PRESETS[id];
        const card = document.createElement('div');
        card.className = 'preset-card';
        card.dataset.presetId = id;
        
        card.innerHTML = `
            <div class="preview-wrapper" style="background-color: ${preset.colors.background}; padding: 0; overflow: hidden;">
                <div style="background-color: ${preset.colors.primary}; padding: 10px; border-radius: 0 0 15px 15px; display: flex; flex-direction: column; align-items: flex-start; padding-bottom: 15px;">
                    <div style="width: 35px; height: 35px; background: rgba(255, 255, 255, 0.2); border-radius: 8px; margin-bottom: 5px; display: flex; align-items: center; justify-content: center;">
                        <iconify-icon icon="solar:shop-2-bold-duotone" style="font-size: 1.2rem; color: ${preset.colors.background};"></iconify-icon>
                    </div>
                    <h4 style="color: ${preset.colors.background}; font-size: 0.75rem; margin: 0;">Nome da Loja</h4>
                    <div style="height: 3px; width: 50%; background: ${preset.colors.background}; opacity: 0.5; margin-top: 3px;"></div>
                </div>
                <div style="display: flex; justify-content: center; gap: 8px; margin-top: 10px;">
                    <div style="width: 25px; height: 25px; background-color: ${preset.colors.primary}; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid ${preset.colors.background};">
                        <iconify-icon icon="solar:box-minimalistic-bold-duotone" style="color: ${preset.colors.background}; font-size: 0.8rem;"></iconify-icon>
                    </div>
                    <div style="width: 25px; height: 25px; background-color: ${preset.colors.primary}; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid ${preset.colors.background};">
                        <iconify-icon icon="solar:star-bold" style="color: ${preset.colors.background}; font-size: 0.8rem;"></iconify-icon>
                    </div>
                </div>
                <div style="margin: 10px; background-color: ${preset.colors.cards}; padding: 10px; border-radius: 8px; border: 1px solid #eee; text-align: center;">
                    <div style="height: 40px; background-color: #e0e0e0; border-radius: 4px; margin-bottom: 8px;"></div>
                    <h5 style="color: ${preset.colors.text}; font-size: 0.8rem; margin: 0;">Produto</h5>
                </div>
            </div>
            <div class="preset-card-title">${preset.name}</div>
        `;
        grid.appendChild(card);
    }
}

function initializeColorPickers() {
    const pickerOptions = { width: 150, borderWidth: 2, borderColor: '#fff' };
    colorPickerPrimary = new iro.ColorPicker('#picker-primary', pickerOptions);
    colorPickerBackground = new iro.ColorPicker('#picker-background', pickerOptions);
    colorPickerText = new iro.ColorPicker('#picker-text', pickerOptions);
    colorPickerCards = new iro.ColorPicker('#picker-cards', pickerOptions);

    const onColorChange = () => {
        updatePreviewColor('--preview-primaria', colorPickerPrimary.color.hexString);
        updatePreviewColor('--preview-fundo', colorPickerBackground.color.hexString);
        updatePreviewColor('--preview-texto', colorPickerText.color.hexString);
        updatePreviewColor('--preview-cards', colorPickerCards.color.hexString);
        updateActivePreset();
    };
    
    colorPickerPrimary.on('color:change', onColorChange);
    colorPickerBackground.on('color:change', onColorChange);
    colorPickerText.on('color:change', onColorChange);
    colorPickerCards.on('color:change', onColorChange);
}

function updatePreviewColor(cssVar, newColor) {
    mainPreviewWrapper.style.setProperty(cssVar, newColor);
}

async function loadVisualData() {
    document.getElementById('skeleton-view').style.display = 'block';
    document.getElementById('theme-form').style.display = 'none';

    try {
        const result = await apiFetch('/visual');
        const visual = result.visual;
        colorPickerPrimary.color.hexString = visual.corPrimaria || '#0C2340';
        colorPickerBackground.color.hexString = visual.corFundo || '#FFFFFF';
        colorPickerText.color.hexString = visual.corTexto || '#333333';
        colorPickerCards.color.hexString = visual.corCards || '#F8F9FA';
        
        updateActivePreset();

        document.getElementById('skeleton-view').style.display = 'none';
        document.getElementById('theme-form').style.display = 'block';
    } catch (error) {
        showToast(error.message, 'error');
        document.getElementById('skeleton-view').style.display = 'none';
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    toggleLoader(true);
    
    const data = {
        corPrimaria: colorPickerPrimary.color.hexString,
        corFundo: colorPickerBackground.color.hexString,
        corTexto: colorPickerText.color.hexString,
        corCards: colorPickerCards.color.hexString
    };

    try {
        await apiFetch('/visual', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        showToast('Cores salvas com sucesso!', 'success');
    } catch (error) {
        showToast(`Erro ao salvar: ${error.message}`, 'error');
    } finally {
        toggleLoader(false);
    }
}

function setupEventListeners() {
    document.getElementById('theme-form').addEventListener('submit', handleFormSubmit);
    
    document.getElementById('presets-grid').addEventListener('click', (e) => {
        const card = e.target.closest('.preset-card');
        if (!card) return;
        const presetId = card.dataset.presetId;
        applyPreset(presetId);
    });
}

function applyPreset(presetId) {
    const preset = THEME_PRESETS[presetId];
    if (preset) {
        colorPickerPrimary.color.hexString = preset.colors.primary;
        colorPickerBackground.color.hexString = preset.colors.background;
        colorPickerText.color.hexString = preset.colors.text;
        colorPickerCards.color.hexString = preset.colors.cards;
    }
}

function updateActivePreset() {
    const currentColors = {
        primary: colorPickerPrimary.color.hexString.toUpperCase(),
        background: colorPickerBackground.color.hexString.toUpperCase(),
        text: colorPickerText.color.hexString.toUpperCase(),
        cards: colorPickerCards.color.hexString.toUpperCase()
    };

    document.querySelectorAll('.preset-card').forEach(card => card.classList.remove('active'));

    for (const id in THEME_PRESETS) {
        const presetColors = THEME_PRESETS[id].colors;
        if (
            currentColors.primary === presetColors.primary.toUpperCase() &&
            currentColors.background === presetColors.background.toUpperCase() &&
            currentColors.text === presetColors.text.toUpperCase() &&
            currentColors.cards === presetColors.cards.toUpperCase()
        ) {
            const activeCard = document.querySelector(`.preset-card[data-preset-id="${id}"]`);
            if (activeCard) activeCard.classList.add('active');
            return;
        }
    }
}