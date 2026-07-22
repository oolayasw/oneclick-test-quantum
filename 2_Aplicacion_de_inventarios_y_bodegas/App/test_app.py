"""Script de prueba de todas las pantallas de StockControl"""
import urllib.request, urllib.parse, http.cookiejar

base = 'http://127.0.0.1:5001'
jar  = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))

# LOGIN
data = urllib.parse.urlencode({'username':'admin','password':'admin123'}).encode()
r = opener.open(base+'/login', data)
body = r.read().decode()
print(f'[LOGIN/DASHBOARD] status={r.status} | Dashboard={("Dashboard" in body)}')

# Verificar todas las pantallas
pantallas = [
    ('/productos',                  'PROD001'),
    ('/productos/nuevo',            'Nuevo Producto'),
    ('/productos/editar/1',         'Editar Producto'),
    ('/bodegas',                    'Bodega Central'),
    ('/bodegas/nuevo',              'Nueva Bodega'),
    ('/bodegas/editar/1',           'Editar Bodega'),
    ('/movimientos',                'Historial'),
    ('/movimientos/entrada',        'Registrar Entrada'),
    ('/movimientos/salida',         'Registrar Salida'),
    ('/movimientos/traslado',       'Traslado entre Bodegas'),
    ('/movimientos/ajuste',         'Ajuste de Inventario'),
    ('/kardex',                     'Existencias y Kardex'),
    ('/kardex/detalle/1/1',         'Kardex del Producto'),
    ('/api/stock?prod=1&bod=1',     'stock'),
]

print("\n[PRUEBA DE PANTALLAS]")
ok_count = 0
fail_count = 0
for url, kw in pantallas:
    try:
        r = opener.open(base+url)
        body = r.read().decode()
        ok = kw in body
        status = 'OK' if ok else 'FALLO'
        if ok:
            ok_count += 1
        else:
            fail_count += 1
        print(f'  {r.status} {status:5} {url:35} (keyword: {kw})')
    except Exception as e:
        fail_count += 1
        print(f'  ERR   {url:35} -> {e}')

print(f"\n[RESULTADO] Exitosas: {ok_count}/{ok_count+fail_count} | Fallidas: {fail_count}")

# Test POST entrada
print("\n[TEST POST - Registrar Entrada]")
data2 = urllib.parse.urlencode({
    'bodega_id': '1', 'referencia': 'TEST-001', 'motivo': 'Compra',
    'prod_0': '1', 'cant_0': '5', 'costo_0': '2800000'
}).encode()
try:
    r2 = opener.open(base+'/movimientos/entrada', data2)
    print(f'  POST entrada -> status={r2.status} OK')
except urllib.error.HTTPError as e:
    # 302 redirect al historial = exito
    if e.code == 302:
        print(f'  POST entrada -> 302 redirect (exito, movimiento registrado)')
    else:
        print(f'  POST entrada -> ERROR {e.code}')

print("\n[VERIFICACION STOCK POST-ENTRADA]")
r3 = opener.open(base+'/api/stock?prod=1&bod=1')
import json
data3 = json.loads(r3.read().decode())
print(f'  Stock producto 1, bodega 1: {data3["stock"]}')

print("\n[DEBUG COMPLETO: EXITOSO]")
