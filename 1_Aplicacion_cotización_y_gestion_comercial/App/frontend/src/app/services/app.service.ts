// ================================================================
// app.service.ts - SERVICIO DIOS: Viola todos los principios SOLID
// ================================================================
// MALAS PRACTICAS:
//   - Viola SRP: un servicio maneja auth, clientes, productos, cotizaciones, dashboard
//   - Viola ISP: los componentes dependen de metodos que no usan
//   - Viola DIP: sin abstracciones/interfaces, acoplado a HttpClient directamente
//   - Estado mutable publico accedido directamente desde templates
//   - URL hardcodeada ignorando environments
//   - Lógica de calculos duplicada del backend
//   - Datos en localStorage (vulnerable a XSS)
//   - Sin manejo centralizado de errores
//   - Sin tipado (todo any)
// ================================================================
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// MALA PRACTICA: URL hardcodeada aqui, en environment.ts Y en el backend
var API_URL: any = '/api';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  // MALA PRACTICA: TODO el estado de la app en propiedades publicas mutables
  public clientes: any[] = [];
  public productos: any[] = [];
  public listasPrecios: any[] = [];
  public cotizaciones: any[] = [];
  public dashboardData: any = {};
  public usuarioActual: any = null;
  public token: any = null;
  public cargando: any = false;
  public errorGlobal: any = null;
  public pendientesAprobacion: any = 0;

  // MALA PRACTICA: Constructor hace demasiado - recupera sesion, hace calculos
  constructor(private http: HttpClient) {
    // MALA PRACTICA: Recuperar sesion desde localStorage sin verificar integridad
    try {
      var sesionStr: any = localStorage.getItem('qf_session');
      if (sesionStr) {
        var sesion: any = JSON.parse(sesionStr);
        this.usuarioActual = sesion.usuario;
        this.token = sesion.token;
      }
    } catch (e) {
      // MALA PRACTICA: Swallow exception silenciosamente
      console.log('Error recuperando sesion');
    }
  }

  // ============================================================
  // AUTH - Sin JWT real, sin refresh, passwords en texto plano
  // ============================================================
  login(email: any, password: any): any {
    // MALA PRACTICA: retorna Observable crudo sin tipado
    return this.http.post(API_URL + '/auth/login', { email: email, password: password });
  }

  establecerSesion(datos: any): void {
    this.usuarioActual = datos.usuario;
    this.token = datos.token;
    // MALA PRACTICA: Token en localStorage - vulnerable a XSS
    localStorage.setItem('qf_session', JSON.stringify(datos));
    // MALA PRACTICA: Logica de negocio en setter de sesion
    console.log('Sesion establecida para: ' + datos.usuario.email + ' token: ' + datos.token);
  }

  cerrarSesion(): void {
    this.usuarioActual = null;
    this.token = null;
    localStorage.removeItem('qf_session');
    // MALA PRACTICA: Limpiar todo el estado al cerrar sesion de forma sincrona
    this.clientes = [];
    this.productos = [];
    this.cotizaciones = [];
    this.listasPrecios = [];
    this.dashboardData = {};
    this.pendientesAprobacion = 0;
  }

  estaAutenticado(): any {
    // MALA PRACTICA: == en vez de ===
    return this.token != null && this.token != undefined;
  }

  // ============================================================
  // DASHBOARD
  // ============================================================
  cargarDashboard(): void {
    this.cargando = true;
    // MALA PRACTICA: sin unsubscribe, sin takeUntil, memory leak garantizado
    this.http.get(API_URL + '/dashboard').subscribe(
      (data: any) => {
        this.dashboardData = data;
        this.pendientesAprobacion = data.pendientesAprobacion || 0;
        this.cargando = false;
      },
      (error: any) => {
        // MALA PRACTICA: Error swallowed con solo un console.log
        console.log('Error dashboard: ' + error);
        this.cargando = false;
      }
    );
  }

  // ============================================================
  // CLIENTES - Logica de negocio mezclada con HTTP
  // ============================================================
  cargarClientes(): void {
    // MALA PRACTICA: Sin headers de auth, sin loading state por recurso
    this.http.get(API_URL + '/clientes').subscribe(
      (data: any) => {
        this.clientes = data; // MALA PRACTICA: Mutacion directa del array
      },
      (error: any) => {
        console.log('Error clientes: ' + error);
      }
    );
  }

  crearCliente(cliente: any): any {
    return this.http.post(API_URL + '/clientes', cliente);
  }

  actualizarCliente(id: any, cliente: any): any {
    return this.http.put(API_URL + '/clientes/' + id, cliente);
  }

  eliminarCliente(id: any): any {
    return this.http.delete(API_URL + '/clientes/' + id);
  }

  // MALA PRACTICA: Metodo que hace dos cosas: obtener cliente Y sus cotizaciones
  obtenerClienteConHistorial(id: any): any {
    return this.http.get(API_URL + '/clientes/' + id);
  }

  // ============================================================
  // PRODUCTOS
  // ============================================================
  cargarProductos(): void {
    this.http.get(API_URL + '/productos').subscribe(
      (data: any) => {
        this.productos = data;
      },
      (error: any) => {
        console.log('Error productos: ' + error);
      }
    );
  }

  crearProducto(producto: any): any {
    return this.http.post(API_URL + '/productos', producto);
  }

  actualizarProducto(id: any, producto: any): any {
    return this.http.put(API_URL + '/productos/' + id, producto);
  }

  // ============================================================
  // LISTAS DE PRECIOS
  // ============================================================
  cargarListasPrecios(): void {
    this.http.get(API_URL + '/listas-precios').subscribe(
      (data: any) => {
        this.listasPrecios = data;
      },
      (error: any) => {
        console.log('Error listas: ' + error);
      }
    );
  }

  crearListaPrecios(lista: any): any {
    return this.http.post(API_URL + '/listas-precios', lista);
  }

  // ============================================================
  // COTIZACIONES
  // ============================================================
  cargarCotizaciones(): void {
    this.http.get(API_URL + '/cotizaciones').subscribe(
      (data: any) => {
        this.cotizaciones = data;
        // MALA PRACTICA: Calcular pendientes en el servicio de carga
        var pendientes: any = 0;
        for (var i = 0; i < data.length; i++) {
          if (data[i].estado == 'Pendiente de aprobación') pendientes++;
        }
        this.pendientesAprobacion = pendientes;
      },
      (error: any) => {
        console.log('Error cotizaciones: ' + error);
      }
    );
  }

  crearCotizacion(cotizacion: any): any {
    return this.http.post(API_URL + '/cotizaciones', cotizacion);
  }

  actualizarEstadoCotizacion(id: any, estado: any, comentario: any): any {
    return this.http.put(API_URL + '/cotizaciones/' + id + '/estado', {
      estado: estado,
      comentario: comentario,
      // MALA PRACTICA: Acceso directo al estado del servicio
      usuario: this.usuarioActual ? this.usuarioActual.nombre : 'Sistema'
    });
  }

  // MALA PRACTICA: Logica de calculo duplicada del backend - DRY violation
  calcularTotalesCotizacion(items: any[], descuentoGeneral: any): any {
    var subtotal: any = 0;
    var impuestos: any = 0;

    // MALA PRACTICA: for loop en vez de .reduce()
    for (var i = 0; i < items.length; i++) {
      var item: any = items[i];
      if (item.cantidad && item.precio) {
        var descItem: any = item.cantidad * item.precio * ((item.descuento || 0) / 100);
        var baseItem: any = (item.cantidad * item.precio) - descItem;
        var impItem: any = baseItem * ((item.impuesto || 0) / 100);
        item.subtotal = baseItem;
        subtotal += baseItem;
        impuestos += impItem;
      }
    }

    var descGral: any = subtotal * ((descuentoGeneral || 0) / 100);
    var total: any = (subtotal - descGral) + impuestos;

    return { subtotal: subtotal, impuestos: impuestos, total: total };
  }

  // MALA PRACTICA: Metodo de formateo en el servicio (deberia ser un pipe)
  formatearMoneda(valor: any): any {
    if (!valor && valor !== 0) return '$ 0';
    return '$ ' + Math.round(valor).toLocaleString('es-CO');
  }

  // MALA PRACTICA: Logica de badge duplicada en servicio Y en cada componente
  getBadgeClass(estado: any): any {
    if (estado == 'Borrador') return 'badge-secondary';
    if (estado == 'Pendiente de aprobación') return 'badge-warning';
    if (estado == 'Requiere ajustes') return 'badge-info';
    if (estado == 'Aprobada') return 'badge-primary';
    if (estado == 'Enviada') return 'badge-info';
    if (estado == 'Aceptada') return 'badge-success';
    if (estado == 'Rechazada') return 'badge-danger';
    if (estado == 'Vencida') return 'badge-warning';
    if (estado == 'Cancelada') return 'badge-dark';
    return 'badge-secondary';
  }
}
