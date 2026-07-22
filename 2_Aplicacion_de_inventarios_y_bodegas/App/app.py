#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
StockControl - Aplicacion de Inventarios y Bodegas
==============================================================
EJERCICIO DE MODERNIZACION
ADVERTENCIA: Este codigo contiene MALAS PRACTICAS INTENCIONALES.
NO USAR EN PRODUCCION.

Antipatrones implementados:
  - God Module: todo en un solo archivo de ~1100 lineas
  - God Function: iniciar() hace BD + tablas + seed + config
  - Global State: conexion BD global no thread-safe
  - SQL Injection: concatenacion directa de strings en queries
  - Broken Authentication: MD5 para passwords, credenciales hardcoded
  - Spaghetti Code: logica de negocio + BD + HTML mezclados en cada ruta
  - Copy-Paste Programming: rutas de movimientos casi identicas
  - Magic Numbers: numeros sin contexto en todo el codigo
  - No Validation: entrada del usuario directamente a BD
  - Violated SRP: cada funcion hace 5-10 responsabilidades distintas
  - Violated OCP: agregar funciones = modificar todo el archivo
  - Violated DIP: dependencia directa y hardcoded de SQLite en todas partes
  - Violated LSP/ISP: funciones "polimorficas" con if/elif interminable
  - No Error Handling: try/except que swallows errores silenciosamente
  - Debug en produccion: DEBUG=True y host='0.0.0.0' hardcoded
  - Secrets en codigo: clave secreta y passwords visibles en fuente
  - HTML generado por concatenacion en Python (no templates reales)
  - Queries N+1: bucles con queries dentro
  - Sin paginacion: se cargan TODOS los registros
  - Sin logging: print() en lugar de logging framework
  - Sin migraciones: DDL recreado en cada reinicio
  - Sin tests: cero cobertura
"""

# MALA PRACTICA #1: Imports todos juntos, desordenados, sin isort
from __future__ import print_function, division  # Vestigios Python 2
import sqlite3, os, sys, datetime, hashlib, json  # noqa: E401
from flask import (Flask, request, redirect, session,
                   render_template_string, flash, get_flashed_messages)

# ================================================================
# ANTIPATRON: ESTADO GLOBAL MASIVO - Viola OOP, DI, y todo SOLID
# ================================================================
DATABASE  = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'stock.db')
CLAVE     = 'stockcontrol_dev_KEY_123'   # MALA PRACTICA: hardcoded secret
DEBUG     = True                          # MALA PRACTICA: debug en produccion
VERSION   = '1.0.0'                       # Sin SemVer real
MAX_ROWS  = 999                           # Magic number

# MALA PRACTICA: Conexion global - no thread-safe, nunca cerrada
_DB = None

app = Flask(__name__)
app.secret_key = CLAVE        # MALA PRACTICA: visible en codigo fuente
app.debug     = DEBUG         # MALA PRACTICA: nunca False

# ================================================================
# ANTIPATRON: FUNCION DIOS
# Viola SRP (hace todo), OCP (modificar aqui para todo),
# DIP (depende directamente de SQLite hardcoded)
# ================================================================
def iniciar():
    """
    God Function: inicializa BD, crea tablas, inserta seeds,
    configura sistema, imprime mensajes. Todo en una funcion.
    """
    global _DB

    # MALA PRACTICA: print en lugar de logging
    print("=" * 55)
    print("  StockControl v" + VERSION + "  [MODO DEBUG]")
    print("=" * 55)

    # MALA PRACTICA: conexion global, check_same_thread=False como "solucion"
    _DB = sqlite3.connect(DATABASE, check_same_thread=False)
    _DB.row_factory = sqlite3.Row
    _DB.execute("PRAGMA journal_mode=WAL")   # Sin comentario de por que

    # MALA PRACTICA: Todo el DDL en una sola funcion, sin migraciones versionadas
    _DB.executescript("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id       INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT    NOT NULL,
            password TEXT    NOT NULL,
            rol      TEXT    DEFAULT 'AUXILIAR',
            nombre   TEXT,
            activo   INTEGER DEFAULT 1
        );
        CREATE TABLE IF NOT EXISTS categorias (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre      TEXT NOT NULL,
            descripcion TEXT
        );
        CREATE TABLE IF NOT EXISTS productos (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo         TEXT    NOT NULL UNIQUE,
            codigo_barras  TEXT,
            nombre         TEXT    NOT NULL,
            categoria_id   INTEGER,
            unidad_medida  TEXT,
            costo_promedio REAL    DEFAULT 0,
            stock_minimo   INTEGER DEFAULT 0,
            stock_maximo   INTEGER DEFAULT 0,
            control_lote   INTEGER DEFAULT 0,
            estado         INTEGER DEFAULT 1,
            descripcion    TEXT
        );
        CREATE TABLE IF NOT EXISTS bodegas (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre      TEXT    NOT NULL,
            ubicacion   TEXT,
            responsable TEXT,
            activa      INTEGER DEFAULT 1,
            capacidad   INTEGER DEFAULT 1000
        );
        CREATE TABLE IF NOT EXISTS existencias (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            producto_id       INTEGER NOT NULL,
            bodega_id         INTEGER NOT NULL,
            stock_fisico      REAL    DEFAULT 0,
            stock_reservado   REAL    DEFAULT 0,
            lote              TEXT    DEFAULT '',
            fecha_vencimiento TEXT    DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS movimientos (
            id                 INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo               TEXT    NOT NULL,
            bodega_id          INTEGER,
            bodega_destino_id  INTEGER,
            referencia         TEXT,
            motivo             TEXT,
            fecha              TEXT    NOT NULL,
            usuario_id         INTEGER,
            estado             TEXT    DEFAULT 'CONFIRMADO',
            observaciones      TEXT
        );
        CREATE TABLE IF NOT EXISTS detalle_movimientos (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            movimiento_id     INTEGER NOT NULL,
            producto_id       INTEGER NOT NULL,
            cantidad          REAL    NOT NULL,
            costo             REAL    DEFAULT 0,
            lote              TEXT    DEFAULT '',
            existencia_antes  REAL    DEFAULT 0,
            existencia_despues REAL   DEFAULT 0
        );
    """)

    # MALA PRACTICA: Seed datos hardcodeados en la misma funcion de init
    if _DB.execute("SELECT COUNT(*) FROM usuarios").fetchone()[0] == 0:

        # MALA PRACTICA: MD5 - completamente inseguro para passwords
        def _md5(p):
            return hashlib.md5(p.encode('utf-8')).hexdigest()

        # MALA PRACTICA: SQL injection posible - concatenacion directa
        _DB.execute("INSERT INTO usuarios (username,password,rol,nombre) VALUES "
                    "('admin','" + _md5('admin123') + "','ADMIN','Administrador Sistema')")
        _DB.execute("INSERT INTO usuarios (username,password,rol,nombre) VALUES "
                    "('bodeguero1','" + _md5('bodega123') + "','AUXILIAR','Juan Carlos Perez')")
        _DB.execute("INSERT INTO usuarios (username,password,rol,nombre) VALUES "
                    "('auditor1','" + _md5('audit123') + "','AUDITOR','Maria Lopez Ruiz')")
        _DB.execute("INSERT INTO usuarios (username,password,rol,nombre) VALUES "
                    "('inventario1','" + _md5('inv2024') + "','ADMIN_INV','Pedro Rodriguez')")

        for cat in [
            ('Electronica',   'Equipos tecnologicos y dispositivos electronicos'),
            ('Papeleria',     'Material de oficina, papeleria y suministros'),
            ('Herramientas',  'Herramientas manuales y electricas'),
            ('Repuestos',     'Repuestos, partes y accesorios'),
            ('Consumibles',   'Materiales de consumo y descartables'),
        ]:
            _DB.execute("INSERT INTO categorias (nombre,descripcion) VALUES (?,?)", cat)

        for b in [
            ('Bodega Central',     'Edificio Principal - Piso 1', 'admin',       2000),
            ('Bodega Norte',       'Edificio Norte - Bodega A',   'bodeguero1',  1500),
            ('Bodega Sur',         'Edificio Sur - Bodega B',     'bodeguero1',   800),
            ('Cuarto Devolucion',  'Edificio Principal - Piso 2', 'inventario1',  300),
        ]:
            _DB.execute("INSERT INTO bodegas (nombre,ubicacion,responsable,capacidad)"
                        " VALUES (?,?,?,?)", b)

        for p in [
            ('PROD001','7890001','Laptop HP 14 pulgadas',       1,'Unidad', 2800000, 2, 20),
            ('PROD002','7890002','Mouse Optico Logitech M100',   1,'Unidad',   45000,10, 50),
            ('PROD003','7890003','Teclado USB Dell',             1,'Unidad',   68000, 5, 30),
            ('PROD004','7890004','Monitor 24 pulgadas FHD',      1,'Unidad',  720000, 2, 10),
            ('PROD005','7890005','Resma Papel Bond A4 x500',     2,'Resma',    18500,20,200),
            ('PROD006','7890006','Lapices Faber x12',            2,'Caja',      9000, 5, 50),
            ('PROD007','7890007','Archivador AZ Grande',         2,'Unidad',   12000,10, 80),
            ('PROD008','7890008','Destornillador Phillips 6"',   3,'Unidad',   15000, 5, 25),
            ('PROD009','7890009','Taladro Percutor 500W',        3,'Unidad',  285000, 2,  8),
            ('PROD010','7890010','Toner HP 85A Negro',           4,'Unidad',  195000, 3, 15),
        ]:
            _DB.execute(
                "INSERT INTO productos "
                "(codigo,codigo_barras,nombre,categoria_id,unidad_medida,"
                "costo_promedio,stock_minimo,stock_maximo) VALUES (?,?,?,?,?,?,?,?)", p)

        for e in [
            (1,1,12,0),(2,1,35,0),(3,1,18,0),(4,1, 4,0),(5,1,75,8),
            (6,1,28,0),(7,1,45,0),(8,2,15,0),(9,2, 5,0),(10,1,7,0),
            (1,2, 3,0),(2,2,12,0),(5,2,25,0),(8,1, 4,0),(3,2,5,0),
        ]:
            _DB.execute(
                "INSERT INTO existencias (producto_id,bodega_id,stock_fisico,stock_reservado)"
                " VALUES (?,?,?,?)", e)

        fecha = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        _DB.execute(
            "INSERT INTO movimientos (tipo,bodega_id,referencia,motivo,fecha,usuario_id)"
            " VALUES ('ENTRADA',1,'COMP-001','Carga inicial de inventario',?,1)", (fecha,))
        mov_id = _DB.execute("SELECT last_insert_rowid()").fetchone()[0]
        for pid, cant, costo in [(1,12,2800000),(2,35,45000),(3,18,68000),(5,75,18500)]:
            _DB.execute(
                "INSERT INTO detalle_movimientos"
                " (movimiento_id,producto_id,cantidad,costo,existencia_antes,existencia_despues)"
                " VALUES (?,?,?,?,0,?)", (mov_id, pid, cant, costo, cant))

        _DB.commit()
        print("[OK] Datos iniciales cargados")

    _DB.commit()
    print("[OK] Base de datos lista:", DATABASE)


# MALA PRACTICA: Codigo ejecutado al importar el modulo
# Un import de este modulo dispara toda la inicializacion
try:
    iniciar()
except Exception as _e:
    print("ERROR FATAL al iniciar:", _e)   # MALA PRACTICA: no relanzar ni loggear bien
    sys.exit(1)


# ================================================================
# HELPERS MEZCLADOS - Sin ninguna estructura de capas
# ================================================================

def db():
    """MALA PRACTICA: acceso directo a variable global no thread-safe"""
    global _DB
    if _DB is None:
        iniciar()
    return _DB


def md5pw(p):
    """MALA PRACTICA: MD5 para hashing de contraseñas"""
    return hashlib.md5(p.encode()).hexdigest()


def now():
    """MALA PRACTICA: Helper global en vez de usar constante de formato"""
    return datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')


def get_stock(prod_id, bod_id):
    """
    MALA PRACTICA: Query inline acoplada a la estructura de BD.
    Sin cache, ejecutada muchas veces en bucles (N+1).
    """
    r = db().execute(
        "SELECT COALESCE(SUM(stock_fisico),0) AS s"
        " FROM existencias WHERE producto_id=? AND bodega_id=?",
        (prod_id, bod_id)).fetchone()
    return float(r['s']) if r else 0.0


def actualizar_stock(prod_id, bod_id, delta, costo_nuevo=None):
    """
    MALA PRACTICA: Mezcla logica de negocio con acceso a datos.
    Sin transacciones explicitas, sin manejo de concurrencia (race condition).
    Viola SRP y DIP.
    """
    # MALA PRACTICA: dos queries separadas sin bloqueo
    fila = db().execute(
        "SELECT id, stock_fisico FROM existencias"
        " WHERE producto_id=? AND bodega_id=?", (prod_id, bod_id)).fetchone()

    if fila:
        nuevo = max(0.0, float(fila['stock_fisico']) + delta)
        db().execute("UPDATE existencias SET stock_fisico=? WHERE id=?", (nuevo, fila['id']))
    else:
        nuevo = max(0.0, delta)
        db().execute(
            "INSERT INTO existencias (producto_id,bodega_id,stock_fisico) VALUES (?,?,?)",
            (prod_id, bod_id, nuevo))

    if costo_nuevo and costo_nuevo > 0:
        # MALA PRACTICA: costo promedio actualizado sin formula correcta de promedio ponderado
        db().execute("UPDATE productos SET costo_promedio=? WHERE id=?", (costo_nuevo, prod_id))

    return nuevo


def auth(f):
    """El unico decorator decente del sistema - pero sin roles"""
    def wrapper(*a, **kw):
        if 'uid' not in session:
            flash('Debe iniciar sesion', 'warning')
            return redirect('/login')
        return f(*a, **kw)
    wrapper.__name__ = f.__name__
    return wrapper


# ================================================================
# ANTIPATRON: HTML MEZCLADO EN PYTHON
# Template Jinja2 como string literal en el modulo de rutas
# Viola separacion de responsabilidades completamente
# ================================================================
TMPL_BASE = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>StockControl - {{ titulo }}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
<style>
body{background:#f4f6f9;font-size:14px;}
.sidebar{background:#1e2a3a;min-height:calc(100vh - 56px);width:210px;flex-shrink:0;padding:14px 8px;}
.sidebar .nav-link{color:#adb5bd;padding:7px 12px;border-radius:6px;margin-bottom:2px;font-size:13px;}
.sidebar .nav-link:hover,.sidebar .nav-link.active{color:#fff;background:rgba(255,255,255,.13);}
.sidebar .nav-link i{margin-right:7px;width:16px;}
.sidebar hr{border-color:#344558;margin:8px 0;}
.sidebar .sec{color:#6c757d;font-size:10px;text-transform:uppercase;padding:4px 12px;}
.topbar{background:#1e2a3a!important;}
.sc{border:none;border-radius:10px;border-left:4px solid;}
.sc.primary{border-left-color:#0d6efd;}
.sc.success{border-left-color:#198754;}
.sc.danger{border-left-color:#dc3545;}
.sc.warning{border-left-color:#ffc107;}
.sc.info{border-left-color:#0dcaf0;}
.table th{background:#f8f9fa;font-size:11px;text-transform:uppercase;font-weight:600;}
.btn-xs{padding:2px 7px;font-size:11px;}
</style>
</head>
<body>
<nav class="navbar navbar-dark topbar px-3" style="height:56px;">
  <span class="navbar-brand fw-bold fs-5"><i class="bi bi-boxes me-2"></i>StockControl</span>
  {% if session.get('uid') %}
  <div class="d-flex align-items-center gap-3">
    <span class="text-white small"><i class="bi bi-person-circle me-1"></i>{{ session.get('uname','') }}
      <span class="badge bg-secondary ms-1">{{ session.get('rol','') }}</span>
    </span>
    <a href="/logout" class="btn btn-outline-light btn-sm">Salir</a>
  </div>
  {% endif %}
</nav>
<div class="d-flex">
  {% if session.get('uid') %}
  <div class="sidebar d-flex flex-column">
    <nav class="nav flex-column">
      <a class="nav-link {% if activo=='dashboard' %}active{% endif %}" href="/"><i class="bi bi-speedometer2"></i>Dashboard</a>
      <a class="nav-link {% if activo=='productos' %}active{% endif %}" href="/productos"><i class="bi bi-box-seam"></i>Catálogo</a>
      <a class="nav-link {% if activo=='bodegas' %}active{% endif %}" href="/bodegas"><i class="bi bi-building"></i>Bodegas</a>
      <hr>
      <div class="sec">Movimientos</div>
      <a class="nav-link {% if activo=='entrada' %}active{% endif %}" href="/movimientos/entrada"><i class="bi bi-arrow-down-circle-fill"></i>Entrada</a>
      <a class="nav-link {% if activo=='salida' %}active{% endif %}" href="/movimientos/salida"><i class="bi bi-arrow-up-circle-fill"></i>Salida</a>
      <a class="nav-link {% if activo=='traslado' %}active{% endif %}" href="/movimientos/traslado"><i class="bi bi-arrow-left-right"></i>Traslado</a>
      <a class="nav-link {% if activo=='ajuste' %}active{% endif %}" href="/movimientos/ajuste"><i class="bi bi-sliders2"></i>Ajuste</a>
      <a class="nav-link {% if activo=='movimientos' %}active{% endif %}" href="/movimientos"><i class="bi bi-list-ul"></i>Historial</a>
      <hr>
      <a class="nav-link {% if activo=='kardex' %}active{% endif %}" href="/kardex"><i class="bi bi-table"></i>Existencias/Kardex</a>
    </nav>
  </div>
  {% endif %}
  <div class="flex-grow-1 p-4" style="min-width:0;">
    {% with msgs = get_flashed_messages(with_categories=true) %}
    {% if msgs %}{% for cat,msg in msgs %}
    <div class="alert alert-{{ cat }} alert-dismissible fade show py-2 small">
      <i class="bi bi-info-circle me-2"></i>{{ msg }}
      <button type="button" class="btn-close btn-close-sm" data-bs-dismiss="alert"></button>
    </div>
    {% endfor %}{% endif %}{% endwith %}
    {{ contenido | safe }}
  </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
{{ scripts | safe }}
</body>
</html>"""


def render(titulo, contenido, activo='', scripts=''):
    """
    MALA PRACTICA: Funcion de render manual que mezcla presentacion con logica.
    Viola separacion de responsabilidades, no usa sistema de templates real.
    """
    return render_template_string(
        TMPL_BASE, titulo=titulo, contenido=contenido,
        activo=activo, scripts=scripts)


# ================================================================
# HELPERS PARA OPCIONES HTML - MALA PRACTICA: HTML en Python
# ================================================================

def opts_prods(prods, vacio=True):
    """MALA PRACTICA: genera HTML en Python - mezcla capas"""
    o = '<option value="">-- Seleccione producto --</option>' if vacio else ''
    for p in prods:
        o += f'<option value="{p["id"]}">[{p["codigo"]}] {p["nombre"]}</option>'
    return o


def opts_bodegas(bods, vacio=True, excluir=None):
    """MALA PRACTICA: genera HTML en Python"""
    o = '<option value="">-- Seleccione bodega --</option>' if vacio else ''
    for b in bods:
        if b['id'] != excluir:
            o += f'<option value="{b["id"]}">{b["nombre"]}</option>'
    return o


def get_prods_bodegas():
    """MALA PRACTICA: una sola funcion que carga dos entidades sin relacion"""
    prods = db().execute(
        "SELECT id,codigo,nombre,unidad_medida,control_lote FROM productos"
        " WHERE estado=1 ORDER BY codigo").fetchall()
    bods = db().execute(
        "SELECT id,nombre FROM bodegas WHERE activa=1 ORDER BY nombre").fetchall()
    return prods, bods


# ================================================================
# RUTAS - LOGIN / LOGOUT
# ================================================================

@app.route('/login', methods=['GET', 'POST'])
def login():
    # MALA PRACTICA: toda la logica (auth + BD + HTML) en una ruta
    error = ''
    if request.method == 'POST':
        u = request.form.get('username', '')
        p = request.form.get('password', '')
        # MALA PRACTICA: SQL INJECTION - concatenacion directa sin parametrizar
        fila = db().execute(
            "SELECT * FROM usuarios WHERE username='" + u +
            "' AND activo=1").fetchone()
        if fila and fila['password'] == md5pw(p):
            session['uid']    = fila['id']
            session['uname']  = fila['username']
            session['rol']    = fila['rol']
            session['nombre'] = fila['nombre']
            return redirect('/')
        error = 'Usuario o contraseña incorrectos'

    html = f"""
    <div class="row justify-content-center mt-5">
      <div class="col-md-4 col-lg-3">
        <div class="card shadow">
          <div class="card-body p-4">
            <div class="text-center mb-4">
              <i class="bi bi-boxes" style="font-size:3rem;color:#1e2a3a;"></i>
              <h3 class="fw-bold mt-2">StockControl</h3>
              <p class="text-muted small">Sistema de Inventarios y Bodegas</p>
            </div>
            {'<div class="alert alert-danger py-2 small">' + error + '</div>' if error else ''}
            <form method="POST">
              <div class="mb-3">
                <label class="form-label fw-semibold">Usuario</label>
                <input type="text" name="username" class="form-control" required autofocus>
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold">Contraseña</label>
                <input type="password" name="password" class="form-control" required>
              </div>
              <button type="submit" class="btn w-100 fw-semibold"
                style="background:#1e2a3a;color:#fff;">Ingresar</button>
            </form>
            <div class="mt-3 p-2 bg-light rounded small text-muted">
              <strong>Usuarios:</strong><br>
              admin / admin123<br>
              bodeguero1 / bodega123<br>
              auditor1 / audit123
            </div>
          </div>
        </div>
      </div>
    </div>"""
    return render('Login', html)


@app.route('/logout')
def logout():
    session.clear()
    flash('Sesion cerrada correctamente', 'info')
    return redirect('/login')


# ================================================================
# DASHBOARD
# MALA PRACTICA: 8+ queries separadas en una funcion, sin DAO
# ================================================================

@app.route('/')
@auth
def dashboard():
    d = db()

    # MALA PRACTICA: Query N+1 para obtener estadisticas basicas
    total_prods  = d.execute("SELECT COUNT(*) FROM productos WHERE estado=1").fetchone()[0]
    total_bodegas = d.execute("SELECT COUNT(*) FROM bodegas WHERE activa=1").fetchone()[0]

    # MALA PRACTICA: Calculo de valor en Python en vez de en SQL
    ex_rows = d.execute(
        "SELECT e.stock_fisico, p.costo_promedio"
        " FROM existencias e JOIN productos p ON e.producto_id=p.id"
        " WHERE p.estado=1").fetchall()
    valor_inv = sum(float(r['stock_fisico']) * float(r['costo_promedio']) for r in ex_rows)

    agotados = d.execute("""
        SELECT COUNT(*) FROM (
          SELECT p.id FROM productos p
          LEFT JOIN existencias e ON p.id=e.producto_id
          WHERE p.estado=1
          GROUP BY p.id
          HAVING COALESCE(SUM(e.stock_fisico),0)=0
        )""").fetchone()[0]

    bajo_min = d.execute("""
        SELECT COUNT(*) FROM (
          SELECT p.id FROM productos p
          JOIN existencias e ON p.id=e.producto_id
          WHERE p.estado=1
          GROUP BY p.id
          HAVING SUM(e.stock_fisico) > 0 AND SUM(e.stock_fisico) <= p.stock_minimo
        )""").fetchone()[0]

    mes = datetime.datetime.now().strftime('%Y-%m')
    entradas_mes = d.execute(
        "SELECT COUNT(*) FROM movimientos WHERE tipo='ENTRADA' AND fecha LIKE ?",
        (mes + '%',)).fetchone()[0]
    salidas_mes = d.execute(
        "SELECT COUNT(*) FROM movimientos WHERE tipo='SALIDA' AND fecha LIKE ?",
        (mes + '%',)).fetchone()[0]

    ultimos = d.execute("""
        SELECT m.id,m.tipo,m.fecha,m.referencia,m.motivo,
               b.nombre AS bodega, u.username
        FROM movimientos m
        LEFT JOIN bodegas  b ON m.bodega_id=b.id
        LEFT JOIN usuarios u ON m.usuario_id=u.id
        ORDER BY m.id DESC LIMIT 10""").fetchall()

    alertas_stock = d.execute("""
        SELECT p.codigo,p.nombre,p.stock_minimo,
               COALESCE(SUM(e.stock_fisico),0) AS tot, c.nombre AS cat
        FROM productos p
        LEFT JOIN existencias e ON p.id=e.producto_id
        LEFT JOIN categorias  c ON p.categoria_id=c.id
        WHERE p.estado=1
        GROUP BY p.id
        HAVING tot <= p.stock_minimo
        ORDER BY tot ASC LIMIT 6""").fetchall()

    mayor_rot = d.execute("""
        SELECT p.nombre, COUNT(dm.id) AS movs,
               COALESCE(SUM(DISTINCT e.stock_fisico),0) AS stock
        FROM productos p
        LEFT JOIN detalle_movimientos dm ON p.id=dm.producto_id
        LEFT JOIN existencias e ON p.id=e.producto_id
        WHERE p.estado=1
        GROUP BY p.id ORDER BY movs DESC LIMIT 5""").fetchall()

    # MALA PRACTICA: construccion HTML por concatenacion de strings en Python
    TIPO_BADGE = {
        'ENTRADA':    'bg-success',
        'SALIDA':     'bg-danger',
        'TRASLADO':   'bg-primary',
        'AJUSTE_POS': 'bg-teal',
        'AJUSTE_NEG': 'bg-warning text-dark',
    }

    filas_ult = ''
    for m in ultimos:
        bc = TIPO_BADGE.get(m['tipo'], 'bg-secondary')
        filas_ult += (
            f'<tr><td><strong>#{m["id"]}</strong></td>'
            f'<td><span class="badge {bc}">{m["tipo"]}</span></td>'
            f'<td><small>{m["bodega"] or "-"}</small></td>'
            f'<td><small>{m["referencia"] or "-"}</small></td>'
            f'<td><small class="text-muted">{(m["fecha"] or "")[:16]}</small></td>'
            f'<td><small>{m["username"] or "-"}</small></td></tr>')

    filas_alerta = ''
    for a in alertas_stock:
        css = 'text-danger fw-bold' if a['tot'] == 0 else 'text-warning fw-bold'
        filas_alerta += (
            f'<tr><td><code class="small">{a["codigo"]}</code></td>'
            f'<td class="small">{a["nombre"][:28]}</td>'
            f'<td class="{css}">{a["tot"]:.0f}</td>'
            f'<td class="small text-muted">min:{a["stock_minimo"]}</td></tr>')

    filas_rot = ''
    for r in mayor_rot:
        filas_rot += (
            f'<tr><td class="small">{r["nombre"][:22]}</td>'
            f'<td class="text-center">{r["movs"]}</td>'
            f'<td class="text-end">{r["stock"]:.0f}</td></tr>')

    html = f"""
<div class="d-flex justify-content-between align-items-center mb-4">
  <h4 class="mb-0 fw-bold"><i class="bi bi-speedometer2 me-2"></i>Dashboard de Inventario</h4>
  <small class="text-muted">{now()}</small>
</div>

<div class="row g-3 mb-4">
  <div class="col-md-2 col-sm-6">
    <div class="card sc primary shadow-sm h-100"><div class="card-body">
      <div class="text-primary mb-1"><i class="bi bi-box-seam fs-4"></i></div>
      <div class="fs-3 fw-bold">{total_prods}</div>
      <div class="text-muted small">Productos Activos</div>
    </div></div>
  </div>
  <div class="col-md-2 col-sm-6">
    <div class="card sc success shadow-sm h-100"><div class="card-body">
      <div class="text-success mb-1"><i class="bi bi-building fs-4"></i></div>
      <div class="fs-3 fw-bold">{total_bodegas}</div>
      <div class="text-muted small">Bodegas Activas</div>
    </div></div>
  </div>
  <div class="col-md-3 col-sm-6">
    <div class="card sc info shadow-sm h-100"><div class="card-body">
      <div class="text-info mb-1"><i class="bi bi-currency-dollar fs-4"></i></div>
      <div class="fs-5 fw-bold">$ {valor_inv:,.0f}</div>
      <div class="text-muted small">Valor Estimado</div>
    </div></div>
  </div>
  <div class="col-md-2 col-sm-6">
    <div class="card sc danger shadow-sm h-100"><div class="card-body">
      <div class="text-danger mb-1"><i class="bi bi-exclamation-triangle fs-4"></i></div>
      <div class="fs-3 fw-bold">{agotados}</div>
      <div class="text-muted small">Agotados</div>
    </div></div>
  </div>
  <div class="col-md-3 col-sm-6">
    <div class="card sc warning shadow-sm h-100"><div class="card-body">
      <div class="text-warning mb-1"><i class="bi bi-arrow-down-circle fs-4"></i></div>
      <div class="fs-3 fw-bold">{bajo_min}</div>
      <div class="text-muted small">Bajo Mínimo Stock</div>
    </div></div>
  </div>
</div>

<div class="row g-3 mb-4">
  <div class="col-md-5">
    <div class="card shadow-sm">
      <div class="card-header py-2 fw-semibold small"><i class="bi bi-bar-chart me-2"></i>Movimientos del Mes</div>
      <div class="card-body d-flex gap-4 justify-content-center">
        <div class="text-center">
          <div class="fs-2 fw-bold text-success">{entradas_mes}</div>
          <div class="small text-muted"><i class="bi bi-arrow-down-circle-fill text-success me-1"></i>Entradas</div>
        </div>
        <div class="text-center">
          <div class="fs-2 fw-bold text-danger">{salidas_mes}</div>
          <div class="small text-muted"><i class="bi bi-arrow-up-circle-fill text-danger me-1"></i>Salidas</div>
        </div>
      </div>
    </div>
  </div>
  <div class="col-md-7">
    <div class="card shadow-sm">
      <div class="card-header py-2 fw-semibold small text-danger"><i class="bi bi-exclamation-triangle me-2"></i>Alertas de Stock</div>
      <div class="card-body p-0">
        <table class="table table-sm mb-0">
          <thead><tr><th>Cod.</th><th>Producto</th><th>Stock</th><th>Mín.</th></tr></thead>
          <tbody>
            {filas_alerta or '<tr><td colspan="4" class="text-center text-success p-3 small"><i class="bi bi-check-circle me-1"></i>Todo el stock esta bien</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<div class="row g-3">
  <div class="col-md-8">
    <div class="card shadow-sm">
      <div class="card-header py-2 fw-semibold small"><i class="bi bi-clock-history me-2"></i>Últimos Movimientos</div>
      <div class="card-body p-0">
        <table class="table table-sm table-hover mb-0">
          <thead><tr><th>#</th><th>Tipo</th><th>Bodega</th><th>Referencia</th><th>Fecha</th><th>Usuario</th></tr></thead>
          <tbody>{filas_ult or '<tr><td colspan="6" class="text-center p-3 text-muted">Sin movimientos</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  </div>
  <div class="col-md-4">
    <div class="card shadow-sm">
      <div class="card-header py-2 fw-semibold small"><i class="bi bi-arrow-repeat me-2"></i>Mayor Rotación</div>
      <div class="card-body p-0">
        <table class="table table-sm mb-0">
          <thead><tr><th>Producto</th><th>Movs.</th><th class="text-end">Stock</th></tr></thead>
          <tbody>{filas_rot or '<tr><td colspan="3" class="text-center p-3 text-muted">Sin datos</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  </div>
</div>"""
    return render('Dashboard', html, 'dashboard')


# ================================================================
# PRODUCTOS
# MALA PRACTICA: SQL injection en filtros, HTML en Python, sin paginacion
# ================================================================

@app.route('/productos')
@auth
def productos():
    fn  = request.args.get('nombre',   '').strip()
    fc  = request.args.get('categoria','').strip()
    fe  = request.args.get('estado',   '').strip()

    # MALA PRACTICA: SQL INJECTION directa por concatenacion de filtros
    sql = """SELECT p.*, c.nombre AS cat_nombre,
             COALESCE((SELECT SUM(e.stock_fisico) FROM existencias e
                       WHERE e.producto_id=p.id),0) AS stock_total
             FROM productos p LEFT JOIN categorias c ON p.categoria_id=c.id
             WHERE 1=1"""
    if fn:
        sql += " AND p.nombre LIKE '%" + fn + "%'"
    if fc:
        sql += " AND p.categoria_id=" + fc
    if fe != '':
        sql += " AND p.estado=" + fe
    sql += " ORDER BY p.codigo"

    prods = db().execute(sql).fetchall()
    cats  = db().execute("SELECT * FROM categorias ORDER BY nombre").fetchall()

    opts_c = '<option value="">Todas</option>'
    for c in cats:
        sel = 'selected' if fc == str(c['id']) else ''
        opts_c += f'<option value="{c["id"]}" {sel}>{c["nombre"]}</option>'

    filas = ''
    for p in prods:
        eb  = ('<span class="badge bg-success">Activo</span>'
               if p['estado'] else '<span class="badge bg-secondary">Inactivo</span>')
        st  = float(p['stock_total'])
        smin = int(p['stock_minimo'])
        scss = 'text-danger fw-bold' if st <= smin else 'text-success'
        stxt = ('⚠ ' if st <= smin else '') + f'{st:.0f}'
        filas += (
            f'<tr>'
            f'<td><code class="small">{p["codigo"]}</code></td>'
            f'<td>{p["nombre"]}</td>'
            f'<td><small>{p["cat_nombre"] or "-"}</small></td>'
            f'<td><small>{p["unidad_medida"] or "-"}</small></td>'
            f'<td class="text-end">${float(p["costo_promedio"]):,.0f}</td>'
            f'<td class="{scss} text-end">{stxt}</td>'
            f'<td class="text-end small">{smin}</td>'
            f'<td>{eb}</td>'
            f'<td>'
            f'<a href="/productos/editar/{p["id"]}" class="btn btn-xs btn-outline-primary me-1"><i class="bi bi-pencil"></i></a>'
            f'<a href="/productos/toggle/{p["id"]}" class="btn btn-xs '
            f'{"btn-outline-danger" if p["estado"] else "btn-outline-success"}" '
            f'onclick="return confirm(\'¿Confirma cambio de estado?\')">'
            f'<i class="bi bi-power"></i></a>'
            f'</td></tr>')

    html = f"""
<div class="d-flex justify-content-between align-items-center mb-3">
  <h4 class="mb-0 fw-bold"><i class="bi bi-box-seam me-2"></i>Catálogo de Productos</h4>
  <a href="/productos/nuevo" class="btn btn-sm fw-semibold" style="background:#1e2a3a;color:#fff;">
    <i class="bi bi-plus-lg me-1"></i>Nuevo Producto</a>
</div>
<div class="card shadow-sm mb-3">
  <div class="card-body py-2">
    <form class="row g-2 align-items-end" method="GET">
      <div class="col-md-4"><input type="text" name="nombre" class="form-control form-control-sm"
        placeholder="Buscar por nombre..." value="{fn}"></div>
      <div class="col-md-3"><select name="categoria" class="form-select form-select-sm">{opts_c}</select></div>
      <div class="col-md-2">
        <select name="estado" class="form-select form-select-sm">
          <option value="">Todos</option>
          <option value="1" {'selected' if fe=='1' else ''}>Activos</option>
          <option value="0" {'selected' if fe=='0' else ''}>Inactivos</option>
        </select>
      </div>
      <div class="col-auto">
        <button type="submit" class="btn btn-sm btn-primary">Filtrar</button>
        <a href="/productos" class="btn btn-sm btn-outline-secondary ms-1">Limpiar</a>
      </div>
    </form>
  </div>
</div>
<div class="card shadow-sm">
  <div class="card-body p-0">
    <table class="table table-hover table-sm mb-0">
      <thead><tr>
        <th>Código</th><th>Nombre</th><th>Categoría</th><th>Unidad</th>
        <th class="text-end">Costo Prom.</th><th class="text-end">Stock</th>
        <th class="text-end">Mín.</th><th>Estado</th><th>Acc.</th>
      </tr></thead>
      <tbody>{filas or '<tr><td colspan="9" class="text-center p-3 text-muted">No hay productos</td></tr>'}</tbody>
    </table>
  </div>
</div>
<small class="text-muted mt-2 d-block">{len(prods)} productos encontrados</small>"""
    return render('Catálogo', html, 'productos')


@app.route('/productos/nuevo', methods=['GET', 'POST'])
@auth
def producto_nuevo():
    cats = db().execute("SELECT * FROM categorias ORDER BY nombre").fetchall()

    if request.method == 'POST':
        # MALA PRACTICA: sin validacion robusta ni sanitizacion
        cod   = request.form.get('codigo',        '').strip()
        nom   = request.form.get('nombre',        '').strip()
        cat   = request.form.get('categoria_id',  '0')
        um    = request.form.get('unidad_medida', '')
        costo = request.form.get('costo_promedio','0') or '0'
        smin  = request.form.get('stock_minimo',  '0') or '0'
        smax  = request.form.get('stock_maximo',  '0') or '0'
        cbar  = request.form.get('codigo_barras', '')
        desc  = request.form.get('descripcion',   '')
        clote = 1 if request.form.get('control_lote') else 0

        if not cod or not nom:
            flash('Código y nombre son obligatorios', 'danger')
        else:
            # MALA PRACTICA: SQL INJECTION - verificar duplicado con concatenacion
            existe = db().execute(
                "SELECT id FROM productos WHERE codigo='" + cod + "'").fetchone()
            if existe:
                flash('El código ya existe', 'danger')
            else:
                try:
                    db().execute(
                        "INSERT INTO productos"
                        " (codigo,codigo_barras,nombre,categoria_id,unidad_medida,"
                        " costo_promedio,stock_minimo,stock_maximo,control_lote,descripcion,estado)"
                        " VALUES (?,?,?,?,?,?,?,?,?,?,1)",
                        (cod, cbar, nom, cat, um, float(costo),
                         int(smin), int(smax), clote, desc))
                    db().commit()
                    flash('Producto creado exitosamente', 'success')
                    return redirect('/productos')
                except Exception as ex:
                    # MALA PRACTICA: exponer error tecnico al usuario
                    flash('Error tecnico: ' + str(ex), 'danger')

    opts_c = ''.join(f'<option value="{c["id"]}">{c["nombre"]}</option>' for c in cats)
    html = f"""
<div class="d-flex justify-content-between align-items-center mb-3">
  <h4 class="mb-0 fw-bold"><i class="bi bi-plus-circle me-2"></i>Nuevo Producto</h4>
  <a href="/productos" class="btn btn-sm btn-outline-secondary"><i class="bi bi-arrow-left me-1"></i>Volver</a>
</div>
<div class="card shadow-sm">
  <div class="card-body">
    <form method="POST">
      <div class="row g-3">
        <div class="col-md-3">
          <label class="form-label fw-semibold">Código *</label>
          <input type="text" name="codigo" class="form-control" required placeholder="PROD001">
        </div>
        <div class="col-md-3">
          <label class="form-label fw-semibold">Código de Barras</label>
          <input type="text" name="codigo_barras" class="form-control" placeholder="7890000000000">
        </div>
        <div class="col-md-6">
          <label class="form-label fw-semibold">Nombre *</label>
          <input type="text" name="nombre" class="form-control" required placeholder="Nombre del producto">
        </div>
        <div class="col-md-3">
          <label class="form-label fw-semibold">Categoría</label>
          <select name="categoria_id" class="form-select">
            <option value="0">Sin categoría</option>{opts_c}
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label fw-semibold">Unidad de Medida</label>
          <input type="text" name="unidad_medida" class="form-control" placeholder="Unidad, Caja, Kg...">
        </div>
        <div class="col-md-3">
          <label class="form-label fw-semibold">Costo Promedio</label>
          <input type="number" name="costo_promedio" class="form-control" value="0" min="0" step="0.01">
        </div>
        <div class="col-md-1">
          <label class="form-label fw-semibold">Mín.</label>
          <input type="number" name="stock_minimo" class="form-control" value="0" min="0">
        </div>
        <div class="col-md-1">
          <label class="form-label fw-semibold">Máx.</label>
          <input type="number" name="stock_maximo" class="form-control" value="0" min="0">
        </div>
        <div class="col-md-2 d-flex align-items-end">
          <div class="form-check mb-2">
            <input type="checkbox" name="control_lote" class="form-check-input" id="clote">
            <label class="form-check-label" for="clote">Control Lote</label>
          </div>
        </div>
        <div class="col-12">
          <label class="form-label fw-semibold">Descripción</label>
          <textarea name="descripcion" class="form-control" rows="2" placeholder="Opcional..."></textarea>
        </div>
        <div class="col-12">
          <button type="submit" class="btn fw-semibold" style="background:#1e2a3a;color:#fff;">
            <i class="bi bi-save me-2"></i>Guardar Producto</button>
          <a href="/productos" class="btn btn-outline-secondary ms-2">Cancelar</a>
        </div>
      </div>
    </form>
  </div>
</div>"""
    return render('Nuevo Producto', html, 'productos')


@app.route('/productos/editar/<int:pid>', methods=['GET', 'POST'])
@auth
def producto_editar(pid):
    # MALA PRACTICA: SQL INJECTION - pid en URL insertado directo en query
    prod = db().execute(
        "SELECT * FROM productos WHERE id=" + str(pid)).fetchone()
    if not prod:
        flash('Producto no encontrado', 'danger')
        return redirect('/productos')

    cats = db().execute("SELECT * FROM categorias ORDER BY nombre").fetchall()

    if request.method == 'POST':
        nom   = request.form.get('nombre',        '').strip()
        cat   = request.form.get('categoria_id',  '0')
        um    = request.form.get('unidad_medida', '')
        costo = request.form.get('costo_promedio','0') or '0'
        smin  = request.form.get('stock_minimo',  '0') or '0'
        smax  = request.form.get('stock_maximo',  '0') or '0'
        cbar  = request.form.get('codigo_barras', '')
        desc  = request.form.get('descripcion',   '')
        clote = 1 if request.form.get('control_lote') else 0
        if not nom:
            flash('El nombre es obligatorio', 'danger')
        else:
            db().execute(
                "UPDATE productos SET nombre=?,codigo_barras=?,categoria_id=?,"
                "unidad_medida=?,costo_promedio=?,stock_minimo=?,"
                "stock_maximo=?,control_lote=?,descripcion=? WHERE id=?",
                (nom, cbar, cat, um, float(costo), int(smin), int(smax), clote, desc, pid))
            db().commit()
            flash('Producto actualizado correctamente', 'success')
            return redirect('/productos')

    opts_c = ''
    for c in cats:
        sel = 'selected' if c['id'] == prod['categoria_id'] else ''
        opts_c += f'<option value="{c["id"]}" {sel}>{c["nombre"]}</option>'
    clote_chk = 'checked' if prod['control_lote'] else ''

    html = f"""
<div class="d-flex justify-content-between align-items-center mb-3">
  <h4 class="mb-0 fw-bold"><i class="bi bi-pencil me-2"></i>Editar Producto</h4>
  <a href="/productos" class="btn btn-sm btn-outline-secondary"><i class="bi bi-arrow-left me-1"></i>Volver</a>
</div>
<div class="card shadow-sm">
  <div class="card-body">
    <form method="POST">
      <div class="row g-3">
        <div class="col-md-3">
          <label class="form-label fw-semibold">Código</label>
          <input type="text" class="form-control bg-light" value="{prod['codigo']}" readonly>
        </div>
        <div class="col-md-3">
          <label class="form-label fw-semibold">Código de Barras</label>
          <input type="text" name="codigo_barras" class="form-control" value="{prod['codigo_barras'] or ''}">
        </div>
        <div class="col-md-6">
          <label class="form-label fw-semibold">Nombre *</label>
          <input type="text" name="nombre" class="form-control" required value="{prod['nombre']}">
        </div>
        <div class="col-md-3">
          <label class="form-label fw-semibold">Categoría</label>
          <select name="categoria_id" class="form-select">
            <option value="0">Sin categoría</option>{opts_c}
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label fw-semibold">Unidad de Medida</label>
          <input type="text" name="unidad_medida" class="form-control" value="{prod['unidad_medida'] or ''}">
        </div>
        <div class="col-md-3">
          <label class="form-label fw-semibold">Costo Promedio</label>
          <input type="number" name="costo_promedio" class="form-control"
            value="{prod['costo_promedio']}" min="0" step="0.01">
        </div>
        <div class="col-md-1">
          <label class="form-label fw-semibold">Mín.</label>
          <input type="number" name="stock_minimo" class="form-control" value="{prod['stock_minimo']}" min="0">
        </div>
        <div class="col-md-1">
          <label class="form-label fw-semibold">Máx.</label>
          <input type="number" name="stock_maximo" class="form-control" value="{prod['stock_maximo']}" min="0">
        </div>
        <div class="col-md-2 d-flex align-items-end">
          <div class="form-check mb-2">
            <input type="checkbox" name="control_lote" class="form-check-input" id="clote" {clote_chk}>
            <label class="form-check-label" for="clote">Control Lote</label>
          </div>
        </div>
        <div class="col-12">
          <label class="form-label fw-semibold">Descripción</label>
          <textarea name="descripcion" class="form-control" rows="2">{prod['descripcion'] or ''}</textarea>
        </div>
        <div class="col-12">
          <button type="submit" class="btn fw-semibold" style="background:#1e2a3a;color:#fff;">
            <i class="bi bi-save me-2"></i>Guardar Cambios</button>
          <a href="/productos" class="btn btn-outline-secondary ms-2">Cancelar</a>
        </div>
      </div>
    </form>
  </div>
</div>"""
    return render('Editar Producto', html, 'productos')


@app.route('/productos/toggle/<int:pid>')
@auth
def producto_toggle(pid):
    # MALA PRACTICA: Toggle por GET (deberia ser POST); modifica estado con link
    p = db().execute("SELECT estado FROM productos WHERE id=?", (pid,)).fetchone()
    if p:
        nuevo = 0 if p['estado'] else 1
        db().execute("UPDATE productos SET estado=? WHERE id=?", (nuevo, pid))
        db().commit()
        flash('Producto ' + ('activado' if nuevo else 'inactivado'), 'success' if nuevo else 'warning')
    return redirect('/productos')


# ================================================================
# BODEGAS
# MALA PRACTICA: Copy-paste de patrones de productos (no DRY)
# ================================================================

@app.route('/bodegas')
@auth
def bodegas():
    bods = db().execute("""
        SELECT b.*,
          (SELECT COUNT(DISTINCT e.producto_id) FROM existencias e
           WHERE e.bodega_id=b.id AND e.stock_fisico>0) AS prods_stock,
          COALESCE((SELECT SUM(e.stock_fisico) FROM existencias e
                    WHERE e.bodega_id=b.id),0) AS total_uni
        FROM bodegas b ORDER BY b.nombre""").fetchall()

    filas = ''
    for b in bods:
        eb  = ('<span class="badge bg-success">Activa</span>'
               if b['activa'] else '<span class="badge bg-secondary">Bloqueada</span>')
        pct = min(100, int(float(b['total_uni']) / max(int(b['capacidad']), 1) * 100))
        bc  = ('bg-danger' if pct >= 90 else ('bg-warning' if pct >= 70 else 'bg-success'))
        filas += (
            f'<tr>'
            f'<td><strong>{b["nombre"]}</strong></td>'
            f'<td><small>{b["ubicacion"] or "-"}</small></td>'
            f'<td><small>{b["responsable"] or "-"}</small></td>'
            f'<td class="text-center">{b["prods_stock"]}</td>'
            f'<td class="text-end">{float(b["total_uni"]):.0f}</td>'
            f'<td style="min-width:130px;">'
            f'<div class="d-flex align-items-center gap-2">'
            f'<div class="progress flex-grow-1" style="height:6px;">'
            f'<div class="progress-bar {bc}" style="width:{pct}%;"></div></div>'
            f'<small>{pct}%</small></div></td>'
            f'<td class="text-end">{b["capacidad"]}</td>'
            f'<td>{eb}</td>'
            f'<td>'
            f'<a href="/bodegas/editar/{b["id"]}" class="btn btn-xs btn-outline-primary me-1"><i class="bi bi-pencil"></i></a>'
            f'<a href="/bodegas/toggle/{b["id"]}" '
            f'class="btn btn-xs {"btn-outline-danger" if b["activa"] else "btn-outline-success"}" '
            f'onclick="return confirm(\'¿Confirma?\')">'
            f'<i class="bi bi-{"lock" if b["activa"] else "unlock"}"></i></a>'
            f'</td></tr>')

    html = f"""
<div class="d-flex justify-content-between align-items-center mb-3">
  <h4 class="mb-0 fw-bold"><i class="bi bi-building me-2"></i>Gestión de Bodegas</h4>
  <a href="/bodegas/nuevo" class="btn btn-sm fw-semibold" style="background:#1e2a3a;color:#fff;">
    <i class="bi bi-plus-lg me-1"></i>Nueva Bodega</a>
</div>
<div class="card shadow-sm">
  <div class="card-body p-0">
    <table class="table table-hover table-sm mb-0">
      <thead><tr>
        <th>Nombre</th><th>Ubicación</th><th>Responsable</th>
        <th class="text-center">Prods.</th><th class="text-end">Unidades</th>
        <th>Capacidad Usada</th><th class="text-end">Cap. Total</th>
        <th>Estado</th><th>Acc.</th>
      </tr></thead>
      <tbody>{filas or '<tr><td colspan="9" class="text-center p-3 text-muted">No hay bodegas</td></tr>'}</tbody>
    </table>
  </div>
</div>"""
    return render('Bodegas', html, 'bodegas')


@app.route('/bodegas/nuevo', methods=['GET', 'POST'])
@auth
def bodega_nueva():
    if request.method == 'POST':
        nom  = request.form.get('nombre',      '').strip()
        ubi  = request.form.get('ubicacion',   '')
        resp = request.form.get('responsable', '')
        cap  = request.form.get('capacidad',   '1000') or '1000'
        if not nom:
            flash('El nombre es obligatorio', 'danger')
        else:
            db().execute(
                "INSERT INTO bodegas (nombre,ubicacion,responsable,capacidad)"
                " VALUES (?,?,?,?)", (nom, ubi, resp, int(cap)))
            db().commit()
            flash('Bodega creada exitosamente', 'success')
            return redirect('/bodegas')

    html = """
<div class="d-flex justify-content-between align-items-center mb-3">
  <h4 class="mb-0 fw-bold"><i class="bi bi-plus-circle me-2"></i>Nueva Bodega</h4>
  <a href="/bodegas" class="btn btn-sm btn-outline-secondary"><i class="bi bi-arrow-left me-1"></i>Volver</a>
</div>
<div class="card shadow-sm">
  <div class="card-body">
    <form method="POST">
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label fw-semibold">Nombre *</label>
          <input type="text" name="nombre" class="form-control" required placeholder="Ej: Bodega Norte">
        </div>
        <div class="col-md-6">
          <label class="form-label fw-semibold">Ubicación</label>
          <input type="text" name="ubicacion" class="form-control" placeholder="Edificio, piso, area...">
        </div>
        <div class="col-md-6">
          <label class="form-label fw-semibold">Responsable</label>
          <input type="text" name="responsable" class="form-control" placeholder="Nombre del responsable">
        </div>
        <div class="col-md-3">
          <label class="form-label fw-semibold">Capacidad (unidades)</label>
          <input type="number" name="capacidad" class="form-control" value="1000" min="1">
        </div>
        <div class="col-12">
          <button type="submit" class="btn fw-semibold" style="background:#1e2a3a;color:#fff;">
            <i class="bi bi-save me-2"></i>Guardar Bodega</button>
          <a href="/bodegas" class="btn btn-outline-secondary ms-2">Cancelar</a>
        </div>
      </div>
    </form>
  </div>
</div>"""
    return render('Nueva Bodega', html, 'bodegas')


@app.route('/bodegas/editar/<int:bid>', methods=['GET', 'POST'])
@auth
def bodega_editar(bid):
    bod = db().execute("SELECT * FROM bodegas WHERE id=?", (bid,)).fetchone()
    if not bod:
        flash('Bodega no encontrada', 'danger')
        return redirect('/bodegas')

    if request.method == 'POST':
        nom  = request.form.get('nombre',      '').strip()
        ubi  = request.form.get('ubicacion',   '')
        resp = request.form.get('responsable', '')
        cap  = request.form.get('capacidad',   '1000') or '1000'
        if not nom:
            flash('El nombre es obligatorio', 'danger')
        else:
            db().execute(
                "UPDATE bodegas SET nombre=?,ubicacion=?,responsable=?,capacidad=? WHERE id=?",
                (nom, ubi, resp, int(cap), bid))
            db().commit()
            flash('Bodega actualizada', 'success')
            return redirect('/bodegas')

    html = f"""
<div class="d-flex justify-content-between align-items-center mb-3">
  <h4 class="mb-0 fw-bold"><i class="bi bi-pencil me-2"></i>Editar Bodega</h4>
  <a href="/bodegas" class="btn btn-sm btn-outline-secondary"><i class="bi bi-arrow-left me-1"></i>Volver</a>
</div>
<div class="card shadow-sm">
  <div class="card-body">
    <form method="POST">
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label fw-semibold">Nombre *</label>
          <input type="text" name="nombre" class="form-control" required value="{bod['nombre']}">
        </div>
        <div class="col-md-6">
          <label class="form-label fw-semibold">Ubicación</label>
          <input type="text" name="ubicacion" class="form-control" value="{bod['ubicacion'] or ''}">
        </div>
        <div class="col-md-6">
          <label class="form-label fw-semibold">Responsable</label>
          <input type="text" name="responsable" class="form-control" value="{bod['responsable'] or ''}">
        </div>
        <div class="col-md-3">
          <label class="form-label fw-semibold">Capacidad</label>
          <input type="number" name="capacidad" class="form-control" value="{bod['capacidad']}" min="1">
        </div>
        <div class="col-12">
          <button type="submit" class="btn fw-semibold" style="background:#1e2a3a;color:#fff;">
            <i class="bi bi-save me-2"></i>Guardar Cambios</button>
          <a href="/bodegas" class="btn btn-outline-secondary ms-2">Cancelar</a>
        </div>
      </div>
    </form>
  </div>
</div>"""
    return render('Editar Bodega', html, 'bodegas')


@app.route('/bodegas/toggle/<int:bid>')
@auth
def bodega_toggle(bid):
    b = db().execute("SELECT activa FROM bodegas WHERE id=?", (bid,)).fetchone()
    if b:
        nuevo = 0 if b['activa'] else 1
        db().execute("UPDATE bodegas SET activa=? WHERE id=?", (nuevo, bid))
        db().commit()
        flash('Bodega ' + ('activada' if nuevo else 'bloqueada'), 'success' if nuevo else 'warning')
    return redirect('/bodegas')


# ================================================================
# MOVIMIENTOS - ENTRADA
# MALA PRACTICA: 250 lineas de logica, HTML y BD mezclados
# ================================================================

@app.route('/movimientos/entrada', methods=['GET', 'POST'])
@auth
def mov_entrada():
    prods, bods = get_prods_bodegas()

    if request.method == 'POST':
        bod_id  = request.form.get('bodega_id',  '0')
        ref     = request.form.get('referencia', '')
        motivo  = request.form.get('motivo',     'Compra')
        obs     = request.form.get('observaciones', '')

        # MALA PRACTICA: parseo manual sin schema de validacion
        items = []
        i = 0
        while True:
            pid  = request.form.get(f'prod_{i}')
            if pid is None:
                break
            cant  = request.form.get(f'cant_{i}',  '0')
            costo = request.form.get(f'costo_{i}', '0')
            lote  = request.form.get(f'lote_{i}',  '')
            try:
                if pid and float(cant or 0) > 0:
                    items.append((int(pid), float(cant), float(costo or 0), lote))
            except Exception:
                pass  # MALA PRACTICA: swallow exceptions
            i += 1
            if i > 50:  # Magic number - limite sin razon documentada
                break

        if not bod_id or bod_id == '0':
            flash('Seleccione una bodega', 'danger')
        elif not items:
            flash('Agregue al menos un producto', 'danger')
        else:
            try:
                db().execute(
                    "INSERT INTO movimientos"
                    " (tipo,bodega_id,referencia,motivo,fecha,usuario_id,observaciones)"
                    " VALUES ('ENTRADA',?,?,?,?,?,?)",
                    (int(bod_id), ref, motivo, now(), session['uid'], obs))
                mov_id = db().execute("SELECT last_insert_rowid()").fetchone()[0]
                for pid, cant, costo, lote in items:
                    antes    = get_stock(pid, int(bod_id))
                    despues  = actualizar_stock(pid, int(bod_id), cant, costo)
                    db().execute(
                        "INSERT INTO detalle_movimientos"
                        " (movimiento_id,producto_id,cantidad,costo,lote,"
                        " existencia_antes,existencia_despues)"
                        " VALUES (?,?,?,?,?,?,?)",
                        (mov_id, pid, cant, costo, lote, antes, despues))
                db().commit()
                flash(f'Entrada registrada exitosamente — Movimiento #{mov_id}', 'success')
                return redirect('/movimientos')
            except Exception as ex:
                flash('Error al registrar entrada: ' + str(ex), 'danger')

    ob = opts_bodegas(bods)
    op = opts_prods(prods)
    op_json = json.dumps(op)   # para JS seguro

    html = f"""
<div class="d-flex justify-content-between align-items-center mb-3">
  <h4 class="mb-0 fw-bold"><i class="bi bi-arrow-down-circle-fill text-success me-2"></i>Registrar Entrada</h4>
  <a href="/movimientos" class="btn btn-sm btn-outline-secondary"><i class="bi bi-arrow-left me-1"></i>Historial</a>
</div>
<div class="card shadow-sm">
  <div class="card-body">
    <form method="POST" id="frmEnt">
      <div class="row g-3 mb-3">
        <div class="col-md-4">
          <label class="form-label fw-semibold">Bodega Destino *</label>
          <select name="bodega_id" class="form-select" required>{ob}</select>
        </div>
        <div class="col-md-3">
          <label class="form-label fw-semibold">Referencia</label>
          <input type="text" name="referencia" class="form-control" placeholder="No. factura, remision...">
        </div>
        <div class="col-md-3">
          <label class="form-label fw-semibold">Motivo</label>
          <select name="motivo" class="form-select">
            <option>Compra</option><option>Devolucion cliente</option>
            <option>Traslado entrada</option><option>Apertura</option><option>Otro</option>
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label fw-semibold">Observaciones</label>
          <input type="text" name="observaciones" class="form-control">
        </div>
      </div>
      <div class="card border-success mb-3">
        <div class="card-header bg-success text-white py-2 d-flex justify-content-between align-items-center">
          <span><i class="bi bi-list-ul me-2"></i>Productos a ingresar</span>
          <button type="button" class="btn btn-sm btn-light" onclick="addRow()">
            <i class="bi bi-plus-lg"></i> Agregar fila</button>
        </div>
        <div class="card-body p-0">
          <table class="table table-sm mb-0">
            <thead><tr>
              <th style="width:40%">Producto</th>
              <th style="width:18%">Cantidad</th>
              <th style="width:22%">Costo Unit.</th>
              <th style="width:15%">Lote</th>
              <th></th>
            </tr></thead>
            <tbody id="tbItems">
              <tr>
                <td><select name="prod_0" class="form-select form-select-sm">{op}</select></td>
                <td><input type="number" name="cant_0" class="form-control form-control-sm" value="1" min="0.01" step="0.01"></td>
                <td><input type="number" name="costo_0" class="form-control form-control-sm" value="0" min="0" step="0.01"></td>
                <td><input type="text" name="lote_0" class="form-control form-control-sm" placeholder="Opcional"></td>
                <td><button type="button" class="btn btn-xs btn-outline-danger"
                  onclick="this.closest('tr').remove()"><i class="bi bi-trash"></i></button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <button type="submit" class="btn btn-success fw-semibold">
        <i class="bi bi-check-lg me-2"></i>Confirmar Entrada</button>
      <a href="/movimientos" class="btn btn-outline-secondary ms-2">Cancelar</a>
    </form>
  </div>
</div>"""

    scripts = f"""<script>
var _cnt = 1;
var _op  = {op_json};
function addRow() {{
  var tb = document.getElementById('tbItems');
  var tr = document.createElement('tr');
  var c  = _cnt;
  tr.innerHTML =
    '<td><select name="prod_'+c+'" class="form-select form-select-sm">'+_op+'</select></td>'+
    '<td><input type="number" name="cant_'+c+'" class="form-control form-control-sm" value="1" min="0.01" step="0.01"></td>'+
    '<td><input type="number" name="costo_'+c+'" class="form-control form-control-sm" value="0" min="0" step="0.01"></td>'+
    '<td><input type="text" name="lote_'+c+'" class="form-control form-control-sm" placeholder="Opcional"></td>'+
    '<td><button type="button" class="btn btn-xs btn-outline-danger" onclick="this.closest(&quot;tr&quot;).remove()"><i class="bi bi-trash"></i></button></td>';
  tb.appendChild(tr);
  _cnt++;
}}
</script>"""
    return render('Entrada de Inventario', html, 'entrada', scripts)


# ================================================================
# MOVIMIENTOS - SALIDA
# MALA PRACTICA: copia casi exacta de mov_entrada (no DRY)
# ================================================================

@app.route('/movimientos/salida', methods=['GET', 'POST'])
@auth
def mov_salida():
    prods, bods = get_prods_bodegas()

    if request.method == 'POST':
        bod_id = request.form.get('bodega_id',  '0')
        ref    = request.form.get('referencia', '')
        motivo = request.form.get('motivo',     'Venta')
        obs    = request.form.get('observaciones', '')

        items = []
        i = 0
        while True:
            pid  = request.form.get(f'prod_{i}')
            if pid is None:
                break
            cant = request.form.get(f'cant_{i}', '0')
            try:
                if pid and float(cant or 0) > 0:
                    items.append((int(pid), float(cant)))
            except Exception:
                pass  # MALA PRACTICA: swallow
            i += 1
            if i > 50:
                break

        if not bod_id or bod_id == '0':
            flash('Seleccione una bodega', 'danger')
        elif not items:
            flash('Agregue al menos un producto', 'danger')
        else:
            # MALA PRACTICA: validacion DESPUES de parsear (orden incorrecto)
            errores = []
            for pid, cant in items:
                stk = get_stock(pid, int(bod_id))
                if stk < cant:
                    p = db().execute("SELECT nombre FROM productos WHERE id=?", (pid,)).fetchone()
                    errores.append(f'{p["nombre"]}: disponible {stk:.0f}, solicitado {cant:.0f}')
            if errores:
                flash('Stock insuficiente — ' + ' | '.join(errores), 'danger')
            else:
                try:
                    db().execute(
                        "INSERT INTO movimientos"
                        " (tipo,bodega_id,referencia,motivo,fecha,usuario_id,observaciones)"
                        " VALUES ('SALIDA',?,?,?,?,?,?)",
                        (int(bod_id), ref, motivo, now(), session['uid'], obs))
                    mov_id = db().execute("SELECT last_insert_rowid()").fetchone()[0]
                    for pid, cant in items:
                        antes   = get_stock(pid, int(bod_id))
                        despues = actualizar_stock(pid, int(bod_id), -cant)
                        db().execute(
                            "INSERT INTO detalle_movimientos"
                            " (movimiento_id,producto_id,cantidad,existencia_antes,existencia_despues)"
                            " VALUES (?,?,?,?,?)",
                            (mov_id, pid, cant, antes, despues))
                    db().commit()
                    flash(f'Salida registrada — Movimiento #{mov_id}', 'success')
                    return redirect('/movimientos')
                except Exception as ex:
                    flash('Error: ' + str(ex), 'danger')

    ob = opts_bodegas(bods)
    op = opts_prods(prods)
    op_json = json.dumps(op)

    html = f"""
<div class="d-flex justify-content-between align-items-center mb-3">
  <h4 class="mb-0 fw-bold"><i class="bi bi-arrow-up-circle-fill text-danger me-2"></i>Registrar Salida</h4>
  <a href="/movimientos" class="btn btn-sm btn-outline-secondary"><i class="bi bi-arrow-left me-1"></i>Historial</a>
</div>
<div class="alert alert-warning small py-2">
  <i class="bi bi-info-circle me-2"></i>El sistema verificara stock disponible antes de confirmar.
</div>
<div class="card shadow-sm">
  <div class="card-body">
    <form method="POST">
      <div class="row g-3 mb-3">
        <div class="col-md-4">
          <label class="form-label fw-semibold">Bodega Origen *</label>
          <select name="bodega_id" class="form-select" required>{ob}</select>
        </div>
        <div class="col-md-3">
          <label class="form-label fw-semibold">Referencia</label>
          <input type="text" name="referencia" class="form-control" placeholder="No. orden, solicitud...">
        </div>
        <div class="col-md-3">
          <label class="form-label fw-semibold">Motivo</label>
          <select name="motivo" class="form-select">
            <option>Venta</option><option>Consumo interno</option>
            <option>Devolucion proveedor</option><option>Baja por dano</option><option>Otro</option>
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label fw-semibold">Observaciones</label>
          <input type="text" name="observaciones" class="form-control">
        </div>
      </div>
      <div class="card border-danger mb-3">
        <div class="card-header bg-danger text-white py-2 d-flex justify-content-between align-items-center">
          <span><i class="bi bi-list-ul me-2"></i>Productos a retirar</span>
          <button type="button" class="btn btn-sm btn-light" onclick="addRow()">
            <i class="bi bi-plus-lg"></i> Agregar fila</button>
        </div>
        <div class="card-body p-0">
          <table class="table table-sm mb-0">
            <thead><tr>
              <th style="width:60%">Producto</th>
              <th style="width:25%">Cantidad</th><th></th>
            </tr></thead>
            <tbody id="tbItems">
              <tr>
                <td><select name="prod_0" class="form-select form-select-sm">{op}</select></td>
                <td><input type="number" name="cant_0" class="form-control form-control-sm" value="1" min="0.01" step="0.01"></td>
                <td><button type="button" class="btn btn-xs btn-outline-danger"
                  onclick="this.closest('tr').remove()"><i class="bi bi-trash"></i></button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <button type="submit" class="btn btn-danger fw-semibold">
        <i class="bi bi-check-lg me-2"></i>Confirmar Salida</button>
      <a href="/movimientos" class="btn btn-outline-secondary ms-2">Cancelar</a>
    </form>
  </div>
</div>"""

    scripts = f"""<script>
var _cnt=1; var _op={op_json};
function addRow(){{
  var tb=document.getElementById('tbItems'); var tr=document.createElement('tr'); var c=_cnt;
  tr.innerHTML='<td><select name="prod_'+c+'" class="form-select form-select-sm">'+_op+'</select></td>'+
    '<td><input type="number" name="cant_'+c+'" class="form-control form-control-sm" value="1" min="0.01" step="0.01"></td>'+
    '<td><button type="button" class="btn btn-xs btn-outline-danger" onclick="this.closest(&quot;tr&quot;).remove()"><i class="bi bi-trash"></i></button></td>';
  tb.appendChild(tr); _cnt++;
}}
</script>"""
    return render('Salida de Inventario', html, 'salida', scripts)


# ================================================================
# MOVIMIENTOS - TRASLADO
# MALA PRACTICA: tercer copy-paste casi identico
# ================================================================

@app.route('/movimientos/traslado', methods=['GET', 'POST'])
@auth
def mov_traslado():
    prods, bods = get_prods_bodegas()

    if request.method == 'POST':
        bod_ori = request.form.get('bodega_origen',  '0')
        bod_dst = request.form.get('bodega_destino', '0')
        ref     = request.form.get('referencia',     '')
        obs     = request.form.get('observaciones',  '')

        items = []
        i = 0
        while True:
            pid  = request.form.get(f'prod_{i}')
            if pid is None:
                break
            cant = request.form.get(f'cant_{i}', '0')
            try:
                if pid and float(cant or 0) > 0:
                    items.append((int(pid), float(cant)))
            except Exception:
                pass
            i += 1
            if i > 50:
                break

        if not bod_ori or bod_ori == '0' or not bod_dst or bod_dst == '0':
            flash('Seleccione bodega origen y destino', 'danger')
        elif bod_ori == bod_dst:
            flash('Origen y destino deben ser diferentes', 'danger')
        elif not items:
            flash('Agregue al menos un producto', 'danger')
        else:
            errores = []
            for pid, cant in items:
                stk = get_stock(pid, int(bod_ori))
                if stk < cant:
                    p = db().execute("SELECT nombre FROM productos WHERE id=?", (pid,)).fetchone()
                    errores.append(f'{p["nombre"]}: disponible {stk:.0f}')
            if errores:
                flash('Stock insuficiente — ' + ' | '.join(errores), 'danger')
            else:
                try:
                    db().execute(
                        "INSERT INTO movimientos"
                        " (tipo,bodega_id,bodega_destino_id,referencia,motivo,fecha,usuario_id,observaciones)"
                        " VALUES ('TRASLADO',?,?,?,?,?,?,?)",
                        (int(bod_ori), int(bod_dst), ref,
                         'Traslado entre bodegas', now(), session['uid'], obs))
                    mov_id = db().execute("SELECT last_insert_rowid()").fetchone()[0]
                    for pid, cant in items:
                        antes   = get_stock(pid, int(bod_ori))
                        despues = actualizar_stock(pid, int(bod_ori), -cant)
                        actualizar_stock(pid, int(bod_dst), cant)
                        db().execute(
                            "INSERT INTO detalle_movimientos"
                            " (movimiento_id,producto_id,cantidad,existencia_antes,existencia_despues)"
                            " VALUES (?,?,?,?,?)",
                            (mov_id, pid, cant, antes, despues))
                    db().commit()
                    flash(f'Traslado completado — Movimiento #{mov_id}', 'success')
                    return redirect('/movimientos')
                except Exception as ex:
                    flash('Error: ' + str(ex), 'danger')

    ob = opts_bodegas(bods)
    op = opts_prods(prods)
    op_json = json.dumps(op)

    html = f"""
<div class="d-flex justify-content-between align-items-center mb-3">
  <h4 class="mb-0 fw-bold"><i class="bi bi-arrow-left-right text-primary me-2"></i>Traslado entre Bodegas</h4>
  <a href="/movimientos" class="btn btn-sm btn-outline-secondary"><i class="bi bi-arrow-left me-1"></i>Historial</a>
</div>
<div class="card shadow-sm">
  <div class="card-body">
    <form method="POST">
      <div class="row g-3 mb-3">
        <div class="col-md-4">
          <label class="form-label fw-semibold">Bodega Origen *</label>
          <select name="bodega_origen" class="form-select" required>{ob}</select>
        </div>
        <div class="col-md-4">
          <label class="form-label fw-semibold">Bodega Destino *</label>
          <select name="bodega_destino" class="form-select" required>{ob}</select>
        </div>
        <div class="col-md-4">
          <label class="form-label fw-semibold">Referencia</label>
          <input type="text" name="referencia" class="form-control" placeholder="No. traslado, orden...">
        </div>
        <div class="col-12">
          <label class="form-label fw-semibold">Observaciones</label>
          <input type="text" name="observaciones" class="form-control">
        </div>
      </div>
      <div class="card border-primary mb-3">
        <div class="card-header bg-primary text-white py-2 d-flex justify-content-between align-items-center">
          <span><i class="bi bi-list-ul me-2"></i>Productos a trasladar</span>
          <button type="button" class="btn btn-sm btn-light" onclick="addRow()">
            <i class="bi bi-plus-lg"></i> Agregar fila</button>
        </div>
        <div class="card-body p-0">
          <table class="table table-sm mb-0">
            <thead><tr>
              <th style="width:60%">Producto</th>
              <th style="width:25%">Cantidad</th><th></th>
            </tr></thead>
            <tbody id="tbItems">
              <tr>
                <td><select name="prod_0" class="form-select form-select-sm">{op}</select></td>
                <td><input type="number" name="cant_0" class="form-control form-control-sm" value="1" min="0.01" step="0.01"></td>
                <td><button type="button" class="btn btn-xs btn-outline-danger"
                  onclick="this.closest('tr').remove()"><i class="bi bi-trash"></i></button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <button type="submit" class="btn btn-primary fw-semibold">
        <i class="bi bi-check-lg me-2"></i>Confirmar Traslado</button>
      <a href="/movimientos" class="btn btn-outline-secondary ms-2">Cancelar</a>
    </form>
  </div>
</div>"""

    scripts = f"""<script>
var _cnt=1; var _op={op_json};
function addRow(){{
  var tb=document.getElementById('tbItems'); var tr=document.createElement('tr'); var c=_cnt;
  tr.innerHTML='<td><select name="prod_'+c+'" class="form-select form-select-sm">'+_op+'</select></td>'+
    '<td><input type="number" name="cant_'+c+'" class="form-control form-control-sm" value="1" min="0.01" step="0.01"></td>'+
    '<td><button type="button" class="btn btn-xs btn-outline-danger" onclick="this.closest(&quot;tr&quot;).remove()"><i class="bi bi-trash"></i></button></td>';
  tb.appendChild(tr); _cnt++;
}}
</script>"""
    return render('Traslado entre Bodegas', html, 'traslado', scripts)


# ================================================================
# MOVIMIENTOS - AJUSTE
# ================================================================

@app.route('/movimientos/ajuste', methods=['GET', 'POST'])
@auth
def mov_ajuste():
    prods, bods = get_prods_bodegas()

    if request.method == 'POST':
        bod_id  = request.form.get('bodega_id',      '0')
        prod_id = request.form.get('producto_id',    '0')
        cant_f  = request.form.get('cantidad_fisica','0') or '0'
        motivo  = request.form.get('motivo',         'Conteo fisico')
        obs     = request.form.get('observaciones',  '')

        if not bod_id or bod_id == '0' or not prod_id or prod_id == '0':
            flash('Seleccione bodega y producto', 'danger')
        else:
            try:
                cant_fisica  = float(cant_f)
                stock_actual = get_stock(int(prod_id), int(bod_id))
                diferencia   = cant_fisica - stock_actual
                tipo         = 'AJUSTE_POS' if diferencia >= 0 else 'AJUSTE_NEG'

                db().execute(
                    "INSERT INTO movimientos"
                    " (tipo,bodega_id,referencia,motivo,fecha,usuario_id,observaciones)"
                    " VALUES (?,?,?,?,?,?,?)",
                    (tipo, int(bod_id),
                     'AJ-' + now()[:10].replace('-', ''),
                     motivo, now(), session['uid'], obs))
                mov_id = db().execute("SELECT last_insert_rowid()").fetchone()[0]

                # MALA PRACTICA: UPDATE directo sin UPSERT ni verificacion de existencia
                affected = db().execute(
                    "UPDATE existencias SET stock_fisico=?"
                    " WHERE producto_id=? AND bodega_id=?",
                    (cant_fisica, int(prod_id), int(bod_id))).rowcount
                if affected == 0:
                    db().execute(
                        "INSERT INTO existencias (producto_id,bodega_id,stock_fisico)"
                        " VALUES (?,?,?)",
                        (int(prod_id), int(bod_id), cant_fisica))

                db().execute(
                    "INSERT INTO detalle_movimientos"
                    " (movimiento_id,producto_id,cantidad,existencia_antes,existencia_despues)"
                    " VALUES (?,?,?,?,?)",
                    (mov_id, int(prod_id), abs(diferencia), stock_actual, cant_fisica))
                db().commit()

                signo = '+' if diferencia >= 0 else ''
                flash(
                    f'Ajuste registrado: {signo}{diferencia:.1f} unidades — '
                    f'Movimiento #{mov_id}', 'success')
                return redirect('/movimientos')
            except Exception as ex:
                flash('Error en ajuste: ' + str(ex), 'danger')

    ob = opts_bodegas(bods)
    op = opts_prods(prods)

    html = f"""
<div class="d-flex justify-content-between align-items-center mb-3">
  <h4 class="mb-0 fw-bold"><i class="bi bi-sliders2 text-warning me-2"></i>Ajuste de Inventario</h4>
  <a href="/movimientos" class="btn btn-sm btn-outline-secondary"><i class="bi bi-arrow-left me-1"></i>Historial</a>
</div>
<div class="alert alert-info small py-2">
  <i class="bi bi-info-circle me-2"></i>
  El ajuste corrige la existencia fisica de un producto. El sistema calcula la diferencia automaticamente.
</div>
<div class="card shadow-sm">
  <div class="card-body">
    <form method="POST">
      <div class="row g-3">
        <div class="col-md-4">
          <label class="form-label fw-semibold">Bodega *</label>
          <select name="bodega_id" id="selBod" class="form-select" required onchange="consultarStock()">{ob}</select>
        </div>
        <div class="col-md-4">
          <label class="form-label fw-semibold">Producto *</label>
          <select name="producto_id" id="selProd" class="form-select" required onchange="consultarStock()">{op}</select>
        </div>
        <div class="col-md-4">
          <label class="form-label fw-semibold">Stock en Sistema</label>
          <input type="text" id="stockSistema" class="form-control bg-light" readonly
            value="Seleccione bodega y producto">
        </div>
        <div class="col-md-4">
          <label class="form-label fw-semibold">Cantidad Fisica Contada *</label>
          <input type="number" name="cantidad_fisica" id="cantFisica" class="form-control"
            required min="0" step="0.01" oninput="calcDif()">
        </div>
        <div class="col-md-4">
          <label class="form-label fw-semibold">Diferencia</label>
          <input type="text" id="diferencia" class="form-control bg-light" readonly>
        </div>
        <div class="col-md-4">
          <label class="form-label fw-semibold">Motivo *</label>
          <select name="motivo" class="form-select">
            <option>Conteo fisico</option><option>Deterioro o dano</option>
            <option>Error de registro</option><option>Merma o perdida</option>
            <option>Ajuste de apertura</option><option>Otro</option>
          </select>
        </div>
        <div class="col-12">
          <label class="form-label fw-semibold">Observaciones / Justificacion</label>
          <textarea name="observaciones" class="form-control" rows="2"
            placeholder="Describa el motivo del ajuste..."></textarea>
        </div>
        <div class="col-12">
          <button type="submit" class="btn btn-warning fw-semibold">
            <i class="bi bi-check-lg me-2"></i>Registrar Ajuste</button>
          <a href="/movimientos" class="btn btn-outline-secondary ms-2">Cancelar</a>
        </div>
      </div>
    </form>
  </div>
</div>"""

    scripts = """<script>
function consultarStock(){
  var pid=document.getElementById('selProd').value;
  var bid=document.getElementById('selBod').value;
  if(pid && bid && pid!=''){
    fetch('/api/stock?prod='+pid+'&bod='+bid)
      .then(function(r){return r.json();})
      .then(function(d){
        document.getElementById('stockSistema').value=d.stock;
        calcDif();
      }).catch(function(){});
  }
}
function calcDif(){
  var s=parseFloat(document.getElementById('stockSistema').value)||0;
  var f=parseFloat(document.getElementById('cantFisica').value)||0;
  var d=f-s;
  var el=document.getElementById('diferencia');
  el.value=(d>=0?'+':'')+d.toFixed(2)+' unidades';
  el.style.color=d<0?'#dc3545':'#198754';
  el.style.fontWeight='bold';
}
</script>"""
    return render('Ajuste de Inventario', html, 'ajuste', scripts)


# ================================================================
# API minima - MALA PRACTICA: mezclada con rutas de UI, sin auth robusta
# ================================================================

@app.route('/api/stock')
@auth
def api_stock():
    from flask import jsonify
    pid = request.args.get('prod', 0, type=int)
    bid = request.args.get('bod',  0, type=int)
    return jsonify({'stock': get_stock(pid, bid)})


# ================================================================
# HISTORIAL DE MOVIMIENTOS
# ================================================================

@app.route('/movimientos')
@auth
def movimientos():
    ft = request.args.get('tipo',   '').strip()
    fb = request.args.get('bodega', '').strip()

    # MALA PRACTICA: SQL INJECTION en filtros
    sql = """SELECT m.*,
             b1.nombre AS bod_nom, b2.nombre AS bod_dst_nom,
             u.username
             FROM movimientos m
             LEFT JOIN bodegas  b1 ON m.bodega_id=b1.id
             LEFT JOIN bodegas  b2 ON m.bodega_destino_id=b2.id
             LEFT JOIN usuarios u  ON m.usuario_id=u.id
             WHERE 1=1"""
    if ft:
        sql += " AND m.tipo='" + ft + "'"
    if fb:
        sql += " AND (m.bodega_id=" + fb + " OR m.bodega_destino_id=" + fb + ")"
    sql += " ORDER BY m.id DESC LIMIT 100"  # Magic number 100

    movs = db().execute(sql).fetchall()
    bods = db().execute("SELECT * FROM bodegas ORDER BY nombre").fetchall()

    BADGE = {
        'ENTRADA':    'bg-success',
        'SALIDA':     'bg-danger',
        'TRASLADO':   'bg-primary',
        'AJUSTE_POS': 'bg-teal',
        'AJUSTE_NEG': 'bg-warning text-dark',
    }

    opts_b = '<option value="">Todas</option>'
    for b in bods:
        sel = 'selected' if fb == str(b['id']) else ''
        opts_b += f'<option value="{b["id"]}" {sel}>{b["nombre"]}</option>'

    tipos_opts = '<option value="">Todos</option>'
    for t in ['ENTRADA', 'SALIDA', 'TRASLADO', 'AJUSTE_POS', 'AJUSTE_NEG']:
        sel = 'selected' if ft == t else ''
        tipos_opts += f'<option value="{t}" {sel}>{t}</option>'

    filas = ''
    for m in movs:
        bc    = BADGE.get(m['tipo'], 'bg-secondary')
        bod_t = m['bod_nom'] or '-'
        if m['tipo'] == 'TRASLADO' and m['bod_dst_nom']:
            bod_t += f' <i class="bi bi-arrow-right"></i> {m["bod_dst_nom"]}'

        # MALA PRACTICA: Query N+1 dentro del bucle
        dets = db().execute(
            "SELECT dm.cantidad, p.codigo FROM detalle_movimientos dm"
            " JOIN productos p ON dm.producto_id=p.id"
            " WHERE dm.movimiento_id=?", (m['id'],)).fetchall()
        dets_txt = ', '.join(f'{d["codigo"]}×{d["cantidad"]:.0f}' for d in dets) or '-'

        filas += (
            f'<tr>'
            f'<td><strong>#{m["id"]}</strong></td>'
            f'<td><span class="badge {bc}">{m["tipo"]}</span></td>'
            f'<td class="small">{bod_t}</td>'
            f'<td class="small">{m["referencia"] or "-"}</td>'
            f'<td class="small">{m["motivo"] or "-"}</td>'
            f'<td class="small text-muted">{dets_txt[:45]}</td>'
            f'<td class="small">{(m["fecha"] or "")[:16]}</td>'
            f'<td class="small">{m["username"] or "-"}</td>'
            f'</tr>')

    html = f"""
<div class="d-flex justify-content-between align-items-center mb-3">
  <h4 class="mb-0 fw-bold"><i class="bi bi-list-ul me-2"></i>Historial de Movimientos</h4>
  <div class="d-flex gap-2">
    <a href="/movimientos/entrada"  class="btn btn-sm btn-success"><i class="bi bi-arrow-down-circle me-1"></i>Entrada</a>
    <a href="/movimientos/salida"   class="btn btn-sm btn-danger"><i class="bi bi-arrow-up-circle me-1"></i>Salida</a>
    <a href="/movimientos/traslado" class="btn btn-sm btn-primary"><i class="bi bi-arrow-left-right me-1"></i>Traslado</a>
    <a href="/movimientos/ajuste"   class="btn btn-sm btn-warning"><i class="bi bi-sliders2 me-1"></i>Ajuste</a>
  </div>
</div>
<div class="card shadow-sm mb-3">
  <div class="card-body py-2">
    <form class="row g-2 align-items-end" method="GET">
      <div class="col-md-3">
        <select name="tipo" class="form-select form-select-sm">{tipos_opts}</select>
      </div>
      <div class="col-md-3">
        <select name="bodega" class="form-select form-select-sm">{opts_b}</select>
      </div>
      <div class="col-auto">
        <button type="submit" class="btn btn-sm btn-primary">Filtrar</button>
        <a href="/movimientos" class="btn btn-sm btn-outline-secondary ms-1">Limpiar</a>
      </div>
    </form>
  </div>
</div>
<div class="card shadow-sm">
  <div class="card-body p-0">
    <table class="table table-hover table-sm mb-0">
      <thead><tr>
        <th>#</th><th>Tipo</th><th>Bodega</th><th>Referencia</th>
        <th>Motivo</th><th>Productos</th><th>Fecha</th><th>Usuario</th>
      </tr></thead>
      <tbody>{filas or '<tr><td colspan="8" class="text-center p-3 text-muted">No hay movimientos</td></tr>'}</tbody>
    </table>
  </div>
</div>
<small class="text-muted mt-2 d-block">{len(movs)} movimientos (max 100)</small>"""
    return render('Historial de Movimientos', html, 'movimientos')


# ================================================================
# EXISTENCIAS Y KARDEX - Pantalla 5
# MALA PRACTICA: CROSS JOIN genera producto cartesiano ineficiente
# ================================================================

@app.route('/kardex')
@auth
def kardex():
    fp = request.args.get('producto',  '').strip()
    fb = request.args.get('bodega',    '').strip()
    fc = request.args.get('categoria', '').strip()
    fe = request.args.get('estado',    'todos').strip()

    # MALA PRACTICA: SQL INJECTION en todos los filtros + CROSS JOIN ineficiente
    sql = """
        SELECT p.id,p.codigo,p.nombre,p.unidad_medida,
               p.stock_minimo,p.stock_maximo,p.costo_promedio,
               c.nombre AS categoria,
               b.id AS bodega_id, b.nombre AS bodega_nombre,
               COALESCE(e.stock_fisico,   0) AS stock_fisico,
               COALESCE(e.stock_reservado,0) AS stock_reservado,
               COALESCE(e.stock_fisico,0)-COALESCE(e.stock_reservado,0) AS disponible,
               e.lote, e.fecha_vencimiento
        FROM productos p
        LEFT JOIN categorias c ON p.categoria_id=c.id
        CROSS JOIN bodegas b
        LEFT JOIN existencias e ON e.producto_id=p.id AND e.bodega_id=b.id
        WHERE b.activa=1 AND p.estado=1"""
    if fp:
        sql += " AND (p.nombre LIKE '%" + fp + "%' OR p.codigo LIKE '%" + fp + "%')"
    if fb:
        sql += " AND b.id=" + fb
    if fc:
        sql += " AND p.categoria_id=" + fc
    if fe == 'bajo_min':
        sql += " AND COALESCE(e.stock_fisico,0)>0 AND COALESCE(e.stock_fisico,0)<=p.stock_minimo"
    elif fe == 'agotado':
        sql += " AND COALESCE(e.stock_fisico,0)=0"
    elif fe == 'ok':
        sql += " AND COALESCE(e.stock_fisico,0)>p.stock_minimo"
    sql += " ORDER BY p.codigo, b.nombre"

    regs = db().execute(sql).fetchall()
    bods = db().execute("SELECT * FROM bodegas WHERE activa=1 ORDER BY nombre").fetchall()
    cats = db().execute("SELECT * FROM categorias ORDER BY nombre").fetchall()

    opts_b = '<option value="">Todas las bodegas</option>'
    for b in bods:
        sel = 'selected' if fb == str(b['id']) else ''
        opts_b += f'<option value="{b["id"]}" {sel}>{b["nombre"]}</option>'

    opts_c = '<option value="">Todas las categorias</option>'
    for c in cats:
        sel = 'selected' if fc == str(c['id']) else ''
        opts_c += f'<option value="{c["id"]}" {sel}>{c["nombre"]}</option>'

    total_valor = 0
    filas = ''
    for r in regs:
        stk  = float(r['stock_fisico'])
        res  = float(r['stock_reservado'])
        disp = float(r['disponible'])
        val  = stk * float(r['costo_promedio'])
        total_valor += val

        if stk == 0:
            scss  = 'text-danger fw-bold'
            slbl  = '<span class="badge bg-danger small">Agotado</span>'
        elif stk <= r['stock_minimo']:
            scss  = 'text-warning fw-bold'
            slbl  = '<span class="badge bg-warning text-dark small">Bajo Min.</span>'
        else:
            scss  = 'text-success'
            slbl  = ''

        filas += (
            f'<tr>'
            f'<td><code class="small">{r["codigo"]}</code></td>'
            f'<td class="small">{r["nombre"]}</td>'
            f'<td class="small">{r["categoria"] or "-"}</td>'
            f'<td class="small">{r["bodega_nombre"]}</td>'
            f'<td class="{scss} text-end">{stk:.1f}</td>'
            f'<td class="text-warning text-end">{res:.1f}</td>'
            f'<td class="text-success text-end">{disp:.1f}</td>'
            f'<td class="text-end small">${val:,.0f}</td>'
            f'<td class="text-center">{slbl}</td>'
            f'<td>'
            f'<a href="/kardex/detalle/{r["id"]}/{r["bodega_id"]}" '
            f'class="btn btn-xs btn-outline-info me-1" title="Ver Kardex">'
            f'<i class="bi bi-clock-history"></i></a>'
            f'<a href="/movimientos/ajuste" '
            f'class="btn btn-xs btn-outline-warning" title="Ajustar stock">'
            f'<i class="bi bi-sliders2"></i></a>'
            f'</td></tr>')

    html = f"""
<div class="d-flex justify-content-between align-items-center mb-3">
  <h4 class="mb-0 fw-bold"><i class="bi bi-table me-2"></i>Existencias y Kardex</h4>
  <div class="text-muted small">
    Valor total inventario: <strong>$ {total_valor:,.0f}</strong>
  </div>
</div>
<div class="card shadow-sm mb-3">
  <div class="card-body py-2">
    <form class="row g-2 align-items-end" method="GET">
      <div class="col-md-3">
        <input type="text" name="producto" class="form-control form-control-sm"
          placeholder="Buscar producto o codigo..." value="{fp}">
      </div>
      <div class="col-md-2">
        <select name="bodega" class="form-select form-select-sm">{opts_b}</select>
      </div>
      <div class="col-md-2">
        <select name="categoria" class="form-select form-select-sm">{opts_c}</select>
      </div>
      <div class="col-md-2">
        <select name="estado" class="form-select form-select-sm">
          <option value="todos"    {'selected' if fe=='todos'    else ''}>Todos</option>
          <option value="ok"       {'selected' if fe=='ok'       else ''}>Stock OK</option>
          <option value="bajo_min" {'selected' if fe=='bajo_min' else ''}>Bajo minimo</option>
          <option value="agotado"  {'selected' if fe=='agotado'  else ''}>Agotados</option>
        </select>
      </div>
      <div class="col-auto">
        <button type="submit" class="btn btn-sm btn-primary">Filtrar</button>
        <a href="/kardex" class="btn btn-sm btn-outline-secondary ms-1">Limpiar</a>
      </div>
    </form>
  </div>
</div>
<div class="card shadow-sm">
  <div class="card-body p-0">
    <table class="table table-hover table-sm mb-0">
      <thead><tr>
        <th>Código</th><th>Producto</th><th>Categoría</th><th>Bodega</th>
        <th class="text-end">Stock Fis.</th>
        <th class="text-end">Reservado</th>
        <th class="text-end">Disponible</th>
        <th class="text-end">Valor</th>
        <th class="text-center">Estado</th>
        <th>Acc.</th>
      </tr></thead>
      <tbody>{filas or '<tr><td colspan="10" class="text-center p-3 text-muted">No hay registros</td></tr>'}</tbody>
    </table>
  </div>
</div>
<small class="text-muted mt-2 d-block">{len(regs)} registros encontrados</small>"""
    return render('Existencias / Kardex', html, 'kardex')


@app.route('/kardex/detalle/<int:prod_id>/<int:bod_id>')
@auth
def kardex_detalle(prod_id, bod_id):
    # MALA PRACTICA: queries directas sin DAO/Repository
    prod = db().execute(
        "SELECT p.*, c.nombre AS cat FROM productos p"
        " LEFT JOIN categorias c ON p.categoria_id=c.id"
        " WHERE p.id=?", (prod_id,)).fetchone()
    bod  = db().execute("SELECT * FROM bodegas WHERE id=?", (bod_id,)).fetchone()

    if not prod or not bod:
        flash('Producto o bodega no encontrados', 'danger')
        return redirect('/kardex')

    stock_actual = get_stock(prod_id, bod_id)

    hist = db().execute("""
        SELECT dm.*, m.tipo, m.fecha, m.referencia, m.motivo, u.username,
               m.bodega_id, m.bodega_destino_id
        FROM detalle_movimientos dm
        JOIN movimientos m ON dm.movimiento_id=m.id
        LEFT JOIN usuarios u ON m.usuario_id=u.id
        WHERE dm.producto_id=?
          AND (m.bodega_id=? OR m.bodega_destino_id=?)
        ORDER BY m.id DESC LIMIT 50""",
        (prod_id, bod_id, bod_id)).fetchall()

    BADGE = {
        'ENTRADA':    'bg-success',
        'SALIDA':     'bg-danger',
        'TRASLADO':   'bg-primary',
        'AJUSTE_POS': 'bg-teal',
        'AJUSTE_NEG': 'bg-warning text-dark',
    }
    filas = ''
    for h in hist:
        es_pos = h['tipo'] in ('ENTRADA', 'AJUSTE_POS') or (
            h['tipo'] == 'TRASLADO' and h['bodega_destino_id'] == bod_id)
        ctxt   = ('+' if es_pos else '-') + f'{h["cantidad"]:.1f}'
        ccss   = 'text-success fw-bold' if es_pos else 'text-danger fw-bold'
        bc     = BADGE.get(h['tipo'], 'bg-secondary')
        filas += (
            f'<tr>'
            f'<td class="small">{(h["fecha"] or "")[:16]}</td>'
            f'<td><span class="badge {bc} small">{h["tipo"]}</span></td>'
            f'<td class="small">{h["referencia"] or "-"}</td>'
            f'<td class="small">{h["motivo"] or "-"}</td>'
            f'<td class="{ccss} text-end">{ctxt}</td>'
            f'<td class="text-end">{h["existencia_antes"]:.1f}</td>'
            f'<td class="text-end fw-bold">{h["existencia_despues"]:.1f}</td>'
            f'<td class="small">{h["username"] or "-"}</td></tr>')

    stock_css = 'text-danger' if stock_actual <= prod['stock_minimo'] else 'text-success'
    html = f"""
<div class="d-flex justify-content-between align-items-center mb-3">
  <h4 class="mb-0 fw-bold"><i class="bi bi-clock-history me-2"></i>Kardex del Producto</h4>
  <a href="/kardex" class="btn btn-sm btn-outline-secondary"><i class="bi bi-arrow-left me-1"></i>Volver</a>
</div>
<div class="row g-3 mb-3">
  <div class="col-md-8">
    <div class="card shadow-sm">
      <div class="card-body">
        <div class="row">
          <div class="col-md-6">
            <p class="text-muted small mb-1">Producto</p>
            <div class="fw-bold fs-6">{prod['nombre']}</div>
            <div><code>{prod['codigo']}</code>
              <span class="ms-2 text-muted small">{prod['unidad_medida'] or ''}</span>
            </div>
            <div class="text-muted small">Categoria: {prod['cat'] or '-'}</div>
          </div>
          <div class="col-md-6">
            <p class="text-muted small mb-1">Bodega</p>
            <div class="fw-bold fs-6">{bod['nombre']}</div>
            <div class="text-muted small">{bod['ubicacion'] or '-'}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="col-md-4">
    <div class="card shadow-sm h-100">
      <div class="card-body text-center d-flex flex-column justify-content-center">
        <p class="text-muted small mb-1">Stock Actual</p>
        <div class="{stock_css}" style="font-size:2.8rem;font-weight:800;">{stock_actual:.1f}</div>
        <div class="text-muted small">{prod['unidad_medida'] or 'Unidades'}</div>
        <div class="mt-2 small">
          Min: <strong>{prod['stock_minimo']}</strong> |
          Max: <strong>{prod['stock_maximo']}</strong>
        </div>
        <div class="small">Costo prom: <strong>${float(prod['costo_promedio']):,.0f}</strong></div>
      </div>
    </div>
  </div>
</div>
<div class="card shadow-sm">
  <div class="card-header py-2 fw-semibold small">
    <i class="bi bi-table me-2"></i>Historial de Movimientos (ultimos 50)
  </div>
  <div class="card-body p-0">
    <table class="table table-sm table-hover mb-0">
      <thead><tr>
        <th>Fecha</th><th>Tipo</th><th>Referencia</th><th>Motivo</th>
        <th class="text-end">Cantidad</th>
        <th class="text-end">Stock Antes</th>
        <th class="text-end">Stock Despues</th>
        <th>Usuario</th>
      </tr></thead>
      <tbody>{filas or '<tr><td colspan="8" class="text-center p-3 text-muted">Sin movimientos registrados para este producto en esta bodega</td></tr>'}</tbody>
    </table>
  </div>
</div>"""
    return render(f'Kardex - {prod["nombre"]}', html, 'kardex')


# ================================================================
# MALA PRACTICA: Error handlers que exponen info interna del sistema
# ================================================================

@app.errorhandler(404)
def not_found(e):
    html = f'<div class="alert alert-warning"><strong>404 - No encontrado</strong><br>{e}</div>'
    return render('Error 404', html), 404


@app.errorhandler(500)
def server_error(e):
    # MALA PRACTICA: exponer stack trace al usuario final
    html = f'<div class="alert alert-danger"><strong>Error 500</strong><br><pre>{e}</pre></div>'
    return render('Error 500', html), 500


# ================================================================
# MALA PRACTICA: Main con configuracion hardcoded
# debug=True, host='0.0.0.0' expuesto a toda la red
# Sin factory pattern, sin configuracion por entorno
# ================================================================
if __name__ == '__main__':
    print()
    print("Acceso: http://127.0.0.1:5001")
    print("Usuarios: admin/admin123  |  bodeguero1/bodega123  |  auditor1/audit123")
    print()
    app.run(host='0.0.0.0', port=5001, debug=True, use_reloader=False)
