// Función para redondear a 2 decimales
function redondear(valor) {
    return Math.round(valor * 100) / 100;
}

// Función para formatear números con formato #,###.00
function formatearNumero(numero) {
    return new Intl.NumberFormat('es-PE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true
    }).format(numero);
}

// Función para formatear porcentajes con formato #.####% o ‰
function formatearPorcentaje(decimal, esPorMil = false) {
    const valor = esPorMil ? decimal * 1000 : decimal * 100;
    return valor.toFixed(4) + (esPorMil ? '‰' : '%');
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
        inputType: document.querySelector('input[name="inputType"]:checked').value,
        // Guardar también los datos de tasa
        tipoTasa: document.getElementById('tipoTasa').value,
        valorTasa: document.getElementById('valorTasa').value,
        tasaPorMil: document.getElementById('tasaPorMil').checked,
        tasaPorMilPrima: document.getElementById('tasaPorMilPrima').checked
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
    // Cargar datos de tasa
    if (datos.tipoTasa) document.getElementById('tipoTasa').value = datos.tipoTasa;
    if (datos.valorTasa) document.getElementById('valorTasa').value = datos.valorTasa;
    if (datos.tasaPorMil !== undefined) document.getElementById('tasaPorMil').checked = datos.tasaPorMil;
    if (datos.tasaPorMilPrima !== undefined) document.getElementById('tasaPorMilPrima').checked = datos.tasaPorMilPrima;
    
    // Guardar el tipo de prima original para mantener coherencia en los cambios
    if (datos.tipoPrima) {
        sessionStorage.setItem('tipoPrimaOriginal', datos.tipoPrima);
    }

    // Aplicar el tipo de entrada al final para asegurar que todos los valores estén cargados
    if (datos.inputType) {
        document.querySelector(`input[name="inputType"][value="${datos.inputType}"]`).checked = true;
        toggleInputVisibility(datos.inputType);
    }
}

// Guardar datos en cada cambio de input, select y checkbox
['tipoPrima','valorPrima','sumaAsegurada','tipoComision','valorComision','tipoTasa','valorTasa','aplicarMinimo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('change', () => {
            guardarDatos();
            calcular();
        });
        el.addEventListener('input', () => {
            guardarDatos();
            calcular();
        });
    }
});

// Eliminar comas de miles y dejar solo el punto decimal
function limpiarNumero(valor) {
    valor = valor.replace(/\s/g, '').replace(/,/g, '');
    const partes = valor.split('.');
    if (partes.length > 2) {
        valor = partes.slice(0, -1).join('') + '.' + partes[partes.length - 1];
    }
    return valor;
}

// Función principal de cálculo
function calcular() {
    // Obtener tipo de prima y valor
    const tipoPrima = document.getElementById('tipoPrima').value;
    const valorPrima = parseFloat(limpiarNumero(document.getElementById('valorPrima').value || '')) || 0;
    const sumaAsegurada = parseFloat(limpiarNumero(document.getElementById('sumaAsegurada').value || '')) || 0;
    const tipoComision = document.getElementById('tipoComision').value;
    const valorComision = parseFloat(limpiarNumero(document.getElementById('valorComision').value || '')) || 0;
    const derechoEmisionMinimo = parseFloat(limpiarNumero(document.getElementById('derechoEmisionMinimo').value)) ?? 0;
    // Obtener la tasa de derecho de emisión seleccionada
    const tasaDerechoEmision = parseFloat(document.getElementById('tasaDerechoEmision').value) || 0.03;

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

    // Determinar el modo activo
    const modoTasa = document.querySelector('.tasa-inputs.active') !== null;
    const modoPrima = !modoTasa;

    // Determinar si hay valores suficientes para calcular según el modo
    const valorTasaActual = document.getElementById('valorTasa').value;
    const tieneValoresTasa = modoTasa && sumaAsegurada && valorTasaActual;
    const tieneValoresPrima = modoPrima && (valorPrima || sumaAsegurada);

    // En modo prima necesitamos prima o suma asegurada
    // En modo tasa necesitamos tasa y suma asegurada
    if ((modoPrima && !tieneValoresPrima) || (modoTasa && (!sumaAsegurada || !valorTasaActual))) {
        tasaNetaEl.textContent = '0.0000%';
        tasaComercialEl.textContent = '0.0000%';
    primaNetaEl.textContent = '0.00';
    derechoEmisionEl.textContent = '0.00';
    primaComercialEl.innerHTML = '<strong>0.00</strong>';
    igvEl.textContent = '0.00';
    primaTotalCalculadaEl.textContent = '0.00';
        labelResultado.textContent = tipoComision === 'porcentaje' ? 'Comisión:' : '% Comisión:';
        spanResultado.textContent = tipoComision === 'porcentaje' ? '0.00' : '0.00%';
        return;
    }

    // Cálculos principales
    let primaNeta = 0, derechoEmision = 0, primaComercial = 0, igv = 0, primaTotalCalculada = 0, tasaNeta = 0, tasaComercial = 0, porcentajeComision = 0, montoComision = 0;
    let tieneSuma = !!sumaAsegurada;
    let tieneComision = !!valorComision;
    
    // En modo tasa, no necesitamos considerar el valor de la prima
    let tienePrima = modoPrima && !!valorPrima;

    if (modoTasa && tieneSuma) {
        // Si estamos en modo tasa, usar solo los cálculos basados en tasa
        const tipoTasa = document.getElementById('tipoTasa').value;
        let valorTasaInput = (document.getElementById('valorTasa').value || '').replace(/\s/g, '').replace(/,/g, '').replace('%','').replace('‰','');
        let valorTasa = parseFloat(valorTasaInput) || 0;
        const tasaPorMil = document.getElementById('tasaPorMil').checked;
        let valorTasaDecimal = tasaPorMil ? valorTasa / 1000 : valorTasa / 100;

        if (valorTasa > 0) {
            let simbolo = tasaPorMil ? '‰' : '%';
            if (tipoTasa === 'tasaNeta') {
                tasaNeta = valorTasaDecimal;
                primaNeta = redondear(tasaNeta * sumaAsegurada);
                let derechoEmisionCalculado = redondear(primaNeta * tasaDerechoEmision);
                if (derechoEmisionCalculado < derechoEmisionMinimo) {
                    derechoEmision = derechoEmisionMinimo;
                } else {
                    derechoEmision = derechoEmisionCalculado;
                }
                primaComercial = redondear(primaNeta + derechoEmision);
                tasaComercial = primaComercial / sumaAsegurada;
                igv = redondear(primaComercial * 0.18);
                primaTotalCalculada = redondear(primaComercial + igv);

                // Mostrar las tasas
                tasaNetaEl.textContent = valorTasa.toFixed(4) + simbolo;
                tasaComercialEl.textContent = (tasaComercial * (tasaPorMil ? 1000 : 100)).toFixed(4) + simbolo;
            } else if (tipoTasa === 'tasaComercial') {
                tasaComercial = valorTasaDecimal;
                primaComercial = redondear(tasaComercial * sumaAsegurada);
                let primaNetaCalculada = redondear(primaComercial / (1 + tasaDerechoEmision));
                let derechoEmisionCalculado = redondear(primaNetaCalculada * tasaDerechoEmision);
                if (derechoEmisionCalculado < derechoEmisionMinimo) {
                    derechoEmision = derechoEmisionMinimo;
                    primaNeta = redondear(primaComercial - derechoEmision);
                } else {
                    derechoEmision = derechoEmisionCalculado;
                    primaNeta = primaNetaCalculada;
                }
                tasaNeta = primaNeta / sumaAsegurada;
                igv = redondear(primaComercial * 0.18);
                primaTotalCalculada = redondear(primaComercial + igv);

                // Mostrar las tasas
                tasaNetaEl.textContent = (tasaNeta * (tasaPorMil ? 1000 : 100)).toFixed(4) + simbolo;
                tasaComercialEl.textContent = valorTasa.toFixed(4) + simbolo;
            }

            // Mostrar los resultados
            const primaNetaFormateada = formatearNumero(primaNeta);
            const primaComercialFormateada = formatearNumero(primaComercial);
            primaNetaEl.textContent = primaNetaFormateada;
            derechoEmisionEl.textContent = formatearNumero(derechoEmision);
            primaComercialEl.innerHTML = `<strong>${primaComercialFormateada}</strong>`;
            igvEl.textContent = formatearNumero(igv);
            primaTotalCalculadaEl.textContent = formatearNumero(primaTotalCalculada);
        }
    } else if (tienePrima) {
        if (tipoPrima === 'total') {
            primaComercial = redondear(valorPrima / 1.18);
            // Prima neta = Prima total / ((1 + tasaDerechoEmision) * 1.18)
            let primaNetaCalculada = redondear(valorPrima / ((1 + tasaDerechoEmision) * 1.18));
            let derechoEmisionCalculado = redondear(primaNetaCalculada * tasaDerechoEmision);
            const derechoEmisionMinimo = parseFloat(document.getElementById('derechoEmisionMinimo').value) ?? 0;
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
            let derechoEmisionCalculado = redondear(primaNeta * tasaDerechoEmision);
            const derechoEmisionMinimo = parseFloat(document.getElementById('derechoEmisionMinimo').value) ?? 0;
            if (derechoEmisionCalculado < derechoEmisionMinimo) {
                derechoEmision = derechoEmisionMinimo;
            } else {
                derechoEmision = derechoEmisionCalculado;
            }
            primaComercial = redondear(primaNeta + derechoEmision);
            igv = redondear(primaComercial * 0.18);
            primaTotalCalculada = redondear(primaComercial + igv);
        }
        // Mostrar resultados dependientes solo de prima, resaltando prima comercial junto con neta/total
        const primaNetaFormateada = formatearNumero(primaNeta);
        const primaComercialFormateada = formatearNumero(primaComercial);
        primaNetaEl.textContent = primaNetaFormateada;
        derechoEmisionEl.textContent = formatearNumero(derechoEmision);
        primaComercialEl.innerHTML = `<strong>${primaComercialFormateada}</strong>`;
        igvEl.textContent = formatearNumero(igv);
        primaTotalCalculadaEl.textContent = formatearNumero(primaTotalCalculada);
        // Calcular y mostrar tasas si hay suma asegurada
        if (tieneSuma) {
            let tasaNeta = primaNeta / sumaAsegurada;
            let tasaComercial = primaComercial / sumaAsegurada;
            const esPorMil = document.getElementById('tasaPorMilPrima').checked;
            tasaNetaEl.textContent = formatearPorcentaje(tasaNeta, esPorMil);
            tasaComercialEl.textContent = formatearPorcentaje(tasaComercial, esPorMil);
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
                let derechoEmisionCalculado = redondear(primaNeta * tasaDerechoEmision);
                const derechoEmisionMinimo = parseFloat(document.getElementById('derechoEmisionMinimo').value) ?? 0;
                if (derechoEmisionCalculado < derechoEmisionMinimo) {
                    derechoEmision = derechoEmisionMinimo;
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
                let primaNetaCalculada = redondear(primaComercial / (1 + tasaDerechoEmision));
                let derechoEmisionCalculado = redondear(primaNetaCalculada * tasaDerechoEmision);
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
    // Calcular tasas solo en modo prima y si tenemos los datos necesarios
    if (modoPrima && tienePrima && tieneSuma) {
        tasaNeta = primaNeta / sumaAsegurada;
        tasaComercial = primaComercial / sumaAsegurada;
        const esPorMil = document.getElementById('tasaPorMilPrima').checked;
        tasaNetaEl.textContent = formatearPorcentaje(tasaNeta, esPorMil);
        tasaComercialEl.textContent = formatearPorcentaje(tasaComercial, esPorMil);
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
    const labelResultado = document.getElementById('labelResultadoComision');
    
    if (tipoComision === 'porcentaje') {
        labelComision.textContent = '% Comisión:';
        inputComision.placeholder = '0.00';
        labelResultado.textContent = 'Comisión:';
    } else {
        labelComision.textContent = 'Comisión:';
        inputComision.placeholder = '0.00';
        labelResultado.textContent = '% Comisión:';
    }
    
    // Limpiar el valor al cambiar el tipo
    inputComision.value = '';
    calcular();
}

// Función para alternar la visibilidad de los campos de prima/tasa
function toggleInputVisibility(type) {
    const primaInputs = document.querySelector('.prima-inputs');
    const tasaInputs = document.querySelector('.tasa-inputs');
    
    // Guardar el estado actual del checkbox por mil antes del cambio
    const tasaPorMilActual = document.querySelector('.prima-inputs.active') ? 
        document.getElementById('tasaPorMilPrima').checked : 
        document.getElementById('tasaPorMil').checked;

    if (type === 'prima') {
        // Cambiar a prima
        primaInputs.classList.add('active');
        tasaInputs.classList.remove('active');
        
        // Guardar estado actual de tasa para futura referencia
        if (document.getElementById('valorTasa').value) {
            sessionStorage.setItem('ultimaTasa', document.getElementById('valorTasa').value);
            sessionStorage.setItem('ultimoTipoPorMil', document.getElementById('tasaPorMil').checked);
            sessionStorage.setItem('ultimoTipoTasa', document.getElementById('tipoTasa').value);
        }

        // Determinar el tipo de prima y extraer el valor correspondiente
        const tipoPrimaActual = document.getElementById('tipoPrima').value;
        const primaTotal = document.getElementById('primaTotalCalculada').textContent;
        const primaNeta = document.getElementById('primaNeta').textContent;

        if (primaTotal && primaNeta && primaTotal !== '0.00' && primaTotal !== '0.00 ⚠️') {
            if (tipoPrimaActual === 'total') {
                document.getElementById('valorPrima').value = primaTotal.replace(/[^\d.,]/g, '');
            } else {
                document.getElementById('valorPrima').value = primaNeta.replace(/[^\d.,]/g, '');
            }
        }
    } else {
        // Cambiar a tasa
        tasaInputs.classList.add('active');
        primaInputs.classList.remove('active');

        // Obtener la tasa actual del resultado
        const tasaNetaText = document.getElementById('tasaNeta').textContent;
        const tasaComercialText = document.getElementById('tasaComercial').textContent;
        
        if (tasaNetaText && tasaNetaText !== '0.0000%' && tasaNetaText !== '0.0000% ⚠️') {
            // Extraer solo el valor numérico de la tasa
            const tasaActual = tasaNetaText.replace(/[^0-9.,]/g, '');
            if (tasaActual) {
                document.getElementById('tipoTasa').value = 'tasaNeta';
                document.getElementById('valorTasa').value = tasaActual;
            }
        } else if (sessionStorage.getItem('ultimaTasa')) {
            // Restaurar la última configuración de tasa usada
            document.getElementById('valorTasa').value = sessionStorage.getItem('ultimaTasa');
            document.getElementById('tasaPorMil').checked = sessionStorage.getItem('ultimoTipoPorMil') === 'true';
            if (sessionStorage.getItem('ultimoTipoTasa')) {
                document.getElementById('tipoTasa').value = sessionStorage.getItem('ultimoTipoTasa');
            }
        } else {
            // Si no hay valores previos, establecer valores por defecto
            document.getElementById('tipoTasa').value = 'tasaNeta';
            document.getElementById('valorTasa').value = '';
        }

        // Sincronizar el estado de los checkboxes según el estado guardado
        document.getElementById('tasaPorMil').checked = tasaPorMilActual;
        document.getElementById('tasaPorMilPrima').checked = tasaPorMilActual;
    }
    
    guardarDatos();
    calcular();
}

// Agregar event listeners para el toggle de prima/tasa
document.querySelectorAll('input[name="inputType"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        toggleInputVisibility(e.target.value);
    });
});

// Event listener para cuando el documento esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos guardados
    cargarDatos();
    
    // Event listener para los checkboxes de tasa por mil y sincronización
    ['tasaPorMil', 'tasaPorMilPrima'].forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', function(e) {
                // Sincronizar el estado del otro checkbox
                if (id === 'tasaPorMil') {
                    document.getElementById('tasaPorMilPrima').checked = e.target.checked;
                } else {
                    document.getElementById('tasaPorMil').checked = e.target.checked;
                }
                guardarDatos();
                calcular();
            });
        }
    });

    // Event listeners para el campo de tasa y tipo de tasa
    const valorTasaInput = document.getElementById('valorTasa');
    if (valorTasaInput) {
        let valorAnteriorTasa = '';
        
        valorTasaInput.addEventListener('input', function(e) {
            let valor = e.target.value;
            
            // Si se está borrando o el valor es vacío, permitirlo
            if (valor === '' || valor.length < valorAnteriorTasa.length) {
                valorAnteriorTasa = valor;
                guardarDatos();
                calcular();
                return;
            }
            
            // Limpiar el valor de todo excepto números, punto y coma
            valor = valor.replace(/[^\d.,]/g, '');
            
            // Si hay más de un separador decimal, mantener solo el primero
            let contadorDecimal = 0;
            valor = valor.replace(/[.,]/g, function(match) {
                contadorDecimal++;
                return contadorDecimal === 1 ? '.' : '';
            });
            
            // Si es un número válido, actualizar
            if (/^\d*\.?\d*$/.test(valor)) {
                e.target.value = valor;
                valorAnteriorTasa = valor;
            } else {
                e.target.value = valorAnteriorTasa;
            }
            
            guardarDatos();
            calcular();
        });

        valorTasaInput.addEventListener('blur', function(e) {
            const valor = e.target.value;
            if (valor) {
                const numero = parseFloat(valor.replace(',', '.'));
                if (!isNaN(numero)) {
                    e.target.value = numero.toFixed(4);
                    valorAnteriorTasa = e.target.value;
                } else {
                    e.target.value = '';
                    valorAnteriorTasa = '';
                }
            }
            calcular();
        });

        valorTasaInput.addEventListener('focus', function(e) {
            const valor = e.target.value;
            if (valor) {
                let limpio = valor.replace(/[%‰]/g, '');
                e.target.value = limpio;
                valorAnteriorTasa = limpio;
            }
        });
    }

    // Event listener para el tipo de tasa
    const tipoTasaSelect = document.getElementById('tipoTasa');
    if (tipoTasaSelect) {
        tipoTasaSelect.addEventListener('change', calcular);
    }

    // Event listener para la tasa de derecho de emisión
    const tasaDerechoEmisionSelect = document.getElementById('tasaDerechoEmision');
    if (tasaDerechoEmisionSelect) {
        tasaDerechoEmisionSelect.addEventListener('change', function() {
            calcular();
            guardarDatos();
        });
    }

    // Event listeners para los campos numéricos
    ['valorPrima', 'sumaAsegurada', 'valorComision', 'derechoEmisionMinimo'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            let valorAnterior = '';

            input.addEventListener('input', function(e) {
                let valor = e.target.value;
                // Eliminar comas de miles al escribir o pegar
                valor = valor.replace(/,/g, '');
                // Si se está borrando o el valor es vacío, permitirlo
                if (valor === '' || valor.length < valorAnterior.length) {
                    valorAnterior = valor;
                    guardarDatos();
                    calcular();
                    return;
                }
                // Limpiar el valor de todo excepto números y punto decimal
                valor = valor.replace(/[^\d.]/g, '');
                // Si hay más de un punto, mantener solo el último como decimal
                const partes = valor.split('.');
                if (partes.length > 2) {
                    valor = partes.slice(0, -1).join('') + '.' + partes[partes.length - 1];
                }
                // Si es un número válido, actualizar
                if (/^\d*\.?\d*$/.test(valor)) {
                    e.target.value = valor;
                    valorAnterior = valor;
                } else {
                    e.target.value = valorAnterior;
                }
                guardarDatos();
                calcular();
            });

            input.addEventListener('blur', function(e) {
                const valor = e.target.value.replace(/,/g, '');
                if (valor) {
                    const numero = parseFloat(valor);
                    if (!isNaN(numero)) {
                        e.target.value = formatearNumero(numero);
                        valorAnterior = e.target.value;
                    } else {
                        e.target.value = '';
                        valorAnterior = '';
                    }
                }
                calcular();
            });

            input.addEventListener('focus', function(e) {
                const valor = e.target.value;
                if (valor) {
                    // Mantener el número con sus decimales pero sin formato
                    let limpio = valor.replace(/,/g, '');
                    e.target.value = limpio;
                    valorAnterior = limpio;
                }
            });
        }
    });

    // Botón limpiar
    document.getElementById('btnLimpiar').addEventListener('click', function() {
        document.getElementById('tipoPrima').value = 'total';
        document.getElementById('valorPrima').value = '';
        document.getElementById('sumaAsegurada').value = '';
        document.getElementById('tipoComision').value = 'monto';
        document.getElementById('valorComision').value = '';
        document.getElementById('tipoTasa').value = 'tasaNeta';
        document.getElementById('valorTasa').value = '';
        document.getElementById('tasaPorMil').checked = false;
        document.getElementById('tasaPorMilPrima').checked = false;
        document.getElementById('derechoEmisionMinimo').value = '0.00';
        // Mantener el toggle actual
        const currentToggle = document.querySelector('input[name="inputType"]:checked').value;
        calcular();
        guardarDatos();
    });

    // Cambio en el tipo de comisión
    document.getElementById('tipoComision').addEventListener('change', cambiarTipoComision);
    
    // Calcular al cargar
    calcular();
});