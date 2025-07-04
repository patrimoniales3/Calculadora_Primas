// Función para redondear a 2 decimales
function redondear(valor) {
    return Math.round(valor * 100) / 100;
}

// Función para formatear números con formato #,##0.00
function formatearNumero(numero) {
    return new Intl.NumberFormat('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(numero);
}

// Función para formatear porcentajes con formato 0.0000%
function formatearPorcentaje(decimal) {
    return new Intl.NumberFormat('es-PE', {
        style: 'percent',
        minimumFractionDigits: 4,
        maximumFractionDigits: 4
    }).format(decimal);
}

// Guardar y cargar datos en localStorage
function guardarDatos() {
    const datos = {
        tipoPrima: document.getElementById('tipoPrima').value,
        valorPrima: document.getElementById('valorPrima').value,
        sumaAsegurada: document.getElementById('sumaAsegurada').value,
        tipoComision: document.getElementById('tipoComision').value,
        valorComision: document.getElementById('valorComision').value,
        aplicarMinimo: document.getElementById('aplicarMinimo').checked
    };
    localStorage.setItem('calculadoraPrimas', JSON.stringify(datos));
}

function cargarDatos() {
    const datos = JSON.parse(localStorage.getItem('calculadoraPrimas') || '{}');
    if (datos.tipoPrima) document.getElementById('tipoPrima').value = datos.tipoPrima;
    if (datos.valorPrima) document.getElementById('valorPrima').value = datos.valorPrima;
    if (datos.sumaAsegurada) document.getElementById('sumaAsegurada').value = datos.sumaAsegurada;
    if (datos.tipoComision) document.getElementById('tipoComision').value = datos.tipoComision;
    if (datos.valorComision) document.getElementById('valorComision').value = datos.valorComision;
    if (typeof datos.aplicarMinimo === 'boolean') document.getElementById('aplicarMinimo').checked = datos.aplicarMinimo;
}

// Guardar datos en cada cambio de input, select y checkbox
['tipoPrima','valorPrima','sumaAsegurada','tipoComision','valorComision','aplicarMinimo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('change', guardarDatos);
        el.addEventListener('input', guardarDatos);
    }
});

// Función principal de cálculo
function calcular() {
    // Obtener tipo de prima y valor
    const tipoPrima = document.getElementById('tipoPrima').value;
    const valorPrima = parseFloat((document.getElementById('valorPrima').value || '').replace(/\s/g, '').replace(/,/g, '')) || 0;
    const sumaAsegurada = parseFloat((document.getElementById('sumaAsegurada').value || '').replace(/\s/g, '').replace(/,/g, '')) || 0;
    const tipoComision = document.getElementById('tipoComision').value;
    const valorComision = parseFloat((document.getElementById('valorComision').value || '').replace(/\s/g, '').replace(/,/g, '')) || 0;
    const aplicarMinimo = document.getElementById('aplicarMinimo').checked;

    // Elementos de resultado
    const tasaNetaEl = document.getElementById('tasaNeta');
    const tasaComercialEl = document.getElementById('tasaComercial');
    const primaNetaEl = document.getElementById('primaNeta');
    const derechoEmisionEl = document.getElementById('derechoEmision');
    const primaComercialEl = document.getElementById('primaComercial');
    const igvEl = document.getElementById('igv');
    const primaTotalCalculadaEl = document.getElementById('primaTotalCalculada');
    const labelResultado = document.getElementById('labelResultadoComision');
    const spanResultado = document.getElementById('resultadoComision');

    // Inicializar todos los resultados como advertencia
    tasaNetaEl.textContent = '0.0000% ⚠️';
    tasaComercialEl.textContent = '0.0000% ⚠️';
    primaNetaEl.textContent = '0.00 ⚠️';
    derechoEmisionEl.textContent = '0.00 ⚠️';
    primaComercialEl.textContent = '0.00 ⚠️';
    igvEl.textContent = '0.00 ⚠️';
    primaTotalCalculadaEl.textContent = '0.00 ⚠️';
    labelResultado.textContent = tipoComision === 'porcentaje' ? 'Comisión:' : '% Comisión:';
    spanResultado.textContent = tipoComision === 'porcentaje' ? '0.00 ⚠️' : '0.0000% ⚠️';

    // Si no hay ningún dato, limpiar y mostrar 0 sin advertencia
    if (!valorPrima && !sumaAsegurada && !valorComision) {
        tasaNetaEl.textContent = '0.0000%';
        tasaComercialEl.textContent = '0.0000%';
        primaNetaEl.textContent = '0.00';
        derechoEmisionEl.textContent = '0.00';
        primaComercialEl.textContent = '0.00';
        igvEl.textContent = '0.00';
        primaTotalCalculadaEl.textContent = '0.00';
        labelResultado.textContent = tipoComision === 'porcentaje' ? 'Comisión:' : '% Comisión:';
        spanResultado.textContent = tipoComision === 'porcentaje' ? '0.00' : '0.0000%';
        return;
    }

    // Cálculos principales
    let primaNeta = 0, derechoEmision = 0, primaComercial = 0, igv = 0, primaTotalCalculada = 0, tasaNeta = 0, tasaComercial = 0, porcentajeComision = 0, montoComision = 0;
    let tienePrima = !!valorPrima;
    let tieneSuma = !!sumaAsegurada;
    let tieneComision = !!valorComision;

    if (tienePrima) {
        if (tipoPrima === 'total') {
            if (aplicarMinimo) {
                primaComercial = redondear(valorPrima / 1.18);
                derechoEmision = 5;
                primaNeta = redondear(primaComercial - derechoEmision);
            } else {
                primaNeta = redondear((valorPrima / 1.03) / 1.18);
                derechoEmision = redondear(primaNeta * 0.03);
                primaComercial = redondear(primaNeta + derechoEmision);
            }
            igv = redondear(primaComercial * 0.18);
            primaTotalCalculada = redondear(primaComercial + igv);
        } else if (tipoPrima === 'neta') {
            primaNeta = valorPrima;
            if (aplicarMinimo) {
                derechoEmision = 5;
            } else {
                derechoEmision = redondear(primaNeta * 0.03);
            }
            primaComercial = redondear(primaNeta + derechoEmision);
            igv = redondear(primaComercial * 0.18);
            primaTotalCalculada = redondear(primaComercial + igv);
        }
        // Mostrar resultados dependientes solo de prima
        primaNetaEl.textContent = formatearNumero(primaNeta);
        derechoEmisionEl.textContent = formatearNumero(derechoEmision);
        primaComercialEl.textContent = formatearNumero(primaComercial);
        igvEl.textContent = formatearNumero(igv);
        primaTotalCalculadaEl.textContent = formatearNumero(primaTotalCalculada);
    }
    // Si hay suma asegurada, calcular tasas
    if (tienePrima && tieneSuma) {
        tasaNeta = primaNeta / sumaAsegurada;
        tasaComercial = primaComercial / sumaAsegurada;
        tasaNetaEl.textContent = formatearPorcentaje(tasaNeta);
        tasaComercialEl.textContent = formatearPorcentaje(tasaComercial);
    }
    // Si hay comisión y prima neta, calcular comisiones
    if (tienePrima && primaNeta && tieneComision) {
        if (tipoComision === 'porcentaje') {
            porcentajeComision = valorComision / 100;
            montoComision = redondear((porcentajeComision * primaNeta));
            labelResultado.textContent = 'Comisión:';
            spanResultado.textContent = formatearNumero(montoComision);
        } else {
            montoComision = valorComision;
            porcentajeComision = primaNeta !== 0 ? montoComision / primaNeta : 0;
            labelResultado.textContent = '% Comisión:';
            spanResultado.textContent = formatearPorcentaje(porcentajeComision);
        }
    }
}

// Muestra el icono de advertencia en los resultados
function ponerAdvertencia() {
    const resultItems = document.querySelectorAll('.result-item span');
    resultItems.forEach(span => {
        if (!span.textContent.includes('⚠️')) {
            span.textContent = '0' + (span.textContent.includes('%') ? '.0000%' : '.00') + ' ⚠️';
        }
    });
}

// Quita el icono de advertencia
function quitarAdvertencia() {
    const resultItems = document.querySelectorAll('.result-item span');
    resultItems.forEach(span => {
        span.textContent = span.textContent.replace(' ⚠️', '');
    });
}

// Función para cambiar la etiqueta del input de comisión
function cambiarTipoComision() {
    const tipoComision = document.getElementById('tipoComision').value;
    const labelComision = document.getElementById('labelComision');
    const inputComision = document.getElementById('valorComision');
    
    if (tipoComision === 'porcentaje') {
        labelComision.textContent = '% Comisión:';
        inputComision.placeholder = '0.00';
    } else {
        labelComision.textContent = 'Comisión:';
        inputComision.placeholder = '0.00';
    }
    
    // Limpiar el valor al cambiar el tipo
    inputComision.value = '';
    
    // Recalcular si hay datos
    const primaTotal = parseFloat(document.getElementById('primaTotal').value) || 0;
    const sumaAsegurada = parseFloat(document.getElementById('sumaAsegurada').value) || 0;
    
    if (primaTotal > 0 && sumaAsegurada > 0) {
        calcular();
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    cargarDatos();
    // Cambio en el tipo de comisión
    document.getElementById('tipoComision').addEventListener('change', cambiarTipoComision);

    // Cambio en el tipo de prima
    document.getElementById('tipoPrima').addEventListener('change', function() {
        const tipoPrima = document.getElementById('tipoPrima').value;
        const labelPrima = document.getElementById('labelPrima');
        if (tipoPrima === 'total') {
            labelPrima.textContent = 'Prima Total:';
        } else {
            labelPrima.textContent = 'Prima Neta:';
        }
        document.getElementById('valorPrima').value = '';
        calcular();
    });

    // Recalcular automáticamente cuando cambian los valores
    const inputs = ['valorPrima', 'sumaAsegurada', 'valorComision'];
    inputs.forEach(id => {
        document.getElementById(id).addEventListener('input', function() {
            calcular();
        });
        document.getElementById(id).addEventListener('blur', function(e) {
            // Para type="text": mostrar el valor con separador de miles y dos decimales
            let val = e.target.value.replace(/\s/g, '').replace(/,/g, '');
            val = parseFloat(val);
            if (!isNaN(val)) {
                if (id === 'valorComision' && document.getElementById('tipoComision').value === 'porcentaje') {
                    e.target.value = val.toFixed(2);
                } else if (id === 'valorPrima' || id === 'sumaAsegurada') {
                    e.target.value = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
                } else {
                    e.target.value = val.toFixed(2);
                }
            } else {
                e.target.value = '';
            }
        });
    });

    // Recalcular cuando cambia el checkbox
    document.getElementById('aplicarMinimo').addEventListener('change', function() {
        calcular();
    });

    // Calcular al cargar
    calcular();

    // Limpiar campos
    document.getElementById('btnLimpiar').addEventListener('click', function() {
        document.getElementById('tipoPrima').value = 'total';
        document.getElementById('valorPrima').value = '';
        document.getElementById('sumaAsegurada').value = '';
        document.getElementById('tipoComision').value = 'monto';
        document.getElementById('valorComision').value = '';
        document.getElementById('aplicarMinimo').checked = false;
        guardarDatos();
        if (typeof calcular === 'function') calcular();
    });
});