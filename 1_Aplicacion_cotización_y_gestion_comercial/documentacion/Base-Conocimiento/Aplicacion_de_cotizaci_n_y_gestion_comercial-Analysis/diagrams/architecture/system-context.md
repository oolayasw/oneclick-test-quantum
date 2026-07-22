# QuoteFlow — Diagramas de Arquitectura

## Diagrama de Contexto del Sistema (C4 Nivel 1)

```mermaid
flowchart TD
    subgraph USUARIOS["Actores del Sistema"]
        ASE["Asesor Comercial<br/>Crea cotizaciones y gestiona clientes"]
        SUP["Supervisor<br/>Aprueba/rechaza cotizaciones"]
        ADM["Administrador<br/>Gestion completa del sistema"]
    end

    subgraph QUOTEFLOW["QuoteFlow - Sistema de Cotizacion"]
        FE["Frontend SPA<br/>Angular 12<br/>Puerto 4200"]
        BE["Backend REST API<br/>Express 4.16<br/>Puerto 3000"]
        MEM["Estado en Memoria<br/>Arrays JavaScript"]
    end

    subgraph EXT["Servicios Externos"]
        CDN["CDN Publico<br/>Bootstrap 4.5 + jQuery 3.5 + Font Awesome 5"]
    end

    ASE -->|"HTTP Browser"| FE
    SUP -->|"HTTP Browser"| FE
    ADM -->|"HTTP Browser"| FE
    FE -->|"REST JSON /api/*"| BE
    BE -->|"Lectura/Escritura directa"| MEM
    FE -->|"CSS/JS via link tags"| CDN

    style QUOTEFLOW fill:#2d3436,color:#fff
    style USUARIOS fill:#00b894,color:#fff
    style EXT fill:#636e72,color:#fff
```

Este diagrama muestra que QuoteFlow es un sistema completamente aislado: no integra con bases de datos externas, ERPs, servicios de correo ni proveedores de identidad. Los únicos recursos externos son CDNs públicos para librerías CSS/JS del frontend.

## Diagrama de Contenedores (C4 Nivel 2)

```mermaid
flowchart TD
    subgraph BROWSER["Navegador del Usuario"]
        SPA["Angular 12 SPA<br/>TypeScript 4.3<br/>6 componentes + 1 servicio"]
    end

    subgraph SERVER["Servidor Local (localhost)"]
        PROXY["Angular CLI Dev Server<br/>Puerto 4200<br/>proxy.conf.json"]
        EXPRESS["Express 4.16<br/>Puerto 3000<br/>app.ts - God File"]
        DATA["Datos In-Memory<br/>Arrays: CLIENTES, PRODUCTOS,<br/>LISTAS_PRECIOS, COTIZACIONES,<br/>USUARIOS"]
    end

    subgraph CDN["CDN Externo"]
        BS["stackpath.bootstrapcdn.com<br/>Bootstrap 4.5.2"]
        JQ["code.jquery.com<br/>jQuery 3.5.1"]
        FA["cdnjs.cloudflare.com<br/>Font Awesome 5.15.4"]
    end

    SPA -->|"GET/POST/PUT/DELETE<br/>/api/* via proxy"| PROXY
    PROXY -->|"Forward to localhost:3000"| EXPRESS
    EXPRESS -->|"Array.push/find/filter"| DATA
    SPA -->|"link/script tags"| CDN

    style BROWSER fill:#4ecdc4,color:#000
    style SERVER fill:#ff6b6b,color:#fff
    style CDN fill:#95a5a6,color:#fff
```

El contenedor Express aloja toda la logica de negocio, datos y rutas en un unico archivo `app.ts`. El frontend Angular opera como SPA con un unico servicio (`AppService`) que centraliza todas las operaciones HTTP.

## Diagrama de Deployment

```mermaid
flowchart LR
    subgraph DEV["Entorno de Desarrollo (Unico)"]
        subgraph FE_NODE["Proceso Node.js #1"]
            NGSERVE["ng serve<br/>Angular CLI<br/>:4200"]
        end
        subgraph BE_NODE["Proceso Node.js #2"]
            TSNODE["ts-node + nodemon<br/>Express API<br/>:3000"]
        end
        NGSERVE -->|"proxy /api -> :3000"| TSNODE
    end

    subgraph EXT_CDN["Internet - CDN"]
        STACK["stackpath CDN"]
        CDNJS["cdnjs CDN"]
        JQCDN["jQuery CDN"]
    end

    NGSERVE -->|"HTTP GET CSS/JS"| EXT_CDN

    style DEV fill:#fdcb6e,color:#000
    style EXT_CDN fill:#636e72,color:#fff
```

**Evidencia:** No existe Dockerfile, `docker-compose.yml`, pipeline CI/CD, ni configuración de producción real. `environment.prod.ts` apunta a `localhost:3000` idéntico al entorno de desarrollo (`frontend/src/environments/environment.prod.ts`).

## Diagrama de Flujo de Datos

```mermaid
flowchart TD
    USER["Usuario"] -->|"Interaccion UI"| COMP["Angular Component"]
    COMP -->|"this.appService.metodo()"| SVC["AppService<br/>(God Service)"]
    SVC -->|"this.http.get/post/put/delete"| HTTP["HttpClient Angular"]
    HTTP -->|"HTTP Request"| PROXY["Dev Proxy :4200"]
    PROXY -->|"Forward"| ROUTE["Express Router<br/>app.ts handlers"]
    ROUTE -->|"Array operations"| MEM["Arrays In-Memory<br/>var CLIENTES, PRODUCTOS..."]
    MEM -->|"Return data"| ROUTE
    ROUTE -->|"res.json()"| HTTP
    HTTP -->|"Observable"| SVC
    SVC -->|"this.datos = response"| COMP
    COMP -->|"Template binding"| USER

    style USER fill:#00b894,color:#fff
    style MEM fill:#d63031,color:#fff
    style SVC fill:#e17055,color:#fff
```

Este flujo evidencia que los datos viajan sin transformacion de dominio: el JSON del backend se asigna directamente al estado del componente. No hay DTOs, mappers ni capa de dominio intermedia.

## Hallazgos Clave

- **Sistema completamente aislado** — sin integraciones externas ni base de datos
- **Deployment solo en desarrollo** — sin ambiente de produccion real
- **Datos efimeros** — estado in-memory se pierde al reiniciar cualquier proceso
- **Acoplamiento directo** — sin capas intermedias entre la UI y los datos en memoria
- **CDN como unica dependencia externa** — riesgo si el CDN no esta disponible

## Referencias

- [Arquitectura del Sistema](../../architecture/system-overview.md)
- [Componentes](../../architecture/components.md)
- [Dependencias](../../architecture/dependencies.md)
- [Diagramas de Secuencia](../behavioral/sequence-diagrams.md)
