# Épica 5: Infraestructura y DevOps

> Setup del proyecto, monorepo, pipeline CI/CD y containerización.

## HUs de esta Épica

---

### MG-001 Setup Proyecto NestJS + Angular 17

**Como** equipo de desarrollo
**Quiero** un proyecto base configurado con NestJS (backend) y Angular 17 (frontend) en monorepo
**Para** iniciar el desarrollo del nuevo sistema sobre un stack moderno y soportado

#### Criterios de Aceptación
- [ ] Dado el monorepo, cuando se genera, entonces contiene: `/backend` (NestJS), `/frontend` (Angular 17), `/shared` (tipos compartidos)
- [ ] Dado el backend, cuando se ejecuta `npm run start:dev`, entonces levanta NestJS en puerto 3000 con hot reload
- [ ] Dado el frontend, cuando se ejecuta `ng serve`, entonces levanta Angular en puerto 4200 con proxy a backend
- [ ] Dado TypeScript, cuando se compila, entonces usa strict mode (`"strict": true`) en ambos proyectos
- [ ] Dado el proyecto, cuando se crea, entonces incluye: ESLint, Prettier, Husky pre-commit hooks

#### Notas Técnicas
- Fuente: `migration/component-order.md` Ola 0 — "Setup proyecto"
- Target: Nx monorepo o estructura manual con shared types
- Stack: NestJS 10+ / Angular 17+ / TypeScript 5+ / Node.js 20 LTS
- Complejidad estimada: S (3 SP)

---

### MG-002 Configuración Monorepo con Shared Types

**Como** equipo de desarrollo
**Quiero** compartir interfaces/tipos TypeScript entre backend y frontend
**Para** garantizar consistencia de tipos en las dos capas (evitar `any` del sistema actual)

#### Criterios de Aceptación
- [ ] Dado el módulo shared, cuando se definen interfaces (Cliente, Producto, Cotizacion, etc.), entonces se importan tanto en backend como en frontend
- [ ] Dado un cambio en una interface shared, cuando se compila, entonces ambos proyectos validan contra la nueva definición
- [ ] Dado los DTOs de API, cuando se generan, entonces usan las interfaces shared como base

#### Notas Técnicas
- Fuente: `analysis/tech-debt.md` — uso masivo de `any` (96 instancias detectadas)
- Bug actual: Sin tipos compartidos — `any` everywhere
- Complejidad estimada: S (2 SP)

---

### TK-001 Pipeline CI/CD Básico

**Como** equipo de desarrollo
**Quiero** un pipeline de CI/CD que ejecute lint, build y test en cada push
**Para** detectar errores tempranamente y automatizar el proceso de entrega

#### Criterios de Aceptación
- [ ] Dado un push a cualquier rama, cuando se ejecuta el pipeline, entonces corre: lint → build → test unitarios → test integración
- [ ] Dado un merge a main, cuando el pipeline pasa, entonces genera imagen Docker y la publica en el registry
- [ ] Dado un test fallido, cuando ocurre en pipeline, entonces bloquea el merge y notifica al equipo
- [ ] Dado el pipeline, cuando se define, entonces usa GitHub Actions (o Azure DevOps Pipelines)

#### Notas Técnicas
- Fuente: `analysis/production-readiness.md` — "Sin CI/CD pipeline"
- Target: GitHub Actions con stages: lint → build → test → docker-build → deploy
- Complejidad estimada: S (3 SP)

---

### TK-006 Containerización con Docker

**Como** equipo de DevOps
**Quiero** containerizar la aplicación con Docker multi-stage build
**Para** garantizar portabilidad y facilitar el despliegue en cualquier ambiente

#### Criterios de Aceptación
- [ ] Dado el backend, cuando se construye la imagen Docker, entonces usa multi-stage build (builder + runtime)
- [ ] Dado el frontend, cuando se construye, entonces genera assets estáticos que se sirven con nginx (o similar)
- [ ] Dado docker-compose, cuando se ejecuta `docker-compose up`, entonces levanta: backend + frontend + postgresql
- [ ] Dado la imagen de producción, cuando se ejecuta, entonces NO contiene node_modules de devDependencies ni código fuente
- [ ] Dado el Dockerfile, cuando se escanea con Trivy/Snyk, entonces no tiene vulnerabilidades críticas en la imagen base

#### Notas Técnicas
- Fuente: `analysis/production-readiness.md` — "Sin containerización"
- Target: `node:20-alpine` como base, multi-stage, docker-compose para desarrollo
- Complejidad estimada: S (2 SP)

## Referencias

- [Backlog](../backlog.md)
- [Migration Plan](../../migration/component-order.md)
- [Production Readiness](../../analysis/production-readiness.md)
