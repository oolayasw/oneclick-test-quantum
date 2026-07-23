# Épica 3: Seguridad

## Descripción

Remediación de las vulnerabilidades críticas detectadas. El sistema actual tiene 0 autenticación, 22 puntos XSS, autorización solo cosmética y datos sin cifrar. Esta épica implementa seguridad básica para un sistema financiero.

## HUs Contenidas

---

### SC-001 Implementar autenticación

**Como** administrador del sistema
**Quiero** que todos los usuarios deban autenticarse antes de usar la aplicación
**Para** proteger los datos financieros de accesos no autorizados

#### Criterios de Aceptación
- [ ] Login obligatorio con usuario y contraseña
- [ ] Sesión expira después de 30 minutos de inactividad
- [ ] Contraseñas almacenadas con hash seguro (bcrypt/argon2)
- [ ] Logout manual disponible
- [ ] Token JWT para comunicación con backend

#### Notas Técnicas
- Fuente: `analysis/security-patterns.md` — "A01: Broken Access Control — ❌ Vulnerable"
- Estado actual: `var sessionUser` asignado sin autenticación — `app.js:5`
- Complejidad: L
- Dependencias: IN-001 (Backend para validar credenciales)

#### Evidencia del Análisis
- Sesión simulada: `app.js:5` — `var sessionUser = {name: "Admin", role: "Administrador"}`
- Sin endpoint de login, sin contraseña, sin sesión real

---

### SC-002 Sanitizar XSS (22 puntos de inyección)

**Como** equipo de desarrollo
**Quiero** eliminar todos los puntos de XSS reflejado
**Para** evitar que un atacante inyecte código malicioso

#### Criterios de Aceptación
- [ ] 0 usos de `innerHTML` con datos de usuario
- [ ] Reemplazar con `textContent`, DOM API o template engine seguro
- [ ] Template strings que generan HTML usan función de escape
- [ ] Test automatizado que verifica ausencia de innerHTML con inputs

#### Notas Técnicas
- Fuente: `analysis/security-patterns.md` — "A03: Injection — 22 puntos de inyección"
- Estado actual: `innerHTML` en funciones `render*()` concatenando datos de usuario
- Complejidad: L (22 puntos distribuidos en 9 funciones de rendering)
- Dependencias: TK-005 a TK-010 (extract logic primero, luego sanitizar)

#### Evidencia del Análisis
- 22 usos de innerHTML con datos no sanitizados en funciones render*

---

### SC-003 Implementar RBAC real (backend)

**Como** administrador
**Quiero** que los permisos por rol se validen en el servidor
**Para** que un usuario no pueda eludir restricciones manipulando el frontend

#### Criterios de Aceptación
- [ ] 3 roles definidos: Administrador, Analista de Cartera, Facturador
- [ ] Facturador: solo facturación (crear, emitir, PDF, enviar)
- [ ] Analista: facturación + pagos + recordatorios + CxC
- [ ] Admin: todo + notas crédito + anulación + configuración
- [ ] Permisos validados en el backend (no solo en UI)

#### Notas Técnicas
- Fuente: `analysis/security-patterns.md` — "Autorización cosmética (solo UI)"
- Estado actual: Solo 1 validación de rol en `applyPayment()` — `app.js:479-480`
- Complejidad: M
- Dependencias: SC-001 (Auth), IN-001 (Backend)

#### Evidencia del Análisis
- Única validación: `app.js:479-480` — "Facturador no registra pagos"
- Roles definidos: `index.html:34-38` — dropdown sin protección

---

### SC-004 Cifrar datos sensibles en persistencia

**Como** responsable de seguridad
**Quiero** que los datos financieros estén cifrados en reposo
**Para** cumplir con estándares mínimos de protección de datos

#### Criterios de Aceptación
- [ ] Si se usa localStorage (transición), datos cifrados con AES-256
- [ ] En BD definitiva: cifrado de columnas sensibles (montos, NIT)
- [ ] Claves de cifrado NO almacenadas en código fuente

#### Notas Técnicas
- Fuente: `analysis/security-patterns.md` — "Datos en texto plano en localStorage"
- Estado actual: `JSON.stringify(data)` sin cifrado — `app.js:39-40`
- Complejidad: M
- Dependencias: DT-001 (DataStore — el cifrado va en el adapter)

#### Evidencia del Análisis
- Persistencia en texto plano: `app.js:39-40`

---

### SC-005 Validación de inputs (formato y seguridad)

**Como** equipo de desarrollo
**Quiero** validar formato de todos los inputs del usuario
**Para** prevenir inyecciones y datos corruptos

#### Criterios de Aceptación
- [ ] NIT validado con formato colombiano (9 dígitos + DV)
- [ ] Email validado con regex estándar
- [ ] Montos: solo números positivos, máximo 2 decimales
- [ ] Fechas: formato ISO o DD/MM/YYYY
- [ ] Textos: longitud máxima, caracteres permitidos

#### Notas Técnicas
- Fuente: `behavior/business-logic.md` — "Sin validación de formato"
- Estado actual: Solo validación de existencia (`!value`), nunca de formato
- Complejidad: M
- Dependencias: TK-007 (validators extraídos)

#### Evidencia del Análisis
- `Number()` sin verificar NaN: `app.js:125-126`
- Sin regex para NIT, email, fechas

---

### SC-006 HTTPS y Content Security Policy

**Como** equipo de operaciones
**Quiero** que la aplicación solo funcione sobre HTTPS con headers de seguridad
**Para** prevenir ataques de red y inyección de scripts

#### Criterios de Aceptación
- [ ] Redirect HTTP → HTTPS automático
- [ ] Headers: `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`
- [ ] SRI (Subresource Integrity) en todos los scripts de CDN
- [ ] `Referrer-Policy: strict-origin`

#### Notas Técnicas
- Fuente: `analysis/security-patterns.md` — "CDN sin SRI"
- Estado actual: Scripts de CDN sin integrity — `index.html:7-8, 228-231`
- Complejidad: S (configuración de servidor/CDN)
- Dependencias: MG-003 (container con nginx/caddy)

#### Evidencia del Análisis
- CDN sin SRI: `index.html:7-8` — jQuery y Bootstrap sin integrity hash

## Resumen de Épica

| Tipo | Cantidad | SP Estimados |
|---|---|---|
| Seguridad (SC) | 6 | 34 |
| Prioridad Crítica | 3 (SC-001, SC-002, SC-003) | 21 |
| Prioridad Alta | 3 (SC-004, SC-005, SC-006) | 13 |

## Referencias

- [Backlog](../backlog.md)
- [Security Patterns](../../analysis/security-patterns.md)
- [Business Logic](../../behavior/business-logic.md)
