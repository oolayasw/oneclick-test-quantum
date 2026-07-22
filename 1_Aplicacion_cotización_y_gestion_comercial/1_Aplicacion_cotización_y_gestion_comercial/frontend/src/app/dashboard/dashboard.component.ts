// MALA PRACTICA: Logica de formateo y calculos en el componente de dashboard
// El componente deberia solo mostrar datos, no formatearlos ni calcularlos
import { Component, OnInit } from '@angular/core';
import { AppService } from '../services/app.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {

  // MALA PRACTICA: Inyectar servicio como publico para acceder directamente en template
  constructor(public svc: AppService) {}

  ngOnInit(): void {
    // MALA PRACTICA: Cargar datos en ngOnInit sin cleanup ni unsubscribe
    this.svc.cargarDashboard();
    this.svc.cargarCotizaciones(); // MALA PRACTICA: Carga innecesaria de todos los datos
  }

  // MALA PRACTICA: Lógica de formateo duplicada en cada componente
  // Deberia ser un Angular Pipe
  formatearMoneda(valor: any): any {
    if (!valor && valor !== 0) return '$ 0';
    return '$ ' + Math.round(valor).toLocaleString('es-CO');
  }

  // MALA PRACTICA: Badge logic duplicada (esta en AppService Y en cada componente)
  getBadgeClass(estado: any): any {
    if (estado == 'Borrador') return 'badge-secondary';
    if (estado == 'Pendiente de aprobación') return 'badge-warning';
    if (estado == 'Aprobada') return 'badge-primary';
    if (estado == 'Enviada') return 'badge-info';
    if (estado == 'Aceptada') return 'badge-success';
    if (estado == 'Rechazada') return 'badge-danger';
    if (estado == 'Vencida') return 'badge-warning';
    return 'badge-secondary';
  }

  // MALA PRACTICA: Calcular porcentaje en el componente
  calcularPorcentaje(valor: any, total: any): any {
    if (!total || total == 0) return 0;
    return Math.round((valor / total) * 100);
  }
}
