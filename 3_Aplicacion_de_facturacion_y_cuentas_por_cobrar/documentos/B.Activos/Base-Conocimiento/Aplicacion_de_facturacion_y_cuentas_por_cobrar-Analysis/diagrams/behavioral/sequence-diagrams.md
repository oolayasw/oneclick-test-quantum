# Diagramas de Comportamiento — InvoiceManager

## Secuencia 1: Ciclo de Vida Completo de una Factura

Este diagrama muestra el flujo principal del sistema: desde la creación de una factura hasta su cierre por pago completo.

```mermaid
sequenceDiagram
    participant U as Usuario
    participant UI as HTML (6 vistas)
    participant JS as app.js
    participant SM as recalcInvoiceState()
    participant LS as localStorage

    Note over U,LS: === CREACION ===
    U->>UI: Selecciona cliente, agrega items
    U->>UI: Click "Guardar Borrador"
    UI->>JS: saveInvoice("Borrador")
    JS->>JS: calcTotals()
    JS->>LS: saveData()
    JS->>SM: recalcInvoiceState()
    SM-->>JS: estado = "Borrador"

    Note over U,LS: === EMISION ===
    U->>UI: Click "Emitir"
    UI->>JS: saveInvoice("Emitida")
    JS->>JS: Genera consecutivo FAC-NNNN
    JS->>JS: calcTotals()
    JS->>LS: saveData()
    JS->>SM: recalcInvoiceState()
    SM-->>JS: estado = "Emitida"
    JS->>JS: addAudit("Factura Emitida")

    Note over U,LS: === PAGO ===
    U->>UI: Registra pago parcial
    UI->>JS: applyPayment()
    JS->>JS: Actualiza inv.paid += monto
    JS->>LS: saveData()
    JS->>SM: recalcInvoiceState()
    SM-->>JS: estado = "Parcialmente pagada"

    U->>UI: Registra pago final
    UI->>JS: applyPayment()
    JS->>JS: Actualiza inv.paid += monto
    JS->>LS: saveData()
    JS->>SM: recalcInvoiceState()
    SM-->>JS: estado = "Pagada"
    JS->>JS: addAudit("Pago aplicado")
```

## Secuencia 2: Nota Crédito con Recálculo de Balance

```mermaid
sequenceDiagram
    participant U as Usuario
    participant UI as Modal Nota Credito
    participant JS as createCreditNote()
    participant INV as data.invoices[i]
    participant LS as localStorage

    U->>UI: Selecciona factura, ingresa items NC
    U->>UI: Click "Crear Nota Credito"
    UI->>JS: createCreditNote()
    JS->>JS: Valida que factura no este Anulada/Borrador
    JS->>JS: calcTotals(items NC)
    JS->>INV: push nota credito al array creditNotes
    JS->>INV: Recalcula balance = total - paid - sum(NC)
    JS->>JS: recalcInvoiceState()
    alt balance <= 0
        JS-->>INV: estado = "Pagada"
    else balance > 0
        JS-->>INV: estado = "Con nota credito"
    end
    JS->>LS: saveData()
    JS->>JS: addAudit("Nota credito creada")
    JS->>UI: refreshAll()
```

## Secuencia 3: Generación de PDF de Factura

```mermaid
sequenceDiagram
    participant U as Usuario
    participant UI as Vista Facturacion
    participant JS as downloadPDF()
    participant JSPDF as jsPDF Library
    participant FS as File System (download)

    U->>UI: Click icono PDF en factura
    UI->>JS: downloadPDF(invoiceId)
    JS->>JS: Busca factura en data.invoices
    JS->>JSPDF: new jsPDF()
    JS->>JSPDF: doc.setFontSize(18)
    JS->>JSPDF: doc.text("FACTURA DE VENTA")
    JS->>JSPDF: Datos empresa, cliente, items, totales
    JS->>JSPDF: doc.save("Factura_FAC-NNNN.pdf")
    JSPDF-->>FS: Descarga archivo PDF
    FS-->>U: PDF en carpeta Downloads
```

## Secuencia 4: Dashboard con Gráfico Financiero

```mermaid
sequenceDiagram
    participant JS as refreshAll()
    participant DASH as renderDashboard()
    participant CHART as drawFinanceChart()
    participant CLIB as Chart.js Library
    participant DOM as DOM (Canvas)

    JS->>DASH: renderDashboard()
    DASH->>DASH: Calcula: total facturado, recaudado, pendiente
    DASH->>DOM: Actualiza 3 KPIs (HTML)
    DASH->>CHART: drawFinanceChart()
    CHART->>CHART: Agrupa facturas por mes
    CHART->>CHART: Calcula series: facturado, pagado, cartera
    CHART->>CLIB: new Chart(ctx, config)
    CLIB->>DOM: Renderiza grafico de barras
```

## Máquina de Estados de Factura

```mermaid
stateDiagram-v2
    [*] --> Borrador : saveInvoice("Borrador")
    Borrador --> Emitida : saveInvoice("Emitida")
    Emitida --> ParcialmentePagada : pago parcial (paid > 0 AND balance > 0)
    Emitida --> Pagada : pago total (balance <= 0)
    Emitida --> Vencida : dueDate < today
    Emitida --> ConNotaCredito : creditNote aplicada (balance > 0)
    ParcialmentePagada --> Pagada : pago final (balance <= 0)
    ParcialmentePagada --> Vencida : dueDate < today
    ConNotaCredito --> Pagada : balance <= 0
    Emitida --> Anulada : annulInvoice()
    ParcialmentePagada --> Anulada : annulInvoice()
    Pagada --> [*]
    Anulada --> [*]
```

Este diagrama de estados se reconstruye desde la lógica de `recalcInvoiceState()` (`app.js:315-355`). La función no implementa transiciones explícitas sino que RECALCULA el estado en cada `refreshAll()` basándose en el balance y la fecha.

## Hallazgos Clave

- **Flujo principal simple:** Crear → Emitir → Pagar (3 pasos)
- **State machine implícita:** El estado se recalcula, no se transiciona explícitamente
- **Sin operaciones asíncronas:** Todo es síncrono (localStorage es sync API)
- **Sin error recovery:** Si localStorage falla, no hay catch ni retry
- **Refresh-All:** Cada operación re-renderiza TODA la UI (ineficiente pero correcto)

## Referencias

- [Workflows](../../behavior/workflows.md)
- [Decision Logic](../../behavior/decision-logic.md)
- [System Overview](../../architecture/system-overview.md)
- [Error Handling](../../behavior/error-handling.md)
