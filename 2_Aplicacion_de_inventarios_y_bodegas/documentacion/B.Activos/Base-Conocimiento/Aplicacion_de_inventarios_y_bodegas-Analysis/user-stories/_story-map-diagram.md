# User Story Map — StockControl

## Diagrama Visual del Mapa de Historias

```mermaid
flowchart TB
    subgraph EPICAS["Epicas"]
        E1["E1: Core Business<br/>7 HUs"]
        E2["E2: Integraciones<br/>0 HUs (N/A)"]
        E3["E3: Seguridad<br/>5 HUs"]
        E4["E4: Datos<br/>3 HUs"]
        E5["E5: Infraestructura<br/>4 HUs"]
        E6["E6: Observabilidad<br/>3 HUs"]
        E7["E7: Deuda Tecnica<br/>10 HUs"]
    end

    subgraph OLA0["Ola 0 - Seguridad (2 dias)"]
        O0A["SC-001 Fix SQL Injection"]
        O0B["SC-002 Reemplazar MD5"]
        O0C["SC-003 Externalizar Secrets"]
        O0D["SC-005 Agregar CSRF"]
        O0E["TK-008 Characterization Tests"]
    end

    subgraph OLA1["Ola 1 - Separacion (2 semanas)"]
        O1A["TK-001 Extraer Templates"]
        O1B["TK-002 Crear Modelos ORM"]
        O1C["TK-003 Crear Repositories"]
        O1D["TK-004 Extraer Blueprints"]
        O1E["TK-005 Unificar Movimientos"]
        O1F["MG-001 Actualizar Flask 3.x"]
    end

    subgraph OLA2["Ola 2 - Modernizacion (2 semanas)"]
        O2A["SC-004 Implementar RBAC"]
        O2B["TK-006 Validacion Input"]
        O2C["TK-007 Paginacion"]
        O2D["MG-002 Migrar PostgreSQL"]
        O2E["MG-003 SQLAlchemy Migrations"]
        O2F["FN-001..007 Refactor Funcional"]
    end

    subgraph OLA3["Ola 3 - Produccion (1 semana)"]
        O3A["MG-004 Containerizar"]
        O3B["OB-001 Logging Estructurado"]
        O3C["OB-002 Health Checks"]
        O3D["OB-003 CI/CD Pipeline"]
        O3E["RS-001 Connection Pool"]
        O3F["RS-002 Rate Limiting"]
        O3G["DT-001..003 Funcionalidad Pendiente"]
    end

    E3 --- OLA0
    E7 --- OLA1
    E1 --- OLA2
    E5 --- OLA3

    OLA0 --> OLA1
    OLA1 --> OLA2
    OLA2 --> OLA3

    style EPICAS fill:#dfe6e9,color:#2d3436
    style OLA0 fill:#d63031,color:#fff
    style OLA1 fill:#e17055,color:#fff
    style OLA2 fill:#fdcb6e,color:#2d3436
    style OLA3 fill:#00b894,color:#fff
```

## Matriz de Priorización (MoSCoW)

| Must Have (Ola 0-1) | Should Have (Ola 2) | Could Have (Ola 3) | Won't Have (fuera scope) |
|---|---|---|---|
| SC-001 Fix SQLi | SC-004 RBAC | OB-003 CI/CD | Integración con ERP |
| SC-002 Fix MD5 | TK-006 Validación | RS-002 Rate Limit | Multi-tenancy |
| SC-003 Secrets | TK-007 Paginación | DT-001 Reservas | App mobile |
| TK-008 Char Tests | MG-002 PostgreSQL | DT-002 Lotes | Notificaciones push |
| TK-001 Templates | FN-001..007 Refactor | DT-003 Promedio ponderado | BI/Analytics |
| TK-002 ORM | MG-003 Migrations | | |
| TK-003 Repos | | | |
| TK-004 Blueprints | | | |
| TK-005 Unificar | | | |

## Referencias

- [backlog.md](backlog.md)
- [epics/01-core-business.md](epics/01-core-business.md)
- [epics/03-security.md](epics/03-security.md)
- [epics/07-tech-debt.md](epics/07-tech-debt.md)
