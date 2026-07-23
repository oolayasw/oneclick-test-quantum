# Épica 4: Datos y Persistencia — StockControl

## Descripción

Migrar la capa de datos desde SQLite embebido a PostgreSQL managed, implementar ORM con SQLAlchemy, y activar funcionalidad de datos que existe como schema pero no tiene lógica (reservas, lotes, costo promedio ponderado).

---

### DT-001 Implementar Reserva de Stock

**Como** operador de bodega
**Quiero** que se pueda reservar stock para pedidos pendientes
**Para** evitar vender producto ya comprometido

#### Criterios de Aceptación
- [ ] Dado un producto con stock_reservado > 0, cuando se valida salida, entonces stock_disponible = stock_fisico - stock_reservado
- [ ] Dado una reserva, cuando se confirma el despacho, entonces se convierte en salida real
- [ ] Dado una reserva, cuando se cancela, entonces el stock_reservado se libera

#### Notas Técnicas
- Fuente: `behavior/business-logic.md` (Lógica Ausente: "Reserva de stock")
- Evidencia: Columna `stock_reservado REAL DEFAULT 0` existe en tabla `existencias` (`app.py:114`) pero siempre es 0
- Complejidad estimada: M (3 SP)

---

### DT-002 Implementar Control de Lotes/Vencimiento

**Como** supervisor de almacén
**Quiero** rastrear lotes y fechas de vencimiento por movimiento
**Para** implementar FIFO/FEFO y alertar productos próximos a vencer

#### Criterios de Aceptación
- [ ] Dado una entrada con lote y fecha_vencimiento, cuando se registra, entonces se asocian al detalle
- [ ] Dado una salida, cuando se selecciona producto, entonces se sugiere FIFO (lote más antiguo)
- [ ] Dado productos próximos a vencer (30 días), entonces aparece alerta en dashboard

#### Notas Técnicas
- Fuente: `behavior/business-logic.md` (Lógica Ausente: "Control de lote/vencimiento")
- Evidencia: Campos `lote TEXT, fecha_vencimiento TEXT` existen en `detalle_movimientos` (`app.py:133-134`) pero no se validan
- Complejidad estimada: L (5 SP)

---

### DT-003 Implementar Costo Promedio Ponderado

**Como** contador
**Quiero** que el costo promedio se calcule con fórmula ponderada
**Para** que el valor del inventario sea correcto contablemente

#### Criterios de Aceptación
- [ ] Dado una entrada con costo, cuando se procesa, entonces: `nuevo_promedio = (stock_actual × costo_actual + cantidad_nueva × costo_nuevo) / (stock_actual + cantidad_nueva)`
- [ ] Dado una entrada sin costo (costo=0), cuando se procesa, entonces el costo promedio no cambia
- [ ] Dado el valor del inventario en dashboard, entonces se calcula como `SUM(stock × costo_promedio)` con el cálculo correcto

#### Notas Técnicas
- Fuente: `behavior/business-logic.md` (RN-06: "Sin fórmula de promedio ponderado")
- Evidencia: `app.py:289-291` — actualmente sobrescribe el costo sin promediar
- Complejidad estimada: S (2 SP)

## Referencias

- [Backlog](../backlog.md)
- [Schema Analysis](../../database/schema-analysis.md)
- [Business Logic](../../behavior/business-logic.md)
