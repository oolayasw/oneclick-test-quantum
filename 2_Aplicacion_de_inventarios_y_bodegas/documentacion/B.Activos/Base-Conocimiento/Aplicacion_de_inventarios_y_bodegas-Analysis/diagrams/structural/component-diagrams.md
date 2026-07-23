# Diagramas Estructurales — StockControl

## Diagrama de Componentes (Nivel 3 C4)

Dado que StockControl es un God Module, este diagrama muestra las **zonas lógicas** dentro del archivo único `app.py` y sus relaciones de dependencia interna.

```mermaid
flowchart TD
    subgraph CONFIG["Configuracion (L38-50)"]
        C_APP["Flask App"]
        C_SECRET["Secret Key"]
        C_DB_PATH["DATABASE path"]
        C_DEBUG["DEBUG flag"]
    end

    subgraph INIT["Inicializacion (L62-222)"]
        I_DDL["DDL: 7 tablas"]
        I_SEED["Seed: usuarios + categorias"]
        I_CONN["Conexion SQLite"]
    end

    subgraph HELPERS["Helpers (L224-310)"]
        H_DB["db() - conexion global"]
        H_MD5["md5pw() - hash passwords"]
        H_NOW["now() - timestamp"]
        H_STOCK["get_stock() / actualizar_stock()"]
        H_AUTH["auth() - decorator"]
    end

    subgraph PRESENTATION["Presentacion (L311-440)"]
        P_TMPL["TMPL_BASE - layout HTML"]
        P_RENDER["render() - template engine"]
        P_OPTS["opts_prods() / opts_bodegas()"]
    end

    subgraph ROUTES["Rutas de Negocio (L442-2214)"]
        R_AUTH["Login / Logout"]
        R_DASH["Dashboard"]
        R_PROD["Productos CRUD"]
        R_BOD["Bodegas CRUD"]
        R_MOV["4x Movimientos"]
        R_API["API Stock"]
        R_HIST["Historial"]
        R_KARD["Kardex"]
    end

    CONFIG --> INIT
    INIT --> HELPERS
    HELPERS --> ROUTES
    PRESENTATION --> ROUTES
    H_DB --> R_DASH
    H_DB --> R_PROD
    H_DB --> R_BOD
    H_DB --> R_MOV
    H_DB --> R_API
    H_DB --> R_HIST
    H_DB --> R_KARD
    H_AUTH --> R_DASH
    H_AUTH --> R_PROD
    H_AUTH --> R_BOD
    H_AUTH --> R_MOV
    H_AUTH --> R_HIST
    H_AUTH --> R_KARD
    H_STOCK --> R_MOV

    style CONFIG fill:#fab1a0,color:#2d3436
    style INIT fill:#ffeaa7,color:#2d3436
    style HELPERS fill:#81ecec,color:#2d3436
    style PRESENTATION fill:#a29bfe,color:#fff
    style ROUTES fill:#dfe6e9,color:#2d3436
```

El diagrama revela el patrón **estrella** de acoplamiento: `db()` y `auth()` son nodos centrales con fan-out a todas las rutas.

## Diagrama de Modelo de Datos (ER)

```mermaid
erDiagram
    USUARIOS {
        int id PK
        string username UK
        string password_hash
        string nombre
        string rol
        int activo
    }

    CATEGORIAS {
        int id PK
        string nombre UK
        string descripcion
        int activo
    }

    PRODUCTOS {
        int id PK
        string codigo UK
        string nombre
        int categoria_id FK
        float precio
        int stock_minimo
        int activo
    }

    BODEGAS {
        int id PK
        string codigo UK
        string nombre
        string ubicacion
        int activo
    }

    MOVIMIENTOS {
        int id PK
        string tipo
        int bodega_origen_id FK
        int bodega_destino_id FK
        int usuario_id FK
        string fecha
        string observaciones
    }

    DETALLE_MOVIMIENTOS {
        int id PK
        int movimiento_id FK
        int producto_id FK
        float cantidad
        float costo_unitario
        float stock_antes
        float stock_despues
        string lote
    }

    EXISTENCIAS {
        int id PK
        int producto_id FK
        int bodega_id FK
        float stock_fisico
        float costo_promedio
    }

    CATEGORIAS ||--o{ PRODUCTOS : "contiene"
    PRODUCTOS ||--o{ DETALLE_MOVIMIENTOS : "referenciado en"
    PRODUCTOS ||--o{ EXISTENCIAS : "tiene stock en"
    BODEGAS ||--o{ EXISTENCIAS : "almacena"
    BODEGAS ||--o{ MOVIMIENTOS : "origen"
    BODEGAS ||--o{ MOVIMIENTOS : "destino"
    USUARIOS ||--o{ MOVIMIENTOS : "registra"
    MOVIMIENTOS ||--o{ DETALLE_MOVIMIENTOS : "contiene"
```

**Evidencia:** DDL en `app.py:82-160` (función `iniciar()`)

## Diagrama de Bounded Contexts

```mermaid
flowchart TB
    subgraph BC_CATALOGO["BC: Catalogo de Productos"]
        direction TB
        T_PROD["Productos"]
        T_CAT["Categorias"]
        T_PROD --- T_CAT
    end

    subgraph BC_ALMACENAMIENTO["BC: Almacenamiento"]
        direction TB
        T_BOD["Bodegas"]
        T_EXIST["Existencias"]
        T_BOD --- T_EXIST
    end

    subgraph BC_MOVIMIENTOS["BC: Movimientos de Inventario"]
        direction TB
        T_MOV["Movimientos"]
        T_DET["Detalle Movimientos"]
        T_MOV --- T_DET
    end

    subgraph BC_IDENTIDAD["BC: Identidad y Acceso"]
        direction TB
        T_USR["Usuarios"]
        T_SESS["Sesiones (cookie)"]
        T_USR --- T_SESS
    end

    BC_CATALOGO -->|"producto_id"| BC_MOVIMIENTOS
    BC_ALMACENAMIENTO -->|"bodega_id"| BC_MOVIMIENTOS
    BC_IDENTIDAD -->|"usuario_id"| BC_MOVIMIENTOS
    BC_CATALOGO -->|"producto_id"| BC_ALMACENAMIENTO

    style BC_CATALOGO fill:#74b9ff,color:#2d3436
    style BC_ALMACENAMIENTO fill:#a29bfe,color:#fff
    style BC_MOVIMIENTOS fill:#fd79a8,color:#fff
    style BC_IDENTIDAD fill:#00b894,color:#fff
```

Los 4 bounded contexts son candidatos naturales a microservicios o módulos independientes en una modernización.

## Diagrama de Dependencias de Seguridad

```mermaid
flowchart TD
    subgraph VULNERABLES["Puntos Vulnerables"]
        SQL["SQL Injection<br/>7+ puntos"]
        MD5["MD5 Hashing<br/>passwords"]
        SEC["Secret Key<br/>hardcoded"]
        DBG["Debug Mode<br/>permanente"]
    end

    subgraph VECTORES["Vectores de Ataque"]
        LOGIN["POST /login<br/>username field"]
        FILTROS["GET /productos<br/>search params"]
        KARDEX["GET /kardex<br/>filtros"]
    end

    subgraph IMPACTO["Impacto"]
        DATA["Data Breach<br/>lectura BD completa"]
        FORGE["Session Forgery<br/>impersonacion"]
        RCE["RCE via Debugger<br/>ejecucion remota"]
    end

    LOGIN --> SQL
    FILTROS --> SQL
    KARDEX --> SQL
    SQL --> DATA
    SEC --> FORGE
    DBG --> RCE
    MD5 --> DATA

    style VULNERABLES fill:#d63031,color:#fff
    style VECTORES fill:#e17055,color:#fff
    style IMPACTO fill:#2d3436,color:#fff
```

## Hallazgos Clave Estructurales

1. **Estructura plana**: 0 módulos, 0 packages, 0 clases — todo en funciones a nivel de módulo
2. **Fan-in extremo**: `db()` es consumido por 100% de las rutas (19 de 19)
3. **Sin boundaries**: No hay ningún mecanismo de encapsulamiento entre bounded contexts
4. **Modelo de datos normalizado**: 7 tablas bien relacionadas — la BD es la parte más "sana" del sistema
5. **4 bounded contexts naturales**: La separación para modernización ya está implícita en el modelo de datos

## Referencias

- [Componentes](../../architecture/components.md)
- [Patrones](../../architecture/patterns.md)
- [Schema Analysis](../../database/schema-analysis.md)
- [Dependency Analysis](../../analysis/dependency-analysis.md)
