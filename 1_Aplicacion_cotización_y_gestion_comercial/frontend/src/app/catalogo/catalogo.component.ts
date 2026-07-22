// DIOS COMPONENTE: Maneja productos Y listas de precios en el mismo componente
// Viola SRP - deberia ser ProductosComponent y ListasPreciosComponent por separado
// Viola OCP - para agregar entidades hay que modificar este componente
import { Component, OnInit } from '@angular/core';
import { AppService } from '../services/app.service';

@Component({
  selector: 'app-catalogo',
  templateUrl: './catalogo.component.html'
})
export class CatalogoComponent implements OnInit {

  // MALA PRACTICA: Estado mezclado para dos entidades distintas en el mismo componente
  tabActiva: any = 'productos'; // 'productos' o 'listas'
  mostrarFormProducto: any = false;
  mostrarFormLista: any = false;
  modoEdicionProducto: any = false;
  productoEditando: any = null;
  mensajeExito: any = '';
  mensajeError: any = '';
  filtroProducto: any = '';

  // MALA PRACTICA: Formularios sin interfaz tipada (any en todo)
  formProducto: any = {
    codigo: '',
    nombre: '',
    descripcion: '',
    precio: 0,
    impuesto: 19,
    tipo: 'Producto',
    estado: 'activo'
  };

  formLista: any = {
    nombre: '',
    segmento: 'General',
    vigenciaDesde: '',
    vigenciaHasta: '',
    descuentoMaximo: 10
  };

  constructor(public svc: AppService) {}

  ngOnInit(): void {
    this.svc.cargarProductos();
    this.svc.cargarListasPrecios();
  }

  // MALA PRACTICA: Getter con logica en componente (deberia ser pipe o filtro)
  get productosFiltrados(): any[] {
    if (!this.filtroProducto) return this.svc.productos;
    var txt: any = this.filtroProducto.toLowerCase();
    // MALA PRACTICA: Logica duplicada de busqueda
    var resultado: any[] = [];
    for (var i = 0; i < this.svc.productos.length; i++) {
      var p: any = this.svc.productos[i];
      if ((p.nombre && p.nombre.toLowerCase().indexOf(txt) >= 0) ||
          (p.codigo && p.codigo.toLowerCase().indexOf(txt) >= 0)) {
        resultado.push(p);
      }
    }
    return resultado;
  }

  abrirFormProductoNuevo(): void {
    // MALA PRACTICA: Reset manual copy-paste
    this.formProducto = { codigo: '', nombre: '', descripcion: '', precio: 0, impuesto: 19, tipo: 'Producto', estado: 'activo' };
    this.modoEdicionProducto = false;
    this.productoEditando = null;
    this.mostrarFormProducto = true;
    this.mensajeError = '';
  }

  abrirFormProductoEditar(producto: any): void {
    this.formProducto = {
      codigo: producto.codigo,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      impuesto: producto.impuesto,
      tipo: producto.tipo,
      estado: producto.estado
    };
    this.productoEditando = producto;
    this.modoEdicionProducto = true;
    this.mostrarFormProducto = true;
    this.mensajeError = '';
  }

  guardarProducto(): void {
    // MALA PRACTICA: Validacion duplicada del backend
    if (!this.formProducto.nombre) {
      this.mensajeError = 'El nombre del producto es requerido';
      return;
    }
    if (!this.formProducto.codigo) {
      this.mensajeError = 'El código es requerido';
      return;
    }
    if (this.formProducto.precio < 0) {
      this.mensajeError = 'El precio no puede ser negativo';
      return;
    }

    if (this.modoEdicionProducto) {
      this.svc.actualizarProducto(this.productoEditando.id, this.formProducto).subscribe(
        (data: any) => {
          this.svc.cargarProductos();
          this.mostrarFormProducto = false;
          this.mensajeExito = 'Producto actualizado exitosamente';
          setTimeout(() => { this.mensajeExito = ''; }, 3000);
        },
        (error: any) => {
          this.mensajeError = 'Error: ' + (error.error ? error.error.error : error.message);
        }
      );
    } else {
      this.svc.crearProducto(this.formProducto).subscribe(
        (data: any) => {
          this.svc.cargarProductos();
          this.mostrarFormProducto = false;
          this.mensajeExito = 'Producto "' + data.nombre + '" creado exitosamente';
          setTimeout(() => { this.mensajeExito = ''; }, 3000);
        },
        (error: any) => {
          this.mensajeError = 'Error: ' + (error.error ? error.error.error : error.message);
        }
      );
    }
  }

  toggleEstadoProducto(producto: any): void {
    var nuevo: any = producto.estado === 'activo' ? 'inactivo' : 'activo';
    this.svc.actualizarProducto(producto.id, { ...producto, estado: nuevo }).subscribe(
      () => { this.svc.cargarProductos(); },
      (err: any) => { console.log('Error toggle producto', err); }
    );
  }

  guardarListaPrecios(): void {
    if (!this.formLista.nombre) {
      this.mensajeError = 'El nombre de la lista es requerido';
      return;
    }
    this.svc.crearListaPrecios(this.formLista).subscribe(
      (data: any) => {
        this.svc.cargarListasPrecios();
        this.mostrarFormLista = false;
        this.mensajeExito = 'Lista "' + data.nombre + '" creada exitosamente';
        this.formLista = { nombre: '', segmento: 'General', vigenciaDesde: '', vigenciaHasta: '', descuentoMaximo: 10 };
        setTimeout(() => { this.mensajeExito = ''; }, 3000);
      },
      (error: any) => {
        this.mensajeError = 'Error al crear lista';
      }
    );
  }

  // MALA PRACTICA: Formateo duplicado en cada componente
  formatearMoneda(valor: any): any {
    if (!valor && valor !== 0) return '$ 0';
    return '$ ' + Math.round(valor).toLocaleString('es-CO');
  }
}
