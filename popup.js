/**
 * Calculadora de Primas - Refactored
 * Estructura: Modular (State, Calculator, UI)
 */

// ==========================================
// UTILITIES
// ==========================================
const Utils = {
    redondear: (valor, decimales = 2) => {
        // Redondea al número de decimales especificado (por defecto 2)
        const factor = Math.pow(10, decimales);
        return Math.round((valor + Number.EPSILON) * factor) / factor;
    },
    // Constantes de precisión
    PRECISION_MONTO: 6,
    PRECISION_TASA: 8,
    PRESENTACION_MONTO: 2,
    PRESENTACION_TASA: 4,

    formatearNumero: (numero) => {
        return new Intl.NumberFormat('es-PE', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            useGrouping: true
        }).format(numero);
    },

    formatearPorcentaje: (decimal, esPorMil = false) => {
        const valor = esPorMil ? decimal * 1000 : decimal * 100;
        // El usuario solicitó presentación de 4 decimales en resultados
        const redondeado = Utils.redondear(valor, 4);
        return redondeado.toFixed(4) + (esPorMil ? '‰' : '%');
    },

    limpiarNumero: (valor) => {
        if (!valor) return '0';
        // Limpiamos espacios y manejamos separadores de miles/decimales (coma/punto)
        // En PE se usa coma para decimales frecuentemente. 
        let v = valor.toString().replace(/\s/g, '');

        // Si tiene coma y punto, asumimos el último como decimal
        const lastComma = v.lastIndexOf(',');
        const lastDot = v.lastIndexOf('.');

        if (lastComma > lastDot) {
            // Coma es el decimal. Quitamos puntos y cambiamos coma a punto.
            v = v.replace(/\./g, '').replace(/,/g, '.');
        } else if (lastDot > lastComma) {
            // Punto es el decimal. Quitamos comas.
            v = v.replace(/,/g, '');
        } else if (lastComma !== -1) {
            // Solo hay comas
            v = v.replace(/,/g, '.');
        }

        // Asegurar solo un punto decimal
        const partes = v.split('.');
        if (partes.length > 2) {
            v = partes.slice(0, -1).join('') + '.' + partes[partes.length - 1];
        }
        return v;
    },

    parseInput: (val) => parseFloat(Utils.limpiarNumero(val)) || 0
};

// ==========================================
// DATE UTILITIES
// ==========================================
const DateUtils = {
    parse: (str) => {
        if (!str) return null;
        const parts = str.split('/');
        if (parts.length !== 3) return null;
        const d = new Date(parts[2], parts[1] - 1, parts[0]);
        return isNaN(d.getTime()) ? null : d;
    },

    format: (date) => {
        if (!date || isNaN(date.getTime())) return '';
        const dd = date.getDate().toString().padStart(2, '0');
        const mm = (date.getMonth() + 1).toString().padStart(2, '0');
        const yyyy = date.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
    },

    add: (date, cant, unit) => {
        if (!date) return null;
        const d = new Date(date);
        const val = parseInt(cant) || 0;

        if (unit === 'dias') {
            d.setDate(d.getDate() + val);
        } else if (unit === 'meses') {
            d.setMonth(d.getMonth() + val);
        } else if (unit === 'anos') {
            d.setFullYear(d.getFullYear() + val);
        }
        return d;
    },

    subtract: (date, cant, unit) => {
        if (!date) return null;
        const d = new Date(date);
        const val = parseInt(cant) || 0;

        if (unit === 'dias') {
            d.setDate(d.getDate() - val);
        } else if (unit === 'meses') {
            d.setMonth(d.getMonth() - val);
        } else if (unit === 'anos') {
            d.setFullYear(d.getFullYear() - val);
        }
        return d;
    },

    diff: (d1, d2, unit) => {
        if (!d1 || !d2) return 0;
        // Diferencia en ms
        const diffTime = d2 - d1;

        // Cálculos aproximados estándar
        if (unit === 'dias') {
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } else if (unit === 'meses') {
            let months = (d2.getFullYear() - d1.getFullYear()) * 12;
            months -= d1.getMonth();
            months += d2.getMonth();
            // Ajuste por días
            if (d2.getDate() < d1.getDate()) months--;
            // Retorno decimal opcional o entero? Usuario prefiere entero usualmente para meses, 
            // pero si es exacto mejor. Para simplicidad de UI: integer logic 
            // pero si hay dias extra, no se reflejan.
            // Mejor approach: diff simple en dias siempre para la logica interna, 
            // pero la UI pide 'cant' en 'unidad'.
            // Si el usuario pide diferencia en meses de 15 enero a 15 de febrero = 1.
            return months <= 0 ? 0 : months;
        } else if (unit === 'anos') {
            let years = d2.getFullYear() - d1.getFullYear();
            if (d2.getMonth() < d1.getMonth() || (d2.getMonth() === d1.getMonth() && d2.getDate() < d1.getDate())) {
                years--;
            }
            return years <= 0 ? 0 : years;
        }
        return 0;
    },

    // Calcula siempre la diferencia en DÍAS reales para el factor de prorrata
    diffDíasReal: (d1, d2) => {
        if (!d1 || !d2) return 0;
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
};

// ==========================================
// STATE MANAGEMENT
// ==========================================
class StateManager {
    constructor() {
        this.defaultState = {
            // Configuración
            sumaAsegurada: 0,
            tipoComision: 'monto', // 'monto' o 'porcentaje'
            valorComision: 0,
            tasaDerechoEmision: 0.03,
            derechoEmisionMinimo: 0,

            // Navegación
            activeTab: 'prima',
            previousTab: null,
            tasaPorMil: false,

            // Prima Tab
            tipoPrima: 'total',
            valorPrima: 0,
            tasaPorMilPrima: false,

            // Tasa Tab
            tipoTasa: 'tasaNeta',
            valorTasa: 0,

            // Prorrata Tab (Configuraciones básicas, la lógica compleja suele ser volátil)
            headerDataType: 'primaTotal',
            headerDataValue: 0,

            periodoUnidad: 'anos',
            periodoValor: 1,
            fechaInicioPeriodo: '',
            fechaFinPeriodo: '',

            prorrataUnidad: 'dias',
            prorrataValor: 0,
            fechaInicioProrrata: '',
            fechaFinProrrata: '',

            headerTasaPorMil: false,
        };

        this.state = { ...this.defaultState };
        this.load(); // Load saved state after initializing with defaults
    }

    load() {
        const saved = localStorage.getItem('calculadoraPrimas');
        const parsed = saved ? JSON.parse(saved) : {};
        // Fusionar con defaults para asegurar integridad
        this.state = { ...this.defaultState, ...parsed };
        return this.state;
    }

    save() {
        localStorage.setItem('calculadoraPrimas', JSON.stringify(this.state));
    }

    update(key, value) {
        if (key === 'activeTab') {
            this.state.previousTab = this.state.activeTab;
        }

        // Sincronización Global de Checkbox %o
        if (key === 'tasaPorMil' || key === 'tasaPorMilPrima' || key === 'headerTasaPorMil') {
            this.state.tasaPorMil = value;
            this.state.tasaPorMilPrima = value;
            this.state.headerTasaPorMil = value;
            this.save(); // Save immediately for global sync
            return;
        }

        this.state[key] = value;
        this.save(); // Auto-save on update
    }

    get(key) {
        return this.state[key];
    }

    getAll() {
        return { ...this.state };
    }

    // Sincronización específica
    syncFromResults(results, sourceTab) {
        // Al cambiar de pestaña, actualizamos el estado base para que la nueva pestaña tenga datos coherentes
        // Por ejemplo, si calculé Prima Neta en el tab 'Prima', y voy a 'Tasa', podría querer ver esa Prima Neta reflejada o la tasa resultante.
        // Por simplificación y req del usuario: "Sincronizacion, los selects, los resultados, entre pestañas."

        // Si calculamos una Tasa Neta implícita en la pestaña Prima, actualizamos el valor de tasa?
        // El usuario pidió: "al ir de prima a tasa tambien deberia".

        if (sourceTab === 'prima' && results.tasaNeta) {
            // Actualizamos el valor de tasa implícitamente solo si tenemos suma asegurada
            // OJO: Esto puede ser invasivo si el usuario tenía datos manuales en tasa.
            // Lo haremos "lazy" en la UI al cambiar de tab, leyendo de este update.
        }
    }
}

// ==========================================
// CALCULATION ENGINE
// ==========================================
class CalculatorEngine {
    static calculate(state) {
        const {
            sumaAsegurada,
            activeTab,
            tipoPrima, valorPrima,
            tipoTasa, valorTasa, tasaPorMil, // tasaPorMil is now global
            tipoComision, valorComision,
            tasaDerechoEmision, derechoEmisionMinimo,
            // Prorrata inputs si se pasaran... por ahora nos enfocamos en el core
        } = state;

        let res = {
            tasaNeta: 0,
            tasaComercial: 0,
            primaNeta: 0,
            derechoEmision: 0,
            primaComercial: 0,
            igv: 0,
            primaTotal: 0,
            comisionMonto: 0,
            comisionPorcentaje: 0,
            isValid: false
        };

        // Lógica de Limpieza Total: Si no hay valor base, todo debe ser 0.
        const baseVal = activeTab === 'prorrata' ? state.headerDataValue : (activeTab === 'tasa' ? valorTasa : valorPrima);
        if (baseVal === 0 && sumaAsegurada === 0) { // Added sumaAsegurada check for full reset
            res.isValid = true; // Mostramos 0.00 limpio sin ⚠️
            return res;
        }

        // Lógica Core
        const tieneSuma = sumaAsegurada > 0;

        if (activeTab === 'prima') {
            if (valorPrima > 0 || sumaAsegurada > 0) {
                res.isValid = true;

                if (tipoPrima === 'total') {
                    // Cálculo desde Total: Asegurar que componentes sumen exactamente el total
                    res.primaTotal = valorPrima;
                    res.primaComercial = Utils.redondear(res.primaTotal / 1.18, Utils.PRECISION_MONTO);
                    res.igv = Utils.redondear(res.primaTotal - res.primaComercial, Utils.PRECISION_MONTO);

                    // Cálculo de Prima Neta y Derecho de Emisión
                    let pnApprox = Utils.redondear(res.primaComercial / (1 + tasaDerechoEmision), Utils.PRECISION_MONTO);
                    let deCalc = Utils.redondear(pnApprox * tasaDerechoEmision, Utils.PRECISION_MONTO);

                    if (deCalc < derechoEmisionMinimo) {
                        res.derechoEmision = derechoEmisionMinimo;
                        res.primaNeta = Utils.redondear(res.primaComercial - res.derechoEmision, Utils.PRECISION_MONTO);
                    } else {
                        res.derechoEmision = deCalc;
                        res.primaNeta = pnApprox;
                    }
                } else if (tipoPrima === 'comercial') {
                    res.primaComercial = valorPrima;
                    res.igv = Utils.redondear(res.primaComercial * 0.18, Utils.PRECISION_MONTO);
                    res.primaTotal = Utils.redondear(res.primaComercial + res.igv, Utils.PRECISION_MONTO);

                    let pnApprox = Utils.redondear(res.primaComercial / (1 + tasaDerechoEmision), Utils.PRECISION_MONTO);
                    let deCalc = Utils.redondear(pnApprox * tasaDerechoEmision, Utils.PRECISION_MONTO);

                    if (deCalc < derechoEmisionMinimo) {
                        res.derechoEmision = derechoEmisionMinimo;
                        res.primaNeta = Utils.redondear(res.primaComercial - res.derechoEmision, Utils.PRECISION_MONTO);
                    } else {
                        res.derechoEmision = deCalc;
                        res.primaNeta = pnApprox;
                    }
                } else if (tipoPrima === 'neta') {
                    res.primaNeta = valorPrima;
                    let deCalc = Utils.redondear(res.primaNeta * tasaDerechoEmision, Utils.PRECISION_MONTO);
                    res.derechoEmision = (deCalc < derechoEmisionMinimo) ? derechoEmisionMinimo : deCalc;
                    res.primaComercial = Utils.redondear(res.primaNeta + res.derechoEmision, Utils.PRECISION_MONTO);
                    res.igv = Utils.redondear(res.primaComercial * 0.18, Utils.PRECISION_MONTO);
                    res.primaTotal = Utils.redondear(res.primaComercial + res.igv, Utils.PRECISION_MONTO);
                }

                if (tieneSuma) {
                    res.tasaNeta = res.primaNeta / sumaAsegurada;
                    res.tasaComercial = res.primaComercial / sumaAsegurada;
                }
            }
        } else if (activeTab === 'tasa') {
            if (valorTasa > 0) {
                res.isValid = true;
                let tasaDecimal = tasaPorMil ? valorTasa / 1000 : valorTasa / 100;

                if (tipoTasa === 'tasaNeta') {
                    res.tasaNeta = tasaDecimal;
                    res.tasaComercial = Utils.redondear(res.tasaNeta * (1 + tasaDerechoEmision), Utils.PRECISION_TASA);

                    if (tieneSuma) {
                        res.primaNeta = Utils.redondear(res.tasaNeta * sumaAsegurada, Utils.PRECISION_MONTO);
                        let deCalc = Utils.redondear(res.primaNeta * tasaDerechoEmision, Utils.PRECISION_MONTO);
                        res.derechoEmision = (deCalc < derechoEmisionMinimo) ? derechoEmisionMinimo : deCalc;
                        res.primaComercial = Utils.redondear(res.primaNeta + res.derechoEmision, Utils.PRECISION_MONTO);
                        res.tasaComercial = res.primaComercial / sumaAsegurada;
                    }
                } else if (tipoTasa === 'tasaComercial') {
                    res.tasaComercial = tasaDecimal;
                    res.tasaNeta = Utils.redondear(res.tasaComercial / (1 + tasaDerechoEmision), Utils.PRECISION_TASA);

                    if (tieneSuma) {
                        res.primaComercial = Utils.redondear(res.tasaComercial * sumaAsegurada, Utils.PRECISION_MONTO);
                        let pnApprox = Utils.redondear(res.primaComercial / (1 + tasaDerechoEmision), Utils.PRECISION_MONTO);
                        let deCalc = Utils.redondear(pnApprox * tasaDerechoEmision, Utils.PRECISION_MONTO);

                        if (deCalc < derechoEmisionMinimo) {
                            res.derechoEmision = derechoEmisionMinimo;
                            res.primaNeta = Utils.redondear(res.primaComercial - res.derechoEmision, Utils.PRECISION_MONTO);
                        } else {
                            res.derechoEmision = deCalc;
                            res.primaNeta = pnApprox;
                        }
                        res.tasaNeta = res.primaNeta / sumaAsegurada;
                    }
                }

                if (tieneSuma) {
                    res.igv = Utils.redondear(res.primaComercial * 0.18, Utils.PRECISION_MONTO);
                    res.primaTotal = Utils.redondear(res.primaComercial + res.igv, Utils.PRECISION_MONTO);
                }
            }
        } else if (activeTab === 'prorrata' && state.headerDataValue >= 0) {
            // Determine true decimal value based on header type and checkbox
            let val = state.headerDataValue;
            const isTasa = state.headerDataType.startsWith('tasa');
            const isMil = state.tasaPorMil; // Usar estado global unificado

            if (isTasa) {
                val = isMil ? val / 1000 : val / 100;
            }

            // Initial results based on Header input
            if (state.headerDataType === 'primaTotal') res.primaTotal = val;
            else if (state.headerDataType === 'primaNeta') res.primaNeta = val;
            else if (state.headerDataType === 'primaComercial') res.primaComercial = val;
            else if (state.headerDataType === 'tasaNeta') res.tasaNeta = val;
            else if (state.headerDataType === 'tasaComercial') res.tasaComercial = val;

            // 2. Determine Factor logic
            // Days logic
            const diasPeriodo = DateUtils.diffDíasReal(DateUtils.parse(state.fechaInicioPeriodo), DateUtils.parse(state.fechaFinPeriodo));
            const diasProrrata = DateUtils.diffDíasReal(DateUtils.parse(state.fechaInicioProrrata), DateUtils.parse(state.fechaFinProrrata));

            let factor = 0.00;
            // Si el usuario pone 1 año, aseguramos 365 o 366.
            // Corrección: Usar la lógica de fechas ingresadas es lo más preciso.
            if (diasPeriodo > 0) {
                factor = diasProrrata / diasPeriodo;
                // El factor se redondea a 10 decimales para mayor precisión
                factor = Utils.redondear(factor, 10);
            }

            const valFactorizado = val * factor;

            // 4. Delegate Calculation (Recursividad)
            // Construimos un estado temporal para reutilizar la lógica de Prima o Tasa básica
            // sobre el valor ya prorrateado.
            let tempState = {
                ...state,
                sumaAsegurada: sumaAsegurada,
                tasaPorMil: isMil, // Forzar estado global
                activeTab: '' // Se definirá abajo
            };

            if (state.headerDataType === 'primaTotal') {
                tempState.activeTab = 'prima';
                tempState.tipoPrima = 'total';
                tempState.valorPrima = valFactorizado;
            } else if (state.headerDataType === 'primaNeta') {
                tempState.activeTab = 'prima';
                tempState.tipoPrima = 'neta';
                tempState.valorPrima = valFactorizado;
            } else if (state.headerDataType === 'primaComercial') {
                tempState.activeTab = 'prima';
                tempState.tipoPrima = 'comercial';
                tempState.valorPrima = valFactorizado;
            } else if (state.headerDataType === 'tasaNeta') {
                tempState.activeTab = 'tasa';
                tempState.tipoTasa = 'tasaNeta';
                // Para las tasas, pasamos el valor que el sistema espera (ej. 1.2 si es 1.2%)
                tempState.valorTasa = isMil ? valFactorizado * 1000 : valFactorizado * 100;
            } else if (state.headerDataType === 'tasaComercial') {
                tempState.activeTab = 'tasa';
                tempState.tipoTasa = 'tasaComercial';
                tempState.valorTasa = isMil ? valFactorizado * 1000 : valFactorizado * 100;
            }

            // Llamada recursiva al motor de cálculo
            const subRes = CalculatorEngine.calculate(tempState);
            res = { ...subRes };
            res.isValid = true;
        }


        // Comisión (Común)
        if (res.primaNeta > 0 && valorComision > 0) {
            if (tipoComision === 'porcentaje') {
                res.comisionPorcentaje = valorComision / 100;
                res.comisionMonto = Utils.redondear(res.comisionPorcentaje * res.primaNeta, Utils.PRECISION_MONTO);
            } else {
                res.comisionMonto = valorComision;
                res.comisionPorcentaje = res.comisionMonto / res.primaNeta;
            }
        }

        // REDONDEO FINAL DE PRESENTACIÓN
        res.primaNeta = Utils.redondear(res.primaNeta, Utils.PRESENTACION_MONTO);
        res.derechoEmision = Utils.redondear(res.derechoEmision, Utils.PRESENTACION_MONTO);
        res.primaComercial = Utils.redondear(res.primaComercial, Utils.PRESENTACION_MONTO);
        res.igv = Utils.redondear(res.igv, Utils.PRESENTACION_MONTO);
        res.primaTotal = Utils.redondear(res.primaTotal, Utils.PRESENTACION_MONTO);
        res.comisionMonto = Utils.redondear(res.comisionMonto, Utils.PRESENTACION_MONTO);

        // Tasas a 4 decimales (valor decimal puro)
        res.tasaNeta = Utils.redondear(res.tasaNeta, Utils.PRESENTACION_TASA + 2); // Tasas son 0.XXXXYY
        res.tasaComercial = Utils.redondear(res.tasaComercial, Utils.PRESENTACION_TASA + 2);

        return res;
    }
}

// ==========================================
// UI CONTROLLER
// ==========================================
class UIController {
    constructor(stateManager) {
        this.sm = stateManager;
        this.elements = this.cacheDOM();
        this.lastResults = null;

        this.init();
    }

    cacheDOM() {
        return {
            // Tabs
            tabs: document.querySelectorAll('input[name="inputType"]'),
            tabContainers: {
                prima: document.querySelector('.prima-inputs'),
                tasa: document.querySelector('.tasa-inputs'),
                prorrata: document.querySelector('.prorrata-inputs')
            },

            // Shared Inputs
            sumaAsegurada: document.getElementById('sumaAsegurada'),

            // Prima Inputs
            tipoPrima: document.getElementById('tipoPrima'),
            valorPrima: document.getElementById('valorPrima'),
            tasaPorMilPrima: document.getElementById('tasaPorMilPrima'),

            // Tasa Inputs
            tipoTasa: document.getElementById('tipoTasa'),
            valorTasa: document.getElementById('valorTasa'),
            tasaPorMil: document.getElementById('tasaPorMil'),

            // Comision / Otros
            tipoComision: document.getElementById('tipoComision'),
            valorComision: document.getElementById('valorComision'),
            labelComision: document.getElementById('labelComision'),
            tasaDerechoEmision: document.getElementById('tasaDerechoEmision'),
            derechoEmisionMinimo: document.getElementById('derechoEmisionMinimo'),

            // Resultados
            resTasaNeta: document.getElementById('tasaNeta'),
            resTasaComercial: document.getElementById('tasaComercial'),
            resPrimaNeta: document.getElementById('primaNeta'),
            resDerechoEmision: document.getElementById('derechoEmision'),
            resPrimaComercial: document.getElementById('primaComercial'),
            resIGV: document.getElementById('igv'),
            resPrimaTotal: document.getElementById('primaTotalCalculada'),
            resLabelComision: document.getElementById('labelResultadoComision'),
            resValComision: document.getElementById('resultadoComision'),

            // Buttons
            btnLimpiar: document.getElementById('btnLimpiar')
        };
    }

    init() {
        this.loadStateToUI();
        this.attachListeners();
        this.updateTabVisibility(this.sm.get('activeTab'));

        // Inicializar Header Prorrata en Prima Neta por defecto
        const headerType = document.getElementById('headerDataType');
        if (headerType) {
            headerType.value = this.sm.get('headerDataType'); // Load from state
            // this.sm.update('headerDataType', 'primaNeta'); // No longer hardcode
        }

        this.recalculate(); // Initial calc

        // Asegurar estados iniciales de candados/readonly post-load
        const btnLockPeriodo = document.getElementById('btnLockPeriodo');
        const btnLockProrrata = document.getElementById('btnLockProrrata');
        const valPeriodo = document.getElementById('periodoValor');
        const valProrrata = document.getElementById('prorrataValor');

        if (btnLockPeriodo) btnLockPeriodo.textContent = '🔒';
        if (btnLockProrrata) btnLockProrrata.textContent = '🔓';
        if (valPeriodo) {
            valPeriodo.setAttribute('readonly', 'true');
            valPeriodo.classList.add('input-locked');
        }
        if (valProrrata) {
            valProrrata.removeAttribute('readonly');
            valProrrata.classList.remove('input-locked');
        }
    }

    loadStateToUI() {
        const s = this.sm.getAll();
        const e = this.elements;

        // Cargar Tabs
        const activeRadio = document.querySelector(`input[name="inputType"][value="${s.activeTab}"]`);
        if (activeRadio) activeRadio.checked = true;

        // Cargar Valores
        e.sumaAsegurada.value = s.sumaAsegurada || '';
        e.tipoPrima.value = s.tipoPrima;
        e.valorPrima.value = s.valorPrima || '';
        if (e.tasaPorMilPrima) e.tasaPorMilPrima.checked = s.tasaPorMil; // Use global tasaPorMil

        e.tipoTasa.value = s.tipoTasa;
        e.valorTasa.value = s.valorTasa || '';
        if (e.tasaPorMil) e.tasaPorMil.checked = s.tasaPorMil; // Use global tasaPorMil

        e.tipoComision.value = s.tipoComision;
        e.valorComision.value = s.valorComision || '';
        e.tasaDerechoEmision.value = s.tasaDerechoEmision;
        e.derechoEmisionMinimo.value = s.derechoEmisionMinimo || '';

        // Prorrata Header
        const headerDataType = document.getElementById('headerDataType');
        const headerDataValue = document.getElementById('headerDataValue');
        const headerTasaPorMil = document.getElementById('headerTasaPorMil');

        if (headerDataType) headerDataType.value = s.headerDataType;
        if (headerDataValue) headerDataValue.value = s.headerDataValue || '';
        if (headerTasaPorMil) headerTasaPorMil.checked = s.tasaPorMil; // Use global tasaPorMil

        // Prorrata Periodo
        const periodoUnidad = document.getElementById('periodoUnidad');
        const periodoValor = document.getElementById('periodoValor');
        const fechaInicioPeriodo = document.getElementById('fechaInicioPeriodo');
        const fechaFinPeriodo = document.getElementById('fechaFinPeriodo');

        if (periodoUnidad) periodoUnidad.value = s.periodoUnidad;
        if (periodoValor) periodoValor.value = s.periodoValor;
        if (fechaInicioPeriodo) fechaInicioPeriodo.value = s.fechaInicioPeriodo;
        if (fechaFinPeriodo) fechaFinPeriodo.value = s.fechaFinPeriodo;

        // Prorrata Prorrata
        const prorrataUnidad = document.getElementById('prorrataUnidad');
        const prorrataValor = document.getElementById('prorrataValor');
        const fechaInicioProrrata = document.getElementById('fechaInicioProrrata');
        const fechaFinProrrata = document.getElementById('fechaFinProrrata');

        if (prorrataUnidad) prorrataUnidad.value = s.prorrataUnidad;
        if (prorrataValor) prorrataValor.value = s.prorrataValor;
        if (fechaInicioProrrata) fechaInicioProrrata.value = s.fechaInicioProrrata;
        if (fechaFinProrrata) fechaFinProrrata.value = s.fechaFinProrrata;


        this.updateComisionLabel();
    }

    attachListeners() {
        // Tab Switching
        this.elements.tabs.forEach(tab => {
            tab.addEventListener('change', (e) => {
                const newTab = e.target.value;
                this.sm.update('activeTab', newTab);
                this.updateTabVisibility(newTab);

                // Sync Trigger al cambiar de tab
                this.synchronizeTab(newTab);

                this.recalculate();
            });
        });

        // Input Changes (Generic wrapper)
        const bindInput = (el, key, isNumber = true, isCheck = false) => {
            if (!el) return;
            const handler = (e) => {
                let val;
                if (isCheck) val = e.target.checked;
                else if (isNumber) val = Utils.parseInput(e.target.value);
                else val = e.target.value;

                this.sm.update(key, val);
                this.recalculate();
            };

            el.addEventListener(isCheck ? 'change' : 'input', handler);
            if (!isCheck && el.tagName === 'SELECT') el.addEventListener('change', handler);
        };

        const bindFormatting = (el, type) => {
            if (!el) return;
            // On Focus: Show raw/editable value
            el.addEventListener('focus', () => {
                const val = Utils.limpiarNumero(el.value);
                el.value = (parseFloat(val) === 0) ? '' : val;
            });

            // On Blur: Show formatted value
            el.addEventListener('blur', () => {
                const val = Utils.parseInput(el.value);
                if (type === 'currency') {
                    el.value = (val === 0) ? '' : Utils.formatearNumero(val);
                } else if (type === 'rate') {
                    el.value = (val === 0) ? '' : val.toFixed(4);
                }
            });
        };

        bindInput(this.elements.sumaAsegurada, 'sumaAsegurada');
        bindFormatting(this.elements.sumaAsegurada, 'currency');

        bindInput(this.elements.tipoPrima, 'tipoPrima', false);

        bindInput(this.elements.valorPrima, 'valorPrima');
        bindFormatting(this.elements.valorPrima, 'currency');

        // bindInput(this.elements.tasaPorMilPrima, 'tasaPorMilPrima', false, true); // Handled by global sync

        bindInput(this.elements.tipoTasa, 'tipoTasa', false);

        bindInput(this.elements.valorTasa, 'valorTasa');
        bindFormatting(this.elements.valorTasa, 'rate');

        // bindInput(this.elements.tasaPorMil, 'tasaPorMil', false, true); // Handled by global sync

        bindInput(this.elements.tipoComision, 'tipoComision', false);

        bindInput(this.elements.valorComision, 'valorComision');
        // Comision can be currency or % (implied rate-like but simpler). 
        // User asked "comision" in context of currency list.
        bindFormatting(this.elements.valorComision, 'currency');

        bindInput(this.elements.tasaDerechoEmision, 'tasaDerechoEmision');

        bindInput(this.elements.derechoEmisionMinimo, 'derechoEmisionMinimo');
        bindFormatting(this.elements.derechoEmisionMinimo, 'currency');

        // Prorrata Header Logic
        const headerVal = document.getElementById('headerDataValue');
        const headerType = document.getElementById('headerDataType');
        const headerTasaPorMil = document.getElementById('headerTasaPorMil');

        if (headerVal && headerType) {
            // Bind inputs
            // bindInput(headerVal, 'headerDataValue'); // Handled by specific listener below for sync
            bindInput(headerType, 'headerDataType', false);
            // bindInput(headerTasaPorMil, 'headerTasaPorMil', false, true); // Handled by global sync

            // Apply formatting based on select
            const updateProrrataFormat = () => {
                const t = headerType.value;
                const isRate = t.includes('tasa') || t.includes('Tasa');
                const val = Utils.parseInput(headerVal.value);
                if (val !== 0) {
                    headerVal.value = isRate ? val.toFixed(4) : Utils.formatearNumero(val);
                }
            };

            headerVal.addEventListener('focus', () => {
                const val = Utils.limpiarNumero(headerVal.value);
                headerVal.value = (parseFloat(val) === 0) ? '' : val;
            });

            headerVal.addEventListener('blur', updateProrrataFormat);
            headerType.addEventListener('change', updateProrrataFormat);
        }

        // Prorrata Section Inputs
        bindInput(document.getElementById('periodoUnidad'), 'periodoUnidad', false);
        bindInput(document.getElementById('periodoValor'), 'periodoValor');
        bindInput(document.getElementById('fechaInicioPeriodo'), 'fechaInicioPeriodo', false);
        bindInput(document.getElementById('fechaFinPeriodo'), 'fechaFinPeriodo', false);

        bindInput(document.getElementById('prorrataUnidad'), 'prorrataUnidad', false);
        bindInput(document.getElementById('prorrataValor'), 'prorrataValor');
        bindInput(document.getElementById('fechaInicioProrrata'), 'fechaInicioProrrata', false);
        bindInput(document.getElementById('fechaFinProrrata'), 'fechaFinProrrata', false);

        // Special: Comision Type Update UI
        this.elements.tipoComision.addEventListener('change', () => this.updateComisionLabel());

        // Special: Sync Tasa Checkboxes
        // Checkbox Sync logic (Global %o)
        const checkMil = (e) => {
            const isChecked = e.target.checked;
            this.sm.update('tasaPorMil', isChecked);

            // Sync all checkboxes in DOM immediately
            this.elements.tasaPorMil.checked = isChecked;
            this.elements.tasaPorMilPrima.checked = isChecked;
            const hCheck = document.getElementById('headerTasaPorMil');
            if (hCheck) hCheck.checked = isChecked;

            // Al cambiar el %o, si estamos en prorrata, sincronizar header hacia tabs base
            if (this.sm.get('activeTab') === 'prorrata') {
                this.syncToOtherTabs();
            }

            this.recalculate();
        };

        this.elements.tasaPorMil.addEventListener('change', checkMil);
        this.elements.tasaPorMilPrima.addEventListener('change', checkMil);
        const elHeaderCheck = document.getElementById('headerTasaPorMil');
        if (elHeaderCheck) elHeaderCheck.addEventListener('change', checkMil);

        // Header Prorrata Sync Back
        const elHeaderVal = document.getElementById('headerDataValue');
        const elHeaderType = document.getElementById('headerDataType');

        if (elHeaderVal) {
            elHeaderVal.addEventListener('input', (e) => {
                const val = Utils.parseInput(e.target.value);
                this.sm.update('headerDataValue', val);
                this.syncToOtherTabs();
                this.recalculate();
            });
            elHeaderVal.addEventListener('blur', (e) => {
                const val = this.sm.get('headerDataValue');
                e.target.value = elHeaderType.value.startsWith('tasa') ? val.toFixed(4) : Utils.formatearNumero(val);
            });
        }

        if (elHeaderType) {
            elHeaderType.addEventListener('change', (e) => {
                this.sm.update('headerDataType', e.target.value);
                this.syncToOtherTabs();
                this.recalculate();
            });
        }

        // Limpiar
        if (this.elements.btnLimpiar) {
            this.elements.btnLimpiar.addEventListener('click', () => {
                this.resetCurrentTab();
            });
        }

        // ==========================================
        // PRORRATA UI LOGIC
        const toggleSection = (headerId, contentId) => {
            const header = document.getElementById(headerId);
            const content = document.getElementById(contentId);
            const arrow = header?.querySelector('.toggle-arrow');

            const updateArrow = () => {
                if (!arrow) return;
                // ▲ expandido (no colapsado), ▼ colapsado
                arrow.textContent = content.classList.contains('collapsed') ? '▼' : '▲';
            };

            if (header && content) {
                header.addEventListener('click', (e) => {
                    if (e.target.closest('select') || e.target.closest('input') || e.target.closest('button')) return;
                    content.classList.toggle('collapsed');
                    updateArrow();
                });
                updateArrow(); // Estado inicial
            }
        };

        toggleSection('headerPeriodo', 'contentPeriodo');
        toggleSection('headerProrrata', 'contentProrrata');

        const toggleLock = (btnId) => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Coherencia: 🔒 = Bloqueado (Readonly), 🔓 = Manual (Editable)
                    const isNowLocked = btn.textContent === '🔓';
                    btn.textContent = isNowLocked ? '🔒' : '🔓';

                    const sectionId = btnId === 'btnLockPeriodo' ? 'contentPeriodo' : 'contentProrrata';
                    const container = document.getElementById(sectionId);
                    if (container) {
                        const inputs = container.querySelectorAll('input, select');
                        const inputCant = container.querySelector('input[id$="Valor"]');

                        inputs.forEach(inp => {
                            if (isNowLocked) {
                                inp.setAttribute('readonly', 'true');
                                if (inp.tagName === 'SELECT') inp.setAttribute('disabled', 'true');
                            } else {
                                inp.removeAttribute('readonly');
                                if (inp.tagName === 'SELECT') inp.removeAttribute('disabled');
                            }
                        });

                        if (isNowLocked) {
                            container.classList.add('locked-section');
                            if (inputCant) inputCant.classList.add('input-locked');
                        } else {
                            container.classList.remove('locked-section');
                            if (inputCant) inputCant.classList.remove('input-locked');
                        }
                    }
                });
            }
        };

        toggleLock('btnLockPeriodo');
        toggleLock('btnLockProrrata');

        // Logic Date Sync
        this.setupDateSync('Periodo');
        this.setupDateSync('Prorrata');
    }

    setupDateSync(suffix) {
        // Elements
        const elUnidad = document.getElementById(`${suffix.toLowerCase()}Unidad`);
        const elValor = document.getElementById(`${suffix.toLowerCase()}Valor`); // Cantidad
        const elInicio = document.getElementById(`fechaInicio${suffix}`);
        const elFin = document.getElementById(`fechaFin${suffix}`);
        const btnLock = document.getElementById(`btnLock${suffix}`);

        if (!elUnidad || !elValor || !elInicio || !elFin) return;

        let isInternalUpdate = false;

        const isLocked = () => btnLock && btnLock.textContent === '🔒';

        const updateFin = () => {
            if (isInternalUpdate) return;
            isInternalUpdate = true;
            try {
                const inicio = DateUtils.parse(elInicio.value);
                const cant = parseFloat(elValor.value) || 0;
                const unidad = elUnidad.value;

                if (inicio && cant >= 0) {
                    const fin = DateUtils.add(inicio, cant, unidad);
                    const parsedFin = DateUtils.format(fin);
                    elFin.value = parsedFin;
                    this.sm.update(`fechaFin${suffix}`, parsedFin);
                }
            } finally {
                isInternalUpdate = false;
                this.recalculate();
            }
        };

        const updateInicio = () => {
            if (isInternalUpdate) return;
            isInternalUpdate = true;
            try {
                const fin = DateUtils.parse(elFin.value);
                const cant = parseFloat(elValor.value) || 0;
                const unidad = elUnidad.value;

                if (fin && cant >= 0) {
                    const inicio = DateUtils.subtract(fin, cant, unidad);
                    const parsedInicio = DateUtils.format(inicio);
                    elInicio.value = parsedInicio;
                    this.sm.update(`fechaInicio${suffix}`, parsedInicio);
                }
            } finally {
                isInternalUpdate = false;
                this.recalculate();
            }
        };

        const updateCant = () => {
            if (isInternalUpdate) return;
            isInternalUpdate = true;
            try {
                const inicio = DateUtils.parse(elInicio.value);
                const fin = DateUtils.parse(elFin.value);
                const unidad = elUnidad.value;

                if (inicio && fin) {
                    let diff = (unidad === 'dias') ? DateUtils.diffDíasReal(inicio, fin) : DateUtils.diff(inicio, fin, unidad);
                    elValor.value = diff;
                    this.sm.update(`${suffix.toLowerCase()}Valor`, diff);
                }
            } finally {
                isInternalUpdate = false;
                this.recalculate();
            }
        };

        // Eventos
        elValor.addEventListener('input', () => {
            if (!isLocked()) updateFin();
        });

        elInicio.addEventListener('change', () => {
            if (isLocked()) updateFin();
            else updateCant();
        });
        elInicio.addEventListener('blur', () => {
            if (isLocked()) updateFin();
            else updateCant();
        });

        elFin.addEventListener('change', () => {
            if (isLocked()) updateInicio();
            else updateCant();
        });
        elFin.addEventListener('blur', () => {
            if (isLocked()) updateInicio();
            else updateCant();
        });

        elUnidad.addEventListener('change', updateFin);
    }


    resetCurrentTab() {
        const activeTab = this.sm.get('activeTab');
        const today = new Date();
        const nextYear = new Date(today);
        nextYear.setFullYear(today.getFullYear() + 1);

        const fmtDate = (d) => {
            const dd = d.getDate().toString().padStart(2, '0');
            const mm = (d.getMonth() + 1).toString().padStart(2, '0');
            const yyyy = d.getFullYear();
            return `${dd}/${mm}/${yyyy}`;
        };

        // Reset inputs comunes (Suma, Comision, Derechos)
        this.sm.update('sumaAsegurada', 0);
        this.elements.sumaAsegurada.value = '';

        this.sm.update('tipoComision', 'monto');
        this.elements.tipoComision.value = 'monto';
        this.updateComisionLabel();

        this.sm.update('valorComision', 0);
        this.elements.valorComision.value = '';

        this.sm.update('tasaDerechoEmision', 0.03);
        this.elements.tasaDerechoEmision.value = '0.03';

        this.sm.update('derechoEmisionMinimo', 0);
        this.elements.derechoEmisionMinimo.value = '0.00';

        if (activeTab === 'prima') {
            this.sm.update('tipoPrima', 'total');
            this.elements.tipoPrima.value = 'total';

            this.sm.update('valorPrima', 0);
            this.elements.valorPrima.value = '';

            this.elements.tasaPorMilPrima.checked = false;
            this.sm.update('tasaPorMilPrima', false);
            // Sync logic will handle the other checkbox if needed, but explicit is better
            this.elements.tasaPorMil.checked = false;
            this.sm.update('tasaPorMil', false);

        } else if (activeTab === 'tasa') {
            this.sm.update('tipoTasa', 'tasaNeta');
            this.elements.tipoTasa.value = 'tasaNeta';

            this.sm.update('valorTasa', 0);
            this.elements.valorTasa.value = '';

            this.elements.tasaPorMil.checked = false;
            this.sm.update('tasaPorMil', false);
            this.elements.tasaPorMilPrima.checked = false;
            this.sm.update('tasaPorMilPrima', false);

        } else if (activeTab === 'prorrata') {
            // Header
            const headerType = document.getElementById('headerDataType');
            const headerVal = document.getElementById('headerDataValue');
            const headerCheck = document.getElementById('headerTasaPorMil');

            if (headerType) {
                headerType.value = 'primaNeta';
                this.sm.update('headerDataType', 'primaNeta');
            }
            if (headerVal) {
                headerVal.value = '0.00';
                this.sm.update('headerDataValue', 0);
            }
            if (headerCheck) {
                headerCheck.checked = false;
                this.sm.update('headerTasaPorMil', false);
            }

            // Section: Por Periodo (Colapsado, Bloqueado)
            const contentPeriodo = document.getElementById('contentPeriodo');
            const btnLockPeriodo = document.getElementById('btnLockPeriodo');
            const periodoUnidad = document.getElementById('periodoUnidad');
            const fechaInicioPeriodo = document.getElementById('fechaInicioPeriodo');
            const fechaFinPeriodo = document.getElementById('fechaFinPeriodo');
            const periodoValor = document.getElementById('periodoValor');

            if (contentPeriodo) contentPeriodo.classList.add('collapsed');
            if (btnLockPeriodo) btnLockPeriodo.textContent = '🔒';
            if (periodoUnidad) {
                periodoUnidad.value = 'anos';
                this.sm.update('periodoUnidad', 'anos');
            }
            if (fechaInicioPeriodo) {
                fechaInicioPeriodo.value = fmtDate(today);
                this.sm.update('fechaInicioPeriodo', fmtDate(today));
            }
            if (fechaFinPeriodo) {
                fechaFinPeriodo.value = fmtDate(nextYear);
                this.sm.update('fechaFinPeriodo', fmtDate(nextYear));
            }
            if (periodoValor) {
                periodoValor.value = '1.00';
                periodoValor.setAttribute('readonly', 'true');
                periodoValor.classList.add('input-locked');
                this.sm.update('periodoValor', 1);
            }

            // Section: A Prorrata (Extendido, Desbloqueado)
            const contentProrrata = document.getElementById('contentProrrata');
            const btnLockProrrata = document.getElementById('btnLockProrrata');
            const prorrataUnidad = document.getElementById('prorrataUnidad');
            const fechaInicioProrrata = document.getElementById('fechaInicioProrrata');
            const fechaFinProrrata = document.getElementById('fechaFinProrrata');
            const prorrataValor = document.getElementById('prorrataValor');

            if (contentProrrata) contentProrrata.classList.remove('collapsed');
            if (btnLockProrrata) btnLockProrrata.textContent = '🔓';
            if (prorrataUnidad) {
                prorrataUnidad.value = 'dias';
                this.sm.update('prorrataUnidad', 'dias');
            }
            if (fechaInicioProrrata) {
                fechaInicioProrrata.value = fmtDate(today);
                this.sm.update('fechaInicioProrrata', fmtDate(today));
            }
            if (fechaFinProrrata) {
                fechaFinProrrata.value = fmtDate(nextYear);
                this.sm.update('fechaFinProrrata', fmtDate(nextYear));
            }

            const diffTime = Math.abs(nextYear - today);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (prorrataValor) {
                prorrataValor.value = diffDays.toString();
                prorrataValor.removeAttribute('readonly');
                prorrataValor.classList.remove('input-locked');
                this.sm.update('prorrataValor', diffDays);
            }
        }

        this.recalculate();
    }


    updateTabVisibility(activeTab) {
        Object.keys(this.elements.tabContainers).forEach(key => {
            const container = this.elements.tabContainers[key];
            if (container) {
                if (key === activeTab) container.classList.add('active');
                else container.classList.remove('active');
            }
        });
    }

    updateComisionLabel() {
        const type = this.elements.tipoComision.value;
        this.elements.labelComision.textContent = type === 'porcentaje' ? '% Comisión:' : 'Comisión:';
        this.elements.resLabelComision.textContent = type === 'porcentaje' ? 'Comisión:' : '% Comisión:';

        // Placeholder update
        this.elements.valorComision.placeholder = '0.00';
    }

    synchronizeTab(newTab) {
        const res = this.lastResults;
        const s = this.sm.getAll();
        const hasValidResults = res && res.isValid && (res.primaTotal > 0 || res.tasaNeta > 0);

        // Siempre sincronizar el checkbox global al entrar a una pestaña
        const isMil = s.tasaPorMil;
        this.elements.tasaPorMil.checked = isMil;
        this.elements.tasaPorMilPrima.checked = isMil;
        const hCereal = document.getElementById('headerTasaPorMil');
        if (hCereal) hCereal.checked = isMil;

        if (newTab === 'tasa') {
            const targetType = this.elements.tipoTasa.value;
            let val = 0;
            if (hasValidResults) {
                val = (targetType === 'tasaNeta') ? res.tasaNeta : res.tasaComercial;
                val = isMil ? val * 1000 : val * 100;
                this.elements.valorTasa.value = val.toFixed(4);
                this.sm.update('valorTasa', val);
            } else if (s.previousTab === 'prorrata') {
                // Si venimos de prorrata y no hay resultados todavia, conservamos el valor del header si coincide el tipo
                if (s.headerDataType === targetType) {
                    val = s.headerDataValue;
                    this.elements.valorTasa.value = val.toFixed(4);
                    this.sm.update('valorTasa', val);
                }
            }
        } else if (newTab === 'prima') {
            const targetType = this.elements.tipoPrima.value;
            let val = 0;
            if (hasValidResults) {
                if (targetType === 'total') val = res.primaTotal;
                else if (targetType === 'neta') val = res.primaNeta;
                else if (targetType === 'comercial') val = res.primaComercial;

                this.elements.valorPrima.value = Utils.formatearNumero(val);
                this.sm.update('valorPrima', val);
            } else if (s.previousTab === 'prorrata') {
                if (s.headerDataType === (targetType === 'neta' ? 'primaNeta' : (targetType === 'comercial' ? 'primaComercial' : 'primaTotal'))) {
                    val = s.headerDataValue;
                    this.elements.valorPrima.value = Utils.formatearNumero(val);
                    this.sm.update('valorPrima', val);
                }
            }
        }

        if (newTab === 'prorrata') {
            this.syncProrrataHeader();
            // Defaults logic remains...
        }

        this.recalculate();
    }

    syncToOtherTabs() {
        // Propaga cambios del Header Prorrata a las pestañas base
        const hType = document.getElementById('headerDataType').value;
        const hVal = Utils.parseInput(document.getElementById('headerDataValue').value);
        const s = this.sm.getAll();

        if (hType.startsWith('tasa')) {
            this.elements.tipoTasa.value = hType;
            this.sm.update('tipoTasa', hType);
            this.elements.valorTasa.value = hVal.toFixed(4);
            this.sm.update('valorTasa', hVal);
        } else {
            const pType = (hType === 'primaNeta') ? 'neta' : (hType === 'primaComercial' ? 'comercial' : 'total');
            this.elements.tipoPrima.value = pType;
            this.sm.update('tipoPrima', pType);
            this.elements.valorPrima.value = Utils.formatearNumero(hVal);
            this.sm.update('valorPrima', hVal);
        }
        // El checkbox ya se sincroniza vía checkMil
    }

    syncProrrataHeader() {
        const headerVal = document.getElementById('headerDataValue');
        const headerType = document.getElementById('headerDataType');
        const headerCheck = document.getElementById('headerTasaPorMil');
        if (!headerVal || !headerType || !headerCheck) return;

        const res = this.lastResults;
        const s = this.sm.getAll();

        let mapType = 'primaNeta';
        let val = 0;
        let mapCheck = s.tasaPorMil;

        // Intentar sincronizar desde resultados primero
        const hasResults = res && res.isValid && (res.primaTotal > 0 || res.tasaNeta > 0);

        if (s.previousTab === 'tasa') {
            mapType = this.elements.tipoTasa.value;
            if (hasResults) {
                val = (mapType === 'tasaNeta') ? res.tasaNeta : res.tasaComercial;
                val = mapCheck ? val * 1000 : val * 100;
            } else {
                // Si no hay resultados (ej. Suma 0), traemos el input crudo
                val = Utils.parseInput(this.elements.valorTasa.value);
            }
        } else if (s.previousTab === 'prima') {
            mapType = (this.elements.tipoPrima.value === 'neta') ? 'primaNeta' :
                (this.elements.tipoPrima.value === 'comercial' ? 'primaComercial' : 'primaTotal');
            if (hasResults) {
                if (mapType === 'primaNeta') val = res.primaNeta;
                else if (mapType === 'primaComercial') val = res.primaComercial;
                else val = res.primaTotal;
            } else {
                val = Utils.parseInput(this.elements.valorPrima.value);
            }
            mapCheck = false;
        } else {
            // Default o ya estamos en prorrata
            mapType = s.headerDataType || 'primaNeta';
            val = s.headerDataValue || 0;
            mapCheck = s.tasaPorMil;
        }

        headerType.value = mapType;
        headerCheck.checked = mapCheck;
        headerVal.value = (mapType.startsWith('tasa')) ? val.toFixed(4) : Utils.formatearNumero(val);

        // Actualizar Estado
        this.sm.update('headerDataType', mapType);
        this.sm.update('headerDataValue', val);
        this.sm.update('headerTasaPorMil', mapCheck);

        // Formatear visualmente
        headerVal.dispatchEvent(new Event('blur'));
    }

    recalculate() {
        const state = this.sm.getAll();
        const results = CalculatorEngine.calculate(state);
        this.lastResults = results;
        this.renderResults(results);
    }

    renderResults(res) {
        const e = this.elements;
        const state = this.sm.getAll();
        const isWarning = !res.isValid;
        const suffix = isWarning ? ' ⚠️' : '';

        const fmtNum = (n) => isWarning ? '0.00' + suffix : Utils.formatearNumero(n);
        const fmtPct = (n) => {
            const isMil = state.tasaPorMil;
            const symbol = isMil ? '‰' : '%';
            if (isWarning) return '0.0000' + symbol + suffix;
            return Utils.formatearPorcentaje(n, isMil);
        };

        e.resTasaNeta.textContent = fmtPct(res.tasaNeta);
        e.resTasaComercial.textContent = fmtPct(res.tasaComercial);
        e.resPrimaNeta.textContent = fmtNum(res.primaNeta);
        e.resDerechoEmision.textContent = fmtNum(res.derechoEmision);
        e.resPrimaComercial.innerHTML = isWarning ? '0.00 ⚠️' : `<strong>${Utils.formatearNumero(res.primaComercial)}</strong>`;
        e.resIGV.textContent = fmtNum(res.igv);
        e.resPrimaTotal.textContent = fmtNum(res.primaTotal);

        if (this.elements.tipoComision.value === 'porcentaje') {
            e.resValComision.textContent = fmtNum(res.comisionMonto);
        } else {
            e.resValComision.textContent = isWarning ? '0.00%' : (res.comisionPorcentaje * 100).toFixed(2) + '%';
        }
    }
}

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const stateManager = new StateManager();
    const ui = new UIController(stateManager);

    // Global access for debug
    window.app = { stateManager, ui };
});