# Épica 1: Core Business — Facturación y Pagos

## Descripción

Funcionalidades principales del sistema de facturación y cuentas por cobrar. Estas HUs representan la **reescritura** de la lógica existente en `app.js` usando arquitectura moderna (módulos ES6+, services, tests unitarios).

## HUs Contenidas

---

### FN-001 Crear factura en borrador

**Como** facturador autenticado
**Quiero** crear una factura con cliente, ítems, condiciones de pago e impuestos
**Para** tener un documento borrador listo para emitir

#### Criterios de Aceptación
- [ ] Dado un usuario autenticado con rol Facturador o Admin, cuando selecciona un cliente y agrega al menos un ítem, entonces puede guardar la factura en estado "Borrador"
- [ ] Dado un ítem con cantidad ≤ 0, cuando se intenta agregar, entonces el sistema muestra error "Cantidad inválida"
- [ ] Dado que se agrega un ítem, entonces se calcula automáticamente: bruto = qty × price, descuento, neto, impuesto, total línea
- [ ] Dado que se selecciona condición "Crédito", cuando no se ingresa fecha vencimiento, entonces el sistema rechaza con error
- [ ] Dado un borrador guardado exitosamente, entonces se registra en auditoría

#### Notas Técnicas
- Fuente: `behavior/workflows.md` (Workflow 1: Creación y Emisión)
- Lógica actual: `saveInvoice("Borrador")` en `app.js:198-269`
- Validaciones: RN-01 (4 reglas) en `behavior/business-logic.md`
- Complejidad: M (módulo de cálculos + validación + persistencia)
- Dependencias: TK-005 (calculator), TK-007 (validators), DT-001 (DataStore)

#### Evidencia del Análisis
- Regla de negocio: `app.js:208-229` — 4 validaciones obligatorias
- Motor de cálculo: `app.js:817-837` — `calcItem()` + `calcTotals()`

---

### FN-002 Emitir factura con consecutivo

**Como** facturador autenticado
**Quiero** emitir una factura asignándole un consecutivo automático (FAC-NNNN)
**Para** que la factura sea oficial y pueda enviarse al cliente

#### Criterios de Aceptación
- [ ] Dado un borrador válido (cliente + items + fecha), cuando se emite, entonces se genera consecutivo FAC-{next} automáticamente
- [ ] Dado que la factura ya fue emitida previamente, cuando se intenta emitir de nuevo, entonces el sistema rechaza con "La emisión ya fue ejecutada para esta factura"
- [ ] Dado una emisión exitosa, entonces el consecutivo incrementa en 1 (`data.numeration.next++`)
- [ ] Dado una emisión exitosa, entonces se registra `emittedAt = new Date()`

#### Notas Técnicas
- Fuente: `behavior/workflows.md` (Workflow 1)
- Lógica actual: `saveInvoice("Emitida")` en `app.js:230-262`
- Consecutivo: `data.numeration.prefix + data.numeration.next` (`app.js:231-232`)
- Complejidad: S
- Dependencias: FN-001, DT-001

#### Evidencia del Análisis
- Generación de consecutivo: `app.js:231-232`
- Validación de duplicados: `app.js:228-229`

---

### FN-003 Aplicar pago a facturas

**Como** analista de cartera autenticado
**Quiero** registrar un pago y distribuirlo entre facturas pendientes de un cliente
**Para** actualizar los saldos y reflejar el cobro realizado

#### Criterios de Aceptación
- [ ] Dado un usuario con rol "Facturador", cuando intenta aplicar pago, entonces el sistema rechaza con "El rol Facturador no registra pagos"
- [ ] Dado un monto de pago ≤ 0, cuando se intenta aplicar, entonces muestra error
- [ ] Dado que la suma distribuida entre facturas ≠ monto total, entonces rechaza con "La suma aplicada debe coincidir con el valor del pago"
- [ ] Dado que un monto asignado a una factura supera su saldo, entonces rechaza con "Los pagos no pueden superar el saldo"
- [ ] Dado un pago válido aplicado, entonces `inv.paid += monto` y `inv.balance -= monto` para cada factura
- [ ] Dado que `inv.balance <= 0` después del pago, entonces su estado cambia a "Pagada"

#### Notas Técnicas
- Fuente: `behavior/workflows.md` (Workflow 2: Aplicación de Pago)
- Lógica actual: `applyPayment()` en `app.js:471-557`
- Reglas: RN-02 (4 validaciones) + RN-03 (recálculo de estado)
- Complejidad: L (distribución múltiple + recálculo de estado + autorización)
- Dependencias: TK-006 (state machine), SC-003 (RBAC), DT-001

#### Evidencia del Análisis
- Autorización por rol: `app.js:479-480`
- Distribución: `app.js:521-523`
- Recálculo de estado: `recalcInvoiceState()` llamado vía `refreshAll()`

---

### FN-004 Crear nota crédito

**Como** administrador autenticado
**Quiero** emitir una nota crédito (parcial o total) contra una factura existente
**Para** ajustar el saldo cuando hay devoluciones o errores

#### Criterios de Aceptación
- [ ] Dado que no se ha cargado una factura, cuando se intenta crear NC, entonces rechaza con "Primero cargue una factura"
- [ ] Dado un monto de NC > saldo de la factura, cuando se envía, entonces rechaza con "La nota crédito no puede superar el saldo"
- [ ] Dado tipo "Total", entonces el monto se asigna automáticamente como el saldo completo
- [ ] Dado tipo "Parcial", entonces el usuario ingresa el monto específico
- [ ] Dado una NC creada exitosamente, entonces `inv.balance -= amount` y se registra auditoría

#### Notas Técnicas
- Fuente: `behavior/workflows.md` (Workflow 4: Nota Crédito)
- Lógica actual: `createCreditNote()` en `app.js:703-753`
- Reglas: RN-04 (4 validaciones)
- Complejidad: M
- Dependencias: DT-001, TK-006

#### Evidencia del Análisis
- Validaciones: `app.js:710-732`
- Reducción de balance: `app.js:745`

---

### FN-005 Anular factura

**Como** administrador autenticado
**Quiero** anular una factura registrando el motivo de anulación
**Para** invalidar un documento que fue emitido por error

#### Criterios de Aceptación
- [ ] Dado que no se ingresa motivo, cuando se intenta anular, entonces rechaza con "Toda anulación requiere motivo"
- [ ] Dado una anulación exitosa, entonces `inv.status = "Anulada"` (estado terminal — no recalculable)
- [ ] Dado una factura anulada, entonces no puede recibir pagos ni notas crédito

#### Notas Técnicas
- Fuente: `behavior/workflows.md` (Workflow 5: Anulación)
- Lógica actual: `annulInvoice()` en `app.js:755-773`
- Reglas: RN-05
- Complejidad: S
- Dependencias: DT-001

#### Evidencia del Análisis
- Estado terminal: `app.js:763-764`

---

### FN-006 Generar PDF de factura

**Como** facturador autenticado
**Quiero** descargar un PDF con el detalle de la factura (cliente, ítems, totales)
**Para** entregar al cliente un documento formal

#### Criterios de Aceptación
- [ ] Dado una factura emitida, cuando se solicita PDF, entonces se genera un documento con logo, datos empresa, cliente, ítems, subtotales, impuestos, retención y total
- [ ] Dado una factura en borrador, entonces también puede generar PDF (preview)
- [ ] El PDF incluye: consecutivo, fecha, vencimiento, condición de pago, notas

#### Notas Técnicas
- Fuente: `behavior/workflows.md` (Workflow 1 paso "Generar PDF")
- Lógica actual: `previewInvoice()` + `downloadPDF()` en `app.js:277-340`
- Librería actual: jsPDF 1.5.3 (vendorizada) — reemplazar por versión moderna
- Complejidad: M
- Dependencias: FN-001, FN-002

#### Evidencia del Análisis
- Generación PDF: `app.js:277-340` (~63 LOC)

---

### FN-007 Enviar factura por correo

**Como** facturador autenticado
**Quiero** enviar la factura por email al cliente
**Para** notificarle que tiene un documento pendiente

#### Criterios de Aceptación
- [ ] Dado una factura en borrador, cuando se intenta enviar, entonces rechaza con "No se puede enviar factura en borrador"
- [ ] Dado una factura emitida, cuando se envía, entonces se registra `sentHistory` con fecha y dirección
- [ ] Dado que se envía exitosamente, entonces se registra auditoría

#### Notas Técnicas
- Fuente: `behavior/business-logic.md` (V-15)
- Lógica actual: `sendInvoice()` en `app.js:342-372` — SIMULADO (no hay backend de email)
- Complejidad: M (requiere backend real para email)
- Dependencias: IN-001 (Backend API), FN-002

#### Evidencia del Análisis
- Simulación actual: `app.js:342-372`
- Validación: `app.js:303`

---

### FN-008 Dashboard financiero con KPIs

**Como** usuario autenticado (cualquier rol)
**Quiero** ver un dashboard con los KPIs financieros principales
**Para** tener visibilidad del estado de la cartera en tiempo real

#### Criterios de Aceptación
- [ ] Muestra: facturación mensual, valor recaudado, saldo pendiente, cartera vencida
- [ ] Muestra: count de facturas emitidas, pagadas, parciales
- [ ] Muestra: promedio de días de pago, próximos vencimientos (7 días)
- [ ] Incluye gráfico de barras de facturación por mes (últimos 6 meses)
- [ ] Incluye listado de top 5 deudores

#### Notas Técnicas
- Fuente: `behavior/workflows.md` (Workflow 6: Dashboard Financiero)
- Lógica actual: `renderDashboard()` en `app.js:559-650`
- 8 KPIs + Chart.js para gráfico
- Complejidad: M
- Dependencias: DT-001

#### Evidencia del Análisis
- KPIs: `app.js:559-650` — 8 cálculos aggregados

---

### FN-009 Gestión de recordatorios de cobro

**Como** analista de cartera
**Quiero** enviar recordatorios de cobro a facturas pendientes/vencidas
**Para** gestionar activamente la cartera y reducir morosidad

#### Criterios de Aceptación
- [ ] Dado una lista de facturas pendientes filtrada, cuando selecciono varias y envío recordatorio, entonces se registra `collectionAction` en cada una
- [ ] Dado un recordatorio enviado, entonces se registra tipo, fecha y método
- [ ] Dado un recordatorio exitoso, entonces se registra auditoría por cada factura

#### Notas Técnicas
- Fuente: `behavior/workflows.md` (Workflow 3: Gestión de Cartera)
- Lógica actual: `sendBulkReminders()` + `sendReminderForInvoice()` en `app.js:436-470`
- Complejidad: S (post-modernización real requiere servicio de email)
- Dependencias: DT-001, IN-001

#### Evidencia del Análisis
- Recordatorios simulados: `app.js:436-470`

---

### FN-010 Exportar cuentas por cobrar a CSV

**Como** analista de cartera
**Quiero** exportar la tabla de cuentas por cobrar a un archivo CSV
**Para** analizarla en Excel o compartir con el equipo financiero

#### Criterios de Aceptación
- [ ] Dado una tabla de CxC con filtros aplicados, cuando exporto, entonces se descarga CSV con las columnas visibles
- [ ] El CSV incluye: consecutivo, cliente, total, pagado, saldo, estado, vencimiento, días mora

#### Notas Técnicas
- Fuente: `behavior/workflows.md` — función `exportCSV()`
- Lógica actual: `exportCSV()` en `app.js:432-435`
- Complejidad: S
- Dependencias: DT-001

#### Evidencia del Análisis
- Export: `app.js:432-435` (4 LOC, usa `encodeURIComponent`)

---

### FN-011 Soporte multi-usuario

**Como** administrador del sistema
**Quiero** que múltiples usuarios puedan usar la aplicación simultáneamente
**Para** que el equipo financiero trabaje en paralelo sin conflictos

#### Criterios de Aceptación
- [ ] Cada usuario tiene su sesión autenticada independiente
- [ ] Los datos son compartidos entre usuarios (misma base de datos)
- [ ] No hay conflictos de escritura (optimistic locking o similar)
- [ ] La auditoría registra QUÉ usuario realizó cada acción

#### Notas Técnicas
- Fuente: `analysis/production-readiness.md` — "single tab, sin concurrencia"
- Estado actual: Sesión simulada con `var sessionUser` — `app.js:5`
- Complejidad: L (requiere backend + auth + concurrencia)
- Dependencias: IN-001, SC-001

---

### FN-012 Búsqueda avanzada de facturas

**Como** usuario autenticado
**Quiero** buscar facturas por múltiples criterios (cliente, estado, fecha, monto)
**Para** encontrar rápidamente documentos específicos

#### Criterios de Aceptación
- [ ] Permite filtrar por: cliente, rango de fechas, estado, rango de montos
- [ ] Los filtros se combinan con AND
- [ ] Los resultados muestran paginación si hay más de 20 registros

#### Notas Técnicas
- Fuente: Funcionalidad implícita en renderAccounts() con filtros básicos
- Estado actual: Solo filtro por estado en CxC — `app.js:384-391`
- Complejidad: M
- Dependencias: DT-001

---

### FN-013 Reportes gerenciales por período

**Como** administrador
**Quiero** generar reportes consolidados por período (mensual, trimestral)
**Para** presentar informes a la gerencia financiera

#### Criterios de Aceptación
- [ ] Permite seleccionar rango de fechas
- [ ] Genera resumen: total facturado, recaudado, pendiente, vencido
- [ ] Muestra detalle por cliente (top N)
- [ ] Exportable a PDF

#### Notas Técnicas
- Fuente: Extensión del dashboard actual (`behavior/workflows.md` Workflow 6)
- Complejidad: M
- Dependencias: FN-008, FN-006

---

### FN-014 Configuración de empresa

**Como** administrador
**Quiero** configurar los datos de mi empresa (NIT, razón social, logo, numeración)
**Para** que aparezcan correctamente en facturas y PDFs

#### Criterios de Aceptación
- [ ] Permite editar: razón social, NIT, dirección, teléfono, email, logo
- [ ] Permite configurar: prefijo de facturación, número siguiente
- [ ] Permite configurar: impuesto por defecto, retención por defecto
- [ ] Los cambios se reflejan inmediatamente en nuevas facturas

#### Notas Técnicas
- Fuente: `database/schema-analysis.md` — entidad `companyInfo`
- Estado actual: `data.companyInfo` hardcodeado en `loadData()` — `app.js:15-23`
- Complejidad: S
- Dependencias: DT-001

---

### FN-015 Gestión de catálogo de clientes

**Como** facturador
**Quiero** gestionar (crear, editar, desactivar) clientes en un catálogo
**Para** poder facturar a nuevos clientes sin intervención del administrador

#### Criterios de Aceptación
- [ ] Permite crear cliente con: nombre, NIT, dirección, teléfono, email, contacto
- [ ] Permite editar datos de cliente existente
- [ ] Permite desactivar (no eliminar) un cliente
- [ ] Los clientes desactivados no aparecen en el selector de facturación

#### Notas Técnicas
- Fuente: `database/schema-analysis.md` — entidad `clients`
- Estado actual: `data.clients` inicializado estáticamente en `loadData()` — `app.js:25-28`
- Complejidad: S
- Dependencias: DT-001

---

## Resumen de Épica

| Tipo | Cantidad | SP Estimados |
|---|---|---|
| Funcional (FN) | 15 | 55 |
| Complejidad S | 5 | 15 |
| Complejidad M | 7 | 28 |
| Complejidad L | 3 | 12 |

## Referencias

- [Backlog](../backlog.md)
- [Business Logic](../../behavior/business-logic.md)
- [Workflows](../../behavior/workflows.md)
- [Database Schema](../../database/schema-analysis.md)
