# Orden de Migración por Componentes — InvoiceManager

## Estrategia de Migración Recomendada

Dado el tamaño compacto (1,272 LOC) pero la alta deuda técnica, la estrategia recomendada es **Rebuild incremental** (Strangler Fig simplificado): construir la nueva versión módulo por módulo, reemplazando funcionalidad del monolito original hasta que el archivo `app.js` quede vacío.

## Olas de Migración

```mermaid
gantt
    title Plan de Migracion InvoiceManager
    dateFormat  YYYY-MM-DD
    axisFormat  %d/%m

    section Ola 0 - Foundation
    Setup proyecto moderno (Vite + tests)       :o0a, 2026-08-01, 3d
    Characterization tests (golden masters)      :o0b, after o0a, 5d
    Error handling basico (try-catch)            :o0c, after o0a, 1d

    section Ola 1 - Extract Pure Logic
    Extraer calculadora (calcItem, calcTotals)  :o1a, after o0b, 2d
    Extraer state machine                       :o1b, after o1a, 2d
    Extraer utilidades (money, format, dates)   :o1c, after o1a, 1d
    Extraer validadores                         :o1d, after o1b, 3d

    section Ola 2 - Abstractions
    Crear DataStore interface + adapter         :o2a, after o1d, 3d
    Crear InvoiceService                        :o2b, after o2a, 4d
    Crear PaymentService                        :o2c, after o2b, 3d
    Eliminar var data global                    :o2d, after o2c, 2d

    section Ola 3 - Security + UI
    Sanitizar innerHTML (22 puntos)             :o3a, after o2d, 5d
    Migrar jQuery a vanilla JS                  :o3b, after o3a, 10d
    Migrar Bootstrap 3 a 5                      :o3c, after o3b, 10d
    Agregar autenticacion basica                :o3d, after o2d, 5d

    section Ola 4 - Cloud Ready
    Backend API (Node/Express o Serverless)     :o4a, after o3d, 10d
    Migrar localStorage a BD                    :o4b, after o4a, 5d
    Containerizar (Dockerfile)                  :o4c, after o4b, 3d
    CI/CD pipeline                              :o4d, after o4c, 3d
```

## Detalle por Ola

### Ola 0: Foundation (Semana 1-2)

**Objetivo:** Establecer la infraestructura para refactoring seguro.

| Componente | Acción | Prerequisito | Riesgo | Esfuerzo |
|---|---|---|---|---|
| Build System | `npm init` + Vite + Vitest | Ninguno | Bajo | 3h |
| Characterization Tests | Tests de `calcItem`, `calcTotals`, `recalcInvoiceState` como golden masters | Build system | Bajo | 1 semana |
| Error Recovery | `try/catch` en `loadData()` + fallback a datos vacíos | Ninguno | Bajo | 1h |
| CDN Security | Agregar `integrity` (SRI) a todos los `<script>` | Ninguno | Bajo | 1h |

**Criterio de Done:** Tests pasan con 100% de los escenarios actuales documentados. JSON corrupto no crashea la app.

### Ola 1: Extract Pure Logic (Semana 3-4)

**Objetivo:** Separar lógica pura (testeable sin DOM) del monolito.

| Componente | Destino | LOC | Legacy Level | Técnica Feathers |
|---|---|---|---|---|
| `calcItem()`, `calcTotals()` | `src/domain/calculator.js` | ~20 | A — Testable | Move Function to Module |
| `recalcInvoiceState()` | `src/domain/invoice-state.js` | ~40 | B — Seam-Rich | Extract Class |
| `money()`, `round2()`, `formatDate()`, `daysDiff()` | `src/utils/format.js` | ~30 | A — Testable | Move Function to Module |
| 22 validaciones dispersas | `src/domain/validators.js` | ~50 | B — Seam-Rich | Consolidate Conditional |

**Criterio de Done:** `app.js` reduce ~140 LOC. Tests de Ola 0 siguen pasando. Nuevos tests unitarios para módulos extraídos.

### Ola 2: Introduce Abstractions (Semana 5-7)

**Objetivo:** Inversión de dependencias — eliminar acoplamiento a globales.

| Componente | Patrón Target | Acoplamiento Actual | Técnica |
|---|---|---|---|
| `DataStore` interface | Repository Pattern | `var data` accedido 14+ veces | Extract Interface |
| `LocalStorageAdapter` | Adapter | `JSON.parse(localStorage...)` directo | Wrap with Adapter |
| `InvoiceService` | Service Layer | `saveInvoice()` con 8 dependencias | Extract Class |
| `PaymentService` | Service Layer | `applyPayment()` con 7 dependencias | Extract Class |
| Eliminar `var data` | Dependency Injection | 4 globales compartidas | Parameterize Constructor |

**Criterio de Done:** `var data` eliminado. Services reciben `store` por parámetro. Lógica de negocio testeable sin DOM ni localStorage.

### Ola 3: Security + UI Modernization (Semana 8-11)

**Objetivo:** Eliminar vulnerabilidades y modernizar stack de presentación.

| Componente | Acción | Impacto | Riesgo |
|---|---|---|---|
| XSS (22 puntos) | Reemplazar `innerHTML` con `textContent` + template engine | Elimina vector principal de ataque | Medio |
| jQuery 1.12.4 | Migrar a vanilla JS (o Vue/React si se justifica) | Elimina dependencia EOL de 100% | Alto |
| Bootstrap 3.4.1 | Migrar a Bootstrap 5 o Tailwind CSS | Layout moderno, responsive | Alto |
| ES5 → ES6+ | `let/const`, arrow functions, modules, destructuring | Código moderno y legible | Bajo |
| Auth básica | Login form + JWT o session (requiere backend) | Protege datos financieros | Alto |

**Criterio de Done:** 0 `innerHTML` con input no sanitizado. 0 referencias a jQuery. Bootstrap 5 funcional. Login obligatorio.

### Ola 4: Cloud Ready (Semana 12-14)

**Objetivo:** Habilitar operación en cloud con persistencia real.

| Componente | Target | Justificación |
|---|---|---|
| Backend API | Node.js/Express o AWS Lambda | Persistencia real, auth, multi-usuario |
| Base de datos | PostgreSQL managed (RDS/CloudSQL) o MongoDB Atlas | Reemplazar localStorage (~5MB limit) |
| Dockerfile | Multi-stage build (node:alpine) | Containerización para cualquier cloud |
| CI/CD | GitHub Actions o AWS CodePipeline | Deploy automatizado con tests |
| Monitoring | Structured logging + health checks | Observabilidad básica |

**Criterio de Done:** App containerizada, con BD managed, CI/CD green, health check respondiendo.

## Dependencias entre Olas

```mermaid
flowchart LR
    O0["Ola 0<br/>Foundation<br/>(1-2 sem)"] --> O1["Ola 1<br/>Extract Logic<br/>(2 sem)"]
    O1 --> O2["Ola 2<br/>Abstractions<br/>(2-3 sem)"]
    O2 --> O3["Ola 3<br/>Security + UI<br/>(3-4 sem)"]
    O2 --> O4["Ola 4<br/>Cloud Ready<br/>(2-3 sem)"]

    style O0 fill:#00b894,color:#fff
    style O1 fill:#00b894,color:#fff
    style O2 fill:#f9a826,color:#000
    style O3 fill:#d62828,color:#fff
    style O4 fill:#6c5ce7,color:#fff
```

**Nota:** Ola 3 y Ola 4 pueden ejecutarse en paralelo (equipos separados) una vez que Ola 2 está completa.

## Aplicabilidad de Herramientas de Transformación

| Herramienta | Aplicabilidad | Razón |
|---|---|---|
| **AWS Transformation Hub** | ❌ No aplica | No es .NET ni Java |
| **GitHub Copilot** | ✅ Alta | Asistencia en rewrite ES5→ES6+, tests |
| **Codemod (jscodeshift)** | ✅ Media | Transformaciones mecánicas jQuery→vanilla |
| **ESLint --fix** | ✅ Alta | Auto-fix de styling, unused vars |
| **Prettier** | ✅ Alta | Formateo consistente post-migración |
| **Q Developer** | ⚠️ Parcial | No hay proyecto existente que transformar — es rewrite |

## Riesgos de Migración

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Regresión funcional por falta de tests | Alta | Alto | Ola 0 crea characterization tests PRIMERO |
| jQuery removal rompe funcionalidad oculta | Media | Alto | Migrar gradualmente función por función |
| localStorage → BD pierde datos existentes | Media | Alto | Script de migración de datos como primer paso de Ola 4 |
| Scope creep al modernizar UI | Alta | Medio | Mantener scope estricto: misma funcionalidad, nuevo stack |
| Un solo developer = bus factor 1 | Media | Alto | Documentar decisiones, pair programming |

## Referencias

- [Plan de Remediación](../technical-debt/remediation-plan.md)
- [Production Readiness](../analysis/production-readiness.md)
- [Dependency Analysis](../analysis/dependency-analysis.md)
- [Tech Debt Summary](../technical-debt/summary.md)
- [Test Specifications](test-specifications.md)
