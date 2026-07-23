# Épica 7: Deuda Técnica — StockControl

## Descripción

Resolver la deuda técnica estructural del sistema: extraer el God Module en módulos separados, crear capas de abstracción, unificar código duplicado, agregar validación de inputs, e implementar paginación. Estas son las HUs que habilitan la mantenibilidad y escalabilidad del código.

---

### TK-001 Extraer Templates HTML a Archivos Jinja2

**Como** equipo de desarrollo
**Quiero** que el HTML esté en archivos `.html` separados, no inline en Python
**Para** separar presentación de lógica y habilitar diseño independiente

#### Criterios de Aceptación
- [ ] Dado cada string HTML inline, cuando se extrae, entonces queda en `templates/{nombre}.html`
- [ ] Dado un template base, cuando se hereda, entonces define bloques: title, content, scripts
- [ ] Dado la navegación lateral (sidebar), cuando se modifica, entonces solo se edita `base.html`
- [ ] Dado characterization tests, cuando se ejecutan post-extracción, entonces siguen pasando

#### Notas Técnicas
- Fuente: `analysis/complexity-analysis.md` (God Module con HTML inline)
- Componentes afectados: `app.py:311-398` (base_layout), + HTML en cada ruta
- Dependencias: TK-008 (Char tests — necesarios para refactoring seguro)
- Complejidad estimada: L (5 SP)

#### Evidencia del Análisis
- `render()` helper combina base_layout + contenido inline — `app.py:400-406`
- ~40% del LOC de `app.py` es HTML/CSS embebido
- Refactoring: Extract Method → Extract File (Fowler: Extract Class adaptado a templates)

---

### TK-002 Crear Modelos SQLAlchemy (ORM)

**Como** equipo de desarrollo
**Quiero** que las 7 tablas tengan modelos Python con SQLAlchemy
**Para** tener type safety, relaciones explícitas y eliminar SQL inline

#### Criterios de Aceptación
- [ ] Dado cada tabla DDL, cuando se modela, entonces tiene clase SQLAlchemy con tipos correctos
- [ ] Dado las relaciones lógicas (FKs), cuando se modelan, entonces son `relationship()` explícitas
- [ ] Dado un modelo, cuando se consulta, entonces usa `session.query()` en vez de SQL crudo
- [ ] Dado la función `iniciar()`, cuando se elimina, entonces Alembic gestiona el schema

#### Notas Técnicas
- Fuente: `database/schema-analysis.md` (7 tablas, 0 FK declaradas)
- Componentes afectados: DDL inline `app.py:79-143` → `models/producto.py`, `models/bodega.py`, etc.
- Dependencias: Ninguna (primer paso de separación)
- Complejidad estimada: M (3 SP)

#### Evidencia del Análisis
- DDL actual: `CREATE TABLE IF NOT EXISTS` × 7 — `app.py:79-143`
- Sin Foreign Keys declaradas — relaciones solo por convención de nombre
- Refactoring: Replace Data Value with Object (raw dict → SQLAlchemy model)

---

### TK-003 Crear Repository Layer

**Como** equipo de desarrollo
**Quiero** una capa de repositorios que encapsule el acceso a datos
**Para** separar lógica de negocio de queries SQL y habilitar testing

#### Criterios de Aceptación
- [ ] Dado `ProductoRepository`, cuando se invoca `listar(filtros)`, entonces ejecuta la query con filtros
- [ ] Dado `MovimientoRepository`, cuando se invoca `crear(datos)`, entonces persiste con transacción
- [ ] Dado un test unitario, cuando mockea el repository, entonces el servicio es testeable sin BD
- [ ] Dado la variable global `_DB`, cuando se elimina, entonces el repository recibe la sesión por inyección

#### Notas Técnicas
- Fuente: `architecture/patterns.md` (Anti-pattern: SQL inline en rutas)
- Componentes afectados: Todas las queries SQL inline → `repositories/*.py`
- Dependencias: TK-002 (Modelos ORM)
- Complejidad estimada: M (3 SP)

#### Evidencia del Análisis
- SQL inline en 15+ funciones de ruta
- `db()` retorna conexión global sin abstracción — `app.py:263-264`
- Refactoring: Extract Class (Repository) + Move Method (queries al repo)

---

### TK-004 Extraer Rutas a Flask Blueprints

**Como** equipo de desarrollo
**Quiero** que las 19 rutas estén organizadas en Blueprints por dominio
**Para** reducir el acoplamiento y habilitar desarrollo paralelo

#### Criterios de Aceptación
- [ ] Dado el blueprint `auth_bp`, cuando se registra, entonces maneja `/login`, `/logout`
- [ ] Dado el blueprint `productos_bp`, cuando se registra, entonces maneja `/productos/*`
- [ ] Dado el blueprint `movimientos_bp`, cuando se registra, entonces maneja `/movimientos/*`
- [ ] Dado `app.py`, cuando se refactoriza, entonces solo contiene `create_app()` (factory pattern)
- [ ] Dado cada Blueprint, entonces importa su servicio y repository correspondiente

#### Notas Técnicas
- Fuente: `architecture/patterns.md` (Anti-pattern: God Module)
- Componentes afectados: `app.py` completo → `routes/auth.py`, `routes/productos.py`, etc.
- Dependencias: TK-001 (Templates), TK-003 (Repositories)
- Complejidad estimada: L (5 SP)

#### Evidencia del Análisis
- 19 rutas en un solo archivo — `app.py:442-2218`
- 4 bounded contexts naturales: Auth, Catálogo, Almacenamiento, Movimientos
- Refactoring: Extract Class (Blueprint per bounded context) — Fowler

---

### TK-005 Unificar 4 Tipos de Movimiento en 1 Servicio

**Como** equipo de desarrollo
**Quiero** un único `InventarioService` con Strategy pattern para los 4 tipos de movimiento
**Para** eliminar ~580 LOC de copy-paste y tener un solo punto de mantenimiento

#### Criterios de Aceptación
- [ ] Dado `InventarioService.ejecutar(tipo, datos)`, cuando tipo=ENTRADA, entonces suma stock
- [ ] Dado `InventarioService.ejecutar(tipo, datos)`, cuando tipo=SALIDA, entonces valida y resta
- [ ] Dado `InventarioService.ejecutar(tipo, datos)`, cuando tipo=TRASLADO, entonces resta origen y suma destino
- [ ] Dado `InventarioService.ejecutar(tipo, datos)`, cuando tipo=AJUSTE, entonces establece valor absoluto
- [ ] Dado cualquier movimiento, entonces se ejecuta en transacción atómica (commit/rollback)
- [ ] Dado el código duplicado original (~580 LOC), cuando se elimina, entonces solo queda el servicio unificado

#### Notas Técnicas
- Fuente: `behavior/workflows.md` (Hallazgo: "Copy-paste entre movimientos")
- Componentes afectados: `app.py:1228-1808` (4 funciones ~80% idénticas) → 1 servicio
- Dependencias: TK-003 (Repository layer)
- Complejidad estimada: L (5 SP)

#### Evidencia del Análisis
- 4 funciones: entrada(142 LOC), salida(156 LOC), traslado(160 LOC), ajuste(116 LOC) = ~574 LOC
- ~80% duplicado entre ellas (loop de items, registrar trazabilidad, flash messages)
- Refactoring: Replace Conditional with Strategy (Fowler) + Extract Method

---

### TK-006 Agregar Validación de Inputs (WTForms/Pydantic)

**Como** equipo de seguridad
**Quiero** que todos los inputs de usuario se validen antes de procesarse
**Para** prevenir datos inválidos, XSS, y mejorar mensajes de error

#### Criterios de Aceptación
- [ ] Dado un form de producto, cuando faltan campos requeridos, entonces se muestran errores específicos
- [ ] Dado un campo numérico, cuando se ingresa texto, entonces se rechaza con mensaje claro
- [ ] Dado input con HTML/JS malicioso, cuando se procesa, entonces se escapa/sanitiza
- [ ] Dado la validación, entonces se ejecuta ANTES de cualquier acceso a BD

#### Notas Técnicas
- Fuente: `analysis/security-patterns.md` (A03: Injection — sin validación de input)
- Componentes afectados: Todas las rutas POST
- Dependencias: TK-004 (Blueprints — facilita agregar forms por módulo)
- Complejidad estimada: M (3 SP)

---

### TK-007 Implementar Paginación

**Como** usuario del sistema
**Quiero** que las listas se paginen correctamente
**Para** evitar cargar miles de registros y mejorar performance

#### Criterios de Aceptación
- [ ] Dado más de 25 registros, cuando se lista, entonces se muestran 25 por página con navegación
- [ ] Dado la página 2, cuando se accede, entonces muestra registros 26-50
- [ ] Dado un filtro activo, cuando se pagina, entonces los filtros se mantienen
- [ ] Dado el kardex (CROSS JOIN), cuando tiene >100 filas, entonces se pagina

#### Notas Técnicas
- Fuente: `behavior/workflows.md` (Workflow 6: "Sin paginación")
- Componentes afectados: Rutas de listado (productos, movimientos, kardex)
- Dependencias: TK-003 (Repository — paginación en la query)
- Complejidad estimada: M (3 SP)

#### Evidencia del Análisis
- `SELECT *` sin LIMIT en productos — `app.py:754`
- Kardex: CROSS JOIN sin LIMIT — `app.py:1952-2100`
- `LIMIT 100` y `LIMIT 50` existen en historial pero no en listados principales

---

### TK-008 Crear Characterization Tests (Golden Masters)

**Como** equipo de desarrollo
**Quiero** tests HTTP que pineen el comportamiento actual de las 19 rutas
**Para** poder refactorizar con confianza de que nada se rompe

#### Criterios de Aceptación
- [ ] Dado cada ruta GET, cuando se invoca, entonces el status code y contenido clave están pinned
- [ ] Dado el login, cuando se envía POST con credenciales válidas, entonces redirect a /
- [ ] Dado una entrada de inventario, cuando se procesa, entonces el stock se incrementa correctamente
- [ ] Dado una salida sin stock, cuando se intenta, entonces se rechaza con mensaje esperado
- [ ] Dado los tests, cuando se ejecutan contra el código actual sin modificar, entonces TODOS pasan

#### Notas Técnicas
- Fuente: `analysis/modernization-assessment.md` (Legacy Readiness D → Characterization Tests primero)
- Componentes afectados: Nuevo `tests/test_characterization.py` usando Flask test client
- Dependencias: Ninguna — es el PRIMER paso antes de cualquier refactoring
- Complejidad estimada: L (5 SP)

#### Evidencia del Análisis
- test_app.py existente tiene 7 tests básicos (16% cobertura) — insuficiente para refactoring seguro
- Feathers: "Characterization tests ANTES de cualquier refactoring"
- Necesario: 1 test por cada ruta × escenario principal = ~30-40 tests

---

### RS-001 Implementar Connection Pool

**Como** equipo de operaciones
**Quiero** que la BD use connection pool en vez de singleton global
**Para** soportar concurrencia sin locks ni race conditions

#### Criterios de Aceptación
- [ ] Dado múltiples requests simultáneos, cuando acceden a la BD, entonces cada uno tiene su propia conexión
- [ ] Dado un request que termina, cuando se cierra, entonces la conexión vuelve al pool
- [ ] Dado la variable `_DB` global, cuando se elimina, entonces el pool es gestionado por SQLAlchemy
- [ ] Dado un pool size configurable, entonces se lee de `POOL_SIZE` env var (default: 5)

#### Notas Técnicas
- Fuente: `analysis/production-readiness.md` (Shared Mutable State)
- Componentes afectados: `app.py:49, 62-70` (conexión global) → SQLAlchemy engine con pool
- Dependencias: TK-002 (SQLAlchemy models)
- Complejidad estimada: S (2 SP)

---

### RS-002 Implementar Rate Limiting

**Como** equipo de seguridad
**Quiero** que los endpoints tengan límite de requests por IP
**Para** prevenir brute force en login y DoS en endpoints costosos

#### Criterios de Aceptación
- [ ] Dado el endpoint /login, cuando se superan 5 intentos/minuto, entonces se retorna 429
- [ ] Dado endpoints generales, cuando se superan 60 req/minuto por IP, entonces 429
- [ ] Dado un usuario bloqueado temporalmente, cuando pasa el tiempo, entonces se desbloquea

#### Notas Técnicas
- Fuente: `analysis/security-patterns.md` (Rate limiting: ❌ Ausente)
- Componentes afectados: Flask-Limiter como middleware global
- Dependencias: TK-004 (Blueprints — más fácil con middleware)
- Complejidad estimada: S (2 SP)

## Referencias

- [Backlog](../backlog.md)
- [Complexity Analysis](../../analysis/complexity-analysis.md)
- [Remediation Plan](../../technical-debt/remediation-plan.md)
- [Architecture — Patterns](../../architecture/patterns.md)
- [Production Readiness](../../analysis/production-readiness.md)
