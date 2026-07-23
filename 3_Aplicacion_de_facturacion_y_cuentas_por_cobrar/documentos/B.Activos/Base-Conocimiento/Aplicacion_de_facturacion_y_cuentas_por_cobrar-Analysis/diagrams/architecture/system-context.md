# Diagramas de Arquitectura — InvoiceManager

## Diagrama de Contexto del Sistema (C4 Level 1)

El sistema InvoiceManager opera como una isla aislada: no tiene integraciones con sistemas externos, APIs, ni bases de datos remotas. Su único contexto externo son las CDNs de librerías y el navegador del usuario.

```mermaid
flowchart TD
    subgraph Usuarios["Usuarios del Sistema"]
        FACT["Facturador<br/>(crea y emite facturas)"]
        ANAL["Analista de Cartera<br/>(aplica pagos, gestiona CxC)"]
        ADMIN["Administrador<br/>(acceso completo)"]
    end

    subgraph Sistema["InvoiceManager (SPA)"]
        APP["Aplicacion Web<br/>JavaScript ES5 + jQuery 1.12.4<br/>1,272 LOC / 3 archivos"]
    end

    subgraph Externo["Servicios Externos"]
        CDN["CDNs Publicas<br/>(Bootstrap, jQuery, Chart.js, jsPDF)"]
        BROWSER["Browser localStorage<br/>(persistencia ~5MB)"]
    end

    FACT -->|"Crea facturas,<br/>genera PDF"| APP
    ANAL -->|"Registra pagos,<br/>consulta cartera"| APP
    ADMIN -->|"Todas las<br/>operaciones"| APP

    APP -->|"Carga librerias<br/>(HTTPS, una vez)"| CDN
    APP -->|"Lee/escribe datos<br/>(JSON, sincrono)"| BROWSER

    style Sistema fill:#1b2a4e,color:#fff
    style Usuarios fill:#4ecdc4,color:#fff
    style Externo fill:#6c5ce7,color:#fff
```

Este diagrama muestra que InvoiceManager es un sistema completamente autónomo sin dependencias de backend. Los datos residen exclusivamente en el navegador del usuario (localStorage), y las CDNs solo proveen las librerías estáticas en la carga inicial.

## Diagrama de Contenedores (C4 Level 2)

Dado que la aplicación es un monolito cliente-side, el "contenedor" único es el navegador. Internamente se pueden identificar sub-contenedores lógicos:

```mermaid
flowchart TD
    subgraph Browser["Contenedor: Navegador Web"]
        direction TB
        subgraph UI["Sub-contenedor: Presentacion"]
            HTML["index.html<br/>339 LOC<br/>6 vistas + modal + nav"]
            STYLE["styles.css<br/>103 LOC<br/>complementa Bootstrap"]
        end

        subgraph ENGINE["Sub-contenedor: Motor de Negocio"]
            LOGIC["app.js — Logica<br/>46 funciones, 830 LOC"]
        end

        subgraph STORE["Sub-contenedor: Persistencia"]
            LS["localStorage<br/>key: invoiceManagerData<br/>JSON monolitico"]
        end

        UI --> ENGINE
        ENGINE --> STORE
    end

    subgraph CDN_EXT["CDNs (solo carga inicial)"]
        JQ["jQuery 1.12.4"]
        BS["Bootstrap 3.4.1"]
        CH["Chart.js 2.9.4"]
        PDF["jsPDF 1.5.3"]
    end

    CDN_EXT -->|"script/link tags"| Browser

    style Browser fill:#f8f9fa,color:#000
    style UI fill:#4ecdc4,color:#fff
    style ENGINE fill:#1b2a4e,color:#fff
    style STORE fill:#f9a826,color:#000
    style CDN_EXT fill:#6c5ce7,color:#fff
```

Este diagrama revela la naturaleza monolítica: un solo archivo (`app.js`) contiene TODA la lógica, y un solo key de localStorage contiene TODOS los datos. No hay separación física entre componentes.

## Diagrama de Despliegue

```mermaid
flowchart LR
    subgraph Local["Despliegue Local"]
        FS["File System<br/>index.html + app.js + styles.css"]
    end

    subgraph BW["Navegador del Usuario"]
        DOM["DOM + JavaScript Engine"]
        LSAPI["localStorage API (~5MB)"]
    end

    subgraph Internet["Internet (solo CDNs)"]
        MAXCDN["maxcdn.bootstrapcdn.com"]
        JQCDN["code.jquery.com"]
        CDNJS["cdnjs.cloudflare.com"]
    end

    FS -->|"file:// o http://"| DOM
    Internet -->|"HTTPS (primera carga)"| DOM
    DOM -->|"JSON.stringify/parse"| LSAPI

    style Local fill:#00b894,color:#fff
    style BW fill:#1b2a4e,color:#fff
    style Internet fill:#6c5ce7,color:#fff
```

**Observaciones del despliegue:**
- Sin servidores propios — cero costo de infraestructura
- Sin HTTPS propio — depende del contexto donde se sirva
- Sin versionamiento de archivos en producción
- Sin rollback strategy (no hay versiones anteriores accesibles)

## Hallazgos Clave

- La aplicación es un **island system** — cero integraciones externas
- Todo el sistema reside en **3 archivos servidos estáticamente**
- La persistencia es **exclusivamente local** (browser localStorage, ~5MB límite)
- Las CDNs son un **single point of failure**: sin internet, la app no carga
- No hay **separación de concerns** a nivel de despliegue — todo es un blob

## Referencias

- [Visión del Sistema](../../architecture/system-overview.md)
- [Componentes](../../architecture/components.md)
- [Dependencias](../../architecture/dependencies.md)
- [Production Readiness](../../analysis/production-readiness.md)
