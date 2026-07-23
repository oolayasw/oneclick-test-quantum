# Diagramas de Secuencia — StockControl

## Secuencia 1: Flujo de Login

```mermaid
sequenceDiagram
    participant B as Browser
    participant F as Flask App
    participant DB as SQLite

    B->>F: GET /login
    F-->>B: HTML formulario login

    B->>F: POST /login (username, password)
    F->>F: md5pw(password)
    F->>DB: SELECT * FROM usuarios<br/>WHERE username='{input}' AND activo=1
    Note over F,DB: SQL Injection - f-string directo
    alt Credenciales validas
        F->>F: session[uid, uname, rol, nombre] = row
        F-->>B: Redirect 302 → /
    else Credenciales invalidas
        F-->>B: HTML con mensaje error
    end
```

**Evidencia:** `app.py:442-498`
**Vulnerabilidad:** Username se concatena directamente en SQL (`app.py:460`).

## Secuencia 2: Registrar Movimiento de Entrada

```mermaid
sequenceDiagram
    participant B as Browser
    participant F as Flask /movimientos/entrada
    participant H as Helper Functions
    participant DB as SQLite

    B->>F: POST (bodega_id, prod[], cant[], costo[], lote[])
    F->>F: Parse items via while loop
    
    alt Sin bodega o sin items
        F-->>B: Flash error + redirect
    else Datos validos
        F->>DB: INSERT movimientos (ENTRADA, bodega, user, fecha)
        F->>DB: SELECT last_insert_rowid()
        
        loop Para cada item (prod_id, cantidad, costo)
            F->>H: get_stock(prod_id, bodega_id)
            H->>DB: SELECT SUM(stock_fisico) FROM existencias
            H-->>F: stock_antes
            F->>H: actualizar_stock(prod_id, bodega_id, +cant, costo)
            H->>DB: UPDATE existencias SET stock_fisico += cant
            Note over H,DB: Si no existe row: INSERT
            H-->>F: stock_despues
            F->>DB: INSERT detalle_movimientos
        end
        
        F->>DB: COMMIT (implicito)
        F-->>B: Flash exito + redirect /movimientos
    end
```

**Evidencia:** `app.py:1228-1370`
**Problemas detectados:**
- Sin transacción explícita (si falla a mitad, estado inconsistente)
- `except Exception: pass` — errores de parseo silenciados (`app.py:1252`)

## Secuencia 3: Consulta de Dashboard

```mermaid
sequenceDiagram
    participant B as Browser
    participant F as Flask /
    participant DB as SQLite

    B->>F: GET / (con session activa)
    F->>F: @auth verifica session[uid]
    
    F->>DB: SELECT COUNT(*) FROM productos WHERE activo=1
    F->>DB: SELECT COUNT(*) FROM bodegas WHERE activo=1
    F->>DB: SELECT COUNT(*) FROM movimientos
    F->>DB: SELECT SUM(stock_fisico*costo_promedio) FROM existencias
    F->>DB: SELECT productos con stock_fisico=0
    F->>DB: SELECT productos con stock < stock_minimo
    F->>DB: SELECT 10 ultimos movimientos con JOINs
    F->>DB: SELECT movimientos por tipo (GROUP BY)
    Note over F,DB: 8 queries separadas (N+1 pattern)
    
    F->>F: Generar HTML con todos los datos
    F-->>B: HTML dashboard completo
```

**Evidencia:** `app.py:477-598`
**Problema:** 8 queries separadas al renderizar cada dashboard — sin cache ni optimización.

## Secuencia 4: API Stock (JSON endpoint)

```mermaid
sequenceDiagram
    participant C as Cliente API
    participant F as Flask /api/stock
    participant DB as SQLite

    C->>F: GET /api/stock
    F->>F: @auth verifica session[uid]
    F->>DB: SELECT e.*, p.nombre as producto,<br/>b.nombre as bodega<br/>FROM existencias e<br/>JOIN productos p<br/>JOIN bodegas b
    DB-->>F: Todas las existencias
    F->>F: jsonify(rows)
    F-->>C: 200 JSON array
```

**Evidencia:** `app.py:1810-1818`
**Problema:** Retorna TODAS las existencias sin paginación ni filtros.

## Secuencia 5: Traslado entre Bodegas

```mermaid
sequenceDiagram
    participant B as Browser
    participant F as Flask /movimientos/traslado
    participant H as Helpers
    participant DB as SQLite

    B->>F: POST (bodega_origen, bodega_destino, items[])
    F->>F: Parse items + validar bodegas diferentes
    
    alt Validacion falla
        F-->>B: Flash error
    else Datos validos
        F->>DB: INSERT movimientos (TRASLADO, origen, destino)
        
        loop Para cada item
            F->>H: get_stock(prod, origen)
            H-->>F: stock_origen_antes
            
            alt stock_origen < cantidad
                F-->>B: Flash "Stock insuficiente"
            else Stock suficiente
                F->>H: actualizar_stock(prod, origen, -cant)
                F->>H: actualizar_stock(prod, destino, +cant)
                F->>DB: INSERT detalle_movimientos (origen)
                F->>DB: INSERT detalle_movimientos (destino)
            end
        end
        
        F-->>B: Flash exito + redirect
    end
```

**Evidencia:** `app.py:1545-1720`
**Problemas:**
- Sin transacción: si falla entre decremento de origen e incremento de destino = stock perdido
- Validación item-por-item (debería validar todos ANTES de ejecutar)

## Hallazgos Clave de los Diagramas

1. **Sin transacciones atómicas**: Operaciones multi-paso sin BEGIN/COMMIT explícito
2. **N+1 queries**: Dashboard ejecuta 8 queries por request
3. **SQL Injection**: Parámetros de usuario inyectados directamente en SQL strings
4. **Error swallowing**: Excepciones capturadas y silenciadas en parseo
5. **Sin paginación**: Todos los endpoints retornan datos sin límite

## Referencias

- [Workflows](../../behavior/workflows.md)
- [Business Logic](../../behavior/business-logic.md)
- [Error Handling](../../behavior/error-handling.md)
- [Security Patterns](../../analysis/security-patterns.md)
