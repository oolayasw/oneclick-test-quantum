# Componentes Obsoletos — InvoiceManager

## Inventario de Componentes EOL/Desactualizados

| Componente | Versión Actual | Última Estable | Desfase | Estado | Fecha EOL |
|---|---|---|---|---|---|
| jQuery | 1.12.4 | 3.7.1 | 8 major | **EOL** | 2016 |
| Bootstrap CSS/JS | 3.4.1 | 5.3.3 | 2 major | **EOL** | Feb 2019 |
| Chart.js | 2.9.4 | 4.4.x | 2 major | Mantenimiento solo | 2022 (v2 deprecated) |
| jsPDF | 1.5.3 (debug) | 2.5.x | 1 major | Desactualizado | 2020 (v1 sin soporte) |
| JavaScript (ES5) | ES5 (2009) | ES2024 | 15 años | Legacy | — |

## Timeline de Obsolescencia

```mermaid
gantt
    title Timeline de Publicacion y EOL
    dateFormat  YYYY
    section jQuery
    v1.12.4 publicada           :done, jq1, 2016, 2016
    jQuery 1.x EOL              :crit, jqeol, 2016, 2016
    jQuery 3.7 actual           :active, jq3, 2023, 2024
    section Bootstrap
    v3.4.1 publicada            :done, bs3, 2019, 2019
    Bootstrap 3.x EOL           :crit, bseol, 2019, 2019
    Bootstrap 5.3 actual        :active, bs5, 2023, 2024
    section Chart.js
    v2.9.4 publicada            :done, ch2, 2020, 2020
    Chart.js 2.x deprecated     :crit, cheol, 2022, 2022
    Chart.js 4.4 actual         :active, ch4, 2023, 2024
    section jsPDF
    v1.5.3 publicada            :done, jp1, 2019, 2019
    jsPDF 2.x actual            :active, jp2, 2021, 2024
    section JavaScript
    ES5 (este proyecto)         :done, es5, 2009, 2015
    ES2015+ (estandar)          :active, es6, 2015, 2024
```

## Riesgo por Componente

### jQuery 1.12.4 — RIESGO CRÍTICO

| Factor | Detalle |
|---|---|
| **Años sin soporte** | ~10 años (EOL 2016) |
| **CVEs conocidos** | XSS en versiones < 3.0 via `.html()` / `$.parseHTML()` — [PENDIENTE: verificar CVE-2020-11022, CVE-2020-11023] |
| **Surface area** | 100% del código JS (`app.js` completo) |
| **Alternativa** | Vanilla JS, Alpine.js, htmx |
| **Migración** | Breaking — requiere reescritura de selectores y event handling |

### Bootstrap 3.4.1 — RIESGO ALTO

| Factor | Detalle |
|---|---|
| **Años sin soporte** | ~7 años (EOL 2019) |
| **Cambios de API** | `panel` → `card`, grid rediseñado, jQuery removido |
| **Surface area** | 100% del HTML layout |
| **Alternativa** | Bootstrap 5.3, Tailwind CSS |
| **Migración** | Breaking — rewrite de clases HTML |

### ES5 JavaScript — RIESGO MEDIO

| Factor | Detalle |
|---|---|
| **Años de desfase** | 15 años (ES5 es de 2009) |
| **Features ausentes** | `let/const`, arrow functions, destructuring, modules, `async/await`, classes, template literals |
| **Impacto** | Código verbose, sin módulos, sin encapsulamiento moderno |
| **Migración** | Relativamente mecánica — tools como `lebab` pueden automatizar parte |

## Hallazgos Clave

- **4 de 5 dependencias están EOL o desactualizadas** — solo la "ausencia de framework" no está obsoleta
- **jQuery 1.12.4 es el componente más crítico** — 10 años sin soporte, CVEs activos, 100% coupling
- **El lenguaje mismo (ES5) es legacy** — 15 años detrás del estándar actual
- **Sin package manager** — imposible automatizar actualizaciones o detectar CVEs

## Referencias

- [Resumen de deuda técnica](summary.md)
- [Carga de mantenimiento](maintenance-burden.md)
- [Plan de remediación](remediation-plan.md)
- [Dependencias](../architecture/dependencies.md)
- [Assessment de seguridad](../analysis/dependency-security-assessment.md)
