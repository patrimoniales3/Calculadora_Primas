# Calculadora de Primas de Seguros

Una extensión de Chrome especializada para calcular primas, tasas y comisiones en el sector asegurador. Diseñada para corredores, asesores y especialistas en seguros que necesitan realizar cálculos rápidos y precisos de primas comerciales, primas netas y tasas.

## 📥 Instalación en Google Chrome

### Pasos para descargar e instalar:

1. **Acceder al repositorio**
   - Ve a https://github.com/patrimoniales3/Calculadora_Primas

2. **Descargar el proyecto**
   - Haz clic en el botón **Code** (verde)
   - Selecciona **Download ZIP**
   - Extrae el archivo ZIP en una carpeta de tu elección

3. **Abrir Chrome y acceder a extensiones**
   - Abre **Google Chrome**
   - En la barra de direcciones escribe: `chrome://extensions/`
   - Presiona Enter

4. **Activar modo de desarrollador**
   - En la esquina superior derecha, activa el toggle de **"Modo de desarrollador"**

5. **Cargar la extensión**
   - Haz clic en **"Cargar extensión sin empaquetar"** (arriba a la izquierda)
   - Selecciona la carpeta donde descargaste el proyecto
   - La extensión aparecerá en tu lista de extensiones

6. **Fijar la extensión (opcional)**
   - Haz clic en el icono de pieza de puzzle en la barra de direcciones de Chrome
   - Busca "Calculadora de Seguros"
   - Haz clic en el icono de alfiler para fijarlo en la barra de herramientas

¡Listo! Ya puedes usar la calculadora.

---

## 📊 Funcionalidades principales

### 1. **Modos de cálculo**

La calculadora permite trabajar de dos formas diferentes:

#### **Modo Prima**
- Calcula en base a la **Prima** (Total, Comercial o Neta)
- Útil cuando conoces el valor de la prima que quieres trabajar
- Los resultados se muestran automáticamente

#### **Modo Tasa** 
- Calcula en base a la **Tasa** (Neta o Comercial)
- Útil cuando trabajas con tasas de seguros
- Se requiere una suma asegurada para calcular el monto de prima

### 2. **Preservación de valores**

La calculadora **guarda automáticamente todos los valores** que ingresas usando el almacenamiento local del navegador (localStorage). Esto significa:

- Los valores se mantienen guardados aunque **cierres Chrome**
- Se restauran cuando vuelves a abrir la extensión
- Incluye: Tipo de prima, montos, comisión, derecho de emisión mínimo, tasa de derecho de emisión, y todas tus preferencias
- Los datos se sincronizan automáticamente al cambiar cualquier valor

### 3. **Botón Limpiar (🔄)**

El botón con símbolo de recarga te permite:

- **Limpiar todos los valores** ingresados
- **Restablecer valores por defecto**:
  - Tipo de prima: Prima Total
  - Tipo de comisión: Por monto
  - Derecho de emisión: 3%
  - Derecho emisión mínimo: 0.00
- Mantiene tu **modo actual** (Prima o Tasa) sin cambios
- Útil para empezar un nuevo cálculo

### 4. **Entrada de datos**

#### **Valores en por mil (‰) o porcentaje (%)**

Ambos modos (Prima y Tasa) permiten seleccionar si los valores están en **porcentaje (%)** o **por mil (‰)**:

- **Porcentaje (%)**: Para tasas tradicionales (ej: 3%, 5%)
- **Por mil (‰)**: Para tasas pequeñas (ej: 3‰, 5‰)
- El checkbox sincroniza automáticamente en ambos modos
- La calculadora convierte automáticamente para el cálculo

#### **Comisión: Valor o porcentaje**

Puedes ingresar la comisión de dos formas:

1. **Por Monto**: Ingresa el valor directo de comisión en soles/dólares
   - La calculadora mostrará el **% de Comisión** como resultado

2. **Por Porcentaje**: Ingresa el porcentaje de comisión
   - La calculadora mostrará el **monto de Comisión** como resultado

El resultado se invierte automáticamente según el tipo seleccionado.

#### **Modo Prorrata (A Prorrata)**
- Permite calcular primas para periodos menores a un año (ej. endosos temporales, devoluciones).
- **Cabecera Dinámica**: Puedes elegir qué valor prorratear (Prima Total, Prima Neta, Tasa, etc.).
- **Lógica de Fechas**: Calcula automáticamente los días transcurridos entre dos fechas y los compara con el periodo total (usualmente 365 días).
- **Sincronización**: El resultado prorrateado se envía automáticamente a las pestañas de Prima o Tasa para completar el cálculo de impuestos y comisiones.

### 5. **Pestaña de Presets (Configuraciones Rápidas)**

Nueva sección para cargar configuraciones predefinidas de aseguradoras y productos específicos:

- **Buscador Inteligente**: Filtra por nombre de compañía, descripción o valores específicos (ej: "18.00" o "Comisión").
- **Tipos de Presets**:
  - **Derechos de Emisión**: Carga automática de mínimos y tasas para La Positiva, MAPFRE, Pacífico, AVLA, Crecer, etc.
  - **Comisiones por Producto**: Configura automáticamente el % de comisión para productos como "AUTO TOTAL", "SMART PROVINCIA", "WEB Qualitas", entre otros.
- **Acción Rápida**: El botón de aplicar (✅) carga los valores y te redirige automáticamente a la sección correspondiente para visualizar el resultado.

### 6. **Soporte para Valores Negativos**

- Ideal para calcular **devoluciones o anulaciones parciales**.
- Puedes ingresar valores negativos (ej: `-150.40`) y la calculadora procesará el cálculo manteniendo la integridad matemática de los impuestos y derechos de emisión.

### 7. **Interfaz Dinámica (Auto-escalado)**

- La calculadora ajusta su tamaño y **zoom visual** automáticamente según la resolución de tu pantalla.
- Optimización especial para monitores de alta resolución (`1080p`, `1440p`, etc.) para que la interfaz nunca se vea demasiado pequeña o difícil de leer.

---

## 💰 Derechos de emisión

### **Derecho de Emisión Mínimo**

Cada aseguradora establece un derecho de emisión mínimo que debe cobrarse, independientemente del cálculo porcentual:

#### Ejemplos por aseguradora:

**La Positiva (Soles)**
- Derecho de emisión mínimo: **S/. 18.00**

**La Positiva (Dólares)**
- Derecho de emisión mínimo: **USD 5.00**

**MAPFRE (SOAT)**
- Derecho de emisión porcentual: **5%**

**Pacifico (SOAT)**
- Derecho de emisión porcentual: **4%**

**AVLA o CRECER**
- Derecho de emisión porcentual: **0%**

### **Cálculo del Derecho de Emisión**

El derecho de emisión se calcula de la siguiente manera:

1. **Se calcula como porcentaje** de la prima neta: `De = Prima Neta × Tasa De(%)`
2. **Se compara con el mínimo**: Si el resultado es menor que el mínimo establecido, se usa el mínimo
3. **Ejemplo**:
   - Prima Neta: S/. 500
   - Tasa derecho de emisión: 3%
   - Derecho emisión calculado: S/. 15
   - Derecho emisión mínimo: S/. 18
   - **Resultado**: Se usa S/. 18 (por ser mayor que el calculado)

---

## 📐 Guía de componentes y cálculos

### **Campos de entrada**

| Campo | Descripción | Obligatorio |
|-------|-------------|------------|
| **Tipo de Prima** | Selecciona si ingresas Prima Total, Comercial o Neta | Sí (en modo prima) |
| **Prima / Tasa** | Valor numérico de la prima o tasa | Sí (según modo) |
| **Suma Asegurada** | Monto del bien asegurado | Sí (para calcular tasas) |
| **Tipo de Comisión** | Selecciona si es por monto o porcentaje | No |
| **Valor Comisión** | Monto o porcentaje de comisión | No |
| **Tasa Derecho Emisión** | Selecciona 3%, 5% o 0% | Sí (por defecto 3%) |
| **Derecho Emisión Mín.** | Monto mínimo a cobrar | No (por defecto 0.00) |

### **Resultados del cálculo**

| Resultado | Fórmula | Notas |
|-----------|---------|-------|
| **Tasa Neta** | Prima Neta ÷ Suma Asegurada | Se muestra si hay suma asegurada |
| **Tasa Comercial** | Prima Comercial ÷ Suma Asegurada | Se muestra si hay suma asegurada |
| **Prima Neta (Pn)** | Según tipo de prima ingresada | Base para otros cálculos |
| **Derecho Emisión (De)** | Pn × Tasa De (con mínimo) | Aplicando mínimo si corresponde |
| **Prima Comercial (Pc)** | Pn + De | Resaltado en la interfaz |
| **IGV** | Pc × 0.18 (18%) | Impuesto a la Venta |
| **Prima Total** | Pc + IGV | Precio final con impuesto |
| **Comisión** | Según tipo seleccionado | % o monto según opción |

### **Ejemplo de cálculo completo**

**Datos ingresados:**
- Prima Neta: S/. 1,000.00
- Suma Asegurada: S/. 50,000.00
- Comisión: 5%
- Derecho Emisión: 3% con mínimo de S/. 18.00

**Resultados:**
1. **Tasa Neta**: 1,000 ÷ 50,000 = 0.0200 (2%)
2. **Derecho Emisión Calculado**: 1,000 × 0.03 = 30 (mayor que 18, se usa 30)
3. **Prima Comercial**: 1,000 + 30 = S/. 1,030.00
4. **Tasa Comercial**: 1,030 ÷ 50,000 = 0.0206 (2.06%)
5. **IGV**: 1,030 × 0.18 = S/. 185.40
6. **Prima Total**: 1,030 + 185.40 = S/. 1,215.40
7. **Comisión (5%)**: 1,000 × 0.05 = S/. 50.00

---

## 🎯 Casos de uso comunes

### Caso 1: Calcular prima total desde una prima neta

**Necesitas**: Prima neta de S/. 800

1. Toggle en **Prima**
2. Tipo de Prima: **Prima Neta**
3. Prima Neta: **800**
4. Derecho Emisión: **3%** (por defecto)
5. Derecho Emisión Mín.: **18** (La Positiva)

**Resultado**: Prima comercial y total calculadas automáticamente

### Caso 2: Calcular prima desde una tasa

**Necesitas**: Tasa de 2.5% sobre S/. 100,000

1. Toggle en **Tasa**
2. Tipo de Tasa: **Tasa Neta**
3. Tasa: **2.5**
4. Suma Asegurada: **100000**
5. Derecho Emisión: **3%**

**Resultado**: Prima neta (2,500), comercial y total calculadas

### Caso 3: Calcular comisión en porcentaje

**Necesitas**: Comisión del 10% sobre prima neta de S/. 1,200

1. Ingresa los datos de prima
2. Tipo de Comisión: **% Comisión**
3. Valor: **10**

**Resultado**: Comisión = S/. 120.00

### Caso 4: Póliza sin derecho de emisión

**Necesitas**: Calcular sin cobrar derecho de emisión

1. Ingresa datos de prima
2. Tasa Derecho Emisión: **0%**
3. Derecho Emisión Mín.: **0.00**

**Resultado**: Prima comercial = Prima neta (sin añadir derecho)

### Caso 5: Devolución de Prima (Quálitas)

**Escenario**: Quálitas suele no considerar el derecho de emisión en las devoluciones de prima.

1. Seleccionar pestaña **Prorrata**
2. En la cabecera, seleccionar el tipo de valor que se va a devolver (ej: Prima Neta)
3. En la sección de **Derecho de Emisión**:
   - Tasa Derecho Emisión: **0%**
   - Derecho Emisión Mínimo: **0.00**
4. Ingresar las fechas de vigencia y de anulación para obtener el monto a devolver exacto.

**Resultado**: El cálculo de devolución se realizará exclusivamente sobre la base de la prima, sin retener o devolver derechos de emisión según la política de la aseguradora.

---

## 🔧 Características técnicas

- **Tecnología**: Extensión de Chrome (Manifest V3)
- **Almacenamiento**: localStorage del navegador
- **Precisión**: 
  - **Montos**: Redondeo final a 2 decimales (Precisión interna de 6 decimales para evitar errores acumulados).
  - **Tasas**: Redondeo final a 4 decimales (Precisión interna de 8 decimales).
- **Formato**: Números en formato local (es-PE con miles separados por coma)
- **Sincronización**: Los datos se guardan automáticamente con cada cambio
- **Compatibilidad**: Chrome, Edge, Brave y otros navegadores basados en Chromium

---

## 📝 Notas importantes

- Los valores se mantienen guardados automáticamente en tu navegador
- Si cambias de perfil de Chrome, los datos no se sincronizarán
- Puedes usar "Limpiar" para empezar un nuevo cálculo sin perder la configuración del navegador
- El IGV se aplica automáticamente al 18% (estándar en Perú)
- La calculadora siempre aplica el mínimo de derecho de emisión si el calculado es menor

---

## 🐛 Solución de problemas

**P: Los valores no se guardan**
- R: Verifica que las cookies y almacenamiento local de Chrome estén habilitados para la extensión

**P: La extensión desaparece después de reiniciar**
- R: Si no empaquetaste la extensión, Chrome la eliminará. Debes volver a cargarla en `chrome://extensions/`

**P: Los números se formatean de manera diferente**
- R: Es normal, la calculadora usa el formato local (es-PE) que es estándar para Perú

**P: ¿Dónde guarda los datos?**
- R: En el almacenamiento local de Chrome, específicamente en la clave `calculadoraPrimas`. Se puede ver en las herramientas de desarrollador

---

## 📞 Información del desarrollador

- **Repositorio**: https://github.com/patrimoniales3/Calculadora_Primas
- **Correo**: patrimoniales3@gfconsultor.com

---

## ⚖️ Licencia

Este proyecto está bajo licencia MIT. Consulta el archivo LICENSE para más detalles.
