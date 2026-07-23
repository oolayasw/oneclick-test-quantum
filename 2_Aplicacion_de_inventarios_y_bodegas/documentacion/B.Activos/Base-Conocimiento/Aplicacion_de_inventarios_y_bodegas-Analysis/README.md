# StockControl — Codebase Analysis Report

## Aplicación Analizada

**Aplicacion_de_inventarios_y_bodegas** — Sistema web monolítico de gestión de inventarios y bodegas desarrollado en Python/Flask con SQLite.

| Indicador | Valor |
|---|---|
| **LOC (cloc)** | 939 |
| **Archivos de código** | 2 (app.py, test_app.py) |
| **Lenguaje** | Python 3.x |
| **Framework** | Flask 2.2.5 |
| **Base de datos** | SQLite (embebida) |
| **Deuda técnica** | 17 items (8 Alta, 6 Media, 3 Baja) |
| **Legacy Readiness** | D — Monolithic |
| **Production Readiness** | 1/10 |
| **Clean Code Score** | 2.8/10 |

## Navegación del Análisis

### Visión General
- [Project Overview](project-overview.md)
- [Technical Debt Report (Ejecutivo)](technical-debt-report.md)

### Arquitectura
- [System Overview](architecture/system-overview.md)
- [Components](architecture/components.md)
- [Dependencies](architecture/dependencies.md)
- [Patterns](architecture/patterns.md)

### Comportamiento
- [Business Logic](behavior/business-logic.md)
- [Workflows](behavior/workflows.md)
- [Decision Logic](behavior/decision-logic.md)
- [Error Handling](behavior/error-handling.md)

### Referencia
- [Program Structure](reference/program-structure.md)
- [Interfaces](reference/interfaces.md)
- [Data Models](reference/data-models.md)
- [API Reference](reference/api-reference.md)
- [Modules](reference/modules.md)

### Base de Datos
- [Schema Analysis](database/schema-analysis.md)

### Análisis de Calidad
- [Code Metrics](analysis/code-metrics.md)
- [Complexity Analysis](analysis/complexity-analysis.md)
- [Dependency Analysis](analysis/dependency-analysis.md)
- [Security Patterns](analysis/security-patterns.md)
- [Production Readiness](analysis/production-readiness.md)
- [Tech Debt](analysis/tech-debt.md)
- [Dependency Security Assessment](analysis/dependency-security-assessment.md)
- [Modernization Assessment](analysis/modernization-assessment.md)
- [Team Structure Assessment](analysis/team-structure-assessment.md)

### Diagramas
- [System Context (C4)](diagrams/architecture/system-context.md)
- [Sequence Diagrams](diagrams/behavioral/sequence-diagrams.md)
- [Component Diagrams](diagrams/structural/component-diagrams.md)

### Deuda Técnica (Detalle)
- [Summary](technical-debt/summary.md)
- [Outdated Components](technical-debt/outdated-components.md)
- [Maintenance Burden](technical-debt/maintenance-burden.md)
- [Remediation Plan](technical-debt/remediation-plan.md)

### Plan de Migración
- [Component Order](migration/component-order.md)
- [Test Specifications](migration/test-specifications.md)
- [Validation Criteria](migration/validation-criteria.md)

### Cloud Readiness
- [Cloud Readiness Assessment](analysis/cloud-readiness-assessment.md)

### User Stories (Backlog de Modernización)
- [Backlog General](user-stories/backlog.md)
- [Story Map Diagram](user-stories/_story-map-diagram.md)
- [Épica 1: Core Business](user-stories/epics/01-core-business.md)
- [Épica 2: Integraciones](user-stories/epics/02-integrations.md)
- [Épica 3: Seguridad](user-stories/epics/03-security.md)
- [Épica 4: Datos y Persistencia](user-stories/epics/04-data-persistence.md)
- [Épica 5: Infraestructura](user-stories/epics/05-infrastructure.md)
- [Épica 6: Observabilidad](user-stories/epics/06-observability.md)
- [Épica 7: Deuda Técnica](user-stories/epics/07-tech-debt.md)

### Especializado
- [Specialized Documentation](specialized/specialized-documentation.md)

## Estadísticas del Proyecto

| Métrica | Valor |
|---|---|
| Total archivos analizados | 3 (100% cobertura) |
| Archivos de código | 2 |
| Archivos de configuración | 1 |
| Rutas/endpoints detectados | 19 |
| Tablas de BD | 7 |
| Bounded contexts naturales | 4 |
| Vulnerabilidades críticas | 4 (SQL Injection, MD5, Secret Key, Debug Mode) |
| Dependencias externas | 2 (Flask 2.2.5, Werkzeug 2.2.3) |

## Resumen de Hallazgos Clave

1. **God Module extremo**: Todo el sistema en 1 archivo (939 LOC), con HTML/SQL/lógica mezclados
2. **Vulnerabilidades críticas**: SQL Injection en 7+ puntos, MD5 para passwords, secret key hardcoded
3. **Zero production readiness**: Sin health checks, sin logging, sin containerización, debug permanente
4. **Modernizable**: A pesar de la deuda, el sistema es pequeño (939 LOC), bien documentado (con antipatrones intencionales) y tiene bounded contexts naturales claros

## Generado por

OneClickCBA v3.5 — Análisis estático autónomo
- Fecha: 2026-07-22
- Cobertura de código: 100%
- Cobertura de configuración: 100%

## Referencias

- [Execution Report](_cba-execution-report.md)
