// Datos de la aplicación
const appData = {
    projectInfo: {
        name: '',
        year: 2025,
        length: 0
    },
    works: [],
    nextWorkId: 1,
    months: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    workTypes: {
        pavimentacion: {
            name: 'Pavimentación',
            defaultResources: [
                { name: 'Asfalto', unit: 'ton', quantity: 0, price: 120 },
                { name: 'Maquinaria', unit: 'hora', quantity: 0, price: 250 },
                { name: 'Mano de obra', unit: 'hora', quantity: 0, price: 15 }
            ]
        },
        pintura: {
            name: 'Pintura',
            defaultResources: [
                { name: 'Pintura reflectante', unit: 'litro', quantity: 0, price: 45 },
                { name: 'Equipo de pintado', unit: 'hora', quantity: 0, price: 80 },
                { name: 'Mano de obra', unit: 'hora', quantity: 0, price: 12 }
            ]
        },
        senales: {
            name: 'Señales',
            defaultResources: [
                { name: 'Señales de tráfico', unit: 'unidad', quantity: 0, price: 150 },
                { name: 'Postes', unit: 'unidad', quantity: 0, price: 75 },
                { name: 'Mano de obra', unit: 'hora', quantity: 0, price: 14 }
            ]
        },
        barreras: {
            name: 'Barreras Metálicas',
            defaultResources: [
                { name: 'Barrera metálica', unit: 'metro', quantity: 0, price: 85 },
                { name: 'Postes de soporte', unit: 'unidad', quantity: 0, price: 40 },
                { name: 'Maquinaria', unit: 'hora', quantity: 0, price: 120 },
                { name: 'Mano de obra', unit: 'hora', quantity: 0, price: 16 }
            ]
        }
    }
};

// Elementos DOM
const elements = {
    projectName: document.getElementById('project-name'),
    projectYear: document.getElementById('project-year'),
    projectLength: document.getElementById('project-length'),
    workDetailsContainer: document.getElementById('work-details-container'),
    noWorksMessage: document.querySelector('.no-works-message'),
    monthlyData: document.getElementById('monthly-data'),
    monthlyTotals: document.getElementById('monthly-totals'),
    grandTotal: document.getElementById('grand-total'),
    monthlyChart: document.getElementById('monthly-chart'),
    workTypeTotals: {
        pavimentacion: document.getElementById('pavimentacion-total'),
        pintura: document.getElementById('pintura-total'),
        senales: document.getElementById('senales-total'),
        barreras: document.getElementById('barreras-total')
    },
    presupuestoTotal: document.getElementById('presupuesto-total'),
    generateReportBtn: document.getElementById('generate-report-btn'),
    saveBudgetBtn: document.getElementById('save-budget-btn'),
    resetBtn: document.getElementById('reset-btn'),
    // Templates
    workDetailTemplate: document.getElementById('work-detail-template'),
    resourceRowTemplate: document.getElementById('resource-row-template'),
    monthSliderTemplate: document.getElementById('month-slider-template')
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar eventos
    initEvents();
    
    // Inicializar valores
    elements.projectYear.value = appData.projectInfo.year;
    
    // Actualizar interfaz
    updateInterface();
});

// Inicializar eventos
function initEvents() {
    // Eventos de información del proyecto
    elements.projectName.addEventListener('input', updateProjectInfo);
    elements.projectYear.addEventListener('input', updateProjectInfo);
    elements.projectLength.addEventListener('input', updateProjectInfo);
    
    // Eventos de botones de trabajo
    document.querySelectorAll('.add-work-btn').forEach(btn => {
        btn.addEventListener('click', () => addWork(btn.dataset.work));
    });
    
    // Eventos de botones de acción
    elements.generateReportBtn.addEventListener('click', generateReport);
    elements.saveBudgetBtn.addEventListener('click', saveBudget);
    elements.resetBtn.addEventListener('click', resetBudget);
}

// Actualizar información del proyecto
function updateProjectInfo() {
    appData.projectInfo.name = elements.projectName.value;
    appData.projectInfo.year = parseInt(elements.projectYear.value);
    appData.projectInfo.length = parseFloat(elements.projectLength.value) || 0;
}

// Agregar un nuevo trabajo
function addWork(workType) {
    // Verificar si ya existe este tipo de trabajo
    const existingWork = appData.works.find(work => work.type === workType);
    if (existingWork) {
        alert(`Ya existe un trabajo de tipo ${appData.workTypes[workType].name}`);
        return;
    }
    
    // Crear nuevo trabajo
    const newWork = {
        id: appData.nextWorkId++,
        type: workType,
        name: appData.workTypes[workType].name,
        resources: JSON.parse(JSON.stringify(appData.workTypes[workType].defaultResources)),
        monthlyDistribution: Array(12).fill(0),
        total: 0
    };
    
    // Agregar al array de trabajos
    appData.works.push(newWork);
    
    // Actualizar interfaz
    updateInterface();
    
    // Crear elemento de trabajo
    createWorkElement(newWork);
}

// Crear elemento de trabajo en el DOM
function createWorkElement(work) {
    // Clonar template
    const workElement = elements.workDetailTemplate.content.cloneNode(true);
    const workItem = workElement.querySelector('.work-detail-item');
    
    // Establecer ID y título
    workItem.dataset.workId = work.id;
    workItem.querySelector('.work-title').textContent = work.name;
    
    // Configurar botón de eliminar
    workItem.querySelector('.remove-work-btn').addEventListener('click', () => removeWork(work.id));
    
    // Agregar recursos iniciales
    const resourcesBody = workItem.querySelector('.resources-body');
    work.resources.forEach(resource => {
        addResourceRow(resourcesBody, resource, work.id);
    });
    
    // Configurar botón de agregar recurso
    workItem.querySelector('.add-resource-btn').addEventListener('click', () => {
        const newResource = { name: '', unit: '', quantity: 0, price: 0 };
        work.resources.push(newResource);
        addResourceRow(resourcesBody, newResource, work.id);
        calculateWorkTotal(work.id);
    });
    
    // Crear sliders de distribución mensual
    const monthSliders = workItem.querySelector('.month-sliders');
    appData.months.forEach((month, index) => {
        const sliderElement = elements.monthSliderTemplate.content.cloneNode(true);
        const slider = sliderElement.querySelector('.month-slider');
        
        // Configurar etiqueta y valor
        slider.querySelector('.month-label').textContent = month;
        const rangeInput = slider.querySelector('.month-allocation');
        const valueDisplay = slider.querySelector('.allocation-value');
        
        // Establecer valor inicial
        rangeInput.value = work.monthlyDistribution[index];
        valueDisplay.textContent = `${work.monthlyDistribution[index]}%`;
        
        // Configurar evento de cambio
        rangeInput.addEventListener('input', () => {
            const value = parseInt(rangeInput.value);
            work.monthlyDistribution[index] = value;
            valueDisplay.textContent = `${value}%`;
            updateMonthlyAllocation(work.id);
            updateMonthlyDistribution();
        });
        
        monthSliders.appendChild(slider);
    });
    
    // Agregar al contenedor
    elements.workDetailsContainer.appendChild(workItem);
    
    // Ocultar mensaje de no trabajos
    elements.noWorksMessage.style.display = 'none';
}

// Agregar fila de recurso
function addResourceRow(container, resource, workId) {
    // Clonar template
    const rowElement = elements.resourceRowTemplate.content.cloneNode(true);
    const row = rowElement.querySelector('.resource-row');
    
    // Establecer valores
    const nameInput = row.querySelector('.resource-name');
    const unitInput = row.querySelector('.resource-unit');
    const quantityInput = row.querySelector('.resource-quantity');
    const priceInput = row.querySelector('.resource-price');
    const subtotalCell = row.querySelector('.resource-subtotal');
    
    nameInput.value = resource.name;
    unitInput.value = resource.unit;
    quantityInput.value = resource.quantity;
    priceInput.value = resource.price;
    subtotalCell.textContent = formatCurrency(resource.quantity * resource.price);
    
    // Configurar eventos
    nameInput.addEventListener('input', () => {
        resource.name = nameInput.value;
    });
    
    unitInput.addEventListener('input', () => {
        resource.unit = unitInput.value;
    });
    
    quantityInput.addEventListener('input', () => {
        resource.quantity = parseFloat(quantityInput.value) || 0;
        subtotalCell.textContent = formatCurrency(resource.quantity * resource.price);
        calculateWorkTotal(workId);
    });
    
    priceInput.addEventListener('input', () => {
        resource.price = parseFloat(priceInput.value) || 0;
        subtotalCell.textContent = formatCurrency(resource.quantity * resource.price);
        calculateWorkTotal(workId);
    });
    
    // Configurar botón de eliminar
    row.querySelector('.delete-resource-btn').addEventListener('click', () => {
        const work = appData.works.find(w => w.id === workId);
        if (work) {
            const resourceIndex = work.resources.indexOf(resource);
            if (resourceIndex !== -1) {
                work.resources.splice(resourceIndex, 1);
                row.remove();
                calculateWorkTotal(workId);
            }
        }
    });
    
    // Agregar al contenedor
    container.appendChild(row);
}

// Calcular total de un trabajo
function calculateWorkTotal(workId) {
    const work = appData.works.find(w => w.id === workId);
    if (!work) return;
    
    // Calcular total
    work.total = work.resources.reduce((sum, resource) => {
        return sum + (resource.quantity * resource.price);
    }, 0);
    
    // Actualizar subtotal en la interfaz
    const workElement = document.querySelector(`.work-detail-item[data-work-id="${workId}"]`);
    if (workElement) {
        workElement.querySelector('.work-subtotal').textContent = formatCurrency(work.total);
    }
    
    // Actualizar distribución mensual y totales
    updateMonthlyDistribution();
    updateTotals();
}

// Actualizar asignación mensual
function updateMonthlyAllocation(workId) {
    const work = appData.works.find(w => w.id === workId);
    if (!work) return;
    
    // Calcular porcentaje total asignado
    const totalPercentage = work.monthlyDistribution.reduce((sum, value) => sum + value, 0);
    
    // Actualizar indicador de porcentaje
    const workElement = document.querySelector(`.work-detail-item[data-work-id="${workId}"]`);
    if (workElement) {
        const percentageElement = workElement.querySelector('.percentage-allocated');
        percentageElement.textContent = totalPercentage;
        
        // Aplicar clases según el porcentaje
        percentageElement.classList.remove('percentage-complete', 'percentage-exceeded');
        if (totalPercentage === 100) {
            percentageElement.classList.add('percentage-complete');
        } else if (totalPercentage > 100) {
            percentageElement.classList.add('percentage-exceeded');
        }
    }
}

// Eliminar un trabajo
function removeWork(workId) {
    // Encontrar índice del trabajo
    const workIndex = appData.works.findIndex(work => work.id === workId);
    if (workIndex === -1) return;
    
    // Eliminar del array
    appData.works.splice(workIndex, 1);
    
    // Eliminar elemento del DOM
    const workElement = document.querySelector(`.work-detail-item[data-work-id="${workId}"]`);
    if (workElement) {
        workElement.remove();
    }
    
    // Mostrar mensaje si no hay trabajos
    if (appData.works.length === 0) {
        elements.noWorksMessage.style.display = 'block';
    }
    
    // Actualizar distribución mensual y totales
    updateMonthlyDistribution();
    updateTotals();
}

// Actualizar distribución mensual
function updateMonthlyDistribution() {
    // Limpiar tabla
    elements.monthlyData.innerHTML = '';
    
    // Limpiar gráfico
    elements.monthlyChart.innerHTML = '';
    
    // Crear barras del gráfico para cada mes
    appData.months.forEach((month, index) => {
        const monthBar = document.createElement('div');
        monthBar.className = 'month-bar';
        
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        
        const label = document.createElement('div');
        label.className = 'month-bar-label';
        label.textContent = month;
        
        monthBar.appendChild(bar);
        monthBar.appendChild(label);
        elements.monthlyChart.appendChild(monthBar);
    });
    
    // Inicializar totales mensuales
    const monthlyTotals = Array(12).fill(0);
    
    // Agregar filas para cada trabajo
    appData.works.forEach(work => {
        const row = document.createElement('tr');
        
        // Nombre del trabajo
        const nameCell = document.createElement('td');
        nameCell.textContent = work.name;
        row.appendChild(nameCell);
        
        // Valores mensuales
        let workTotal = 0;
        work.monthlyDistribution.forEach((percentage, monthIndex) => {
            const monthValue = (work.total * percentage) / 100;
            workTotal += monthValue;
            monthlyTotals[monthIndex] += monthValue;
            
            const cell = document.createElement('td');
            cell.textContent = formatCurrency(monthValue);
            row.appendChild(cell);
        });
        
        // Total del trabajo
        const totalCell = document.createElement('td');
        totalCell.textContent = formatCurrency(workTotal);
        row.appendChild(totalCell);
        
        // Agregar fila a la tabla
        elements.monthlyData.appendChild(row);
    });
    
    // Actualizar totales mensuales
    const totalCells = elements.monthlyTotals.querySelectorAll('td');
    let grandTotal = 0;
    
    monthlyTotals.forEach((total, index) => {
        if (index < totalCells.length - 1) {
            totalCells[index].textContent = formatCurrency(total);
            grandTotal += total;
            
            // Actualizar altura de las barras en el gráfico
            const maxValue = Math.max(...monthlyTotals);
            const bars = elements.monthlyChart.querySelectorAll('.chart-bar');
            if (maxValue > 0 && index < bars.length) {
                const heightPercentage = (total / maxValue) * 100;
                bars[index].style.setProperty('--bar-height', `${heightPercentage}%`);
                bars[index].style.height = `${heightPercentage}%`;
            }
        }
    });
    
    // Actualizar total general
    elements.grandTotal.textContent = formatCurrency(grandTotal);
}

// Actualizar totales por tipo de trabajo
function updateTotals() {
    // Inicializar totales
    const totals = {
        pavimentacion: 0,
        pintura: 0,
        senales: 0,
        barreras: 0
    };
    
    // Calcular totales por tipo
    appData.works.forEach(work => {
        if (totals.hasOwnProperty(work.type)) {
            totals[work.type] += work.total;
        }
    });
    
    // Actualizar en la interfaz
    for (const type in totals) {
        if (elements.workTypeTotals[type]) {
            elements.workTypeTotals[type].textContent = formatCurrency(totals[type]);
        }
    }
    
    // Calcular y actualizar total general
    const presupuestoTotal = Object.values(totals).reduce((sum, value) => sum + value, 0);
    elements.presupuestoTotal.textContent = formatCurrency(presupuestoTotal);
}

// Actualizar interfaz completa
function updateInterface() {
    updateMonthlyDistribution();
    updateTotals();
}

// Generar informe (simulado)
function generateReport() {
    if (appData.works.length === 0) {
        alert('No hay trabajos para generar un informe.');
        return;
    }
    
    alert('Generando informe de presupuesto...\n\nEl informe se ha generado correctamente y está listo para descargar.');
}

// Guardar presupuesto (simulado)
function saveBudget() {
    if (appData.projectInfo.name.trim() === '') {
        alert('Por favor, ingrese un nombre para el proyecto antes de guardar.');
        elements.projectName.focus();
        return;
    }
    
    if (appData.works.length === 0) {
        alert('No hay trabajos para guardar en el presupuesto.');
        return;
    }
    
    alert(`Presupuesto "${appData.projectInfo.name}" guardado correctamente.`);
}

// Reiniciar presupuesto
function resetBudget() {
    if (confirm('¿Está seguro de que desea reiniciar el presupuesto? Se perderán todos los datos ingresados.')) {
        // Reiniciar datos
        appData.works = [];
        appData.nextWorkId = 1;
        
        // Reiniciar interfaz
        elements.projectName.value = '';
        elements.projectLength.value = '';
        elements.workDetailsContainer.innerHTML = '';
        elements.noWorksMessage.style.display = 'block';
        elements.workDetailsContainer.appendChild(elements.noWorksMessage);
        
        // Actualizar interfaz
        updateInterface();
        
        // Actualizar información del proyecto
        updateProjectInfo();
    }
}

// Formatear moneda
function formatCurrency(value) {
    return `$${value.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
