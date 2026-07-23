# Diagramas Estructurales — InvoiceManager

## Diagrama de Componentes (C4 Level 3)

Dado que toda la lógica reside en un solo archivo (`app.js`), los "componentes" son agrupaciones funcionales implícitas detectadas por análisis del código.

```mermaid
flowchart TD
    subgraph PRES["Capa Presentacion (index.html)"]
        NAV["Navegacion<br/>nav-pills, 6 tabs"]
        V1["Vista Dashboard<br/>KPIs + Chart"]
        V2["Vista Facturacion<br/>Form + tabla"]
        V3["Vista Pagos<br/>Form + historial"]
        V4["Vista CxC<br/>Tabla aging"]
        V5["Vista Notas Credito<br/>Modal + tabla"]
        V6["Vista Auditoria<br/>Log de eventos"]
    end

    subgraph LOGIC["Capa Logica (app.js — 830 LOC)"]
        subgraph CORE["Core de Negocio"]
            INVOICE["Facturacion<br/>saveInvoice, previewInvoice<br/>downloadPDF, sendInvoice<br/>~180 LOC"]
            PAYMENT["Pagos<br/>applyPayment<br/>renderPaymentsHistory<br/>~90 LOC"]
            CXC["Cuentas por Cobrar<br/>renderAccounts<br/>sendReminder, calcAging<br/>~80 LOC"]
            CREDIT["Notas Credito<br/>createCreditNote<br/>renderCreditNotes<br/>~90 LOC"]
        end

        subgraph SUPPORT["Soporte"]
            DASH["Dashboard<br/>renderDashboard<br/>drawFinanceChart<br/>~70 LOC"]
            AUDIT["Auditoria<br/>addAudit, refreshAudit<br/>~25 LOC"]
        end

        subgraph INFRA["Infraestructura"]
            CALC["Motor Calculos<br/>calcItem, calcTotals<br/>~20 LOC"]
            UTIL["Utilidades<br/>money, round2, clientName<br/>formatDate, daysDiff<br/>~40 LOC"]
            PERSIST["Persistencia<br/>loadData, saveData<br/>hydrateStaticData<br/>~30 LOC"]
            STATE["State Machine<br/>recalcInvoiceState<br/>updateStatusByBalance<br/>~50 LOC"]
            BIND["Event Binding<br/>bindUI<br/>~55 LOC"]
        end
    end

    subgraph DATA["Capa Datos (localStorage)"]
        LS["invoiceManagerData<br/>JSON con 5 entidades:<br/>invoices, payments, clients,<br/>numeration, audit"]
    end

    V2 --> INVOICE
    V3 --> PAYMENT
    V4 --> CXC
    V5 --> CREDIT
    V1 --> DASH
    V6 --> AUDIT

    INVOICE --> CALC
    PAYMENT --> CALC
    CREDIT --> CALC
    INVOICE --> PERSIST
    PAYMENT --> PERSIST
    CXC --> PERSIST
    CREDIT --> PERSIST
    INVOICE --> AUDIT
    PAYMENT --> AUDIT
    CREDIT --> AUDIT
    INVOICE --> STATE
    PAYMENT --> STATE
    CREDIT --> STATE
    DASH --> PERSIST

    PERSIST --> LS

    style PRES fill:#4ecdc4,color:#fff
    style LOGIC fill:#f8f9fa,color:#000
    style CORE fill:#1b2a4e,color:#fff
    style SUPPORT fill:#4caf50,color:#fff
    style INFRA fill:#f9a826,color:#000
    style DATA fill:#6c5ce7,color:#fff
```

## Grafo de Dependencias entre Componentes Funcionales

```mermaid
flowchart LR
    subgraph GLOBALS["Variables Globales (4)"]
        G_DATA["var data"]
        G_ITEMS["var currentItems"]
        G_SEL["var selectedInvoiceId"]
        G_USER["var sessionUser"]
    end

    subgraph FUNCS["Funciones con Mayor Fan-Out"]
        SAVE["saveInvoice()<br/>fan-out: 8"]
        APPLY["applyPayment()<br/>fan-out: 7"]
        REFRESH["refreshAll()<br/>fan-out: 9"]
        CREDIT_F["createCreditNote()<br/>fan-out: 6"]
    end

    SAVE --> G_DATA
    SAVE --> G_ITEMS
    APPLY --> G_DATA
    APPLY --> G_USER
    CREDIT_F --> G_DATA
    CREDIT_F --> G_SEL
    REFRESH --> G_DATA

    style GLOBALS fill:#d62828,color:#fff
    style FUNCS fill:#1b2a4e,color:#fff
```

Este diagrama muestra el problema central: **4 variables globales** son el nexo de acoplamiento entre TODAS las funciones del sistema. Cualquier cambio en la estructura de `data` afecta potencialmente a las 46 funciones.

## Estructura del Modelo de Datos (localStorage Schema)

```mermaid
erDiagram
    DATA {
        array invoices
        array payments
        array clients
        array audit
        object numeration
    }
    INVOICE {
        string id PK
        string num
        string client
        string status
        date date
        date dueDate
        array items
        number subtotal
        number taxTotal
        number withholding
        number total
        number paid
        number balance
        array creditNotes
        string paymentCondition
        string notes
    }
    PAYMENT {
        string id PK
        string client
        number amount
        string method
        date date
        string reference
        array distribution
    }
    CLIENT {
        string nit PK
        string name
        string address
        string email
        string phone
    }
    AUDIT_ENTRY {
        date date
        string action
        string detail
        string user
    }
    NUMERATION {
        string prefix
        number next
    }

    DATA ||--o{ INVOICE : "contiene"
    DATA ||--o{ PAYMENT : "contiene"
    DATA ||--o{ CLIENT : "contiene"
    DATA ||--o{ AUDIT_ENTRY : "contiene"
    DATA ||--|| NUMERATION : "contiene"
    INVOICE ||--o{ INVOICE : "creditNotes (embedded)"
    PAYMENT ||--o{ PAYMENT : "distribution (embedded)"
```

## Métricas de Acoplamiento

| Componente | Fan-In | Fan-Out | Instability (I) | Clasificación |
|---|---|---|---|---|
| `saveInvoice()` | 1 (UI) | 8 | 0.89 | Altamente inestable |
| `applyPayment()` | 1 (UI) | 7 | 0.88 | Altamente inestable |
| `refreshAll()` | 12 (callers) | 9 | 0.43 | Balance medio |
| `saveData()` | 8 (callers) | 1 (localStorage) | 0.11 | Estable |
| `calcTotals()` | 4 (callers) | 0 (puro) | 0.00 | Máxima estabilidad |
| `money()` / `round2()` | 6 (callers) | 0 (puro) | 0.00 | Máxima estabilidad |

**Observación:** Las funciones más estables (I=0) son las puras (utilidades, cálculos). Las más inestables son las orquestadoras de negocio que dependen de todo (globales, DOM, localStorage).

## Hallazgos Clave

- **Zero abstraction:** No hay interfaces, clases ni módulos — solo funciones globales
- **Acoplamiento por globales:** 4 variables compartidas crean dependencias invisibles
- **Fan-out crítico:** `saveInvoice()` y `applyPayment()` dependen de 7-8 funciones cada una
- **Funciones puras aisladas:** `calcItem`, `calcTotals`, `money`, `round2` — candidatas ideales para extraer primero
- **Sin inversión de dependencias:** Las funciones de negocio llaman directamente a localStorage y DOM

## Referencias

- [Componentes](../../architecture/components.md)
- [Dependencias](../../architecture/dependencies.md)
- [Patrones](../../architecture/patterns.md)
- [Complexity Analysis](../../analysis/complexity-analysis.md)
