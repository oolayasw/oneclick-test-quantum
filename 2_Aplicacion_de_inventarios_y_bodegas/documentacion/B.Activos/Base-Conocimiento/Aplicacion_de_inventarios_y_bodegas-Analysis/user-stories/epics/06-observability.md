# Épica 6: Observabilidad — StockControl

## Descripción

Implementar las capacidades mínimas de observabilidad para operar el sistema en producción: logging estructurado, health checks, y pipeline CI/CD.

---

### OB-001 Implementar Logging Estructurado

**Como** equipo de operaciones
**Quiero** que la aplicación genere logs estructurados en formato JSON
**Para** poder buscar, filtrar y alertar sobre eventos en CloudWatch/ELK

#### Criterios de Aceptación
- [ ] Dado un request HTTP, cuando se procesa, entonces se loguea: method, path, status, duration_ms
- [ ] Dado un error, cuando ocurre, entonces se loguea: traceback + contexto (user, route, params)
- [ ] Dado un login exitoso/fallido, entonces se loguea como evento de seguridad
- [ ] Dado el formato, cuando se revisa, entonces es JSON parseable (no print() texto plano)
- [ ] Dado `print()` existentes, cuando se refactorizan, entonces usan `logger.info/warning/error`

#### Notas Técnicas
- Fuente: `analysis/production-readiness.md` (Observability: solo print())
- Componentes afectados: Todos los `print()` en `app.py:58, 60, 215, 217, 224` + request logging middleware
- Dependencias: TK-004 (Blueprints — más fácil con middleware Flask)
- Complejidad estimada: M (3 SP)

#### Evidencia del Análisis
- Actual: `print("[OK] Base de datos lista:", DATABASE)` — `app.py:215`
- Target: `logger.info("database_ready", extra={"path": DATABASE})`

---

### OB-002 Implementar Health Check Endpoints

**Como** orchestrator (Kubernetes/ECS/Cloud Run)
**Quiero** endpoints `/health` y `/ready` que informen el estado de la app
**Para** saber cuándo la app está lista para recibir tráfico y cuándo reiniciarla

#### Criterios de Aceptación
- [ ] Dado GET /health, cuando la app está corriendo, entonces retorna 200 con `{"status": "healthy"}`
- [ ] Dado GET /ready, cuando la BD es accesible, entonces retorna 200 con `{"status": "ready", "db": "ok"}`
- [ ] Dado GET /ready, cuando la BD no responde, entonces retorna 503 con `{"status": "not_ready", "db": "error"}`
- [ ] Dado los endpoints, entonces NO requieren autenticación

#### Notas Técnicas
- Fuente: `analysis/production-readiness.md` (Health Checks: ❌ Ausente)
- Componentes afectados: Nueva ruta `/health`, `/ready` sin decorator `@auth`
- Dependencias: Ninguna
- Complejidad estimada: S (1 SP)

---

### OB-003 Implementar Pipeline CI/CD

**Como** equipo de desarrollo
**Quiero** un pipeline automatizado (GitHub Actions) que build, test y deploy
**Para** tener deployments reproducibles y seguros

#### Criterios de Aceptación
- [ ] Dado un push a main, cuando se ejecuta el pipeline, entonces: lint → test → build image → push registry
- [ ] Dado un PR, cuando se abre, entonces se ejecutan tests y lint automáticamente
- [ ] Dado tests fallidos, cuando el pipeline corre, entonces NO se genera el artefacto de deploy
- [ ] Dado un build exitoso, entonces la imagen Docker se publica en container registry

#### Notas Técnicas
- Fuente: `analysis/production-readiness.md` (CI/CD: ❌ Ausente)
- Componentes afectados: Nuevo `.github/workflows/ci.yml`
- Dependencias: MG-004 (Dockerfile), tests existentes
- Complejidad estimada: M (3 SP)

## Referencias

- [Backlog](../backlog.md)
- [Production Readiness](../../analysis/production-readiness.md)
- [Cloud Readiness](../../analysis/cloud-readiness-assessment.md)
