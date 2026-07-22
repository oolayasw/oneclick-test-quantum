# QuoteFlow — Story Map Diagram

## Mapa Visual de Historias de Usuario

```mermaid
flowchart TB
    subgraph EPIC1["Epica 1: Core Business - Cotizaciones"]
        direction LR
        FN004["FN-004<br/>Crear Cotizacion"]
        FN005["FN-005<br/>Motor Calculo"]
        FN006["FN-006<br/>State Machine"]
        FN007["FN-007<br/>Aprobacion"]
        FN008["FN-008<br/>Dashboard KPIs"]
        FN009["FN-009<br/>Paginacion"]
        FN010["FN-010<br/>Enviar Cliente"]
        FN011["FN-011<br/>Vencimiento"]
    end

    subgraph EPIC2["Epica 2: Gestion Comercial"]
        direction LR
        FN001["FN-001<br/>CRUD Clientes"]
        FN002["FN-002<br/>CRUD Productos"]
        FN003["FN-003<br/>Listas Precios"]
        FN012["FN-012<br/>Busqueda"]
        FN013["FN-013<br/>Historial Cliente"]
    end

    subgraph EPIC3["Epica 3: Seguridad"]
        direction LR
        SC001["SC-001<br/>JWT Auth"]
        SC002["SC-002<br/>Hash Passwords"]
        SC003["SC-003<br/>RBAC"]
        SC004["SC-004<br/>Input Validation"]
        SC005["SC-005<br/>CORS Config"]
        SC006["SC-006<br/>Rate Limiting"]
    end

    subgraph EPIC4["Epica 4: Datos"]
        direction LR
        DT001["DT-001<br/>Schema PostgreSQL"]
        DT002["DT-002<br/>Migrations"]
        DT003["DT-003<br/>Seeds"]
        DT004["DT-004<br/>Soft Delete"]
    end

    subgraph EPIC5["Epica 5: Infraestructura"]
        direction LR
        MG001["MG-001<br/>Setup Proyecto"]
        MG002["MG-002<br/>Monorepo Config"]
        TK001["TK-001<br/>CI/CD"]
        TK006["TK-006<br/>Docker"]
    end

    subgraph EPIC6["Epica 6: Observabilidad"]
        direction LR
        OB001["OB-001<br/>Health Checks"]
        OB002["OB-002<br/>Structured Logging"]
        OB003["OB-003<br/>API Docs"]
        OB004["OB-004<br/>Error Tracking"]
    end

    subgraph EPIC7["Epica 7: Deuda Tecnica"]
        direction LR
        TK002["TK-002<br/>Tipos Estrictos"]
        TK003["TK-003<br/>Unit Tests"]
        TK004["TK-004<br/>Integration Tests"]
        TK005["TK-005<br/>E2E Tests"]
        TK007["TK-007<br/>Linting"]
        TK008["TK-008<br/>Code Review"]
        RS001["RS-001<br/>Error Handling"]
        RS002["RS-002<br/>Validation Pipe"]
    end

    style EPIC1 fill:#00b894,color:#fff
    style EPIC2 fill:#0984e3,color:#fff
    style EPIC3 fill:#d63031,color:#fff
    style EPIC4 fill:#6c5ce7,color:#fff
    style EPIC5 fill:#636e72,color:#fff
    style EPIC6 fill:#fdcb6e,color:#000
    style EPIC7 fill:#e17055,color:#fff
```

## Priorización por Ola

| Ola | Épicas cubiertas | HUs | Duración |
|---|---|---|---|
| Ola 0 — Foundation | 3, 4, 5 | MG-001, DT-001, SC-001, SC-002, TK-001 | 8 días |
| Ola 1 — Core Business | 1, 2 | FN-001 a FN-005, FN-012, FN-013 | 12 días |
| Ola 2 — Flujos | 1, 3 | FN-006 a FN-011, SC-003, SC-004, FN-009 | 8 días |
| Ola 3 — Calidad | 5, 6, 7 | TK-005, TK-006, OB-001 a OB-004, RS-001, RS-002 | 8 días |

## Referencias

- [Backlog](backlog.md)
- [Migration Component Order](../migration/component-order.md)
