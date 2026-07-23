# Workflows — InvoiceManager

## Workflow 1: Creación y Emisión de Factura

**Actor:** Facturador / Administrador
**Entrada:** Datos del formulario (cliente, items, condición de pago)
**Salida:** Factura persistida con consecutivo (si emitida)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant UI as Formulario HTML
    participant JS as saveInvoice()
    participant CALC as calcTotals()
    participant AUD as addAudit()
    participant LS as localStorage

    U->>UI: Selecciona cliente, agrega items
    U->>UI: Click "Emitir"
    UI->>JS: saveInvoice("Emitida")
    JS->>JS: Validar: cliente + fecha + items + vencimiento
    alt Validacion falla
        JS->>U: alert("mensaje de error")
    else Validacion OK
        JS->>CALC: calcTotals(items, withholding)
        CALC-->>JS: {subtotal, taxTotal, withholding, total}
        JS->>JS: Generar consecutivo FAC-NNNN
        JS->>JS: Construir objeto invoice
        JS->>AUD: addAudit("Factura Emitida", detalles)
        JS->>LS: saveData() [JSON completo]
        JS->>UI: resetInvoiceForm() + refreshAll()
    end
```

**Pasos detallados:**
1. Usuario selecciona cliente del dropdown
2. Agrega items uno por uno (`addItemDraft()`)
3. Opcionalmente: fija retención, condición de pago, vencimiento, notas
4. Click "Emitir" → `saveInvoice("Emitida")`
5. Se validan 4 reglas (RN-01)
6. Se calcula totales con impuestos y retención
7. Se genera consecutivo incremental (`FAC-1001`, `FAC-1002`...)
8. Se persiste a localStorage
9. Se registra auditoría
10. Se limpia formulario y refresca UI

## Workflow 2: Aplicación de Pago

**Actor:** Analista de cartera / Administrador
**Entrada:** Cliente, monto, método de pago, distribución entre facturas
**Salida:** Pago registrado, balances actualizados

```mermaid
sequenceDiagram
    participant U as Usuario
    participant UI as Formulario Pagos
    participant JS as applyPayment()
    participant INV as Facturas (data.invoices)
    participant AUD as addAudit()
    participant LS as localStorage

    U->>UI: Selecciona cliente
    UI->>JS: renderPaymentInvoiceCandidates()
    JS-->>UI: Lista facturas pendientes del cliente
    U->>UI: Ingresa monto + distribuye entre facturas
    U->>UI: Click "Aplicar pago"
    UI->>JS: applyPayment()
    JS->>JS: Validar: rol != Facturador
    JS->>JS: Validar: monto > 0, facturas seleccionadas
    JS->>JS: Validar: suma aplicada == monto total
    JS->>JS: Validar: ningun monto > saldo de factura
    alt Validacion falla
        JS->>U: alert("mensaje")
    else OK
        loop Para cada factura aplicada
            JS->>INV: inv.paid += monto
            JS->>INV: inv.balance -= monto
            JS->>INV: collectionActions.push(...)
        end
        JS->>AUD: addAudit("Pago registrado", detalles)
        JS->>LS: saveData()
        JS->>UI: refreshAll()
    end
```

**Pasos detallados:**
1. Usuario selecciona cliente → se listan sus facturas pendientes
2. Ingresa monto total del pago
3. Distribuye el monto entre las facturas seleccionadas
4. Se valida autorización (solo Analista/Admin pueden pagar)
5. Se valida conciliación (suma distribuida = monto total)
6. Se valida que ningún monto exceda el saldo
7. Se aplica a cada factura (actualiza `paid` y `balance`)
8. Se registra pago y auditoría
9. `refreshAll()` recalcula estados (puede cambiar a "Pagada" o "Parcialmente pagada")

## Workflow 3: Gestión de Cartera y Recordatorios

**Actor:** Analista de cartera / Administrador
**Entrada:** Selección de facturas pendientes
**Salida:** Recordatorios enviados (simulados), registro en auditoría

```mermaid
sequenceDiagram
    participant U as Usuario
    participant UI as Vista Cuentas por Cobrar
    participant JS as sendBulkReminders()
    participant REM as sendReminderForInvoice()
    participant AUD as addAudit()
    participant LS as localStorage

    U->>UI: Filtra por estado / busca cliente
    UI->>JS: renderAccounts() [con filtros]
    JS-->>UI: Tabla con checkboxes
    U->>UI: Selecciona facturas + Click "Enviar recordatorio"
    UI->>JS: sendBulkReminders()
    loop Para cada factura seleccionada
        JS->>REM: sendReminderForInvoice(inv)
        REM->>REM: Crear objeto reminder
        REM->>REM: inv.collectionActions.push(...)
        REM->>AUD: addAudit("Recordatorio enviado", ...)
    end
    JS->>LS: saveData()
    JS->>UI: refreshAll()
```

**Nota:** El envío es simulado — no hay integración con servicios de email. Solo se registra la acción.

## Workflow 4: Nota Crédito

**Actor:** Administrador
**Entrada:** Factura cargada, motivo, monto, tipo (Parcial/Total)
**Salida:** Nota crédito registrada, balance reducido

```mermaid
flowchart TD
    A["Buscar factura por consecutivo"] --> B["Cargar detalle"]
    B --> C["Ingresar motivo + monto"]
    C --> D{"Tipo?"}
    D -->|"Parcial"| E["Usar monto ingresado"]
    D -->|"Total"| F["Monto = saldo completo"]
    E --> G["Validar: monto <= saldo"]
    F --> G
    G -->|"Falla"| H["alert: NC no puede superar saldo"]
    G -->|"OK"| I["Crear objeto creditNote"]
    I --> J["inv.balance -= monto"]
    J --> K["addAudit + saveData + refreshAll"]

    style A fill:#1b2a4e,color:#fff
    style D fill:#f9a826,color:#000
    style K fill:#4caf50,color:#fff
```

## Workflow 5: Anulación de Factura

**Actor:** Administrador
**Entrada:** Factura cargada, motivo de anulación
**Salida:** Estado = "Anulada" (terminal)

1. Cargar factura por consecutivo (`loadInvoiceDetail()`)
2. Click "Anular factura" → `annulInvoice()`
3. Prompt: ingresar motivo
4. Si no hay motivo → rechaza
5. `inv.status = "Anulada"` (estado terminal, no recalculable)
6. `inv.canceledReason = motivo`
7. Auditoría + persistencia

## Workflow 6: Dashboard Financiero

**Actor:** Cualquier rol
**Entrada:** Datos de todas las facturas y pagos
**Salida:** 8 KPIs, gráfico de barras, top deudores

**KPIs calculados:**
1. Facturación mensual (suma de totales de facturas emitidas)
2. Valor recaudado (suma de `paid` de todas las facturas)
3. Saldo pendiente (suma de `balance`)
4. Cartera vencida (suma de `balance` de facturas con estado "Vencida")
5. Facturas emitidas (count)
6. Pagadas / Parciales (count)
7. Promedio días de pago (`averageDaysToPay()`)
8. Próximos vencimientos en 7 días (`nextDueCount(7)`)

## Hallazgos Clave

- **6 workflows principales** cubren el ciclo completo de facturación
- **Todos son síncronos** — no hay operaciones asíncronas ni callbacks de red
- **Todos terminan en `refreshAll()`** — patrón de "re-render everything" después de cada mutación
- **Sin transacciones** — si falla algo a mitad (ej: browser crash durante `saveData()`), no hay rollback
- **Sin confirmación de operaciones destructivas** — Solo anulación pide `prompt()`, pero nota crédito no confirma

## Referencias

- [Lógica de negocio](business-logic.md)
- [Lógica de decisión](decision-logic.md)
- [Manejo de errores](error-handling.md)
- [Componentes](../architecture/components.md)
