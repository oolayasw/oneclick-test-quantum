# Backlog de Historias de Usuario — InvoiceManager

## Resumen

| Indicador | Valor |
|---|---|
| **Total HUs** | 42 |
| **Variante seleccionada** | Rebuild incremental (Strangler Fig) |
| **Épicas** | 7 |
| **Timeline estimado** | 11-14 semanas (1 developer senior) |
| **Distribución por tipo** | FN: 15, TK: 10, SC: 6, MG: 4, DT: 3, OB: 2, IN: 1, RS: 1 |

### Distribución por Épica

| # | Épica | HUs | Esfuerzo Total |
|---|---|---|---|
| 1 | Core Business (Facturación + Pagos) | 15 | XL |
| 2 | Integraciones y Persistencia | 4 | L |
| 3 | Seguridad | 6 | L |
| 4 | Datos y Persistencia | 3 | M |
| 5 | Infraestructura | 4 | M |
| 6 | Observabilidad | 2 | S |
| 7 | Deuda Técnica | 8 | L |

## User Story Map

```mermaid
flowchart TD
    subgraph E1["Epica 1: Core Business"]
        direction LR
        FN001["FN-001<br/>Crear Factura"]
        FN002["FN-002<br/>Emitir Factura"]
        FN003["FN-003<br/>Aplicar Pago"]
        FN004["FN-004<br/>Nota Credito"]
        FN005["FN-005<br/>Anular Factura"]
    end

    subgraph E7["Epica 7: Deuda Tecnica"]
        direction LR
        TK001["TK-001<br/>Char. Tests"]
        TK002["TK-002<br/>Extract Calculator"]
        TK003["TK-003<br/>State Machine"]
    end

    subgraph E3["Epica 3: Seguridad"]
        direction LR
        SC001["SC-001<br/>Autenticacion"]
        SC002["SC-002<br/>Sanitizar XSS"]
        SC003["SC-003<br/>RBAC"]
    end

    subgraph E5["Epica 5: Infraestructura"]
        direction LR
        MG001["MG-001<br/>Build System"]
        MG002["MG-002<br/>Backend API"]
        MG003["MG-003<br/>Container"]
    end

    E7 --> E1
    E7 --> E3
    E1 --> E5

    style E1 fill:#1b2a4e,color:#fff
    style E7 fill:#f9a826,color:#000
    style E3 fill:#d62828,color:#fff
    style E5 fill:#6c5ce7,color:#fff
```

## Olas → Sprints (Mapeo)

| Ola Migración | Sprint | HUs Incluidas | Prioridad |
|---|---|---|---|
| Ola 0: Foundation | Sprint 1 (2 sem) | TK-001 a TK-004, MG-001 | Crítica |
| Ola 1: Extract Logic | Sprint 2 (2 sem) | TK-005 a TK-010, FN-001 a FN-004 | Alta |
| Ola 2: Abstractions | Sprint 3 (2-3 sem) | DT-001 a DT-003, FN-005 a FN-010 | Alta |
| Ola 3: Security + UI | Sprint 4 (3-4 sem) | SC-001 a SC-006, FN-011 a FN-015, MG-002 | Alta |
| Ola 4: Cloud Ready | Sprint 5 (2-3 sem) | IN-001, MG-003, MG-004, OB-001, OB-002, RS-001 | Media |

## Dependencias entre HUs

```mermaid
flowchart LR
    TK001["TK-001<br/>Char. Tests"] --> TK005["TK-005<br/>Extract Calc"]
    TK001 --> TK006["TK-006<br/>Extract State"]
    MG001["MG-001<br/>Build System"] --> TK001
    TK005 --> TK007["TK-007<br/>Validators"]
    TK006 --> DT001["DT-001<br/>DataStore"]
    DT001 --> FN005["FN-005<br/>InvoiceService"]
    DT001 --> FN008["FN-008<br/>PaymentService"]
    SC001["SC-001<br/>Auth"] --> SC003["SC-003<br/>RBAC"]
    FN005 --> SC002["SC-002<br/>Sanitize"]
    DT001 --> IN001["IN-001<br/>Backend API"]
    IN001 --> MG003["MG-003<br/>Container"]

    style MG001 fill:#00b894,color:#fff
    style TK001 fill:#00b894,color:#fff
    style SC001 fill:#d62828,color:#fff
    style IN001 fill:#6c5ce7,color:#fff
```

## Criterios de Done Globales

Aplican a TODAS las HUs del backlog:

1. ✅ Código pasa linting (ESLint con reglas definidas en Ola 0)
2. ✅ Tests unitarios escritos ANTES de la implementación (TDD)
3. ✅ Cobertura de tests ≥ 80% para lógica de negocio
4. ✅ Sin `innerHTML` ni manipulación directa de DOM con datos de usuario
5. ✅ Sin variables globales (`var data`, `var sessionUser`)
6. ✅ Funciones ≤ 30 LOC (máximo)
7. ✅ Documentación en JSDoc para funciones públicas
8. ✅ Code review aprobado (o pair programming)
9. ✅ Sin `alert()` — usar sistema de notificaciones
10. ✅ Build pasa en CI (si pipeline existe)

## Estimación de Esfuerzo Total

| Épica | Story Points (Fibonacci) | Semanas |
|---|---|---|
| Core Business | 55 | 4-5 |
| Integraciones | 21 | 2 |
| Seguridad | 34 | 3 |
| Datos | 13 | 1-2 |
| Infraestructura | 21 | 2 |
| Observabilidad | 8 | 1 |
| Deuda Técnica | 34 | 2-3 |
| **TOTAL** | **186** | **11-14** |

[ESTIMADO: Timeline basado en 1 developer senior full-time, velocity 13-21 SP/sprint de 2 semanas]

## Referencias

- [Migration Component Order](../migration/component-order.md)
- [Modernization Assessment](../analysis/modernization-assessment.md)
- [Remediation Plan](../technical-debt/remediation-plan.md)
- [Business Logic](../behavior/business-logic.md)
- [Workflows](../behavior/workflows.md)
- [Security Patterns](../analysis/security-patterns.md)
- [Production Readiness](../analysis/production-readiness.md)
