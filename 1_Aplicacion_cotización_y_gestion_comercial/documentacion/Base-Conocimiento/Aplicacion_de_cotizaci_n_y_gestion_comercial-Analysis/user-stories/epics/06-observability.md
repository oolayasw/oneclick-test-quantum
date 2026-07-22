# Épica 6: Observabilidad y Operaciones

> Health checks, logging estructurado, documentación API y error tracking.

## HUs de esta Épica

---

### OB-001 Health Checks y Readiness Probes

**Como** plataforma de orquestación (Kubernetes/Docker)
**Quiero** endpoints de health check (liveness + readiness)
**Para** detectar cuándo la aplicación está saludable o necesita reinicio

#### Criterios de Aceptación
- [ ] Dado el endpoint GET /health, cuando la app está levantada, entonces retorna 200 `{ status: "ok", uptime: N, timestamp: "..." }`
- [ ] Dado el endpoint GET /health/ready, cuando la BD está conectada, entonces retorna 200; si no, retorna 503
- [ ] Dado el orquestador, cuando el health check falla 3 veces consecutivas, entonces reinicia el container
- [ ] Dado el endpoint, cuando se invoca, entonces NO requiere autenticación

#### Notas Técnicas
- Fuente: `analysis/production-readiness.md` — "Sin endpoint /health, /ready, /alive"
- Target: `@nestjs/terminus` con indicadores de DB, memoria y disco
- Complejidad estimada: S (2 SP)

---

### OB-002 Logging Estructurado

**Como** equipo de operaciones
**Quiero** logs estructurados en formato JSON con niveles, correlation IDs y metadata
**Para** poder filtrar, buscar y correlacionar eventos en producción (no solo console.log)

#### Criterios de Aceptación
- [ ] Dado cualquier log, cuando se genera, entonces incluye: timestamp, level (info/warn/error/debug), message, correlationId, context
- [ ] Dado un request HTTP, cuando entra al backend, entonces se asigna un UUID como correlationId y se propaga en todos los logs de ese request
- [ ] Dado un error, cuando se loguea, entonces incluye stack trace + request metadata (path, method, userId)
- [ ] Dado producción, cuando se configura, entonces NO se loguean passwords ni tokens completos (redacción de campos sensibles)
- [ ] Dado el formato, cuando se produce el log, entonces es JSON para ser ingestable por CloudWatch/ELK/Loki

#### Notas Técnicas
- Fuente: `analysis/production-readiness.md` — "Solo console.log con strings concatenados"
- Bug actual: `app.ts`:163 loguea `JSON.stringify(req.body)` en cada request (incluyendo passwords)
- Target: Pino o Winston con formato JSON + NestJS interceptor para correlationId
- Complejidad estimada: S (3 SP)

#### Evidencia del Análisis
- Anti-pattern: `analysis/production-readiness.md` — "Log pollution"
- Security: `analysis/security-patterns.md` — "Body completo logueado"

---

### OB-003 Documentación API con OpenAPI/Swagger

**Como** equipo de desarrollo (frontend y partners)
**Quiero** documentación interactiva de la API generada automáticamente desde el código
**Para** que cualquier consumidor de la API pueda entender los endpoints sin leer el código

#### Criterios de Aceptación
- [ ] Dado el backend NestJS, cuando se accede a /api/docs, entonces muestra Swagger UI con todos los endpoints documentados
- [ ] Dado cada endpoint, cuando se documenta, entonces incluye: descripción, request body schema, response schema, status codes posibles
- [ ] Dado los DTOs, cuando se usan decoradores Swagger, entonces el schema se genera automáticamente desde class-validator
- [ ] Dado el ambiente de producción, cuando se configura, entonces se puede deshabilitar Swagger por variable de entorno

#### Notas Técnicas
- Fuente: `analysis/production-readiness.md` — "Inexistente" en documentación API
- Target: `@nestjs/swagger` con decoradores `@ApiOperation`, `@ApiResponse`, `@ApiBody`
- Complejidad estimada: S (3 SP)

---

### OB-004 Error Tracking y Alertas

**Como** equipo de operaciones
**Quiero** capturar y agrupar errores no manejados en un servicio de tracking
**Para** detectar problemas en producción antes de que los reporte el usuario

#### Criterios de Aceptación
- [ ] Dado un error no capturado (500), cuando ocurre, entonces se envía a servicio de error tracking (Sentry o similar) con contexto completo
- [ ] Dado errores agrupados, cuando se repiten, entonces se muestra tendencia y frecuencia sin duplicar alertas
- [ ] Dado un error crítico (DB down, auth service down), cuando se detecta, entonces se envía alerta a Slack/email del equipo
- [ ] Dado el frontend, cuando ocurre un error JS no capturado, entonces se reporta con stack trace y estado de la app

#### Notas Técnicas
- Fuente: `analysis/production-readiness.md` — "Sin Sentry, Bugsnag ni similar"
- Bug actual: `app.service.ts`:82-135 — catch silenciosos con `console.log(error)`
- Target: Sentry SDK para Node.js + Angular, o alternativa open source (GlitchTip)
- Complejidad estimada: S (2 SP)

## Referencias

- [Backlog](../backlog.md)
- [Production Readiness](../../analysis/production-readiness.md)
- [Security Patterns](../../analysis/security-patterns.md)
