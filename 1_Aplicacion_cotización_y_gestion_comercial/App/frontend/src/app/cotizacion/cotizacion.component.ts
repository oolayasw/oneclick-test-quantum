// ================================================================
// cotizacion.component.ts - MEGA DIOS COMPONENTE
// ================================================================
// Maneja: lista, creacion, detalle, duplicado, cambio de estado
// Viola SRP, OCP, DRY y todos los principios SOLID
// Antipatron: God Component con estado enorme y metodos mezclados
// ================================================================
import { Component, OnInit } from '@angular/core';
import { AppService } from '../services/app.service';

@Component({
  selector: 'app-cotizacion',
  templateUrl: './cotizacion.component.html'
})
export class CotizacionComponent implements OnInit {

  // MALA PRACTICA: 20+ propiedades en un componente
  vista: any = 'lista'; // 'lista', 'nueva', 'detalle'
  cotizacionDetalle: any = null;
  mensajeExito: any = '';
  mensajeError: any = '';
  filtroEstado: any = '';
  filtroCliente: any = '';

  // Formulario - MALA PRACTICA: objeto plano con any, sin interfaz
  form: any = {
    clienteId: null,
    moneda: 'COP',
    vigencia: '',
    listaPreciosId: null,
    listaPreciosNombre: '',
    descuento: 0,
    condicionesPago: '',
    tiempoEntrega: '',
    observaciones: '',
    items: []
  };

  // Item temporal para agregar
  itemTemp: any = {
    productoId: null,
    codigo: '',
    nombre: '',
    cantidad: 1,
    precio: 0,
    descuento: 0,
    impuesto: 19,
    subtotal: 0
  };

  totales: any = { subtotal: 0, impuestos: 0, total: 0 };
  enviarAAprobacion: any = false;

  // Acciones sobre cotizacion en detalle
  accionEstado: any = '';
  comentarioAccion: any = '';

  constructor(public svc: AppService) {}

  ngOnInit(): void {
    // MALA PRACTICA: Cargar datos sin cleanup, memory leaks garantizados
    this.svc.cargarCotizaciones();
    this.svc.cargarClientes();
    this.svc.cargarProductos();
    this.svc.cargarListasPrecios();
  }

  // MALA PRACTICA: Getter complejo con logica de filtrado
  get cotizacionesFiltradas(): any[] {
    var lista: any[] = this.svc.cotizaciones;
    if (this.filtroEstado) {
      var filtE: any = this.filtroEstado;
      // MALA PRACTICA: for loop en vez de .filter()
      var tmp: any[] = [];
      for (var i = 0; i < lista.length; i++) {
        if (lista[i].estado == filtE) tmp.push(lista[i]);
      }
      lista = tmp;
    }
    if (this.filtroCliente) {
      var txt: any = this.filtroCliente.toLowerCase();
      lista = lista.filter((c: any) => c.cliente.toLowerCase().indexOf(txt) >= 0);
    }
    return lista;
  }

  irANueva(): void {
    this.resetForm();
    this.vista = 'nueva';
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  // MALA PRACTICA: Reset manual que duplica la inicializacion
  resetForm(): void {
    this.form = {
      clienteId: null,
      moneda: 'COP',
      vigencia: '',
      listaPreciosId: null,
      listaPreciosNombre: '',
      descuento: 0,
      condicionesPago: '',
      tiempoEntrega: '',
      observaciones: '',
      items: []
    };
    this.itemTemp = { productoId: null, codigo: '', nombre: '', cantidad: 1, precio: 0, descuento: 0, impuesto: 19, subtotal: 0 };
    this.totales = { subtotal: 0, impuestos: 0, total: 0 };
    this.enviarAAprobacion = false;
    this.mensajeError = '';
  }

  seleccionarProducto(): void {
    if (!this.itemTemp.productoId) return;
    // MALA PRACTICA: for loop para buscar en vez de .find()
    for (var i = 0; i < this.svc.productos.length; i++) {
      var p: any = this.svc.productos[i];
      if (p.id == this.itemTemp.productoId) {
        this.itemTemp.codigo = p.codigo;
        this.itemTemp.nombre = p.nombre;
        this.itemTemp.precio = p.precio;
        this.itemTemp.impuesto = p.impuesto;
        break;
      }
    }
    this.calcularItemTemp();
  }

  calcularItemTemp(): void {
    // MALA PRACTICA: Calculo duplicado (esta en servicio, backend y aqui)
    var desc: any = this.itemTemp.cantidad * this.itemTemp.precio * ((this.itemTemp.descuento || 0) / 100);
    this.itemTemp.subtotal = (this.itemTemp.cantidad * this.itemTemp.precio) - desc;
  }

  agregarItem(): void {
    if (!this.itemTemp.productoId) {
      this.mensajeError = 'Seleccione un producto o servicio';
      return;
    }
    if (!this.itemTemp.cantidad || this.itemTemp.cantidad <= 0) {
      this.mensajeError = 'La cantidad debe ser mayor a 0';
      return;
    }
    this.mensajeError = '';

    // MALA PRACTICA: push directo al array del form sin inmutabilidad
    this.form.items.push({
      productoId: this.itemTemp.productoId,
      codigo: this.itemTemp.codigo,
      nombre: this.itemTemp.nombre,
      cantidad: Number(this.itemTemp.cantidad),
      precio: Number(this.itemTemp.precio),
      descuento: Number(this.itemTemp.descuento) || 0,
      impuesto: Number(this.itemTemp.impuesto),
      subtotal: this.itemTemp.subtotal
    });

    // Reset temp item
    this.itemTemp = { productoId: null, codigo: '', nombre: '', cantidad: 1, precio: 0, descuento: 0, impuesto: 19, subtotal: 0 };
    this.recalcularTotales();
  }

  eliminarItem(idx: any): void {
    // MALA PRACTICA: splice muta el array directamente
    this.form.items.splice(idx, 1);
    this.recalcularTotales();
  }

  recalcularTotales(): void {
    this.totales = this.svc.calcularTotalesCotizacion(this.form.items, this.form.descuento);
  }

  seleccionarListaPrecios(): void {
    // MALA PRACTICA: for loop duplicado de busqueda
    for (var i = 0; i < this.svc.listasPrecios.length; i++) {
      if (this.svc.listasPrecios[i].id == this.form.listaPreciosId) {
        this.form.listaPreciosNombre = this.svc.listasPrecios[i].nombre;
        break;
      }
    }
  }

  guardarCotizacion(enviar: any): void {
    // MALA PRACTICA: Validacion duplicada del backend
    if (!this.form.clienteId) {
      this.mensajeError = 'Debe seleccionar un cliente';
      return;
    }
    if (this.form.items.length === 0) {
      this.mensajeError = 'Debe agregar al menos un producto o servicio';
      return;
    }
    if (!this.form.vigencia) {
      this.mensajeError = 'Debe ingresar la fecha de vigencia';
      return;
    }

    // MALA PRACTICA: Construir objeto con spread y propiedades extra mezcladas
    var cotizacion: any = {
      clienteId: this.form.clienteId,
      moneda: this.form.moneda,
      vigencia: this.form.vigencia,
      listaPreciosId: this.form.listaPreciosId,
      listaPreciosNombre: this.form.listaPreciosNombre,
      descuento: this.form.descuento || 0,
      condicionesPago: this.form.condicionesPago,
      tiempoEntrega: this.form.tiempoEntrega,
      observaciones: this.form.observaciones,
      items: this.form.items,
      asesorId: this.svc.usuarioActual ? this.svc.usuarioActual.id : 1,
      asesor: this.svc.usuarioActual ? this.svc.usuarioActual.nombre : 'Asesor Demo',
      enviarAprobacion: enviar
    };

    this.svc.crearCotizacion(cotizacion).subscribe(
      (data: any) => {
        this.svc.cargarCotizaciones();
        this.svc.cargarDashboard();
        this.mensajeExito = 'Cotización ' + data.numero + ' creada. Estado: ' + data.estado;
        this.vista = 'lista';
        setTimeout(() => { this.mensajeExito = ''; }, 5000);
      },
      (error: any) => {
        this.mensajeError = 'Error al crear cotización: ' + (error.error ? error.error.error : error.message);
      }
    );
  }

  verDetalle(cot: any): void {
    this.cotizacionDetalle = cot;
    this.accionEstado = '';
    this.comentarioAccion = '';
    this.vista = 'detalle';
  }

  duplicarCotizacion(cot: any): void {
    // MALA PRACTICA: JSON.parse(JSON.stringify()) para deep copy - antipatron
    this.form = {
      clienteId: cot.clienteId,
      moneda: cot.moneda,
      vigencia: '',
      listaPreciosId: cot.listaPreciosId,
      listaPreciosNombre: cot.listaPreciosNombre,
      descuento: cot.descuento,
      condicionesPago: cot.condicionesPago,
      tiempoEntrega: cot.tiempoEntrega,
      observaciones: '[COPIA] ' + cot.observaciones,
      items: JSON.parse(JSON.stringify(cot.items))
    };
    this.recalcularTotales();
    this.vista = 'nueva';
    this.mensajeExito = 'Cotización duplicada desde ' + cot.numero + '. Complete los datos y guarde.';
  }

  ejecutarAccion(accion: any): void {
    if (!this.cotizacionDetalle) return;
    // MALA PRACTICA: Switch con magic strings
    var estadoNuevo: any = '';
    if (accion == 'aprobar') estadoNuevo = 'Aprobada';
    else if (accion == 'rechazar') estadoNuevo = 'Rechazada';
    else if (accion == 'ajustes') estadoNuevo = 'Requiere ajustes';
    else if (accion == 'enviar') estadoNuevo = 'Enviada';
    else if (accion == 'aceptar') estadoNuevo = 'Aceptada';
    else if (accion == 'cancelar') estadoNuevo = 'Cancelada';

    this.svc.actualizarEstadoCotizacion(this.cotizacionDetalle.id, estadoNuevo, this.comentarioAccion).subscribe(
      (data: any) => {
        // MALA PRACTICA: Mutar el objeto detalle directamente
        this.cotizacionDetalle.estado = data.estado;
        this.cotizacionDetalle.historialEstados = data.historialEstados;
        this.svc.cargarCotizaciones();
        this.svc.cargarDashboard();
        this.mensajeExito = 'Estado actualizado a: ' + estadoNuevo;
        this.accionEstado = '';
        this.comentarioAccion = '';
        setTimeout(() => { this.mensajeExito = ''; }, 3000);
      },
      (error: any) => {
        this.mensajeError = 'Error al cambiar estado';
      }
    );
  }

  // MALA PRACTICA: "Funcionalidades" simuladas con alert
  generarPDF(): void {
    if (!this.cotizacionDetalle) return;
    alert('PDF generado exitosamente\n\nCotización: ' + this.cotizacionDetalle.numero +
          '\nCliente: ' + this.cotizacionDetalle.cliente +
          '\nTotal: ' + this.formatearMoneda(this.cotizacionDetalle.total) +
          '\n\n(Funcionalidad simulada - implementar con librería PDF real)');
  }

  enviarCorreo(): void {
    if (!this.cotizacionDetalle) return;
    alert('Correo enviado al cliente\n\nDestinatario: ' + this.cotizacionDetalle.cliente +
          '\nCotización: ' + this.cotizacionDetalle.numero +
          '\n\n(Funcionalidad simulada)');
  }

  volver(): void {
    this.vista = 'lista';
    this.cotizacionDetalle = null;
    this.mensajeError = '';
  }

  // MALA PRACTICA: Lógica de formateo duplicada en cada componente
  formatearMoneda(valor: any): any {
    if (!valor && valor !== 0) return '$ 0';
    return '$ ' + Math.round(valor).toLocaleString('es-CO');
  }

  // MALA PRACTICA: getBadgeClass duplicado en 3 componentes
  getBadgeClass(estado: any): any {
    if (estado == 'Borrador') return 'badge-secondary';
    if (estado == 'Pendiente de aprobación') return 'badge-warning';
    if (estado == 'Requiere ajustes') return 'badge-info';
    if (estado == 'Aprobada') return 'badge-primary';
    if (estado == 'Enviada') return 'badge-info';
    if (estado == 'Aceptada') return 'badge-success';
    if (estado == 'Rechazada') return 'badge-danger';
    if (estado == 'Vencida') return 'badge-warning';
    return 'badge-secondary';
  }

  // MALA PRACTICA: Lógica de permisos por rol en el componente
  puedeAprobar(): any {
    return this.svc.usuarioActual &&
      (this.svc.usuarioActual.rol === 'supervisor' || this.svc.usuarioActual.rol === 'admin');
  }
}
