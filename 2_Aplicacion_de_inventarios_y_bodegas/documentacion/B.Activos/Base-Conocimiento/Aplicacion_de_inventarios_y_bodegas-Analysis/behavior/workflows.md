# Workflows del Sistema — StockControl

## Workflow 1: Autenticación de Usuario

**Entrada:** Username + Password via form POST
**Salida:** Redirect a Dashboard (éxito) o mensaje de error (fallo)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Flask /login
    participant DB as SQLite

    U->>F: POST /login (username, password)
    F->>F: md5pw(password)
    F->>DB: SELECT * FROM usuarios WHERE username='...' AND activo=1
    Note over F,DB: SQL INJECTION - concatenacion directa
    alt Usuario encontrado AND password match
        F->>F: session[uid, uname, rol, nombre] = datos
        F->>U: Redirect /
    else Credenciales invalidas
        F->>U: "Usuario o contrasena incorrectos"
    end
```

**Evidencia:** `app.py:442-498`
**Vulnerabilidad:** SQL Injection en la query de login (`app.py:460`) — el username se concatena directamente.

---

## Workflow 2: Registrar Entrada de Inventario

**Entrada:** Bodega destino + lista de productos con cantidades y costos
**Salida:** Movimiento registrado + stock actualizado

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Flask /movimientos/entrada
    participant DB as SQLite
    participant H as Helper actualizar_stock()

    U->>F: POST (bodega_id, items[prod, cant, costo, lote])
    F->>F: Parsear items del form (while loop)
    alt Bodega no seleccionada o sin items
        F->>U: Flash error
    else Datos validos
        F->>DB: INSERT movimientos (tipo=ENTRADA)
        F->>DB: SELECT last_insert_rowid()
        loop Por cada item
            F->>H: get_stock(prod_id, bod_id)
            H->>DB: SELECT SUM(stock_fisico) FROM existencias
            H-->>F: stock_antes
            F->>H: actualizar_stock(prod_id, bod_id, +cantidad, costo)
            H->>DB: UPDATE/INSERT existencias
            H-->>F: stock_despues
            F->>DB: INSERT detalle_movimientos (antes, despues)
        end
        F->>DB: COMMIT
        F->>U: Flash exito + redirect /movimientos
    end
```

**Evidencia:** `app.py:1228-1370`
**Problema:** Sin transacción explícita — si falla a mitad del loop, los primeros items ya están actualizados.

---

## Workflow 3: Registrar Salida de Inventario

**Entrada:** Bodega origen + lista de productos con cantidades
**Salida:** Movimiento registrado + stock decrementado

```mermaid
flowchart TD
    A["POST /movimientos/salida"] --> B["Parsear items del form"]
    B --> C{"Bodega y items validos?"}
    C -->|No| ERR1["Flash error"]
    C -->|Si| D["Verificar stock por cada item"]
    D --> E{"Stock suficiente para TODOS?"}
    E -->|No| ERR2["Flash 'Stock insuficiente'<br/>con detalle por producto"]
    E -->|Si| F["INSERT movimientos tipo=SALIDA"]
    F --> G["Loop: por cada item"]
    G --> H["get_stock() → antes"]
    H --> I["actualizar_stock(prod, bod, -cant)"]
    I --> J["INSERT detalle_movimientos"]
    J --> K{"Mas items?"}
    K -->|Si| G
    K -->|No| L["COMMIT"]
    L --> M["Flash exito + redirect"]

    style A fill:#e17055,color:#fff
    style ERR1 fill:#d63031,color:#fff
    style ERR2 fill:#d63031,color:#fff
    style M fill:#00b894,color:#fff
```

**Evidencia:** `app.py:1372-1528`
**Diferencia con Entrada:** Valida stock ANTES de ejecutar + no registra costo.

---

## Workflow 4: Traslado entre Bodegas

**Entrada:** Bodega origen + Bodega destino + lista de productos
**Salida:** Stock decrementado en origen + incrementado en destino

**Flujo:** Idéntico a Salida (validación de stock en origen) + `actualizar_stock()` positivo en destino.

**Evidencia:** `app.py:1530-1690`
**Validación extra:** `bod_ori == bod_dst` → error "Origen y destino deben ser diferentes" (`app.py:1564`)

---

## Workflow 5: Ajuste de Inventario

**Entrada:** Bodega + Producto + Cantidad física contada
**Salida:** Stock ajustado al valor real + movimiento AJUSTE_POS/AJUSTE_NEG registrado

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Flask /movimientos/ajuste
    participant API as /api/stock
    participant DB as SQLite

    U->>API: GET /api/stock?prod=X&bod=Y (via JS fetch)
    API->>DB: SELECT SUM(stock_fisico)
    API-->>U: {"stock": N}
    U->>U: Ver stock sistema vs ingresar cantidad fisica
    U->>F: POST (bodega_id, producto_id, cantidad_fisica, motivo)
    F->>F: diferencia = cantidad_fisica - stock_actual
    F->>F: tipo = AJUSTE_POS si diff >= 0 else AJUSTE_NEG
    F->>DB: INSERT movimientos (tipo, ref='AJ-YYYYMMDD')
    F->>DB: UPDATE existencias SET stock_fisico=cantidad_fisica
    F->>DB: INSERT detalle_movimientos
    F->>DB: COMMIT
    F->>U: Flash "Ajuste registrado: +/-N unidades"
```

**Evidencia:** `app.py:1692-1808`
**Nota:** El ajuste es la única operación que **establece** un valor absoluto en vez de sumar/restar un delta.

---

## Workflow 6: Consulta de Kardex (Existencias cruzadas)

**Entrada:** Filtros opcionales (producto, bodega, categoría, estado de stock)
**Salida:** Tabla cruzada Producto × Bodega con stock, valor y alertas

**SQL principal:** CROSS JOIN entre `productos` y `bodegas` con LEFT JOIN a `existencias` — genera producto cartesiano de todas las combinaciones posibles.

**Evidencia:** `app.py:1952-2100`
**Problema de rendimiento:** Con 100 productos × 10 bodegas = 1,000 filas sin paginación.

---

## Workflow 7: Dashboard (KPIs)

**Entrada:** Request GET / (autenticado)
**Salida:** Página con 8+ indicadores calculados

| KPI | Query | Evidencia |
|---|---|---|
| Total productos activos | `SELECT COUNT(*)` | `app.py:519` |
| Total bodegas activas | `SELECT COUNT(*)` | `app.py:520` |
| Valor de inventario | SUM(stock × costo) en Python | `app.py:522-527` |
| Productos agotados | Subquery con GROUP BY HAVING | `app.py:529-534` |
| Bajo stock mínimo | Subquery similar | `app.py:536-542` |
| Entradas del mes | COUNT con LIKE mes | `app.py:544-546` |
| Salidas del mes | COUNT con LIKE mes | `app.py:547-549` |
| Últimos 10 movimientos | JOIN + ORDER BY DESC LIMIT 10 | `app.py:551-557` |
| Alertas de stock | GROUP BY HAVING tot <= min LIMIT 6 | `app.py:559-566` |
| Mayor rotación | COUNT detalle_movimientos | `app.py:568-573` |

**Problema:** 10+ queries separadas en una sola función de 205 líneas.

## Hallazgos Clave

1. **7 workflows principales** cubren toda la funcionalidad del sistema
2. **Copy-paste entre movimientos** — Entrada, Salida y Traslado son ~80% iguales
3. **Sin transacciones atómicas** — El loop de items puede fallar a mitad dejando datos inconsistentes
4. **Validación solo en salida/traslado** — Entrada no valida nada más que campos obligatorios
5. **Dashboard es el más costoso** — 10+ queries sin cache ni materialización

## Referencias

- [business-logic.md](business-logic.md)
- [decision-logic.md](decision-logic.md)
- [../architecture/components.md](../architecture/components.md)
- [../database/schema-analysis.md](../database/schema-analysis.md)
