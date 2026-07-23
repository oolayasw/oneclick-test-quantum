# Diagrama de Contexto del Sistema — StockControl

## Nivel 1: Contexto del Sistema (C4)

Este diagrama muestra StockControl y sus interacciones con actores externos y sistemas. Al ser un sistema completamente autocontenido, las interacciones externas son mínimas.

```mermaid
flowchart TD
    subgraph ACTORES["Actores"]
        ADM["Administrador<br/>(ADMIN)"]
        AUX["Auxiliar de Bodega<br/>(AUXILIAR)"]
        AUD["Auditor<br/>(AUDITOR)"]
        AINV["Admin Inventario<br/>(ADMIN_INV)"]
    end

    subgraph SISTEMA["StockControl"]
        APP["Aplicacion Web Flask<br/>Gestion de Inventarios y Bodegas<br/>Python 3.x + SQLite"]
    end

    subgraph EXTERNOS["Sistemas Externos"]
        CDN["CDN jsdelivr.net<br/>Bootstrap 5.3.0 + Icons"]
    end

    ADM -->|"HTTP GET/POST<br/>CRUD completo"| APP
    AUX -->|"HTTP GET/POST<br/>Movimientos"| APP
    AUD -->|"HTTP GET<br/>Consultas Kardex"| APP
    AINV -->|"HTTP GET/POST<br/>Productos + Reportes"| APP
    APP -->|"Fetch CSS/JS<br/>(client-side)"| CDN

    style ACTORES fill:#74b9ff,color:#2d3436
    style SISTEMA fill:#fdcb6e,color:#2d3436
    style EXTERNOS fill:#00b894,color:#fff
```

El diagrama muestra que StockControl es un sistema **island** sin integraciones server-side. La única dependencia externa es el CDN de Bootstrap, descargado por el browser del usuario (no por el servidor).

## Nivel 2: Contenedores (C4)

Al ser un monolito de archivo único, solo existen 2 "contenedores" reales:

```mermaid
flowchart TD
    subgraph BROWSER["Browser del Usuario"]
        HTML["HTML + Bootstrap 5<br/>Server-rendered"]
    end

    subgraph FLASK_APP["Contenedor: Flask Application"]
        direction TB
        WEB["Werkzeug Dev Server<br/>:5001"]
        ROUTES["19 Rutas Flask<br/>(app.py)"]
        BIZ["Logica de Negocio<br/>(inline)"]
        DAL["Acceso a Datos<br/>(sqlite3 directo)"]
    end

    subgraph DATA["Contenedor: Almacenamiento"]
        DB["SQLite<br/>stock.db<br/>(file-based)"]
    end

    HTML -->|"HTTP GET/POST"| WEB
    WEB --> ROUTES
    ROUTES --> BIZ
    BIZ --> DAL
    DAL -->|"sqlite3 protocol"| DB

    style BROWSER fill:#4ecdc4,color:#fff
    style FLASK_APP fill:#ffeaa7,color:#2d3436
    style DATA fill:#6c5ce7,color:#fff
```

Este diagrama refleja la realidad de que las "capas" son zonas lógicas dentro del mismo proceso, no contenedores separados. No hay boundaries reales entre ellas.

## Diagrama de Despliegue Actual (AS-IS)

```mermaid
flowchart LR
    subgraph HOST["Maquina Local (desarrollo)"]
        PROC["Proceso Python<br/>app.py<br/>PID unico"]
        FILE["stock.db<br/>Archivo SQLite<br/>mismo directorio"]
    end

    subgraph CLIENT["Browser"]
        BRW["Chrome/Firefox<br/>HTML renderizado"]
    end

    subgraph INET["Internet"]
        CDN2["jsdelivr.net<br/>Bootstrap CDN"]
    end

    BRW -->|"HTTP :5001"| PROC
    PROC -->|"filesystem I/O"| FILE
    BRW -->|"HTTPS CDN"| CDN2

    style HOST fill:#dfe6e9,color:#2d3436
    style CLIENT fill:#74b9ff,color:#fff
    style INET fill:#00b894,color:#fff
```

**Evidencia:**
- Host: `app.py:2221` — `app.run(host='0.0.0.0', port=5001, debug=True)`
- Database path: `app.py:41` — `DATABASE = os.path.join(os.path.dirname(__file__), 'stock.db')`
- CDN: `app.py:316-317` — URLs de jsdelivr.net en template base

## Hallazgos del Contexto

- **Sin balanceador**: tráfico directo al proceso Flask
- **Sin reverse proxy**: Werkzeug development server expuesto
- **Sin TLS**: solo HTTP, sin certificado
- **Sin DNS**: acceso por IP directa o localhost
- **Sin separación de ambientes**: un único deployment

## Referencias

- [Arquitectura del Sistema](../../architecture/system-overview.md)
- [Componentes](../../architecture/components.md)
- [Dependencias](../../architecture/dependencies.md)
- [Production Readiness](../../analysis/production-readiness.md)
