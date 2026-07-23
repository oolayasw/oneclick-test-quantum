# Épica 4: Datos y Persistencia

## Descripción

Introducción de la capa de abstracción de datos. El sistema actual usa `var data` global + localStorage. Esta épica crea los interfaces y adapters necesarios para migrar a BD real.

## HUs Contenidas

---

### DT-001 Crear DataStore interface y LocalStorageAdapter

**Como** equipo de desarrollo
**Quiero** una abstracción (interface) para la capa de persistencia
**Para** poder reemplazar localStorage por una BD real sin cambiar la lógica de negocio

#### Criterios de Aceptación
- [ ] Interface `DataStore` con métodos: `getInvoices()`, `saveInvoice()`, `getClients()`, `savePayment()`, etc.
- [ ] `LocalStorageAdapter` implementa `DataStore` con la lógica actual
- [ ] El adapter se inyecta a los services (no se instancia internamente)
- [ ] Tests verifican que el adapter cumple el contrato del interface

#### Notas Técnicas
- Fuente: `technical-debt/remediation-plan.md` (Ola 2, item 2.1)
- Estado actual: `var data` accedido directamente en 14+ funciones — `app.js:7`
- Refactoring: Extract Interface + Introduce Repository (Fowler)
- Complejidad: M
- Dependencias: TK-005, TK-006 (lógica pura extraída primero)

#### Evidencia del Análisis
- Global compartido: `app.js:7` — `var data = {}`
- Serialización: `app.js:39-40` — `localStorage.setItem(..., JSON.stringify(data))`

---

### DT-002 Crear InvoiceService

**Como** equipo de desarrollo
**Quiero** un servicio que encapsule todas las operaciones de facturación
**Para** tener un punto único de lógica de negocio testeable sin DOM

#### Criterios de Aceptación
- [ ] `InvoiceService` recibe `DataStore` por constructor
- [ ] Métodos: `create()`, `emit()`, `annul()`, `getById()`, `search()`
- [ ] Cada método ejecuta validaciones Y lógica de negocio
- [ ] No accede a DOM ni a localStorage directamente
- [ ] 100% cobertura de tests unitarios

#### Notas Técnicas
- Fuente: `technical-debt/remediation-plan.md` (Ola 2, item 2.2)
- Estado actual: `saveInvoice()` hace todo: valida + calcula + persiste + renderiza + audita
- Refactoring: Extract Class (Fowler)
- Complejidad: L
- Dependencias: DT-001, TK-005, TK-006, TK-007

#### Evidencia del Análisis
- God Method: `saveInvoice()` en `app.js:198-269` (~72 LOC, 8 dependencias)

---

### DT-003 Crear PaymentService

**Como** equipo de desarrollo
**Quiero** un servicio que encapsule la lógica de pagos
**Para** separar la distribución de pagos de la capa de presentación

#### Criterios de Aceptación
- [ ] `PaymentService` recibe `DataStore` por constructor
- [ ] Métodos: `apply()`, `getByClient()`, `distribute()`
- [ ] Valida autorización (rol), conciliación (suma = total), límites (no exceder saldo)
- [ ] Actualiza balances y recalcula estados
- [ ] 100% cobertura de tests unitarios

#### Notas Técnicas
- Fuente: `technical-debt/remediation-plan.md` (Ola 2, item 2.3)
- Estado actual: `applyPayment()` — God Method de ~87 LOC
- Refactoring: Extract Class (Fowler)
- Complejidad: L
- Dependencias: DT-001, TK-006, TK-007

#### Evidencia del Análisis
- God Method: `applyPayment()` en `app.js:471-557` (validación + distribución + persistencia + render)

## Resumen de Épica

| Tipo | Cantidad | SP Estimados |
|---|---|---|
| Datos (DT) | 3 | 13 |

## Referencias

- [Backlog](../backlog.md)
- [Remediation Plan](../../technical-debt/remediation-plan.md)
- [Database Schema](../../database/schema-analysis.md)
