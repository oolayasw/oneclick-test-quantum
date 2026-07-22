# Épica 3: Seguridad e Identidad

> Implementación de autenticación, autorización y protección de la aplicación desde cero (el sistema actual no tiene seguridad real).

## HUs de esta Épica

---

### SC-001 Autenticación JWT Real

**Como** usuario del sistema
**Quiero** autenticarme con credenciales válidas y recibir un token JWT firmado
**Para** acceder de forma segura a los recursos protegidos del sistema

#### Criterios de Aceptación
- [ ] Dado credenciales válidas (email + password), cuando se invoca POST /auth/login, entonces retorna un JWT firmado con secret (no "fake-jwt-token")
- [ ] Dado el JWT retornado, cuando se incluye en header Authorization, entonces el backend verifica la firma y extrae el payload (userId, rol, exp)
- [ ] Dado un token expirado (TTL: 8 horas), cuando se usa, entonces retorna 401 Unauthorized con mensaje "Token expirado"
- [ ] Dado un request sin token a un endpoint protegido, cuando llega al backend, entonces retorna 401 Unauthorized
- [ ] Dado un login exitoso, cuando se retorna la respuesta, entonces NO incluye el password del usuario (bug actual corregido)
- [ ] Dado el frontend, cuando recibe el token, entonces lo almacena de forma segura (HttpOnly cookie o secure storage)

#### Notas Técnicas
- Fuente: `analysis/security-patterns.md` A01 + A07
- Bug actual: `app.ts`:165 genera "fake-jwt-token-" + timestamp sin firma ni verificación
- Bug actual: `app.ts`:168 retorna password en la respuesta
- Target: `@nestjs/passport` + `@nestjs/jwt` con secret desde env var
- Complejidad estimada: M (5 SP)

#### Evidencia del Análisis
- OWASP A01: `analysis/security-patterns.md` — "Broken Access Control"
- OWASP A07: `analysis/security-patterns.md` — "Identification and Authentication Failures"
- Token actual: `behavior/workflows.md` Workflow 1 — "Token fake"

---

### SC-002 Hashing de Passwords con bcrypt

**Como** sistema
**Quiero** almacenar passwords hasheados con bcrypt (nunca en texto plano)
**Para** proteger las credenciales de los usuarios ante posible brecha de datos

#### Criterios de Aceptación
- [ ] Dado un nuevo usuario, cuando se crea, entonces el password se hashea con bcrypt (salt rounds: 10) antes de persistir
- [ ] Dado un login, cuando se verifica password, entonces se compara con bcrypt.compare() contra el hash almacenado
- [ ] Dado la base de datos, cuando se inspecciona, entonces NINGÚN registro tiene password en texto plano
- [ ] Dado el campo password en la entidad Usuario, cuando se serializa a JSON para respuesta API, entonces el campo password se EXCLUYE (decorator @Exclude)

#### Notas Técnicas
- Fuente: `analysis/security-patterns.md` A02
- Bug actual: `app.ts`:153 — passwords "1234" en texto plano
- Target: bcrypt con salt, @Exclude en entity, custom serialization interceptor
- Complejidad estimada: S (3 SP)

#### Evidencia del Análisis
- OWASP A02: `analysis/security-patterns.md` — "Cryptographic Failures"

---

### SC-003 Sistema de Roles y Permisos (RBAC)

**Como** sistema
**Quiero** validar permisos por rol en el backend antes de ejecutar operaciones
**Para** prevenir escalamiento de privilegios (bug actual: backend no verifica roles)

#### Criterios de Aceptación
- [ ] Dado un endpoint de aprobación, cuando un asesor intenta invocar, entonces retorna 403 Forbidden
- [ ] Dado un supervisor, cuando aprueba/rechaza una cotización, entonces la operación se ejecuta
- [ ] Dado un admin, cuando accede a cualquier operación, entonces tiene acceso total
- [ ] Dado roles definidos (asesor, supervisor, admin), cuando se implementan, entonces usan decoradores `@Roles('supervisor')` en los controladores
- [ ] Dado un guard de roles, cuando el token no tiene el rol requerido, entonces retorna 403 con mensaje "No tiene permisos para esta operación"

#### Notas Técnicas
- Fuente: `behavior/business-logic.md` RN-03
- Bug actual: `cotizacion.component.ts`:250 valida roles SOLO en frontend
- Target: NestJS RolesGuard + @Roles() decorator + metadata de roles en JWT
- Complejidad estimada: M (5 SP)

#### Evidencia del Análisis
- Permisos: `behavior/business-logic.md` RN-03 tabla de permisos
- OWASP A01: `analysis/security-patterns.md` — "Backend no verifica roles"

---

### SC-004 Validación de Input en Backend

**Como** sistema
**Quiero** validar todos los inputs del usuario en el backend con DTOs tipados
**Para** prevenir inyección de datos maliciosos y garantizar integridad

#### Criterios de Aceptación
- [ ] Dado un request con campos faltantes o inválidos, cuando se procesa, entonces retorna 400 con array de errores descriptivos
- [ ] Dado un DTO de creación de cotización, cuando tiene campos extra no definidos, entonces los campos extra se ignoran (whitelist)
- [ ] Dado campos string, cuando contienen HTML/scripts, entonces se sanitizan antes de persistir
- [ ] Dado campos numéricos (cantidad, precio, descuento), cuando son negativos o NaN, entonces se rechazan con error específico

#### Notas Técnicas
- Fuente: `analysis/security-patterns.md` A03
- Situación actual: Validación parcial solo de campos requeridos
- Target: class-validator + class-transformer + ValidationPipe global en NestJS
- Complejidad estimada: S (3 SP)

---

### SC-005 Configuración CORS Restrictiva

**Como** sistema
**Quiero** configurar CORS con origins específicos (no wildcard)
**Para** prevenir que dominios maliciosos accedan a la API

#### Criterios de Aceptación
- [ ] Dado la configuración de CORS, cuando se define, entonces solo permite origins explícitos (localhost en dev, dominio en prod)
- [ ] Dado un request desde un origin no permitido, cuando llega al backend, entonces es rechazado con 403
- [ ] Dado la configuración, cuando se despliega a producción, entonces el origin se lee de variable de entorno

#### Notas Técnicas
- Fuente: `analysis/security-patterns.md` — "CORS completamente abierto"
- Bug actual: `app.ts`:158 — `cors({ origin: '*' })`
- Target: `@nestjs/common` CORS config con whitelist de origins
- Complejidad estimada: S (2 SP)

---

### SC-006 Rate Limiting

**Como** sistema
**Quiero** limitar el número de requests por IP/usuario en ventanas de tiempo
**Para** proteger contra ataques de fuerza bruta y DoS

#### Criterios de Aceptación
- [ ] Dado un endpoint de login, cuando se reciben más de 5 intentos fallidos en 15 minutos desde la misma IP, entonces se bloquea temporalmente
- [ ] Dado endpoints generales, cuando se superan 100 requests/minuto por IP, entonces retorna 429 Too Many Requests
- [ ] Dado un bloqueo temporal, cuando expira el tiempo, entonces el acceso se restaura automáticamente

#### Notas Técnicas
- Fuente: `analysis/security-patterns.md` — "Sin rate limiting"
- Fuente: `analysis/production-readiness.md` — "No backpressure"
- Target: `@nestjs/throttler` con configuración por endpoint
- Complejidad estimada: S (3 SP)

## Referencias

- [Backlog](../backlog.md)
- [Security Patterns](../../analysis/security-patterns.md)
- [Business Logic](../../behavior/business-logic.md)
