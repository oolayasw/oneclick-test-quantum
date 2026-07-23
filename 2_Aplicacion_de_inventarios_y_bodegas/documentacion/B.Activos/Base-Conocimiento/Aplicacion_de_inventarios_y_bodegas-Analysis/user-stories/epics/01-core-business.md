# Épica 1: Core Business — StockControl

## Descripción

Refactorizar la funcionalidad principal del sistema de inventarios: gestión de productos, bodegas, movimientos de stock y consulta de kardex. El refactoring preserva la lógica de negocio existente pero la implementa con servicios separados, validaciones robustas y estructura modular.

## Dependencias

- Requiere: TK-004 (Blueprints extraídos) y TK-005 (Movimientos unificados)
- Habilita: DT-001, DT-002, DT-003 (funcionalidad pendiente)

---

### FN-001 Gestionar Productos (CRUD completo)

**Como** administrador de inventario
**Quiero** crear, editar, listar y desactivar productos
**Para** mantener actualizado el catálogo del sistema

#### Criterios de Aceptación
- [ ] Dado un producto nuevo, cuando se crea con código único, entonces se persiste con estado activo
- [ ] Dado un producto existente, cuando se edita, entonces el código permanece inmutable (readonly)
- [ ] Dado un producto activo, cuando se desactiva, entonces cambia a `estado=0` (soft delete)
- [ ] Dado un código duplicado, cuando se intenta crear, entonces se muestra error "Código ya existe"
- [ ] Dado un listado de productos, cuando se filtra por nombre/categoría/estado, entonces los resultados son correctos

#### Notas Técnicas
- Fuente: `behavior/workflows.md`, `behavior/business-logic.md` (RN-04)
- Componentes afectados: `routes/productos.py`, `services/producto_service.py`, `repositories/producto_repo.py`
- Dependencias: TK-002, TK-003, TK-004
- Complejidad estimada: M (3 SP)

#### Evidencia del Análisis
- Lógica actual: `app.py:741-1040` — CRUD con filtros, soft delete, validación de código único
- Reglas de negocio: Código único e inmutable, estado binario 0/1, soft delete en lugar de DELETE

---

### FN-002 Gestionar Bodegas (CRUD completo)

**Como** administrador de inventario
**Quiero** crear, editar, listar y desactivar bodegas
**Para** definir las ubicaciones físicas de almacenamiento

#### Criterios de Aceptación
- [ ] Dado una bodega nueva, cuando se crea con datos válidos, entonces se persiste con `activa=1`
- [ ] Dado una bodega activa, cuando se desactiva, entonces no aparece en selects de movimientos
- [ ] Dado una bodega con capacidad, cuando se muestra, entonces el % de uso es visual (no bloqueante)

#### Notas Técnicas
- Fuente: `behavior/business-logic.md` (RN-05)
- Componentes afectados: `routes/bodegas.py`, `services/bodega_service.py`
- Dependencias: TK-002, TK-003, TK-004
- Complejidad estimada: S (2 SP)

#### Evidencia del Análisis
- Lógica actual: `app.py:1044-1226` — CRUD con toggle activa, capacidad como campo visual
- Regla: Solo bodegas activas aparecen en operaciones (`WHERE activa=1`)

---

### FN-003 Registrar Entrada de Inventario

**Como** operador de bodega
**Quiero** registrar la entrada de productos a una bodega
**Para** incrementar el stock y mantener trazabilidad

#### Criterios de Aceptación
- [ ] Dado una bodega y lista de items, cuando se registra entrada, entonces el stock se incrementa por cada item
- [ ] Dado una entrada con costo, cuando se procesa, entonces el costo promedio se actualiza
- [ ] Dado una entrada exitosa, entonces se registra `existencia_antes` y `existencia_despues` por item
- [ ] Dado un error en el proceso, entonces se ejecuta ROLLBACK completo (transacción atómica)

#### Notas Técnicas
- Fuente: `behavior/workflows.md` (Workflow 2)
- Componentes afectados: `services/inventario_service.py` (método `registrar_entrada`)
- Dependencias: TK-005 (Unificar movimientos)
- Complejidad estimada: M (3 SP)

#### Evidencia del Análisis
- Lógica actual: `app.py:1228-1370` — Loop de items sin transacción explícita
- Regla: `actualizar_stock(prod, bod, +cant, costo)` — `app.py:1306-1310`
- Gap detectado: Sin transacción atómica — `behavior/workflows.md` Workflow 2

---

### FN-004 Registrar Salida de Inventario

**Como** operador de bodega
**Quiero** registrar la salida de productos de una bodega
**Para** decrementar el stock con validación de disponibilidad

#### Criterios de Aceptación
- [ ] Dado una salida, cuando el stock es suficiente para TODOS los items, entonces se procesa completa
- [ ] Dado una salida, cuando algún item no tiene stock suficiente, entonces se rechaza TODA la operación con detalle
- [ ] Dado una salida exitosa, entonces se registra trazabilidad (antes/después) por item
- [ ] Dado el stock resultante, entonces NUNCA es negativo (`max(0.0, ...)`)

#### Notas Técnicas
- Fuente: `behavior/workflows.md` (Workflow 3), `behavior/business-logic.md` (RN-01)
- Componentes afectados: `services/inventario_service.py` (método `registrar_salida`)
- Dependencias: TK-005
- Complejidad estimada: M (3 SP)

#### Evidencia del Análisis
- Lógica actual: `app.py:1372-1528` — Validación previa `if stk < cant`
- Regla: Stock nunca negativo + validación pre-ejecución completa

---

### FN-005 Registrar Traslado entre Bodegas

**Como** operador de bodega
**Quiero** trasladar productos de una bodega a otra
**Para** redistribuir inventario manteniendo trazabilidad

#### Criterios de Aceptación
- [ ] Dado un traslado, cuando origen y destino son la misma bodega, entonces se rechaza con error
- [ ] Dado un traslado, cuando hay stock suficiente en origen, entonces se decrementa en origen y se incrementa en destino
- [ ] Dado un traslado, cuando no hay stock en origen, entonces se rechaza con detalle por item

#### Notas Técnicas
- Fuente: `behavior/workflows.md` (Workflow 4), `behavior/business-logic.md` (RN-02)
- Componentes afectados: `services/inventario_service.py` (método `registrar_traslado`)
- Dependencias: TK-005
- Complejidad estimada: M (3 SP)

#### Evidencia del Análisis
- Lógica actual: `app.py:1530-1690` — Validación `bod_ori == bod_dst` → error
- Regla: Bodegas origen/destino deben ser diferentes — `app.py:1564`

---

### FN-006 Ajustar Inventario

**Como** supervisor de almacén
**Quiero** ajustar el stock al valor físico real contado
**Para** conciliar diferencias entre sistema y realidad

#### Criterios de Aceptación
- [ ] Dado un ajuste, cuando la cantidad física > stock sistema, entonces se genera AJUSTE_POS
- [ ] Dado un ajuste, cuando la cantidad física < stock sistema, entonces se genera AJUSTE_NEG
- [ ] Dado un ajuste, entonces el stock se ESTABLECE al valor físico (no suma/resta delta)
- [ ] Dado un ajuste, entonces se genera referencia automática `'AJ-' + fecha`

#### Notas Técnicas
- Fuente: `behavior/workflows.md` (Workflow 5), `behavior/business-logic.md` (RN-02)
- Componentes afectados: `services/inventario_service.py` (método `ajustar_inventario`)
- Dependencias: TK-005
- Complejidad estimada: M (3 SP)

#### Evidencia del Análisis
- Lógica actual: `app.py:1692-1808` — Único tipo que establece valor absoluto
- Regla: `stock_fisico = cantidad_fisica` — `app.py:1755-1760`

---

### FN-007 Consultar Kardex (Stock cruzado)

**Como** supervisor de almacén
**Quiero** ver una tabla cruzada Producto × Bodega con stock, valor y alertas
**Para** tener visibilidad completa del inventario

#### Criterios de Aceptación
- [ ] Dado un kardex, cuando se consulta sin filtros, entonces muestra CROSS JOIN producto × bodega
- [ ] Dado filtros (producto, bodega, categoría), cuando se aplican, entonces la tabla se reduce
- [ ] Dado un producto con stock ≤ stock_mínimo, entonces se muestra alerta visual
- [ ] Dado un kardex grande (>100 filas), entonces se pagina correctamente

#### Notas Técnicas
- Fuente: `behavior/workflows.md` (Workflow 6)
- Componentes afectados: `routes/kardex.py`, `repositories/existencia_repo.py`
- Dependencias: TK-007 (Paginación)
- Complejidad estimada: L (5 SP)

#### Evidencia del Análisis
- Lógica actual: `app.py:1952-2100` — CROSS JOIN sin paginación
- Problema: Con 100 productos × 10 bodegas = 1,000 filas sin paginación

## Referencias

- [Backlog](../backlog.md)
- [Workflows](../../behavior/workflows.md)
- [Business Logic](../../behavior/business-logic.md)
- [Migration — Component Order](../../migration/component-order.md)
