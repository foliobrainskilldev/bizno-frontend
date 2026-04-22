let mainChart;
let flatpickrInstance;

document.addEventListener('DOMContentLoaded', () => {
    const chartDom = document.getElementById('main-chart');
    if (chartDom) {
        mainChart = echarts.init(chartDom);
        window.addEventListener('resize', () => mainChart.resize());
    }
    
    setupEventListeners();
    initializeFlatpickr();
    fetchAndRenderStats('7days');
});

function setupEventListeners() {
    const filterBtn = document.getElementById('filter-btn');
    const modal = document.getElementById('filter-modal');
    const closeBtn = document.getElementById('modal-close-btn');

    filterBtn.addEventListener('click', () => modal.classList.add('open'));
    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
    });

    const customRangeBtn = document.getElementById('custom-range-btn');
    const customFields = document.getElementById('custom-range-fields');
    customRangeBtn.addEventListener('click', () => {
        customFields.style.display = customFields.style.display === 'block' ? 'none' : 'block';
    });

    document.querySelectorAll('.filter-options button[data-range]').forEach(button => {
        button.addEventListener('click', () => {
            const range = button.dataset.range;
            document.getElementById('current-filter-display').textContent = `Exibindo dados de: ${button.textContent}`;
            fetchAndRenderStats(range);
            modal.classList.remove('open');
        });
    });

    document.getElementById('apply-custom-filter-btn').addEventListener('click', () => {
        const [startDate, endDate] = flatpickrInstance.selectedDates;
        if (startDate && endDate) {
            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];
            document.getElementById('current-filter-display').textContent = `Exibindo dados de: ${startDate.toLocaleDateString('pt-PT')} a ${endDate.toLocaleDateString('pt-PT')}`;
            fetchAndRenderStats('custom', startStr, endStr);
            modal.classList.remove('open');
        }
    });
}

function initializeFlatpickr() {
    flatpickr.localize(flatpickr.l10ns.pt);
    flatpickrInstance = flatpickr("#start-date", {
        mode: "range",
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "d/m/Y",
        maxDate: "today",
        onChange: function(selectedDates, dateStr, instance) {
            const applyBtn = document.getElementById('apply-custom-filter-btn');
            const endDateInput = document.querySelector(instance.input.dataset.fpInline ? '.flatpickr-calendar .flatpickr-input' : '#end-date');
            
            if (selectedDates.length === 2) {
                endDateInput.value = instance.formatDate(selectedDates[1], "d/m/Y");
                applyBtn.disabled = false;
            } else {
                endDateInput.value = '';
                applyBtn.disabled = true;
            }
        },
    });
}

async function fetchAndRenderStats(range, startDate = null, endDate = null) {
    document.getElementById('skeleton-view').style.display = 'block';
    document.getElementById('content-view').style.display = 'none';
    
    let url = `/statistics?range=${range}`;
    if (range === 'custom' && startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
    }

    try {
        const result = await apiFetch(url);
        updateKpis(result.kpis);
        renderMainChart(result.chartData);
        renderTopProducts(result.topProducts);
    } catch (error) {
        showToast(`Erro ao carregar estatísticas: ${error.message}`, 'error');
    } finally {
        document.getElementById('skeleton-view').style.display = 'none';
        document.getElementById('content-view').style.display = 'block';
        if (mainChart) mainChart.resize(); 
    }
}

function updateKpis(kpis) {
    if (document.getElementById('kpi-visits')) document.getElementById('kpi-visits').textContent = kpis.totalVisits;
    if (document.getElementById('kpi-orders')) document.getElementById('kpi-orders').textContent = kpis.totalOrders;
    if (document.getElementById('kpi-conversion')) document.getElementById('kpi-conversion').textContent = kpis.conversionRate;
}

function renderMainChart(data) {
    if (!mainChart) return;
    const azulCor = '#0C2340';
    const douradoCor = '#D4AF37';

    const option = {
        tooltip: { trigger: 'axis' },
        legend: { data: ['Visitas', 'Pedidos'], bottom: 0 },
        xAxis: { type: 'category', data: data.map(item => new Date(item.date).toLocaleDateString('pt-PT', {day: 'numeric', month: 'short'})) },
        yAxis: { type: 'value', minInterval: 1 },
        series: [
            { name: 'Visitas', type: 'line', smooth: true, data: data.map(item => item.visits), itemStyle: { color: azulCor } },
            { name: 'Pedidos', type: 'line', smooth: true, data: data.map(item => item.orders), itemStyle: { color: douradoCor }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(212, 175, 55, 0.5)' }, { offset: 1, color: 'rgba(212, 175, 55, 0)' }]) } }
        ],
        grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true }
    };
    mainChart.setOption(option, true);
}

function renderTopProducts(products) {
    const tbody = document.getElementById('top-products-tbody');
    tbody.innerHTML = '';
    if (!products || products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Nenhum produto visualizado neste período.</td></tr>';
        return;
    }
    products.forEach(product => {
        const placeholderImage = 'https://via.placeholder.com/50';
        const imageUrl = product.images && product.images.length > 0 ? product.images[0].url : placeholderImage;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${imageUrl}" alt="${product.name}" class="product-thumbnail"></td>
            <td class="product-name-cell">${product.name}</td>
            <td>${product.viewCount}</td>
        `;
        tbody.appendChild(tr);
    });
}