# QuoteFlow — Diagramas Estructurales

## Diagrama de Componentes (C4 Nivel 3)

```mermaid
flowchart TD
    subgraph FE["Frontend - Angular 12 SPA"]
        subgraph MODULES["AppModule (unico modulo)"]
            ROUTING["AppRoutingModule<br/>6 rutas sin guards"]
        end

        subgraph COMPONENTS["Componentes"]
            APP_COMP["AppComponent<br/>Shell + Navbar"]
            LOGIN["LoginComponent<br/>~50 LOC"]
            DASH["DashboardComponent<br/>~80 LOC"]
            CLIENTS["ClientesComponent<br/>~170 LOC"]
            CATALOG["CatalogoComponent<br/>~155 LOC"]
            QUOTE["CotizacionComponent<br/>~295 LOC - God Component"]
            APPROV["AprobacionComponent<br/>~110 LOC"]
        end

        subgraph SERVICES["Servicios"]
            APP_SVC["AppService<br/>~240 LOC - God Service<br/>Auth + CRUD x5 + Calculos"]
        end

        LOGIN --> APP_SVC
        DASH --> APP_SVC
        CLIENTS --> APP_SVC
        CATALOG --> APP_SVC
        QUOTE --> APP_SVC
        APPROV --> APP_SVC
    end

    subgraph BE["Backend - Express (app.ts unico archivo)"]
        subgraph HANDLERS["HTTP Handlers"]
            H_AUTH["POST /auth/login, /auth/logout"]
            H_CLI["GET/POST/PUT/DELETE /clientes"]
            H_PROD["GET/POST/PUT /productos"]
            H_LIST["GET/POST /listas-precios"]
            H_COT["GET/POST /cotizaciones<br/>PUT /cotizaciones/:id/estado"]
            H_DASH["GET /dashboard"]
        end

        subgraph DATA["Estado In-Memory"]
            D_USR["var USUARIOS: any[]"]
            D_CLI["var CLIENTES: any[]"]
            D_PROD["var PRODUCTOS: any[]"]
            D_LIST["var LISTAS_PRECIOS: any[]"]
            D_COT["var COTIZACIONES: any[]"]
        end

        H_AUTH --> D_USR
        H_CLI --> D_CLI
        H_PROD --> D_PROD
        H_LIST --> D_LIST
        H_COT --> D_COT
        H_DASH --> D_CLI
        H_DASH --> D_COT
    end

    APP_SVC -->|"HTTP REST /api/*"| HANDLERS

    style FE fill:#4ecdc4,color:#000
    style BE fill:#ff6b6b,color:#fff
    style QUOTE fill:#e17055,color:#fff
    style APP_SVC fill:#e17055,color:#fff
```

Este diagrama revela el acoplamiento total: todos los componentes dependen de un unico servicio (`AppService`), y todos los handlers del backend acceden directamente a los arrays de datos sin abstraccion intermedia.

## Diagrama de Dependencias entre Componentes

```mermaid
flowchart TD
    subgraph HIGH_FAN_IN["Alto Fan-In (zona de dolor)"]
        SVC["AppService<br/>Fan-in: 6 componentes"]
    end

    subgraph CONSUMERS["Componentes (Fan-out: 1)"]
        C1["LoginComponent"]
        C2["DashboardComponent"]
        C3["ClientesComponent"]
        C4["CatalogoComponent"]
        C5["CotizacionComponent"]
        C6["AprobacionComponent"]
    end

    subgraph INFRA["Infraestructura"]
        HTTP["HttpClient"]
        LS["localStorage"]
        ROUTER["Router"]
    end

    C1 --> SVC
    C2 --> SVC
    C3 --> SVC
    C4 --> SVC
    C5 --> SVC
    C6 --> SVC

    SVC --> HTTP
    SVC --> LS
    C1 --> ROUTER
    C5 --> ROUTER

    style HIGH_FAN_IN fill:#d63031,color:#fff
    style CONSUMERS fill:#00b894,color:#fff
    style INFRA fill:#636e72,color:#fff
```

`AppService` tiene **fan-in = 6** (todos dependen de el) y **fan-out = 2** (HttpClient + localStorage). Esto lo ubica en la **zona de dolor** de las metricas de Robert C. Martin: alta inestabilidad (I=0.25) con abstracciones nulas (A=0), dando una distancia D=0.75 del main sequence.

## Diagrama de Capas (Layered Architecture - Ideal vs Real)

```mermaid
flowchart LR
    subgraph IDEAL["Arquitectura Ideal (N-Tier)"]
        direction TB
        I_PRES["Presentacion<br/>Componentes Angular"]
        I_APP["Aplicacion<br/>Servicios por dominio"]
        I_DOM["Dominio<br/>Entidades + Reglas"]
        I_DATA["Datos<br/>Repositorios + BD"]
        I_PRES --> I_APP --> I_DOM --> I_DATA
    end

    subgraph REAL["Arquitectura Real (QuoteFlow)"]
        direction TB
        R_PRES["6 Componentes<br/>+ logica inline"]
        R_SVC["1 God Service<br/>todo mezclado"]
        R_API["1 God File<br/>rutas + datos + logica"]
        R_PRES --> R_SVC --> R_API
    end

    style IDEAL fill:#00b894,color:#fff
    style REAL fill:#d63031,color:#fff
```

La comparacion muestra que QuoteFlow colapsa 4 capas arquitectonicas en solo 2 (frontend God Service + backend God File), eliminando las capas de dominio y datos como abstracciones independientes.

## Diagrama de Modulos del Proyecto

```mermaid
flowchart TD
    subgraph ROOT["Raiz del Proyecto"]
        PKG_ROOT["package.json (workspace?)"]
    end

    subgraph FE_MOD["frontend/"]
        FE_PKG["package.json<br/>17 dependencias"]
        FE_ANG["angular.json"]
        FE_TS["tsconfig.json<br/>TypeScript 4.3"]
        FE_PROXY["proxy.conf.json"]
        FE_SRC["src/<br/>15 archivos TS"]
    end

    subgraph BE_MOD["backend/"]
        BE_PKG["package.json<br/>5 dependencias"]
        BE_TS["tsconfig.json<br/>TypeScript 3.9"]
        BE_SRC["src/app.ts<br/>700 LOC - TODO"]
    end

    ROOT --> FE_MOD
    ROOT --> BE_MOD
    FE_MOD -.->|"proxy /api"| BE_MOD

    style ROOT fill:#636e72,color:#fff
    style FE_MOD fill:#4ecdc4,color:#000
    style BE_MOD fill:#ff6b6b,color:#fff
```

## Metricas Estructurales

| Metrica | Frontend | Backend | Total |
|---|---|---|---|
| Archivos .ts | 15 | 1 | 16 |
| LOC TypeScript | ~808 | ~700 | ~1,508 |
| Componentes | 7 | 0 | 7 |
| Servicios | 1 | 0 | 1 |
| Interfaces | 0 | 0 | 0 |
| Modulos Angular | 2 | N/A | 2 |
| Endpoints REST | N/A | 12 | 12 |
| Entidades de datos | N/A | 5 arrays | 5 |

## Hallazgos Clave

- **Fan-in critico** en `AppService` — cualquier cambio en el servicio impacta los 6 componentes
- **0 interfaces** — no hay abstraccion ni contrato formal entre capas
- **God File y God Service** son los 2 puntos de mayor riesgo estructural
- **Backend monofichero** impide cualquier practica de desarrollo en equipo
- **Sin lazy loading** — el modulo Angular carga todo en AppModule (7 componentes + 1 servicio)

## Referencias

- [Componentes](../../architecture/components.md)
- [Dependencias](../../architecture/dependencies.md)
- [Analisis de Complejidad](../../analysis/complexity-analysis.md)
- [Diagrama de Arquitectura](../architecture/system-context.md)
