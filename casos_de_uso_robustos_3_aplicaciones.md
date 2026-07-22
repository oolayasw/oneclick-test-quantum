# Casos de uso robustos para tres aplicaciones empresariales

## 1. Aplicación de cotización y gestión comercial

### Nombre propuesto

**QuoteFlow**

### Núcleo de negocio

Gestión comercial y preventa.

### Objetivo

Centralizar el registro de clientes, la creación de cotizaciones, el control de descuentos, la aprobación comercial, el envío de documentos y el seguimiento de oportunidades.

### Roles

- Asesor comercial.
- Supervisor comercial.
- Administrador.

### Módulos

- Clientes.
- Productos y servicios.
- Listas de precios.
- Cotizaciones.
- Aprobaciones.
- Seguimiento comercial.
- Reportes.

## Pantallas

### Pantalla 1. Dashboard comercial

Muestra:

- Cotizaciones creadas.
- Pendientes de aprobación.
- Enviadas, aceptadas, rechazadas y vencidas.
- Valor total cotizado.
- Tasa de conversión.
- Cotizaciones próximas a vencer.
- Actividad reciente.

Permite filtrar por fecha, asesor, cliente y estado.

### Pantalla 2. Gestión de clientes

Permite:

- Crear y editar clientes.
- Buscar por nombre o identificación.
- Consultar contactos.
- Activar o inactivar clientes.
- Consultar historial de cotizaciones.
- Consultar valor total cotizado.

Campos principales:

- Identificación.
- Razón social.
- Contacto.
- Correo.
- Teléfono.
- Dirección.
- Condición tributaria.
- Estado.

### Pantalla 3. Catálogo y listas de precios

Permite:

- Crear productos y servicios.
- Configurar precio base.
- Crear listas por segmento.
- Definir impuestos.
- Activar o inactivar ítems.
- Consultar vigencia de precios.

### Pantalla 4. Creación de cotización

Incluye:

- Cliente.
- Moneda.
- Vigencia.
- Lista de precios.
- Productos o servicios.
- Cantidades.
- Descuentos.
- Impuestos.
- Condiciones de pago.
- Tiempo de entrega.
- Observaciones.
- Total general.

Acciones:

- Guardar borrador.
- Enviar a aprobación.
- Generar vista previa.
- Descargar PDF.
- Duplicar.
- Cancelar.

### Pantalla 5. Aprobación y seguimiento

Muestra:

- Número de cotización.
- Cliente.
- Asesor.
- Valor.
- Descuento solicitado.
- Margen estimado.
- Historial de estados.
- Comentarios.
- Historial de envíos.

Permite:

- Aprobar.
- Rechazar.
- Solicitar ajustes.
- Enviar al cliente.
- Registrar aceptación o rechazo.

## Estados

- Borrador.
- Pendiente de aprobación.
- Requiere ajustes.
- Aprobada.
- Enviada.
- Aceptada.
- Rechazada.
- Vencida.
- Cancelada.

## Casos de uso

### CU-COT-01. Registrar cliente

**Actor:** Asesor comercial.

**Precondiciones:**

- El usuario está autenticado.
- Tiene permiso para gestionar clientes.

**Flujo principal:**

1. El asesor abre la pantalla de clientes.
2. Selecciona `Nuevo cliente`.
3. Registra identificación y datos generales.
4. El sistema valida que no exista.
5. El asesor registra los datos de contacto y tributarios.
6. Guarda la información.
7. El sistema crea el cliente y registra auditoría.

**Resultado:** El cliente queda disponible para cotizaciones.

### CU-COT-02. Crear cotización

**Actor:** Asesor comercial.

**Precondiciones:**

- Cliente activo.
- Productos activos.
- Lista de precios vigente.

**Flujo principal:**

1. El asesor selecciona `Nueva cotización`.
2. Selecciona el cliente.
3. El sistema carga sus datos.
4. El asesor selecciona una lista de precios.
5. Agrega productos o servicios.
6. Registra cantidades.
7. El sistema calcula subtotales, descuentos e impuestos.
8. El asesor registra condiciones comerciales.
9. Guarda la cotización.
10. El sistema genera un consecutivo y la deja en estado Borrador.

### CU-COT-03. Aprobar descuento especial

**Actor:** Supervisor comercial.

1. El supervisor consulta la bandeja de aprobaciones.
2. Abre la cotización.
3. Revisa descuento, margen y justificación.
4. Registra un comentario.
5. Aprueba, rechaza o solicita ajustes.
6. El sistema actualiza el estado y notifica al asesor.

### CU-COT-04. Enviar cotización

**Actor:** Asesor comercial.

1. El asesor abre una cotización aprobada.
2. Selecciona `Enviar`.
3. El sistema genera el PDF.
4. El asesor revisa correo y mensaje.
5. Confirma el envío.
6. El sistema registra destinatario y fecha.
7. La cotización cambia a Enviada.

### CU-COT-05. Registrar respuesta

1. El asesor abre la cotización.
2. Registra si fue aceptada o rechazada.
3. Si fue rechazada, indica el motivo.
4. El sistema actualiza indicadores y trazabilidad.

## Reglas de negocio

- Toda cotización debe incluir al menos un ítem.
- Los precios deben provenir de una lista vigente.
- Los descuentos dependen del rol.
- Los descuentos superiores requieren aprobación.
- Una cotización aprobada no se modifica directamente.
- Los cambios generan una nueva versión.
- Una cotización vencida no puede aceptarse.
- Los cálculos se realizan en el backend.
- El consecutivo debe ser único.
- Un cliente inactivo no puede recibir nuevas cotizaciones.

## Entidades

- Cliente.
- Contacto.
- Producto.
- Servicio.
- ListaPrecio.
- Cotización.
- DetalleCotización.
- Impuesto.
- Aprobación.
- HistorialEstado.
- Usuario.

## Criterios de aceptación

- No se permiten clientes duplicados.
- Los totales se calculan correctamente.
- Se genera PDF.
- Las aprobaciones quedan auditadas.
- Los cambios de estado aparecen en el dashboard.
- El envío por correo queda registrado.
- Se conserva el historial de versiones.

---

# 2. Aplicación de inventarios y bodegas

### Nombre propuesto

**StockControl**

### Núcleo de negocio

Logística, almacenamiento y abastecimiento.

### Objetivo

Controlar productos, bodegas, entradas, salidas, traslados, ajustes, existencias y alertas de inventario.

### Roles

- Auxiliar de bodega.
- Administrador de inventario.
- Auditor.

### Módulos

- Productos.
- Categorías.
- Bodegas.
- Entradas.
- Salidas.
- Traslados.
- Ajustes.
- Existencias.
- Kardex.
- Alertas.

## Pantallas

### Pantalla 1. Dashboard de inventario

Muestra:

- Productos activos.
- Valor estimado del inventario.
- Productos agotados.
- Productos bajo mínimo.
- Entradas y salidas del mes.
- Productos de mayor rotación.
- Productos sin movimiento.
- Últimos movimientos.

### Pantalla 2. Catálogo de productos

Campos:

- Código interno.
- Código de barras.
- Nombre.
- Categoría.
- Unidad de medida.
- Costo promedio.
- Stock mínimo.
- Stock máximo.
- Control por lote.
- Fecha de vencimiento.
- Estado.

Permite crear, editar, activar, inactivar y consultar existencias.

### Pantalla 3. Gestión de bodegas

Permite:

- Crear bodegas.
- Definir ubicaciones.
- Asignar responsables.
- Asignar usuarios.
- Activar o bloquear bodegas.
- Consultar capacidad y existencias.

### Pantalla 4. Registro de movimientos

Permite registrar:

- Entradas.
- Salidas.
- Traslados.
- Ajustes.
- Reversiones.

Incluye:

- Tipo de movimiento.
- Bodega.
- Referencia.
- Motivo.
- Producto.
- Lote.
- Cantidad.
- Costo.
- Existencia actual y proyectada.

### Pantalla 5. Existencias y kardex

Permite:

- Consultar stock físico, reservado y disponible.
- Filtrar por producto, categoría, bodega o lote.
- Consultar historial.
- Ver entradas, salidas y saldo.
- Exportar información.
- Crear ajuste o traslado.

## Casos de uso

### CU-INV-01. Registrar producto

**Actor:** Administrador.

1. Abre el catálogo.
2. Selecciona `Nuevo producto`.
3. Registra código, nombre y categoría.
4. Define unidad de medida.
5. Configura stock mínimo y máximo.
6. Indica si usa lotes o vencimientos.
7. El sistema valida códigos duplicados.
8. Guarda el producto.

### CU-INV-02. Registrar entrada

**Actor:** Auxiliar de bodega.

1. Selecciona `Entrada`.
2. Selecciona la bodega.
3. Registra proveedor y documento de referencia.
4. Agrega productos.
5. Registra cantidades, costos, lotes y vencimientos.
6. El sistema calcula la nueva existencia.
7. El usuario confirma.
8. El sistema registra el movimiento.
9. Actualiza el stock y el costo promedio.

### CU-INV-03. Registrar salida

1. El usuario selecciona `Salida`.
2. Selecciona la bodega.
3. Registra la referencia y el motivo.
4. Agrega productos.
5. El sistema muestra stock disponible.
6. El usuario registra cantidades.
7. El sistema valida disponibilidad.
8. Al confirmar, descuenta existencias.

**Flujo alterno:** Si no existe stock suficiente, se bloquea la operación.

### CU-INV-04. Trasladar entre bodegas

1. El usuario selecciona origen y destino.
2. Agrega productos y cantidades.
3. El sistema valida existencias.
4. Confirma el despacho.
5. El sistema descuenta en origen.
6. El traslado queda En tránsito.
7. La bodega destino confirma la recepción.
8. El sistema aumenta el stock en destino.
9. El traslado queda Completado.

### CU-INV-05. Ajustar inventario

1. El administrador consulta una existencia.
2. Registra la cantidad física.
3. El sistema calcula la diferencia.
4. Selecciona el motivo.
5. Registra una observación.
6. Confirma el ajuste.
7. El sistema crea un movimiento positivo o negativo.
8. Actualiza el saldo.

## Estados de traslado

- Borrador.
- Despachado.
- En tránsito.
- Recibido.
- Completado.
- Cancelado.

## Reglas de negocio

- No se permiten existencias negativas.
- Todo movimiento requiere referencia o motivo.
- Los movimientos confirmados no se editan.
- Las correcciones se realizan mediante reversión.
- Los ajustes negativos requieren permiso.
- Los productos por lote deben indicar lote.
- Un traslado necesita confirmación de origen y destino.
- Stock y movimiento se actualizan en una misma transacción.
- Debe existir control de concurrencia.
- Cada usuario solo opera bodegas autorizadas.
- Los códigos de producto son únicos.

## Entidades

- Producto.
- Categoría.
- UnidadMedida.
- Bodega.
- Ubicación.
- Existencia.
- Movimiento.
- DetalleMovimiento.
- Lote.
- TipoMovimiento.
- MotivoAjuste.
- AlertaStock.
- Usuario.

## Criterios de aceptación

- El sistema bloquea salidas sin stock.
- Las entradas incrementan existencias.
- Los traslados no duplican unidades.
- El kardex conserva el saldo.
- Los ajustes requieren justificación.
- Se generan alertas de stock mínimo.
- Todo movimiento queda auditado.
- La información puede exportarse.

---

# 3. Aplicación de facturación y cuentas por cobrar

### Nombre propuesto

**InvoiceManager**

### Núcleo de negocio

Facturación, recaudo y cartera.

### Objetivo

Emitir facturas, registrar pagos, controlar saldos, gestionar cartera vencida y mantener trazabilidad financiera.

### Roles

- Facturador.
- Analista de cartera.
- Administrador.

### Módulos

- Clientes.
- Productos y servicios.
- Facturación.
- Pagos.
- Cuentas por cobrar.
- Notas crédito.
- Recordatorios.
- Reportes.

## Pantallas

### Pantalla 1. Dashboard financiero

Muestra:

- Facturación mensual.
- Valor recaudado.
- Saldo pendiente.
- Cartera vencida.
- Facturas emitidas.
- Facturas pagadas y parciales.
- Promedio de días de pago.
- Clientes con mayor deuda.
- Próximos vencimientos.

### Pantalla 2. Creación de factura

Incluye:

- Cliente.
- Fecha.
- Condición de pago.
- Fecha de vencimiento.
- Productos o servicios.
- Cantidad.
- Precio.
- Descuento.
- Impuesto.
- Retención.
- Total.
- Observaciones.

Acciones:

- Guardar borrador.
- Emitir.
- Vista previa.
- Descargar PDF.
- Enviar por correo.

### Pantalla 3. Cuentas por cobrar

Muestra:

- Factura.
- Cliente.
- Fecha de emisión.
- Vencimiento.
- Total.
- Pagado.
- Saldo.
- Días de mora.
- Estado.
- Última gestión.

Permite filtrar, registrar pagos, enviar recordatorios y descargar estados de cuenta.

### Pantalla 4. Registro de pagos

Incluye:

- Cliente.
- Fecha.
- Medio de pago.
- Referencia bancaria.
- Valor.
- Soporte.
- Facturas afectadas.
- Valor aplicado por factura.

Permite aplicar un pago total, parcial o distribuido.

### Pantalla 5. Detalle de factura y notas crédito

Muestra:

- Datos del cliente.
- Detalle facturado.
- Totales.
- PDF.
- Pagos.
- Saldo.
- Historial de envíos.
- Gestiones de cobro.
- Notas crédito.
- Auditoría.

## Estados de factura

- Borrador.
- Emitida.
- Parcialmente pagada.
- Pagada.
- Vencida.
- Anulada.
- Con nota crédito.

## Casos de uso

### CU-FAC-01. Emitir factura

**Actor:** Facturador.

1. Selecciona `Nueva factura`.
2. Selecciona el cliente.
3. El sistema carga datos fiscales.
4. Define condición y fecha de pago.
5. Agrega productos o servicios.
6. El sistema calcula descuentos, impuestos y total.
7. El usuario confirma.
8. El sistema asigna consecutivo.
9. Registra la factura.
10. Crea la cuenta por cobrar.
11. Genera el PDF.

### CU-FAC-02. Enviar factura

1. El usuario consulta una factura emitida.
2. Selecciona `Enviar`.
3. El sistema carga el correo del cliente.
4. Adjunta el PDF.
5. El usuario confirma.
6. El sistema registra fecha y destinatario.

### CU-FAC-03. Registrar pago parcial

**Actor:** Analista de cartera.

1. Busca al cliente.
2. Registra fecha, valor y referencia.
3. Adjunta soporte.
4. Selecciona una factura.
5. Aplica parte del pago.
6. El sistema reduce el saldo.
7. Cambia la factura a Parcialmente pagada.
8. Registra auditoría.

### CU-FAC-04. Consultar cartera vencida

1. El analista abre cuentas por cobrar.
2. Filtra por estado Vencida.
3. El sistema muestra saldo y días de mora.
4. Ordena por monto o antigüedad.
5. Consulta el detalle.
6. Exporta el reporte o inicia gestión de cobro.

### CU-FAC-05. Enviar recordatorio

1. El analista selecciona facturas pendientes.
2. El sistema genera un mensaje.
3. Incluye número, saldo y vencimiento.
4. El analista revisa.
5. Confirma el envío.
6. El sistema registra la gestión.

### CU-FAC-06. Generar nota crédito

1. El facturador abre una factura.
2. Selecciona `Nota crédito`.
3. Registra el motivo.
4. Define si es total o parcial.
5. Selecciona conceptos y valores.
6. El sistema valida el monto.
7. Genera la nota.
8. Actualiza el saldo y la trazabilidad.

## Reglas de negocio

- Toda factura debe tener al menos un detalle.
- El consecutivo debe ser único y vigente.
- Una factura emitida no se edita.
- Las correcciones se hacen mediante nota crédito.
- Una factura a crédito requiere vencimiento.
- Los pagos no pueden superar el saldo.
- Un pago puede aplicarse a varias facturas.
- Las facturas vencidas se identifican automáticamente.
- Los estados cambian según el saldo.
- Toda anulación requiere motivo.
- Los cálculos se ejecutan en el backend.
- La emisión debe ser idempotente.

## Entidades

- Cliente.
- Producto.
- Servicio.
- Factura.
- DetalleFactura.
- Impuesto.
- Retención.
- CuentaCobrar.
- Pago.
- AplicaciónPago.
- MedioPago.
- NotaCrédito.
- GestiónCobro.
- Recordatorio.
- Numeración.
- HistorialEstado.
- Usuario.

## Criterios de aceptación

- Se generan consecutivos únicos.
- Los totales se calculan correctamente.
- Los pagos parciales reducen el saldo.
- Las facturas vencidas se detectan automáticamente.
- Se envían recordatorios.
- Las notas crédito actualizan la deuda.
- El dashboard muestra facturación, recaudo y cartera.
- Los documentos y operaciones quedan auditados.

---

# Comparación general

| Aplicación | Núcleo | Pantallas | Funcionalidad principal |
|---|---|---:|---|
| QuoteFlow | Comercial | 5 | Cotizar, aprobar y hacer seguimiento |
| StockControl | Logística | 5 | Controlar productos y movimientos |
| InvoiceManager | Financiero | 5 | Facturar, recaudar y controlar cartera |

# Arquitectura sugerida

Para los tres MVP se recomienda un **monolito modular** con:

- Frontend web responsivo.
- API REST.
- Autenticación JWT u OpenID Connect.
- Autorización basada en roles.
- Base de datos PostgreSQL o SQL Server.
- Auditoría.
- Generación de PDF.
- Notificaciones por correo.
- Registro centralizado de errores.
- Contenedores Docker.
- Pipeline CI/CD.

Una estructura posible:

```text
Frontend
   |
API REST
   |
Application
   |
Domain
   |
Infrastructure
   |
PostgreSQL / SQL Server
```

# Requisitos no funcionales comunes

- Tiempo de respuesta menor a tres segundos.
- Disponibilidad recomendada de 99,5 %.
- Acceso basado en roles.
- Auditoría de operaciones críticas.
- Diseño adaptable a computador y tableta.
- Cifrado en tránsito mediante HTTPS.
- Manejo centralizado de errores.
- Copias de seguridad.
- Documentación de API con OpenAPI.
- Pruebas unitarias y de integración.
