// DIOS COMPONENTE: Maneja lista, creacion, edicion y detalle de clientes
// Viola SRP - deberia haber ClienteListComponent, ClienteFormComponent, ClienteDetailComponent separados
// Viola DRY - codigo duplicado con otros componentes
import { Component, OnInit } from '@angular/core';
import { AppService } from '../services/app.service';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.component.html'
})
export class ClientesComponent implements OnInit {

  // MALA PRACTICA: Decenas de propiedades en un componente
  vista: any = 'lista'; // 'lista', 'detalle'
  clienteDetalle: any = null;
  mostrarFormulario: any = false;
  modoEdicion: any = false;
  clienteEditando: any = null;
  mensajeExito: any = '';
  mensajeError: any = '';
  filtroTexto: any = '';
  filtroEstado: any = '';

  // MALA PRACTICA: Objeto de formulario sin interfaz tipada
  form: any = {
    identificacion: '',
    razonSocial: '',
    contacto: '',
    correo: '',
    telefono: '',
    direccion: '',
    condicionTributaria: 'NO_RESPONSABLE',
    estado: 'activo'
  };

  constructor(public svc: AppService) {}

  ngOnInit(): void {
    this.svc.cargarClientes();
  }

  // MALA PRACTICA: Getter con logica compleja en el componente
  get clientesFiltrados(): any[] {
    var lista: any[] = this.svc.clientes;
    if (this.filtroEstado) {
      lista = lista.filter((c: any) => c.estado == this.filtroEstado);
    }
    if (this.filtroTexto) {
      var txt: any = this.filtroTexto.toLowerCase();
      // MALA PRACTICA: Logica de busqueda en el getter del componente
      lista = lista.filter((c: any) =>
        (c.razonSocial && c.razonSocial.toLowerCase().indexOf(txt) >= 0) ||
        (c.identificacion && c.identificacion.toLowerCase().indexOf(txt) >= 0) ||
        (c.contacto && c.contacto.toLowerCase().indexOf(txt) >= 0) ||
        (c.correo && c.correo.toLowerCase().indexOf(txt) >= 0)
      );
    }
    return lista;
  }

  verDetalle(cliente: any): void {
    this.svc.obtenerClienteConHistorial(cliente.id).subscribe(
      (data: any) => {
        this.clienteDetalle = data;
        this.vista = 'detalle';
      },
      (error: any) => {
        this.mensajeError = 'Error al cargar detalle';
      }
    );
  }

  abrirFormularioNuevo(): void {
    // MALA PRACTICA: Reset manual copia-pega de la inicializacion
    this.form = {
      identificacion: '',
      razonSocial: '',
      contacto: '',
      correo: '',
      telefono: '',
      direccion: '',
      condicionTributaria: 'NO_RESPONSABLE',
      estado: 'activo'
    };
    this.modoEdicion = false;
    this.clienteEditando = null;
    this.mostrarFormulario = true;
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  abrirFormularioEditar(cliente: any): void {
    // MALA PRACTICA: Copia campo por campo (deberia ser { ...cliente })
    this.form = {
      identificacion: cliente.identificacion,
      razonSocial: cliente.razonSocial,
      contacto: cliente.contacto,
      correo: cliente.correo,
      telefono: cliente.telefono,
      direccion: cliente.direccion,
      condicionTributaria: cliente.condicionTributaria,
      estado: cliente.estado
    };
    this.clienteEditando = cliente;
    this.modoEdicion = true;
    this.mostrarFormulario = true;
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  guardarCliente(): void {
    // MALA PRACTICA: Validacion duplicada del backend
    if (!this.form.razonSocial || this.form.razonSocial.trim() == '') {
      this.mensajeError = 'La razón social es obligatoria';
      return;
    }
    if (!this.form.identificacion || this.form.identificacion.trim() == '') {
      this.mensajeError = 'La identificación es obligatoria';
      return;
    }

    if (this.modoEdicion) {
      this.svc.actualizarCliente(this.clienteEditando.id, this.form).subscribe(
        (data: any) => {
          this.svc.cargarClientes(); // MALA PRACTICA: Recargar todo en vez de actualizar solo el item
          this.mostrarFormulario = false;
          this.mensajeExito = 'Cliente actualizado exitosamente';
          setTimeout(() => { this.mensajeExito = ''; }, 3000); // MALA PRACTICA: setTimeout sin limpiar
        },
        (error: any) => {
          this.mensajeError = 'Error al actualizar: ' + (error.error ? error.error.error : error.message);
        }
      );
    } else {
      this.svc.crearCliente(this.form).subscribe(
        (data: any) => {
          this.svc.cargarClientes();
          this.mostrarFormulario = false;
          this.mensajeExito = 'Cliente "' + data.razonSocial + '" creado exitosamente';
          setTimeout(() => { this.mensajeExito = ''; }, 3000);
        },
        (error: any) => {
          this.mensajeError = 'Error al crear: ' + (error.error ? error.error.error : error.message);
        }
      );
    }
  }

  toggleEstado(cliente: any): void {
    var nuevoEstado: any = cliente.estado === 'activo' ? 'inactivo' : 'activo';
    this.svc.actualizarCliente(cliente.id, { estado: nuevoEstado }).subscribe(
      (data: any) => {
        this.svc.cargarClientes();
        this.mensajeExito = 'Estado cambiado a ' + nuevoEstado;
        setTimeout(() => { this.mensajeExito = ''; }, 2000);
      },
      (error: any) => {
        console.log('Error toggle estado: ' + error);
      }
    );
  }

  eliminarCliente(cliente: any): void {
    // MALA PRACTICA: confirm() de navegador en vez de modal Angular
    if (confirm('¿Desea eliminar permanentemente al cliente ' + cliente.razonSocial + '?')) {
      this.svc.eliminarCliente(cliente.id).subscribe(
        (data: any) => {
          this.svc.cargarClientes();
          this.mensajeExito = 'Cliente eliminado';
          setTimeout(() => { this.mensajeExito = ''; }, 2000);
        },
        (error: any) => {
          this.mensajeError = 'Error al eliminar';
        }
      );
    }
  }

  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.mensajeError = '';
  }

  volver(): void {
    this.vista = 'lista';
    this.clienteDetalle = null;
  }

  // MALA PRACTICA: Formateo duplicado en cada componente
  formatearMoneda(valor: any): any {
    if (!valor && valor !== 0) return '$ 0';
    return '$ ' + Math.round(valor).toLocaleString('es-CO');
  }
}
