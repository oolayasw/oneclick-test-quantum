# Épica 5: Infraestructura

## Descripción

Setup de herramientas de build, migración de frameworks obsoletos, containerización y CI/CD.

## HUs Contenidas

---

### MG-001 Setup build system moderno (Vite + Vitest)

**Como** equipo de desarrollo
**Quiero** un proyecto moderno con build system, test runner y linting
**Para** poder usar módulos ES6, escribir tests y garantizar calidad de código

#### Criterios de Aceptación
- [ ] `npm init` con Vite como bundler
- [ ] Vitest configurado para tests unitarios
- [ ] ESLint + Prettier configurados con reglas estrictas
- [ ] Scripts: `dev`, `build`, `test`, `lint`
- [ ] `.gitignore` adecuado (node_modules, dist, .env)

#### Notas Técnicas
- Fuente: `technical-debt/remediation-plan.md` (Ola 0, item 0.1)
- Estado actual: 0 archivos de configuración, 0 package.json, 0 tests
- Complejidad: S
- Dependencias: Ninguna (es el primer paso)

#### Evidencia del Análisis
- Sin build system: `_cloc-report.txt` — solo 3 archivos raw (.html, .js, .css)

---

### MG-002 Migrar jQuery 1.12.4 a vanilla JS

**Como** equipo de desarrollo
**Quiero** eliminar la dependencia de jQuery (EOL)
**Para** reducir tamaño de bundle y eliminar una librería sin soporte

#### Criterios de Aceptación
- [ ] 0 referencias a `$()` o `jQuery` en el código
- [ ] Todas las operaciones DOM usan APIs nativas (querySelector, addEventListener, etc.)
- [ ] Bootstrap 5 funciona sin jQuery (ya no lo requiere)
- [ ] Tests pasan sin jQuery cargado

#### Notas Técnicas
- Fuente: `analysis/dependency-analysis.md` — "jQuery 1.12.4 — EOL desde 2016"
- Estado actual: 9 usos de `$()` en `app.js:150-161` + Bootstrap 3 depende de jQuery
- Complejidad: L (afecta todos los event handlers y rendering)
- Dependencias: SC-002 (sanitizar primero), luego migrar jQuery

#### Evidencia del Análisis
- jQuery CDN: `index.html:7` — versión 1.12.4 (circa 2016)
- 9 usos: `app.js:150-161` — formateo de montos y selectores

---

### MG-003 Containerizar aplicación (Dockerfile)

**Como** equipo de operaciones
**Quiero** un Dockerfile multi-stage para construir y servir la aplicación
**Para** poder desplegar en cualquier plataforma cloud con un solo comando

#### Criterios de Aceptación
- [ ] Dockerfile multi-stage: build (node) + serve (nginx:alpine)
- [ ] `.dockerignore` configurado
- [ ] Imagen final < 50MB
- [ ] Health check endpoint responde `/health`
- [ ] Variables de entorno para configuración

#### Notas Técnicas
- Fuente: `migration/component-order.md` (Ola 4)
- Estado actual: Archivos estáticos servidos directamente — sin container
- Complejidad: S
- Dependencias: IN-001 (si backend incluido en mismo container o separado)

---

### MG-004 CI/CD Pipeline

**Como** equipo de desarrollo
**Quiero** un pipeline que ejecute tests, lint, build y deploy automáticamente
**Para** garantizar que cada cambio pase quality gates antes de llegar a producción

#### Criterios de Aceptación
- [ ] Trigger en push a main y PRs
- [ ] Pasos: install → lint → test → build → deploy (staging)
- [ ] Deploy a producción requiere approval manual
- [ ] Notificación de fallo
- [ ] Badge de estado en README

#### Notas Técnicas
- Fuente: `analysis/production-readiness.md` — "Sin CI/CD"
- Estado actual: Deploy manual (copiar archivos)
- Complejidad: M
- Dependencias: MG-001 (build system), MG-003 (container)

## Resumen de Épica

| Tipo | Cantidad | SP Estimados |
|---|---|---|
| Migración (MG) | 4 | 21 |

## Referencias

- [Backlog](../backlog.md)
- [Migration Component Order](../../migration/component-order.md)
- [Production Readiness](../../analysis/production-readiness.md)
