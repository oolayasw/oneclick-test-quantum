# Épica 7: Deuda Técnica y Calidad

> Historias técnicas para implementar testing, tipos estrictos, linting, resiliencia y prácticas de calidad desde el inicio del rebuild.

## HUs de esta Épica

---

### TK-002 Tipado Estricto (Eliminar `any`)

**Como** equipo de desarrollo
**Quiero** que el proyecto use TypeScript strict mode sin `any` en todo el código
**Para** detectar errores en tiempo de compilación y mejorar mantenibilidad (96 instancias de `any` en sistema actual)

#### Criterios de Aceptación
- [ ] Dado tsconfig.json, cuando se configura, entonces `"strict": true` y `"noImplicitAny": true`
- [ ] Dado el proyecto, cuando se compila, entonces 0 warnings de tipo
- [ ] Dado ESLint, cuando se ejecuta, entonces `@typescript-eslint/no-explicit-any` es error (no warning)
- [ ] Dado el code review, cuando se revisa un PR, entonces no se aprueba con `any` sin justificación documentada

#### Notas Técnicas
- Fuente: `analysis/code-metrics.md` — "96 instancias de `any`"
- Bug actual: Todo el backend usa `any[]` para los arrays de datos
- Target: Interfaces en `/shared/types/` para cada entidad
- Complejidad estimada: S (2 SP — se aplica progresivamente durante todo el desarrollo)

---

### TK-003 Tests Unitarios (≥80% cobertura)

**Como** equipo de desarrollo
**Quiero** tests unitarios para todos los servicios de dominio
**Para** validar la lógica de negocio de forma aislada y prevenir regresiones

#### Criterios de Aceptación
- [ ] Dado el motor de cálculo, cuando se testea, entonces cubre: cálculo de items, descuentos, impuestos, totales, edge cases (0, negativos)
- [ ] Dado la máquina de estados, cuando se testea, entonces cubre: todas las transiciones válidas + todas las inválidas
- [ ] Dado el servicio de autenticación, cuando se testea, entonces cubre: login válido, inválido, token expirado
- [ ] Dado el pipeline, cuando se ejecuta, entonces reporta cobertura y falla si es <80% en servicios
- [ ] Dado los tests, cuando se ejecutan, entonces NO dependen de BD (mocks/stubs para repos)

#### Notas Técnicas
- Fuente: `analysis/production-readiness.md` — "0% tests"
- Target: Jest con `jest.mock()` para dependencias, `@nestjs/testing` para módulos
- Complejidad estimada: M (5 SP — proporcional al número de servicios)

---

### TK-004 Tests de Integración

**Como** equipo de desarrollo
**Quiero** tests de integración que validen los endpoints con BD real (testcontainers)
**Para** verificar que la API funciona correctamente end-to-end sin mocks

#### Criterios de Aceptación
- [ ] Dado cada endpoint CRUD, cuando se testea en integración, entonces valida: creación, lectura, actualización, eliminación con BD real
- [ ] Dado un test de integración, cuando se ejecuta, entonces usa TestContainers (PostgreSQL efímero) para aislamiento
- [ ] Dado el endpoint de login, cuando se testea, entonces valida flujo completo: login → recibir JWT → usar JWT en request protegido
- [ ] Dado errores de validación, cuando se testean, entonces valida que retornan 400 con mensajes correctos

#### Notas Técnicas
- Target: Supertest + TestContainers/PostgreSQL + `@nestjs/testing`
- Complejidad estimada: M (5 SP)

---

### TK-005 Tests E2E (End-to-End)

**Como** equipo de QA
**Quiero** tests E2E que validen los flujos principales desde el browser
**Para** garantizar que frontend y backend funcionan correctamente integrados

#### Criterios de Aceptación
- [ ] Dado el flujo de login, cuando se testea E2E, entonces simula: abrir app → ingresar credenciales → navegar a dashboard
- [ ] Dado el flujo de cotización, cuando se testea E2E, entonces simula: crear cotización → agregar items → guardar → verificar en listado
- [ ] Dado el flujo de aprobación, cuando se testea E2E, entonces simula: supervisor ve pendientes → aprueba → verifica cambio de estado
- [ ] Dado los tests E2E, cuando se ejecutan en CI, entonces corren en modo headless (Playwright/Cypress)

#### Notas Técnicas
- Fuente: `migration/test-specifications.md`
- Target: Playwright con page object pattern
- Complejidad estimada: M (5 SP)

---

### TK-007 Linting y Formateo Automático

**Como** equipo de desarrollo
**Quiero** ESLint + Prettier configurados con reglas estrictas y fix automático
**Para** mantener consistencia de código sin discusiones en code review

#### Criterios de Aceptación
- [ ] Dado un commit, cuando se ejecuta Husky pre-commit, entonces corrige automáticamente formateo con Prettier
- [ ] Dado el pipeline, cuando detecta errores de lint, entonces falla el build
- [ ] Dado las reglas, cuando se definen, entonces incluyen: no-explicit-any, no-unused-vars, prefer-const, no-console (warn en prod)

#### Notas Técnicas
- Target: ESLint flat config + Prettier + Husky + lint-staged
- Complejidad estimada: S (2 SP)

---

### TK-008 Code Review Obligatorio

**Como** equipo de desarrollo
**Quiero** que todo código pase por code review antes de merge a main
**Para** mantener calidad y compartir conocimiento del código entre el equipo

#### Criterios de Aceptación
- [ ] Dado un branch, cuando se crea PR, entonces requiere al menos 1 aprobación antes de merge
- [ ] Dado el pipeline CI, cuando falla en un PR, entonces el merge queda bloqueado
- [ ] Dado el PR template, cuando se crea un PR, entonces incluye: descripción del cambio, tipo (feat/fix/chore), checklist de DoD

#### Notas Técnicas
- Target: Branch protection rules en GitHub/Azure DevOps
- Complejidad estimada: S (1 SP)

---

### RS-001 Manejo de Errores Centralizado

**Como** sistema
**Quiero** un exception filter global que capture todos los errores y retorne respuestas consistentes
**Para** que el frontend siempre reciba un formato predecible de errores (no stack traces)

#### Criterios de Aceptación
- [ ] Dado un error no capturado, cuando llega al filter global, entonces retorna `{ statusCode, message, error, timestamp, path }` en formato consistente
- [ ] Dado un error de validación (400), cuando ocurre, entonces retorna array de mensajes descriptivos por campo
- [ ] Dado un error interno (500), cuando ocurre en producción, entonces NO expone stack trace al cliente
- [ ] Dado un error de negocio (409 Conflict, 403 Forbidden), cuando se lanza, entonces usa excepciones tipadas (`ConflictException`, `ForbiddenException`)

#### Notas Técnicas
- Fuente: `behavior/error-handling.md`
- Bug actual: `app.service.ts` — 8 instancias de `catch { console.log(error) }` sin acción
- Target: NestJS `ExceptionFilter` global + custom business exceptions
- Complejidad estimada: S (3 SP)

#### Evidencia del Análisis
- Anti-pattern: `analysis/production-readiness.md` — "Error swallowing"
- Error handling actual: `behavior/error-handling.md`

---

### RS-002 Validation Pipe Global

**Como** sistema
**Quiero** un ValidationPipe global que valide todos los DTOs automáticamente
**Para** garantizar que ningún input inválido llegue a la lógica de negocio

#### Criterios de Aceptación
- [ ] Dado el pipe global, cuando se configura, entonces se aplica automáticamente a TODOS los endpoints
- [ ] Dado un DTO con class-validator decoradores, cuando llega un request inválido, entonces retorna 400 con errores específicos por campo
- [ ] Dado `whitelist: true`, cuando llegan campos no definidos en el DTO, entonces se eliminan automáticamente (strip unknown)
- [ ] Dado `transform: true`, cuando llegan params como string (ej: `:id`), entonces se transforman a number automáticamente

#### Notas Técnicas
- Fuente: `analysis/security-patterns.md` A03 — "Injection"
- Target: NestJS `ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })`
- Complejidad estimada: S (2 SP)

## Referencias

- [Backlog](../backlog.md)
- [Tech Debt](../../analysis/tech-debt.md)
- [Remediation Plan](../../technical-debt/remediation-plan.md)
- [Production Readiness](../../analysis/production-readiness.md)
- [Test Specifications](../../migration/test-specifications.md)
