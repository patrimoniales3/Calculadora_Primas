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
        derechoEmisionMinimo: document.getElementById('derechoEmisionMinimo').value,
        inputType: document.querySelector('input[name="inputType"]:checked').value
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
    if (datos.derechoEmisionMinimo) document.getElementById('derechoEmisionMinimo').value = datos.derechoEmisionMinimo;
    if (datos.inputType) {
        document.querySelector(`input[name="inputType"][value="${datos.inputType}"]`).checked = true;
        toggleInputVisibility(datos.inputType);
    }
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
        spanResultado.textContent = tipoComision === 'porcentaje' ? '0.00' : '0.00%';
        return;
    }

    // Cálculos principales
    let primaNeta = 0, derechoEmision = 0, primaComercial = 0, igv = 0, primaTotalCalculada = 0, tasaNeta = 0, tasaComercial = 0, porcentajeComision = 0, montoComision = 0;
    let tienePrima = !!valorPrima;
    let tieneSuma = !!sumaAsegurada;
    let tieneComision = !!valorComision;

    if (tienePrima) {
        if (tipoPrima === 'total') {
            primaComercial = redondear(valorPrima / 1.18);
            let primaNetaCalculada = redondear((valorPrima / 1.03) / 1.18);
            let derechoEmisionCalculado = redondear(primaNetaCalculada * 0.03);
            const derechoEmisionMinimo = parseFloat(document.getElementById('derechoEmisionMinimo').value) || 5;
            if (derechoEmisionCalculado < derechoEmisionMinimo) {
                derechoEmision = derechoEmisionMinimo;
                primaNeta = redondear(primaComercial - derechoEmision);
            } else {
                derechoEmision = derechoEmisionCalculado;
                primaNeta = primaNetaCalculada;
            }
            primaComercial = redondear(primaNeta + derechoEmision);
            igv = redondear(primaComercial * 0.18);
            primaTotalCalculada = redondear(primaComercial + igv);
        } else if (tipoPrima === 'neta') {
            primaNeta = valorPrima;
            let derechoEmisionCalculado = redondear(primaNeta * 0.03);
            const derechoEmisionMinimo = parseFloat(document.getElementById('derechoEmisionMinimo').value) || 5;
            if (derechoEmisionCalculado < derechoEmisionMinimo) {
                derechoEmision = derechoEmisionMinimo;
            } else {
                derechoEmision = derechoEmisionCalculado;
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
        // Calcular y mostrar tasas si hay suma asegurada
        if (tieneSuma) {
            let tasaNeta = primaNeta / sumaAsegurada;
            let tasaComercial = primaComercial / sumaAsegurada;
            const esPorMil = document.getElementById('tasaPorMil').checked;
            if (esPorMil) {
                tasaNetaEl.textContent = (tasaNeta * 1000).toFixed(4) + '‰';
                tasaComercialEl.textContent = (tasaComercial * 1000).toFixed(4) + '‰';
            } else {
                tasaNetaEl.textContent = (tasaNeta * 100).toFixed(4) + '%';
                tasaComercialEl.textContent = (tasaComercial * 100).toFixed(4) + '%';
            }
        }
    } else {
        // Si no hay prima, pero hay tipo de tasa, valor de tasa y suma asegurada, calcular por tasa
        const tipoTasa = document.getElementById('tipoTasa').value;
        let valorTasaInput = (document.getElementById('valorTasa').value || '').replace(/\s/g, '').replace(/,/g, '').replace('%','').replace('‰','');
        let valorTasa = parseFloat(valorTasaInput) || 0;
        const tasaPorMil = document.getElementById('tasaPorMil').checked;
        let valorTasaDecimal = tasaPorMil ? valorTasa / 1000 : valorTasa / 100;
        if (tipoTasa && valorTasa && tieneSuma) {
            let simbolo = tasaPorMil ? '‰' : '%';
            if (tipoTasa === 'tasaNeta') {
                tasaNeta = valorTasaDecimal;
                primaNeta = redondear(tasaNeta * sumaAsegurada);
                let derechoEmisionCalculado = redondear(primaNeta * 0.03);
                if (aplicarMinimo && derechoEmisionCalculado < 5) {
                    derechoEmision = 5;
                } else {
                    derechoEmision = derechoEmisionCalculado;
                }
                primaComercial = redondear(primaNeta + derechoEmision);
                tasaComercial = primaComercial / sumaAsegurada;
                igv = redondear(primaComercial * 0.18);
                primaTotalCalculada = redondear(primaComercial + igv);
                // Mostrar la tasa neta ingresada y la comercial calculada
                tasaNetaEl.textContent = valorTasa.toFixed(4) + simbolo;
                tasaComercialEl.textContent = (tasaComercial * (tasaPorMil ? 1000 : 100)).toFixed(4) + simbolo;
            } else if (tipoTasa === 'tasaComercial') {
                tasaComercial = valorTasaDecimal;
                primaComercial = redondear(tasaComercial * sumaAsegurada);
                let primaNetaCalculada = redondear(primaComercial / 1.03);
                let derechoEmisionCalculado = redondear(primaNetaCalculada * 0.03);
                if (aplicarMinimo && derechoEmisionCalculado < 5) {
                    derechoEmision = 5;
                } else {
                    derechoEmision = derechoEmisionCalculado;
                }
                primaNeta = redondear(primaComercial - derechoEmision);
                tasaNeta = primaNeta / sumaAsegurada;
                igv = redondear(primaComercial * 0.18);
                primaTotalCalculada = redondear(primaComercial + igv);
                // Mostrar la tasa comercial ingresada y la neta calculada
                tasaNetaEl.textContent = (tasaNeta * (tasaPorMil ? 1000 : 100)).toFixed(4) + simbolo;
                tasaComercialEl.textContent = valorTasa.toFixed(4) + simbolo;
            }
            primaNetaEl.textContent = formatearNumero(primaNeta);
            derechoEmisionEl.textContent = formatearNumero(derechoEmision);
            primaComercialEl.textContent = formatearNumero(primaComercial);
            igvEl.textContent = formatearNumero(igv);
            primaTotalCalculadaEl.textContent = formatearNumero(primaTotalCalculada);
        }
    }
    // Si hay suma asegurada, calcular tasas
    if (tienePrima && tieneSuma) {
        tasaNeta = primaNeta / sumaAsegurada;
        tasaComercial = primaComercial / sumaAsegurada;
        const esPorMil = document.getElementById('tasaPorMil').checked;
        if (esPorMil) {
            tasaNetaEl.textContent = (tasaNeta * 100).toFixed(4) + '‰';
            tasaComercialEl.textContent = (tasaComercial * 100).toFixed(4) + '‰';
        } else {
            tasaNetaEl.textContent = (tasaNeta * 100).toFixed(4) + '%';
            tasaComercialEl.textContent = (tasaComercial * 100).toFixed(4) + '%';
        }
    }
    // Calcular comisión siempre que haya prima neta y valor de comisión
    if (primaNeta && tieneComision) {
        if (tipoComision === 'porcentaje') {
            porcentajeComision = valorComision / 100;
            montoComision = redondear((porcentajeComision * primaNeta));
            labelResultado.textContent = 'Comisión:';
            spanResultado.textContent = formatearNumero(montoComision);
        } else {
            montoComision = valorComision;
            porcentajeComision = primaNeta !== 0 ? montoComision / primaNeta : 0;
            labelResultado.textContent = '% Comisión:';
            // Formatear como 0.00% en vez de 0.0000%
            spanResultado.textContent = (porcentajeComision * 100).toFixed(2) + '%';
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

// Función para alternar la visibilidad de los campos de prima/tasa
function toggleInputVisibility(type) {
    const primaInputs = document.querySelector('.prima-inputs');
    const tasaInputs = document.querySelector('.tasa-inputs');
    
    if (type === 'prima') {
        primaInputs.classList.add('active');
        tasaInputs.classList.remove('active');
        // Limpiar y deshabilitar campos de tasa
        document.getElementById('tipoTasa').value = '';
        document.getElementById('valorTasa').value = '';
        document.getElementById('tasaPorMil').checked = false;
    } else {
        tasaInputs.classList.add('active');
        primaInputs.classList.remove('active');
        // Limpiar y deshabilitar campos de prima
        document.getElementById('tipoPrima').value = 'total';
        document.getElementById('valorPrima').value = '';
    }
    calcular();
}

// Agregar event listeners para el toggle de prima/tasa
document.querySelectorAll('input[name="inputType"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        toggleInputVisibility(e.target.value);
    });
});

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    cargarDatos();
    // Cambio en el tipo de comisión
    document.getElementById('tipoComision').addEventListener('change', cambiarTipoComision);
    // Lógica para bloquear campos según entrada de tasa o prima
    function toggleInputs() {
        const tipoTasa = document.getElementById('tipoTasa').value;
        let valorTasaInput = document.getElementById('valorTasa').value;
        valorTasaInput = valorTasaInput.replace(/\s/g, '').replace(/,/g, '').replace('%','').replace('‰','');
        const valorTasa = parseFloat(valorTasaInput);
        const valorPrima = document.getElementById('valorPrima');
        const tipoPrima = document.getElementById('tipoPrima');
        // Si hay tipo de tasa y valor válido, bloquear primas
        if (tipoTasa && !isNaN(valorTasa) && valorTasa > 0) {
            valorPrima.disabled = true;
            tipoPrima.disabled = true;
        } else {
            valorPrima.disabled = false;
            tipoPrima.disabled = false;
        }
        // Si hay prima, bloquear tasas
        if (valorPrima.value) {
            document.getElementById('tipoTasa').disabled = true;
            document.getElementById('valorTasa').disabled = true;
            document.getElementById('tasaPorMil').disabled = true;
        } else {
            document.getElementById('tipoTasa').disabled = false;
            document.getElementById('valorTasa').disabled = false;
            document.getElementById('tasaPorMil').disabled = false;
        }
    }

    // Listeners para bloquear/desbloquear
    document.getElementById('tipoTasa').addEventListener('change', function() { toggleInputs(); calcular(); });
    document.getElementById('valorTasa').addEventListener('input', function() { toggleInputs(); calcular(); });
    document.getElementById('valorPrima').addEventListener('input', function() { toggleInputs(); calcular(); });
    document.getElementById('tipoPrima').addEventListener('change', function() { toggleInputs(); calcular(); });
    document.getElementById('tasaPorMil').addEventListener('change', function() { calcular(); });

    // Formatear el valor de tasa al salir del input
    document.getElementById('valorTasa').addEventListener('blur', function(e) {
        let val = e.target.value.replace(/\s/g, '').replace(/,/g, '');
        val = parseFloat(val);
        if (!isNaN(val)) {
            // Mostrar siempre 4 decimales
            let formatted = val.toFixed(4);
            // Mostrar símbolo según el checkbox
            if (document.getElementById('tasaPorMil').checked) {
                e.target.value = formatted + '‰';
            } else {
                e.target.value = formatted + '%';
            }
        } else {
            e.target.value = '';
        }
    });

    // Al enfocar, quitar el símbolo para permitir editar
    document.getElementById('valorTasa').addEventListener('focus', function(e) {
        e.target.value = e.target.value.replace('%','').replace('‰','').trim();
    });

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