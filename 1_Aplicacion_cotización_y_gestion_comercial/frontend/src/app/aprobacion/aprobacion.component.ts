// COMPONENTE DE APROBACIONES - Viola SRP mezclando lista y aprobacion
// Duplica lógica del componente de cotizaciones (antipatron copy-paste)
import { Component, OnInit } from '@angular/core';
import { AppService } from '../services/app.service';

@Component({
  selector: 'app-aprobacion',
  templateUrl: './aprobacion.component.html'
})
export class AprobacionComponent implements OnInit {

  // MALA PRACTICA: Estado duplicado del componente de cotizaciones
  vista: any = 'lista';
  cotizacionSeleccionada: any = null;
  comentario: any = '';
  mensajeExito: any = '';
  mensajeError: any = '';
  filtroEstado: any = 'Pendiente de aprobación';

  constructor(public svc: AppService) {}

  ngOnInit(): void {
    this.svc.cargarCotizaciones();
  }

  // MALA PRACTICA: Getter con logica duplicada de CotizacionComponent
  get cotizacionesFiltradas(): any[] {
    var lista: any[] = this.svc.cotizaciones;
    if (this.filtroEstado) {
      // MALA PRACTICA: Codigo identico al de cotizacion.component.ts
      var tmp: any[] = [];
      for (var i = 0; i < lista.length; i++) {
        if (lista[i].estado == this.filtroEstado) tmp.push(lista[i]);
      }
      return tmp;
    }
    return lista;
  }

  verDetalle(cot: any): void {
    this.cotizacionSeleccionada = cot;
    this.comentario = '';
    this.mensajeError = '';
    this.vista = 'detalle';
  }

  // MALA PRACTICA: Metodos identicos a los de CotizacionComponent
  aprobar(): void {
    if (!this.cotizacionSeleccionada) return;
    this.svc.actualizarEstadoCotizacion(this.cotizacionSeleccionada.id, 'Aprobada', this.comentario).subscribe(
      (data: any) => {
        // MALA PRACTICA: Mutacion directa del objeto
        this.cotizacionSeleccionada.estado = data.estado;
        this.cotizacionSeleccionada.historialEstados = data.historialEstados;
        this.svc.cargarCotizaciones();
        this.svc.cargarDashboard();
        this.mensajeExito = 'Cotización ' + this.cotizacionSeleccionada.numero + ' APROBADA';
        this.comentario = '';
        setTimeout(() => { this.mensajeExito = ''; }, 4000);
      },
      (error: any) => {
        this.mensajeError = 'Error al aprobar';
      }
    );
  }

  rechazar(): void {
    if (!this.cotizacionSeleccionada) return;
    if (!this.comentario) {
      this.mensajeError = 'Debe ingresar un motivo de rechazo';
      return;
    }
    this.svc.actualizarEstadoCotizacion(this.cotizacionSeleccionada.id, 'Rechazada', this.comentario).subscribe(
      (data: any) => {
        this.cotizacionSeleccionada.estado = data.estado;
        this.cotizacionSeleccionada.historialEstados = data.historialEstados;
        this.svc.cargarCotizaciones();
        this.svc.cargarDashboard();
        this.mensajeExito = 'Cotización ' + this.cotizacionSeleccionada.numero + ' RECHAZADA';
        this.comentario = '';
        setTimeout(() => { this.mensajeExito = ''; }, 4000);
      },
      (error: any) => {
        this.mensajeError = 'Error al rechazar';
      }
    );
  }

  solicitarAjustes(): void {
    if (!this.cotizacionSeleccionada) return;
    this.svc.actualizarEstadoCotizacion(this.cotizacionSeleccionada.id, 'Requiere ajustes', this.comentario).subscribe(
      (data: any) => {
        this.cotizacionSeleccionada.estado = data.estado;
        this.cotizacionSeleccionada.historialEstados = data.historialEstados;
        this.svc.cargarCotizaciones();
        this.mensajeExito = 'Se solicitaron ajustes para ' + this.cotizacionSeleccionada.numero;
        this.comentario = '';
        setTimeout(() => { this.mensajeExito = ''; }, 4000);
      },
      (error: any) => {
        this.mensajeError = 'Error al solicitar ajustes';
      }
    );
  }

  volver(): void {
    this.vista = 'lista';
    this.cotizacionSeleccionada = null;
    this.comentario = '';
    this.mensajeError = '';
    this.svc.cargarCotizaciones();
  }

  // MALA PRACTICA: formatearMoneda duplicado en CUATRO componentes
  formatearMoneda(valor: any): any {
    if (!valor && valor !== 0) return '$ 0';
    return '$ ' + Math.round(valor).toLocaleString('es-CO');
  }

  // MALA PRACTICA: getBadgeClass duplicado en CUATRO componentes
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

  // MALA PRACTICA: Calculo de margen en el componente frontend
  calcularMargenEstimado(cotizacion: any): any {
    // Simulacion sin datos reales de costo
    return Math.round(cotizacion.total * 0.35); // 35% hardcodeado
  }
}
