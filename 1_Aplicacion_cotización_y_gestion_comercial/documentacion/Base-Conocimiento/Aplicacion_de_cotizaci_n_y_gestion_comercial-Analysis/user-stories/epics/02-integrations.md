# Épica 2: Gestión Comercial — Clientes y Catálogo

> CRUD completo de clientes, productos y listas de precios con validaciones de negocio.

## HUs de esta Épica

---

### FN-001 CRUD de Clientes

**Como** asesor comercial
**Quiero** gestionar el registro de clientes (crear, editar, consultar, desactivar)
**Para** mantener actualizada la base de clientes para cotizaciones

#### Criterios de Aceptación
- [ ] Dado un usuario autenticado, cuando crea un cliente con NIT, razón social y datos de contacto, entonces el cliente se persiste en BD
- [ ] Dado un NIT que ya existe, cuando se intenta crear otro cliente con el mismo NIT, entonces retorna 409 Conflict con mensaje "Ya existe un cliente con esta identificación"
- [ ] Dado un cliente existente, cuando se editan sus datos, entonces los cambios se persisten manteniendo el ID y fechas de auditoría
- [ ] Dado un cliente, cuando se "elimina", entonces se hace soft delete (activo=false) en vez de borrado físico
- [ ] Dado campos obligatorios (razónSocial, identificación), cuando están vacíos, entonces retorna 400 con lista de errores

#### Notas Técnicas
- Fuente: `behavior/workflows.md` Workflow 5
- Bug actual: Borrado físico en `app.ts`:233 — target: soft delete
- Validación NIT: `app.ts`:199 (ya implementada en backend actual)
- Complejidad estimada: M (5 SP)

#### Evidencia del Análisis
- Validaciones: `behavior/business-logic.md` tabla de validaciones (fila "Razón social requerida", "Identificación requerida", "NIT único")
- Bug borrado: `behavior/workflows.md` Workflow 5 — "Borrado físico permanente"

---

### FN-002 CRUD de Productos

**Como** usuario con rol admin o supervisor
**Quiero** gestionar el catálogo de productos (crear, editar, consultar)
**Para** mantener actualizada la oferta comercial disponible para cotizaciones

#### Criterios de Aceptación
- [ ] Dado un admin/supervisor, cuando crea un producto con código, nombre, descripción, precio base e impuesto, entonces se persiste en BD
- [ ] Dado un código de producto que ya existe, cuando se intenta crear otro con el mismo código, entonces retorna 409 Conflict
- [ ] Dado un producto existente, cuando se edita, entonces los cambios se reflejan en nuevas cotizaciones (no retroactivo)
- [ ] Dado un asesor, cuando intenta crear/editar un producto, entonces recibe 403 Forbidden

#### Notas Técnicas
- Fuente: `reference/api-reference.md` — endpoints de productos
- Validación código único: `app.ts`:262
- Complejidad estimada: M (5 SP)

---

### FN-003 Gestión de Listas de Precios

**Como** supervisor o admin
**Quiero** gestionar listas de precios por segmento de clientes con descuentos máximos
**Para** controlar las condiciones comerciales por tipo de cliente

#### Criterios de Aceptación
- [ ] Dado un supervisor, cuando crea una lista de precios con nombre, segmento, productos asociados y descuento máximo, entonces se persiste en BD
- [ ] Dado una lista de precios, cuando se asocia a un producto, entonces define el precio y descuento máximo aplicable
- [ ] Dado un asesor creando cotización, cuando selecciona lista de precios, entonces los descuentos aplicados NO pueden exceder el descuento máximo de la lista

#### Notas Técnicas
- Fuente: `behavior/business-logic.md` RN-05
- Bug actual: Descuento máximo definido pero NUNCA validado — target: validar en el motor de cálculo
- Datos actuales: `app.ts`:90-92 (descuentoMaximo: 10%, 15%, 25%)
- Complejidad estimada: S (3 SP)

#### Evidencia del Análisis
- Regla RN-05: `behavior/business-logic.md` — "descuento máximo definido pero no aplicado"

---

### FN-012 Búsqueda y Filtrado de Registros

**Como** usuario del sistema
**Quiero** buscar clientes por NIT o razón social, y productos por código o nombre
**Para** encontrar rápidamente el registro que necesito

#### Criterios de Aceptación
- [ ] Dado un texto de búsqueda, cuando se aplica al listado de clientes, entonces filtra por coincidencia parcial en NIT, razón social o nombre de contacto
- [ ] Dado un texto de búsqueda en productos, cuando se aplica, entonces filtra por código, nombre o descripción
- [ ] Dado un filtro de cotizaciones, cuando se aplica por estado, entonces retorna solo las cotizaciones en ese estado (query en BD, no en frontend)

#### Notas Técnicas
- Fuente: `behavior/workflows.md` Workflow 3 — "Filtra por estado... se hace en el frontend"
- Bug actual: Filtrado client-side trayendo TODOS los datos — target: query params en API
- Complejidad estimada: S (3 SP)

---

### FN-013 Historial de Cotizaciones por Cliente

**Como** asesor comercial
**Quiero** ver el historial completo de cotizaciones de un cliente
**Para** conocer la relación comercial y propuestas previas

#### Criterios de Aceptación
- [ ] Dado un cliente, cuando se consulta su detalle, entonces incluye listado paginado de sus cotizaciones con número, fecha, total y estado
- [ ] Dado el historial, cuando se muestra, entonces está ordenado por fecha (más reciente primero)
- [ ] Dado una cotización en el historial, cuando se hace click, entonces navega al detalle de esa cotización

#### Notas Técnicas
- Fuente: `behavior/workflows.md` Workflow 5 — "Detalle incluye historial de cotizaciones inline"
- Implementación actual: `app.ts`:189 muta objeto original (bug) — target: JOIN en BD
- Complejidad estimada: S (2 SP)

## Referencias

- [Backlog](../backlog.md)
- [Workflows](../../behavior/workflows.md)
- [API Reference](../../reference/api-reference.md)
