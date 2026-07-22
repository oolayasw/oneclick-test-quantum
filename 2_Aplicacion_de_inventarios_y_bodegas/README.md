# StockControl - Aplicación de Inventarios y Bodegas

> **APLICACION DE EJERCICIO DE MODERNIZACION**  
> Esta aplicación usa una implementación **monolítica** en Python e incluye **malas prácticas intencionales** para análisis y modernización.

## Stack Tecnológico (Obsoleto / Intencional)

| Capa | Tecnología | Versión | Estado |
|------|-----------|---------|--------|
| Backend + UI | Flask | 2.2.5 | Desactualizado |
| Servidor WSGI dev | Werkzeug | 2.2.3 | Desactualizado |
| Base de datos | SQLite | local file | No apta para escenarios empresariales concurrentes |
| Lenguaje | Python | compatible con 3.13 (con estilo legado) | Diseño intencionalmente no moderno |

## Malas Prácticas Implementadas

### Backend monolítico
- God Module: toda la aplicación en un solo archivo [app.py](App/app.py).
- God Function: `iniciar()` crea esquema, carga seed y configura runtime.
- Estado global mutable: conexión global `_DB`.
- SQL Injection: concatenación directa en múltiples filtros y consultas.
- Autenticación débil: hash MD5 y credenciales hardcodeadas.
- Mezcla de capas: HTML, lógica y acceso a datos en los mismos handlers.
- Código duplicado: flujos de Entrada/Salida/Traslado con copy-paste.
- Magic numbers y validaciones mínimas.
- Debug activo y host abierto (`0.0.0.0`) en ejecución local.

### Antipatrones
- Spaghetti code.
- No separación por capas ni blueprint/controllers/services.
- Sin migraciones versionadas de base de datos.
- Manejo de errores inconsistente.
- No tests unitarios automatizados en la app principal.

## Funcionalidad Implementada

La aplicación incluye las pantallas del documento para inventarios y bodegas:

1. Login.
2. Dashboard de inventario.
3. Catálogo de productos.
4. Gestión de bodegas.
5. Registro de movimientos:
   - Entrada.
   - Salida.
   - Traslado.
   - Ajuste.
6. Historial de movimientos.
7. Existencias y kardex.
8. Detalle de kardex por producto/bodega.

## Estructura del Proyecto

```text
2_Aplicacion_de_inventarios_y_bodegas/
├── App/
│   ├── app.py
│   ├── requirements.txt
│   ├── test_app.py
│   └── stock.db              # puede estar bloqueado si la app está en ejecución
├── documentacion/            # vacía por ahora
└── README.md
```

## Cómo Ejecutar

### 1) Instalar dependencias

```bash
cd 2_Aplicacion_de_inventarios_y_bodegas
cd App
pip install -r requirements.txt
```

### 2) Iniciar aplicación

```bash
python app.py
```

Servidor:
- http://127.0.0.1:5001

## Credenciales de Demo

| Usuario | Password | Rol |
|---------|----------|-----|
| admin | admin123 | ADMIN |
| bodeguero1 | bodega123 | AUXILIAR |
| auditor1 | audit123 | AUDITOR |
| inventario1 | inv2024 | ADMIN_INV |

## Endpoints y Rutas Principales

```text
GET  /login
GET  /logout
GET  /
GET  /productos
GET  /productos/nuevo
GET  /productos/editar/<id>
GET  /bodegas
GET  /bodegas/nuevo
GET  /bodegas/editar/<id>
GET  /movimientos
GET  /movimientos/entrada
GET  /movimientos/salida
GET  /movimientos/traslado
GET  /movimientos/ajuste
GET  /kardex
GET  /kardex/detalle/<prod_id>/<bod_id>
GET  /api/stock?prod=<id>&bod=<id>
```

## Prueba rápida

Se incluye el script [test_app.py](App/test_app.py) para validar rutas clave:

```bash
python test_app.py
```

Resultado esperado: validación exitosa de login, pantallas principales y flujo de entrada de inventario.

## Advertencias

- No usar en producción.
- Diseño inseguro a propósito para ejercicios de modernización.
- El archivo `stock.db` se crea localmente y puede variar entre ejecuciones.
