// ================================================================
// app.ts - ARCHIVO DIOS: TODO EL BACKEND EN UN SOLO ARCHIVO
// ================================================================
// MALAS PRACTICAS IMPLEMENTADAS:
//   - Viola SRP: rutas, logica de negocio y datos en un mismo archivo
//   - Viola OCP: para agregar un modulo hay que modificar este archivo
//   - Viola DIP: sin abstracciones, todo acoplado directamente
//   - ANTIPATRON God Object: una clase/modulo que lo hace todo
//   - Estado global mutable en variables globales
//   - Passwords en texto plano
//   - Tokens falsos (no JWT real)
//   - CORS abierto para todos los origenes
//   - Sin validacion de entrada
//   - Codigo duplicado en cada endpoint
//   - Magic numbers y strings hardcodeados
//   - var en vez de const/let
//   - Tipos any en todo
// ================================================================

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

// MALA PRACTICA: var y tipo any en todo
var app: any = express();
var PORT: any = 3000;

// ================================================================
// ANTIPATRON: Estado global mutable - deberia ser base de datos
// ================================================================
var CLIENTES: any[] = [
  {
    id: 1, identificacion: '900123456-1', razonSocial: 'Empresa ABC S.A.S',
    contacto: 'Juan Pérez', correo: 'juan@empresaabc.com', telefono: '3001234567',
    direccion: 'Calle 1 # 2-3, Bogotá', condicionTributaria: 'RESPONSABLE_IVA',
    estado: 'activo', totalCotizado: 22610000
  },
  {
    id: 2, identificacion: '800987654-2', razonSocial: 'Comercial XYZ Ltda',
    contacto: 'María García', correo: 'maria@xyz.com', telefono: '3009876543',
    direccion: 'Carrera 5 # 10-20, Medellín', condicionTributaria: 'NO_RESPONSABLE',
    estado: 'activo', totalCotizado: 10067400
  },
  {
    id: 3, identificacion: '700555666-3', razonSocial: 'Industrias 123 SAS',
    contacto: 'Carlos López', correo: 'carlos@ind123.com', telefono: '3005556666',
    direccion: 'Av 6 # 15-30, Cali', condicionTributaria: 'GRAN_CONTRIBUYENTE',
    estado: 'inactivo', totalCotizado: 0
  },
  {
    id: 4, identificacion: '600111222-4', razonSocial: 'Servicios Integrales SA',
    contacto: 'Ana Martínez', correo: 'ana@servicios.com', telefono: '3101112222',
    direccion: 'Diagonal 8 # 5-10, Barranquilla', condicionTributaria: 'RESPONSABLE_IVA',
    estado: 'activo', totalCotizado: 0
  }
];

var PRODUCTOS: any[] = [
  { id: 1, codigo: 'PROD-001', nombre: 'Software de gestión ERP', descripcion: 'Sistema completo de gestión empresarial', precio: 5000000, impuesto: 19, tipo: 'Producto', estado: 'activo' },
  { id: 2, codigo: 'PROD-002', nombre: 'Licencia anual de uso', descripcion: 'Licencia de uso anual por usuario', precio: 2000000, impuesto: 0, tipo: 'Producto', estado: 'activo' },
  { id: 3, codigo: 'SERV-001', nombre: 'Consultoría técnica (hora)', descripcion: 'Hora de consultoría técnica especializada', precio: 150000, impuesto: 19, tipo: 'Servicio', estado: 'activo' },
  { id: 4, codigo: 'SERV-002', nombre: 'Soporte premium mensual', descripcion: 'Soporte técnico 24/7 mensual', precio: 800000, impuesto: 19, tipo: 'Servicio', estado: 'activo' },
  { id: 5, codigo: 'PROD-003', nombre: 'Servidor HPE ProLiant', descripcion: 'Servidor físico HPE ProLiant DL380 Gen10', precio: 12000000, impuesto: 19, tipo: 'Producto', estado: 'activo' },
  { id: 6, codigo: 'SERV-003', nombre: 'Capacitación usuarios (día)', descripcion: 'Jornada de capacitación presencial', precio: 500000, impuesto: 19, tipo: 'Servicio', estado: 'activo' }
];

var LISTAS_PRECIOS: any[] = [
  { id: 1, nombre: 'Lista Estándar 2024', segmento: 'General', vigenciaDesde: '2024-01-01', vigenciaHasta: '2024-12-31', descuentoMaximo: 10, estado: 'activa' },
  { id: 2, nombre: 'Lista Corporativa Premium', segmento: 'Corporativo', vigenciaDesde: '2024-01-01', vigenciaHasta: '2024-12-31', descuentoMaximo: 25, estado: 'activa' },
  { id: 3, nombre: 'Lista PYME 2024', segmento: 'PYME', vigenciaDesde: '2024-06-01', vigenciaHasta: '2024-12-31', descuentoMaximo: 15, estado: 'activa' }
];

var COTIZACIONES: any[] = [
  {
    id: 1, numero: 'COT-2024-001', clienteId: 1, cliente: 'Empresa ABC S.A.S',
    asesorId: 1, asesor: 'Asesor Demo', moneda: 'COP', vigencia: '2024-12-31',
    listaPreciosId: 1, listaPreciosNombre: 'Lista Estándar 2024',
    estado: 'Enviada', subtotal: 7000000, descuento: 0, impuestos: 1330000, total: 8330000,
    condicionesPago: '30 días', tiempoEntrega: '15 días hábiles',
    observaciones: 'Cotización para modernización de sistemas internos',
    items: [
      { productoId: 1, codigo: 'PROD-001', nombre: 'Software de gestión ERP', cantidad: 1, precio: 5000000, descuento: 0, impuesto: 19, subtotal: 5000000 },
      { productoId: 2, codigo: 'PROD-002', nombre: 'Licencia anual de uso', cantidad: 1, precio: 2000000, descuento: 0, impuesto: 0, subtotal: 2000000 }
    ],
    historialEstados: [
      { estado: 'Borrador', fecha: '2024-01-10', usuario: 'Asesor Demo', comentario: '' },
      { estado: 'Pendiente de aprobación', fecha: '2024-01-10', usuario: 'Asesor Demo', comentario: 'Solicito aprobación' },
      { estado: 'Aprobada', fecha: '2024-01-11', usuario: 'Supervisor Demo', comentario: 'Aprobado. Margen adecuado.' },
      { estado: 'Enviada', fecha: '2024-01-12', usuario: 'Asesor Demo', comentario: 'Enviada al cliente' }
    ],
    createdAt: '2024-01-10'
  },
  {
    id: 2, numero: 'COT-2024-002', clienteId: 2, cliente: 'Comercial XYZ Ltda',
    asesorId: 1, asesor: 'Asesor Demo', moneda: 'COP', vigencia: '2024-11-30',
    listaPreciosId: 2, listaPreciosNombre: 'Lista Corporativa Premium',
    estado: 'Pendiente de aprobación', subtotal: 8460000, descuento: 10, impuestos: 1453140, total: 9913140,
    condicionesPago: '60 días', tiempoEntrega: '20 días hábiles',
    observaciones: 'Descuento del 10% por volumen solicitado por el cliente',
    items: [
      { productoId: 3, codigo: 'SERV-001', nombre: 'Consultoría técnica (hora)', cantidad: 40, precio: 150000, descuento: 10, impuesto: 19, subtotal: 5400000 },
      { productoId: 4, codigo: 'SERV-002', nombre: 'Soporte premium mensual', cantidad: 3, precio: 800000, descuento: 10, impuesto: 19, subtotal: 2160000 },
      { productoId: 2, codigo: 'PROD-002', nombre: 'Licencia anual de uso', cantidad: 1, precio: 2000000, descuento: 0, impuesto: 0, subtotal: 2000000 }
    ],
    historialEstados: [
      { estado: 'Borrador', fecha: '2024-01-15', usuario: 'Asesor Demo', comentario: '' },
      { estado: 'Pendiente de aprobación', fecha: '2024-01-16', usuario: 'Asesor Demo', comentario: 'Descuento 10% solicitado por volumen. Favor aprobar.' }
    ],
    createdAt: '2024-01-15'
  },
  {
    id: 3, numero: 'COT-2024-003', clienteId: 1, cliente: 'Empresa ABC S.A.S',
    asesorId: 1, asesor: 'Asesor Demo', moneda: 'COP', vigencia: '2024-10-31',
    listaPreciosId: 1, listaPreciosNombre: 'Lista Estándar 2024',
    estado: 'Aceptada', subtotal: 12000000, descuento: 0, impuestos: 2280000, total: 14280000,
    condicionesPago: 'Contado', tiempoEntrega: '30 días hábiles',
    observaciones: 'Reposición de infraestructura de servidores',
    items: [
      { productoId: 5, codigo: 'PROD-003', nombre: 'Servidor HPE ProLiant', cantidad: 1, precio: 12000000, descuento: 0, impuesto: 19, subtotal: 12000000 }
    ],
    historialEstados: [
      { estado: 'Borrador', fecha: '2024-01-08', usuario: 'Asesor Demo', comentario: '' },
      { estado: 'Aprobada', fecha: '2024-01-09', usuario: 'Supervisor Demo', comentario: 'OK sin descuento' },
      { estado: 'Enviada', fecha: '2024-01-09', usuario: 'Asesor Demo', comentario: '' },
      { estado: 'Aceptada', fecha: '2024-01-20', usuario: 'Asesor Demo', comentario: 'Cliente confirmó compra' }
    ],
    createdAt: '2024-01-08'
  },
  {
    id: 4, numero: 'COT-2024-004', clienteId: 2, cliente: 'Comercial XYZ Ltda',
    asesorId: 1, asesor: 'Asesor Demo', moneda: 'COP', vigencia: '2024-09-30',
    listaPreciosId: 2, listaPreciosNombre: 'Lista Corporativa Premium',
    estado: 'Rechazada', subtotal: 3000000, descuento: 20, impuestos: 456000, total: 3456000,
    condicionesPago: '30 días', tiempoEntrega: '10 días hábiles',
    observaciones: '',
    items: [
      { productoId: 6, codigo: 'SERV-003', nombre: 'Capacitación usuarios (día)', cantidad: 6, precio: 500000, descuento: 20, impuesto: 19, subtotal: 2400000 }
    ],
    historialEstados: [
      { estado: 'Borrador', fecha: '2023-12-01', usuario: 'Asesor Demo', comentario: '' },
      { estado: 'Pendiente de aprobación', fecha: '2023-12-01', usuario: 'Asesor Demo', comentario: 'Descuento 20%' },
      { estado: 'Rechazada', fecha: '2023-12-02', usuario: 'Supervisor Demo', comentario: 'Descuento excesivo para este cliente. Resubmit con máximo 15%.' }
    ],
    createdAt: '2023-12-01'
  }
];

// MALA PRACTICA: Passwords en texto plano, sin hash
var USUARIOS: any[] = [
  { id: 1, nombre: 'Asesor Demo', email: 'asesor@quoteflow.com', password: '1234', rol: 'asesor' },
  { id: 2, nombre: 'Supervisor Demo', email: 'supervisor@quoteflow.com', password: '1234', rol: 'supervisor' },
  { id: 3, nombre: 'Admin Demo', email: 'admin@quoteflow.com', password: '1234', rol: 'admin' }
];

// MALA PRACTICA: Contadores globales sin atomicidad (race conditions en concurrencia)
var cotizacionCounter: any = 5;
var clienteCounter: any = 5;
var productoCounter: any = 7;
// MALA PRACTICA: Sesiones en memoria - se pierden al reiniciar
var sesionesActivas: any = {};

// ================================================================
// MIDDLEWARES - MALA PRACTICA: CORS completamente abierto
// ================================================================
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MALA PRACTICA: Middleware de logging que loguea TODA la info sin filtrar datos sensibles
app.use(function(req: any, res: any, next: any) {
  console.log('[' + new Date().toISOString() + '] ' + req.method + ' ' + req.url);
  console.log('Body:', JSON.stringify(req.body)); // MALA PRACTICA: Loguear body completo
  next();
});

// ================================================================
// AUTH - Sin JWT real, sin bcrypt, sin refresh tokens
// ================================================================
app.post('/api/auth/login', function(req: any, res: any) {
  var email: any = req.body.email;
  var password: any = req.body.password;

  // MALA PRACTICA: Busqueda con for loop en vez de .find()
  var usuarioEncontrado: any = null;
  for (var i = 0; i < USUARIOS.length; i++) {
    if (USUARIOS[i].email == email && USUARIOS[i].password == password) { // == en vez de ===, sin hash
      usuarioEncontrado = USUARIOS[i];
    }
  }

  if (usuarioEncontrado == null) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  // MALA PRACTICA: Token es solo un string concatenado, no JWT firmado
  var token: any = 'FAKE_TOKEN_' + usuarioEncontrado.id + '_' + Date.now();
  sesionesActivas[token] = usuarioEncontrado;

  // MALA PRACTICA: Retornamos el password del usuario en la respuesta
  res.json({ token: token, usuario: usuarioEncontrado });
});

app.post('/api/auth/logout', function(req: any, res: any) {
  var token: any = req.headers['authorization'];
  if (token && sesionesActivas[token]) {
    delete sesionesActivas[token];
  }
  res.json({ mensaje: 'Sesión cerrada' });
});

// MALA PRACTICA: Middleware de auth que no verifica que el token sea valido
function verificarAuth(req: any, res: any, next: any) {
  var token: any = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  // MALA PRACTICA: Solo verificamos que el token exista, no que sea valido
  next();
}

// ================================================================
// CLIENTES - Logica de negocio mezclada con rutas HTTP
// ================================================================
app.get('/api/clientes', function(req: any, res: any) {
  // MALA PRACTICA: Retornamos TODOS los clientes sin paginacion
  res.json(CLIENTES);
});

app.get('/api/clientes/:id', function(req: any, res: any) {
  var id: any = parseInt(req.params.id);
  var cliente: any = null;

  // MALA PRACTICA: Duplicado de logica de busqueda (copia exacta en PUT y DELETE)
  for (var i = 0; i < CLIENTES.length; i++) {
    if (CLIENTES[i].id == id) {
      cliente = CLIENTES[i];
    }
  }

  if (!cliente) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }

  // MALA PRACTICA: Lógica de negocio mezclada: calcular historial aquí
  var historialCotizaciones: any[] = [];
  for (var j = 0; j < COTIZACIONES.length; j++) {
    if (COTIZACIONES[j].clienteId == id) {
      historialCotizaciones.push(COTIZACIONES[j]);
    }
  }
  // MALA PRACTICA: Mutamos el objeto original
  cliente.historialCotizaciones = historialCotizaciones;
  res.json(cliente);
});

app.post('/api/clientes', function(req: any, res: any) {
  var body: any = req.body;

  // MALA PRACTICA: Validacion duplicada (igual que en frontend)
  if (!body.razonSocial || body.razonSocial.trim() == '') {
    return res.status(400).json({ error: 'La razón social es requerida' });
  }
  if (!body.identificacion || body.identificacion.trim() == '') {
    return res.status(400).json({ error: 'La identificación es requerida' });
  }

  // MALA PRACTICA: Verificar duplicados con for loop
  for (var i = 0; i < CLIENTES.length; i++) {
    if (CLIENTES[i].identificacion == body.identificacion) {
      return res.status(400).json({ error: 'Ya existe un cliente con esa identificación' });
    }
  }

  // MALA PRACTICA: Sin sanitizacion de entrada
  var nuevoCliente: any = {
    id: clienteCounter++,
    identificacion: body.identificacion,
    razonSocial: body.razonSocial,
    contacto: body.contacto || '',
    correo: body.correo || '',
    telefono: body.telefono || '',
    direccion: body.direccion || '',
    condicionTributaria: body.condicionTributaria || 'NO_RESPONSABLE',
    estado: 'activo',
    totalCotizado: 0
  };

  CLIENTES.push(nuevoCliente);
  res.json(nuevoCliente); // MALA PRACTICA: 200 en vez de 201
});

app.put('/api/clientes/:id', function(req: any, res: any) {
  var id: any = parseInt(req.params.id);
  var body: any = req.body;
  var indice: any = -1;

  // MALA PRACTICA: Codigo IDENTICO al de GET /clientes/:id (DRY violation)
  for (var i = 0; i < CLIENTES.length; i++) {
    if (CLIENTES[i].id == id) {
      indice = i;
    }
  }

  if (indice === -1) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }

  // MALA PRACTICA: Actualizamos campos individualmente sin helper
  CLIENTES[indice].razonSocial = body.razonSocial || CLIENTES[indice].razonSocial;
  CLIENTES[indice].contacto = body.contacto !== undefined ? body.contacto : CLIENTES[indice].contacto;
  CLIENTES[indice].correo = body.correo !== undefined ? body.correo : CLIENTES[indice].correo;
  CLIENTES[indice].telefono = body.telefono !== undefined ? body.telefono : CLIENTES[indice].telefono;
  CLIENTES[indice].direccion = body.direccion !== undefined ? body.direccion : CLIENTES[indice].direccion;
  CLIENTES[indice].condicionTributaria = body.condicionTributaria || CLIENTES[indice].condicionTributaria;
  CLIENTES[indice].estado = body.estado || CLIENTES[indice].estado;

  res.json(CLIENTES[indice]);
});

app.delete('/api/clientes/:id', function(req: any, res: any) {
  var id: any = parseInt(req.params.id);
  // MALA PRACTICA: Borrado fisico en vez de logico
  var longitudAntes: any = CLIENTES.length;
  CLIENTES = CLIENTES.filter(function(c: any) { return c.id != id; });
  if (CLIENTES.length === longitudAntes) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }
  res.json({ mensaje: 'Cliente eliminado permanentemente' });
});

// ================================================================
// PRODUCTOS - Codigo duplicado de CLIENTES (antipatron copy-paste)
// ================================================================
app.get('/api/productos', function(req: any, res: any) {
  res.json(PRODUCTOS); // MALA PRACTICA: Sin paginacion
});

app.post('/api/productos', function(req: any, res: any) {
  var body: any = req.body;

  // MALA PRACTICA: Validacion IDENTICA copiada de clientes
  if (!body.nombre || body.nombre.trim() == '') {
    return res.status(400).json({ error: 'El nombre es requerido' });
  }
  if (!body.codigo || body.codigo.trim() == '') {
    return res.status(400).json({ error: 'El código es requerido' });
  }

  // MALA PRACTICA: Verificar duplicados con for loop (tercera vez igual)
  for (var i = 0; i < PRODUCTOS.length; i++) {
    if (PRODUCTOS[i].codigo == body.codigo) {
      return res.status(400).json({ error: 'Ya existe un producto con ese código' });
    }
  }

  var nuevoProducto: any = {
    id: productoCounter++,
    codigo: body.codigo,
    nombre: body.nombre,
    descripcion: body.descripcion || '',
    precio: body.precio || 0,
    impuesto: body.impuesto !== undefined ? body.impuesto : 19, // Magic number 19
    tipo: body.tipo || 'Producto',
    estado: 'activo'
  };

  PRODUCTOS.push(nuevoProducto);
  res.json(nuevoProducto);
});

app.put('/api/productos/:id', function(req: any, res: any) {
  var id: any = parseInt(req.params.id);
  var body: any = req.body;
  var indice: any = -1;

  // MALA PRACTICA: CUARTA copia del mismo loop de busqueda
  for (var i = 0; i < PRODUCTOS.length; i++) {
    if (PRODUCTOS[i].id == id) {
      indice = i;
    }
  }
  if (indice === -1) return res.status(404).json({ error: 'Producto no encontrado' });
  PRODUCTOS[indice] = { ...PRODUCTOS[indice], ...body, id: id };
  res.json(PRODUCTOS[indice]);
});

// ================================================================
// LISTAS DE PRECIOS
// ================================================================
app.get('/api/listas-precios', function(req: any, res: any) {
  res.json(LISTAS_PRECIOS);
});

app.post('/api/listas-precios', function(req: any, res: any) {
  var body: any = req.body;
  // MALA PRACTICA: Sin validacion
  var nueva: any = {
    id: LISTAS_PRECIOS.length + 1, // MALA PRACTICA: ID calculado con length (puede colisionar)
    nombre: body.nombre,
    segmento: body.segmento || 'General',
    vigenciaDesde: body.vigenciaDesde,
    vigenciaHasta: body.vigenciaHasta,
    descuentoMaximo: body.descuentoMaximo || 10,
    estado: 'activa'
  };
  LISTAS_PRECIOS.push(nueva);
  res.json(nueva);
});

// ================================================================
// COTIZACIONES - Logica de negocio completamente mezclada con HTTP
// ================================================================
app.get('/api/cotizaciones', function(req: any, res: any) {
  res.json(COTIZACIONES);
});

app.get('/api/cotizaciones/:id', function(req: any, res: any) {
  var id: any = parseInt(req.params.id);
  var cot: any = null;
  // MALA PRACTICA: QUINTA copia del loop de busqueda
  for (var i = 0; i < COTIZACIONES.length; i++) {
    if (COTIZACIONES[i].id == id) cot = COTIZACIONES[i];
  }
  if (!cot) return res.status(404).json({ error: 'Cotización no encontrada' });
  res.json(cot);
});

app.post('/api/cotizaciones', function(req: any, res: any) {
  var body: any = req.body;

  if (!body.clienteId) {
    return res.status(400).json({ error: 'El cliente es requerido' });
  }
  if (!body.items || body.items.length === 0) {
    return res.status(400).json({ error: 'Debe agregar al menos un item' });
  }

  // MALA PRACTICA: Logica de calculo mezclada con la ruta
  var subtotal: any = 0;
  var impuestos: any = 0;

  for (var i = 0; i < body.items.length; i++) {
    var item: any = body.items[i];
    var descuentoItem: any = item.cantidad * item.precio * ((item.descuento || 0) / 100);
    var baseItem: any = (item.cantidad * item.precio) - descuentoItem;
    var impuestoItem: any = baseItem * ((item.impuesto || 0) / 100);
    item.subtotal = baseItem;
    subtotal += baseItem;
    impuestos += impuestoItem;
  }

  var descuentoGral: any = subtotal * ((body.descuento || 0) / 100);
  var total: any = (subtotal - descuentoGral) + impuestos;

  // MALA PRACTICA: Generar numero con logica inline
  var anio: any = new Date().getFullYear();
  var numero: any = 'COT-' + anio + '-' + String(cotizacionCounter).padStart(3, '0');

  // MALA PRACTICA: Buscar nombre del cliente inline
  var clienteNombre: any = 'Cliente desconocido';
  for (var j = 0; j < CLIENTES.length; j++) {
    if (CLIENTES[j].id == body.clienteId) {
      clienteNombre = CLIENTES[j].razonSocial;
    }
  }

  var estadoInicial: any = body.enviarAprobacion ? 'Pendiente de aprobación' : 'Borrador';
  var hoy: any = new Date().toISOString().split('T')[0];

  var nuevaCot: any = {
    id: cotizacionCounter++,
    numero: numero,
    clienteId: body.clienteId,
    cliente: clienteNombre,
    asesorId: body.asesorId || 1,
    asesor: body.asesor || 'Asesor Demo',
    moneda: body.moneda || 'COP',
    vigencia: body.vigencia || '',
    listaPreciosId: body.listaPreciosId,
    listaPreciosNombre: body.listaPreciosNombre || '',
    estado: estadoInicial,
    subtotal: subtotal,
    descuento: body.descuento || 0,
    impuestos: impuestos,
    total: total,
    condicionesPago: body.condicionesPago || '',
    tiempoEntrega: body.tiempoEntrega || '',
    observaciones: body.observaciones || '',
    items: body.items,
    historialEstados: [{ estado: estadoInicial, fecha: hoy, usuario: body.asesor || 'Asesor Demo', comentario: body.comentarioInicial || '' }],
    createdAt: hoy
  };

  COTIZACIONES.push(nuevaCot);

  // MALA PRACTICA: Efecto secundario en el mismo handler - actualizar totalCotizado del cliente
  for (var k = 0; k < CLIENTES.length; k++) {
    if (CLIENTES[k].id == body.clienteId) {
      CLIENTES[k].totalCotizado = (CLIENTES[k].totalCotizado || 0) + total;
    }
  }

  console.log('Cotización creada:', numero, 'Total:', total); // MALA PRACTICA: log con datos sensibles
  res.json(nuevaCot);
});

app.put('/api/cotizaciones/:id/estado', function(req: any, res: any) {
  var id: any = parseInt(req.params.id);
  var body: any = req.body;
  var indice: any = -1;

  // MALA PRACTICA: SEXTA copia del loop de busqueda
  for (var i = 0; i < COTIZACIONES.length; i++) {
    if (COTIZACIONES[i].id == id) indice = i;
  }

  if (indice === -1) return res.status(404).json({ error: 'Cotización no encontrada' });

  var estadosValidos: any = ['Borrador', 'Pendiente de aprobación', 'Requiere ajustes', 'Aprobada', 'Enviada', 'Aceptada', 'Rechazada', 'Vencida', 'Cancelada'];
  // MALA PRACTICA: Sin validacion de transicion de estados
  COTIZACIONES[indice].estado = body.estado;
  COTIZACIONES[indice].historialEstados.push({
    estado: body.estado,
    fecha: new Date().toISOString().split('T')[0],
    usuario: body.usuario || 'Sistema',
    comentario: body.comentario || ''
  });

  res.json(COTIZACIONES[indice]);
});

// ================================================================
// DASHBOARD - Calculos estadisticos mezclados en el handler
// ================================================================
app.get('/api/dashboard', function(req: any, res: any) {
  // MALA PRACTICA: Todo el calculo estadistico en el handler HTTP
  var totalCotizaciones: any = 0;
  var borradores: any = 0;
  var pendientesAprobacion: any = 0;
  var enviadas: any = 0;
  var aceptadas: any = 0;
  var rechazadas: any = 0;
  var vencidas: any = 0;
  var valorTotal: any = 0;
  var valorAceptado: any = 0;

  // MALA PRACTICA: Multiples loops donde uno bastaria
  for (var i = 0; i < COTIZACIONES.length; i++) {
    totalCotizaciones++;
    valorTotal = valorTotal + COTIZACIONES[i].total;
  }

  for (var j = 0; j < COTIZACIONES.length; j++) {
    var est: any = COTIZACIONES[j].estado;
    if (est == 'Borrador') borradores++;
    else if (est == 'Pendiente de aprobación') pendientesAprobacion++;
    else if (est == 'Enviada') enviadas++;
    else if (est == 'Aceptada') { aceptadas++; valorAceptado += COTIZACIONES[j].total; }
    else if (est == 'Rechazada') rechazadas++;
    else if (est == 'Vencida') vencidas++;
  }

  var tasaConversion: any = totalCotizaciones > 0 ? Math.round((aceptadas / totalCotizaciones) * 100) : 0;

  // MALA PRACTICA: Construir respuesta inline con todo mezclado
  var actividadReciente: any[] = [];
  for (var k = 0; k < COTIZACIONES.length; k++) {
    actividadReciente.push({
      numero: COTIZACIONES[k].numero,
      cliente: COTIZACIONES[k].cliente,
      estado: COTIZACIONES[k].estado,
      fecha: COTIZACIONES[k].createdAt,
      total: COTIZACIONES[k].total
    });
  }
  // Ordenar por fecha descendente (MALA PRACTICA: sort inline)
  actividadReciente.sort(function(a: any, b: any) { return b.fecha > a.fecha ? 1 : -1; });

  res.json({
    totalCotizaciones: totalCotizaciones,
    borradores: borradores,
    pendientesAprobacion: pendientesAprobacion,
    enviadas: enviadas,
    aceptadas: aceptadas,
    rechazadas: rechazadas,
    vencidas: vencidas,
    valorTotalCotizado: valorTotal,
    valorTotalAceptado: valorAceptado,
    tasaConversion: tasaConversion,
    actividadReciente: actividadReciente.slice(0, 5),
    totalClientes: CLIENTES.filter(function(c: any) { return c.estado === 'activo'; }).length,
    totalProductos: PRODUCTOS.filter(function(p: any) { return p.estado === 'activo'; }).length,
    proximosVencer: COTIZACIONES.filter(function(c: any) { return c.estado == 'Enviada'; }).length
  });
});

// ================================================================
// INICIAR SERVIDOR
// ================================================================
app.listen(PORT, function() {
  console.log('');
  console.log('=======================================================');
  console.log('  QuoteFlow Backend - Puerto ' + PORT);
  console.log('  ATENCION: Versiones obsoletas (Express 4.16, TS 3.9)');
  console.log('  ATENCION: Estado en memoria - datos se pierden al reiniciar');
  console.log('  ATENCION: Sin autenticacion real, CORS abierto');
  console.log('=======================================================');
  console.log('');
});
