# Épica 5: Infraestructura — StockControl

## Descripción

Migración de infraestructura: containerización, actualización de framework, migración de BD a PostgreSQL managed, e implementación de pipeline CI/CD. Estas HUs habilitan el deployment en cloud.

---

### MG-001 Actualizar Flask a 3.x

**Como** equipo de desarrollo
**Quiero** actualizar Flask de 2.2.5 a 3.1.x
**Para** obtener soporte activo, mejor performance y deprecations resueltas

#### Criterios de Aceptación
- [ ] Dado Flask 3.1.x, cuando se ejecuta la app, entonces todas las rutas funcionan igual
- [ ] Dado el upgrade, cuando hay breaking changes (response typing), entonces están resueltas
- [ ] Dado el requirements.txt, entonces las versiones de Werkzeug y Jinja2 son compatibles con Flask 3.x
- [ ] Dado el upgrade, entonces characterization tests siguen pasando

#### Notas Técnicas
- Fuente: `analysis/dependency-security-assessment.md`
- Componentes afectados: `requirements.txt`, todas las rutas (verificar compatibilidad)
- Dependencias: TK-008 (Characterization tests — necesarios para validar el upgrade)
- Complejidad estimada: M (3 SP)

---

### MG-002 Migrar SQLite a PostgreSQL

**Como** equipo de operaciones
**Quiero** reemplazar SQLite por PostgreSQL
**Para** soportar concurrencia, escalabilidad y managed services en cloud

#### Criterios de Aceptación
- [ ] Dado PostgreSQL, cuando múltiples usuarios acceden simultáneamente, entonces no hay locks
- [ ] Dado la migración, cuando se ejecuta, entonces los 7 tablas se crean con tipos correctos
- [ ] Dado datos existentes en SQLite, cuando se migra, entonces se preservan intactos
- [ ] Dado la conexión, cuando se lee de DATABASE_URL env var, entonces se conecta correctamente

#### Notas Técnicas
- Fuente: `analysis/cloud-readiness-assessment.md` (Blocker B01)
- Componentes afectados: `app.py:55-70` (conexión), DDL completo (`app.py:79-143`)
- Dependencias: TK-002 (SQLAlchemy models)
- Complejidad estimada: M (3 SP)

---

### MG-003 Implementar SQLAlchemy + Alembic Migrations

**Como** equipo de desarrollo
**Quiero** gestionar el schema de BD con migraciones versionadas
**Para** tener evolución controlada del schema sin DDL at startup

#### Criterios de Aceptación
- [ ] Dado un cambio de schema, cuando se genera migración, entonces Alembic produce script up/down
- [ ] Dado un deploy, cuando se ejecuta `flask db upgrade`, entonces el schema se actualiza sin perder datos
- [ ] Dado un rollback necesario, cuando se ejecuta `flask db downgrade`, entonces revierte el último cambio
- [ ] Dado `CREATE TABLE IF NOT EXISTS`, entonces se elimina del código (reemplazado por Alembic)

#### Notas Técnicas
- Fuente: `database/schema-analysis.md` (Hallazgo: "DDL at startup")
- Componentes afectados: Eliminar `iniciar()` de `app.py:62-222`, crear `migrations/`
- Dependencias: TK-002 (Modelos SQLAlchemy), MG-002 (PostgreSQL)
- Complejidad estimada: M (3 SP)

---

### MG-004 Containerizar la Aplicación (Docker)

**Como** equipo de DevOps
**Quiero** un Dockerfile multi-stage con gunicorn como WSGI server
**Para** desplegar la aplicación en cualquier cloud con containers

#### Criterios de Aceptación
- [ ] Dado el Dockerfile, cuando se construye, entonces produce imagen <200MB (Python slim)
- [ ] Dado el container, cuando se ejecuta, entonces sirve la app con gunicorn (no Flask dev server)
- [ ] Dado docker-compose, cuando se levanta, entonces app + PostgreSQL están operativos
- [ ] Dado el container, cuando recibe SIGTERM, entonces hace graceful shutdown

#### Notas Técnicas
- Fuente: `analysis/cloud-readiness-assessment.md` (Deployment Score: 0/100)
- Componentes afectados: Nuevos archivos: `Dockerfile`, `docker-compose.yml`, `gunicorn.conf.py`
- Dependencias: SC-003 (env vars), MG-002 (PostgreSQL)
- Complejidad estimada: M (3 SP)

## Referencias

- [Backlog](../backlog.md)
- [Cloud Readiness](../../analysis/cloud-readiness-assessment.md)
- [Migration — Component Order](../../migration/component-order.md)
- [Dependencies](../../architecture/dependencies.md)
