# Épica 3: Seguridad — StockControl

## Descripción

Corregir las vulnerabilidades críticas de seguridad detectadas en el sistema: SQL Injection, hashing inseguro, secrets hardcoded, ausencia de CSRF y falta de autorización por rol. Estas son las HUs de máxima prioridad (Ola 0).

## Dependencias

- Sin dependencias previas — se ejecutan primero
- Habilita: Todo el resto del backlog (sin estos fixes, el sistema es inseguro)

---

### SC-001 Parametrizar Queries SQL (Fix Injection)

**Como** equipo de seguridad
**Quiero** que todas las queries usen parámetros en lugar de concatenación de strings
**Para** eliminar la vulnerabilidad de SQL Injection en 7 puntos del código

#### Criterios de Aceptación
- [ ] Dado cualquier input de usuario, cuando se usa en una query SQL, entonces usa `?` placeholder con tuple
- [ ] Dado el login form, cuando se inyecta `' OR 1=1--`, entonces falla la autenticación (no bypass)
- [ ] Dado los filtros de productos, cuando se inyecta SQL, entonces se tratan como texto literal
- [ ] Dado la verificación de código duplicado, cuando el código tiene comillas, entonces no causa error

#### Notas Técnicas
- Fuente: `analysis/security-patterns.md` (Vulnerabilidad Crítica #1)
- Componentes afectados: `app.py:448, 757, 759, 761, 848, 882, 1962`
- Dependencias: Ninguna
- Complejidad estimada: S (2 SP)

#### Evidencia del Análisis
- SQL vulnerable: `"WHERE username='" + u + "'"` → debe ser `"WHERE username=?", (u,)`
- 7 puntos de inyección confirmados en `analysis/security-patterns.md`
- Refactoring: Replace String Concatenation with Parameterized Query (Fowler: Replace Type Code)

---

### SC-002 Reemplazar MD5 por bcrypt

**Como** equipo de seguridad
**Quiero** que los passwords se hasheen con bcrypt en lugar de MD5
**Para** proteger las credenciales de usuarios contra ataques de fuerza bruta

#### Criterios de Aceptación
- [ ] Dado un nuevo usuario, cuando se crea, entonces su password se almacena con bcrypt+salt
- [ ] Dado un login exitoso con password MD5 legacy, entonces se re-hashea a bcrypt transparentemente
- [ ] Dado un login con password incorrecto, entonces se rechaza sin revelar si el usuario existe
- [ ] Dado el almacenamiento, entonces NUNCA se guarda plain text ni MD5

#### Notas Técnicas
- Fuente: `analysis/security-patterns.md` (Vulnerabilidad Crítica #2)
- Componentes afectados: `app.py:265` (función `md5pw`), ruta login, seeds de usuarios
- Dependencias: Ninguna
- Complejidad estimada: M (3 SP)

#### Evidencia del Análisis
- Función actual: `hashlib.md5(p.encode()).hexdigest()` — `app.py:265`
- MD5 es criptográficamente roto — rainbow tables disponibles públicamente
- Refactoring: Replace Data Value with Object (Password strategy)

---

### SC-003 Externalizar Secrets y Configuración

**Como** equipo de operaciones
**Quiero** que secrets y configuración se lean de variables de entorno
**Para** evitar exponer credenciales en el código y habilitar multi-ambiente

#### Criterios de Aceptación
- [ ] Dado el SECRET_KEY, cuando se despliega, entonces se lee de `os.environ['SECRET_KEY']`
- [ ] Dado DEBUG mode, cuando es producción, entonces `FLASK_DEBUG=false`
- [ ] Dado DATABASE_URL, cuando se configura, entonces se conecta a la BD indicada por la variable
- [ ] Dado la ausencia de una variable requerida, entonces la app falla con mensaje claro al inicio

#### Notas Técnicas
- Fuente: `analysis/security-patterns.md` (STRIDE: Spoofing)
- Componentes afectados: `app.py:44-48` (CLAVE, DEBUG, HOST, PORT, DATABASE)
- Dependencias: Ninguna
- Complejidad estimada: S (1 SP)

#### Evidencia del Análisis
- Actual: `CLAVE = 'stockcontrol_dev_KEY_123'` hardcoded — `app.py:44`
- Actual: `DEBUG = True` hardcoded — `app.py:44`
- Refactoring: Introduce Parameter (env var) — Fowler

---

### SC-004 Implementar Autorización por Rol (RBAC)

**Como** administrador del sistema
**Quiero** que cada rol tenga permisos diferenciados
**Para** que operadores no puedan acceder a funciones administrativas

#### Criterios de Aceptación
- [ ] Dado un usuario con rol "operador", cuando intenta acceder a gestión de usuarios, entonces recibe 403
- [ ] Dado un usuario con rol "admin", cuando accede a cualquier función, entonces tiene acceso completo
- [ ] Dado un usuario con rol "consulta", cuando intenta crear/editar, entonces recibe 403
- [ ] Dado la definición de roles, entonces se mapea: admin=todo, operador=movimientos+consulta, consulta=solo lectura

#### Notas Técnicas
- Fuente: `behavior/business-logic.md` (Lógica Ausente: "Autorización por rol")
- Componentes afectados: Nuevo decorator `require_role()`, todas las rutas
- Dependencias: SC-002 (auth moderna primero)
- Complejidad estimada: M (3 SP)

#### Evidencia del Análisis
- Gap actual: `auth()` decorator solo verifica `session['uid']` — no verifica rol (`app.py:298-305`)
- Roles definidos en BD: `admin, gerente_operaciones, jefe_bodega, operador` — `app.py:158-164`
- 4 roles existen pero 0 se verifican

---

### SC-005 Agregar Protección CSRF

**Como** equipo de seguridad
**Quiero** que todos los formularios tengan token CSRF
**Para** prevenir ataques de Cross-Site Request Forgery

#### Criterios de Aceptación
- [ ] Dado cualquier form POST, cuando no tiene token CSRF válido, entonces se rechaza con 400
- [ ] Dado un form renderizado, cuando se muestra al usuario, entonces incluye campo hidden con token
- [ ] Dado el token CSRF, cuando expira, entonces se solicita refresh de la página

#### Notas Técnicas
- Fuente: `analysis/security-patterns.md` (CSRF ausente)
- Componentes afectados: Todos los formularios (19 rutas POST)
- Dependencias: TK-001 (Extraer templates — más fácil agregar CSRF con templates externos)
- Complejidad estimada: M (3 SP)

#### Evidencia del Análisis
- Sin Flask-WTF ni flask-csrf detectados en `requirements.txt`
- 0 tokens CSRF en ningún formulario — `app.py` completo
- Implementar con Flask-WTF (`CSRFProtect(app)`)

## Referencias

- [Backlog](../backlog.md)
- [Security Patterns](../../analysis/security-patterns.md)
- [Remediation Plan](../../technical-debt/remediation-plan.md)
