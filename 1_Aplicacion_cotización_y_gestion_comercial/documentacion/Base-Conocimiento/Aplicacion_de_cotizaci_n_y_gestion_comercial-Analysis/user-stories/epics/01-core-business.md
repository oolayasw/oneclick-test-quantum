# Épica 1: Core Business — Cotizaciones

> Funcionalidad principal del sistema: creación, cálculo, flujo de aprobación y seguimiento de cotizaciones comerciales.

## HUs de esta Épica

---

### FN-004 Creación de Cotizaciones

**Como** asesor comercial autenticado
**Quiero** crear una cotización seleccionando cliente, productos y condiciones comerciales
**Para** formalizar una propuesta económica al cliente

#### Criterios de Aceptación
- [ ] Dado un asesor autenticado, cuando navega a "Nueva Cotización", entonces puede seleccionar un cliente existente
- [ ] Dado un cliente seleccionado, cuando el asesor agrega productos del catálogo con cantidad y descuento, entonces el sistema muestra subtotal calculado por item
- [ ] Dado al menos 1 item agregado, cuando el asesor guarda como borrador, entonces la cotización se persiste con estado "Borrador" y número COT-YYYY-NNN
- [ ] Dado una cotización válida, cuando el asesor marca "enviar a aprobación", entonces el estado cambia a "Pendiente de aprobación"
- [ ] Dado campos obligatorios vacíos (cliente, items, vigencia), cuando se intenta guardar, entonces el sistema muestra errores de validación específicos

#### Notas Técnicas
- Fuente: `behavior/workflows.md` (Workflow 2: Creación de Cotización)
- Lógica actual: `app.ts`:311-365 + `cotizacion.component.ts`:130-230
- Componentes target: `CotizacionModule` (NestJS) + `CotizacionComponent` (Angular 17 standalone)
- Dependencias: FN-001 (Clientes), FN-002 (Productos), SC-001 (Auth)
- Complejidad estimada: L (8 SP)

#### Evidencia del Análisis
- Workflow documentado: `behavior/workflows.md` Workflow 2
- Validaciones requeridas: `behavior/business-logic.md` tabla de validaciones
- Formato número: `COT-{AÑO}-{CONSECUTIVO}` — `behavior/business-logic.md` RN-06

---

### FN-005 Motor de Cálculo de Totales (Única Fuente de Verdad)

**Como** sistema
**Quiero** calcular totales de cotización en un único servicio de dominio
**Para** evitar inconsistencias entre frontend y backend (bug actual: lógica triplicada)

#### Criterios de Aceptación
- [ ] Dado items con cantidad, precio y descuento%, cuando se calcula, entonces descuento_item = cantidad × precio × (descuento% / 100)
- [ ] Dado items calculados, cuando se totalizan, entonces subtotal = Σ(cantidad × precio - descuento_item)
- [ ] Dado un descuento general%, cuando se aplica, entonces total = (subtotal - descuento_general) + Σ impuestos
- [ ] Dado el cálculo, cuando se invoca desde frontend O backend, entonces ambos usan la MISMA función compartida (DRY)
- [ ] Dado números decimales, cuando se redondea, entonces se usa 2 decimales con Math.round(x * 100) / 100

#### Notas Técnicas
- Fuente: `behavior/business-logic.md` RN-01
- Bug actual: Lógica triplicada en `app.ts`:320-335, `app.service.ts`:153-170, `cotizacion.component.ts`:203
- Target: Domain Service compartido (`shared/domain/calcular-totales.ts`)
- Complejidad estimada: M (5 SP)

#### Evidencia del Análisis
- Regla de negocio: `behavior/business-logic.md` RN-01 (fórmula completa)
- Code smell documentado: `analysis/tech-debt.md` DT-08 (DRY violation)
- Refactoring: `technical-debt/remediation-plan.md` — Extract Method + Move to Shared

---

### FN-006 Máquina de Estados de Cotización

**Como** sistema
**Quiero** validar que las transiciones de estado de cotizaciones sigan el flujo definido
**Para** prevenir estados ilegales (bug actual: cualquier transición es posible)

#### Criterios de Aceptación
- [ ] Dado estado "Borrador", cuando se solicita transición, entonces solo permite → "Pendiente de aprobación" o "Cancelada"
- [ ] Dado estado "Pendiente de aprobación", cuando un supervisor actúa, entonces permite → "Aprobada", "Rechazada", "Requiere ajustes"
- [ ] Dado estado "Aprobada", cuando el asesor envía al cliente, entonces permite → "Enviada"
- [ ] Dado estado "Enviada", cuando el cliente responde, entonces permite → "Aceptada", "Rechazada", "Vencida"
- [ ] Dado una transición inválida (ej: Borrador → Aceptada), cuando se intenta, entonces retorna 400 con mensaje "Transición no permitida de {estado_actual} a {estado_destino}"
- [ ] Dado cualquier transición, cuando ocurre, entonces se registra en historial_estados con {fecha, estado_anterior, estado_nuevo, usuario, comentario}

#### Notas Técnicas
- Fuente: `behavior/business-logic.md` RN-02
- Bug actual: `app.ts`:288 acepta CUALQUIER transición sin validación
- Target: State Machine con guards (NestJS service + enum de estados + mapa de transiciones)
- Complejidad estimada: M (5 SP)

#### Evidencia del Análisis
- Bug documentado: `behavior/business-logic.md` RN-02 "Bug detectado"
- Estados válidos: `behavior/decision-logic.md` D-01
- Diagrama de flujo: `behavior/business-logic.md` diagrama Mermaid principal

---

### FN-007 Flujo de Aprobación por Supervisores

**Como** supervisor
**Quiero** revisar cotizaciones pendientes y aprobar, rechazar o solicitar ajustes
**Para** controlar la calidad de las propuestas comerciales antes de enviarlas al cliente

#### Criterios de Aceptación
- [ ] Dado un supervisor autenticado, cuando navega a aprobaciones, entonces ve SOLO cotizaciones en estado "Pendiente de aprobación"
- [ ] Dado una cotización pendiente, cuando el supervisor aprueba con comentario, entonces el estado cambia a "Aprobada" y se registra en historial
- [ ] Dado una cotización pendiente, cuando el supervisor rechaza, entonces DEBE ingresar un motivo (campo obligatorio) y el estado cambia a "Rechazada"
- [ ] Dado una cotización pendiente, cuando el supervisor solicita ajustes, entonces el estado cambia a "Requiere ajustes" y el asesor es notificado
- [ ] Dado un usuario con rol "asesor", cuando intenta aprobar/rechazar, entonces recibe 403 Forbidden

#### Notas Técnicas
- Fuente: `behavior/workflows.md` Workflow 3
- Bug actual: Backend no verifica roles (`app.ts`:288 — sin middleware de permisos)
- Frontend actual: `aprobacion.component.ts`:84 valida comentario pero no se replica en backend
- Target: NestJS Guard `@Roles('supervisor', 'admin')` + filtro por estado en query BD
- Dependencias: FN-006 (State Machine), SC-003 (RBAC)
- Complejidad estimada: M (5 SP)

#### Evidencia del Análisis
- Workflow: `behavior/workflows.md` Workflow 3
- Validación motivo: `behavior/decision-logic.md` D-03
- Permisos: `behavior/business-logic.md` RN-03

---

### FN-008 Dashboard con KPIs Comerciales

**Como** usuario autenticado (cualquier rol)
**Quiero** ver un dashboard con métricas agregadas del negocio
**Para** tomar decisiones informadas sobre la gestión comercial

#### Criterios de Aceptación
- [ ] Dado un usuario autenticado, cuando accede al dashboard, entonces ve: total cotizaciones por estado, valor total cotizado, valor aceptado, tasa de conversión
- [ ] Dado el cálculo de tasa de conversión, cuando hay cotizaciones, entonces tasa = (aceptadas / total) × 100 (redondeado a entero)
- [ ] Dado un asesor, cuando ve el dashboard, entonces SOLO ve métricas de SUS cotizaciones (no las de otros asesores)
- [ ] Dado un supervisor/admin, cuando ve el dashboard, entonces ve métricas GLOBALES (todas las cotizaciones)
- [ ] Dado el dashboard, cuando se carga, entonces usa queries agregadas en BD (no loops en memoria)

#### Notas Técnicas
- Fuente: `behavior/workflows.md` Workflow 4
- Métricas actuales: `app.ts`:366-420 (cálculos con loops en memoria)
- Bug actual: Asesor ve métricas de TODOS — sin filtro por propietario
- Target: Queries SQL agregadas (COUNT, SUM, GROUP BY) + filtro por usuario
- Complejidad estimada: M (5 SP)

#### Evidencia del Análisis
- KPIs documentados: `behavior/workflows.md` Workflow 4 (8 métricas)
- Cálculo tasa: `behavior/decision-logic.md` D-07
- Bug de permisos: `behavior/workflows.md` "un asesor ve las métricas de TODOS"

---

### FN-009 Paginación de Listados

**Como** usuario del sistema
**Quiero** que los listados de clientes, productos y cotizaciones estén paginados
**Para** que la aplicación escale cuando haya miles de registros (bug actual: retorna TODOS sin límite)

#### Criterios de Aceptación
- [ ] Dado un endpoint GET con listado, cuando se invoca sin parámetros, entonces retorna máximo 20 registros (page=1, limit=20)
- [ ] Dado parámetros `?page=2&limit=10`, cuando se invoca, entonces retorna el segundo set de 10 registros
- [ ] Dado un listado paginado, cuando se retorna, entonces incluye metadata: `{ data: [...], total: N, page: P, limit: L, totalPages: T }`
- [ ] Dado el frontend, cuando carga listados, entonces muestra controles de paginación (anterior/siguiente/ir a página)

#### Notas Técnicas
- Fuente: `behavior/workflows.md` — "Se cargan TODOS los clientes/productos sin paginación"
- Bug actual: `app.ts`:180, 242, 301 retornan array completo sin límite
- Target: TypeORM `.skip()` + `.take()` + count query para total
- Complejidad estimada: S (3 SP)

#### Evidencia del Análisis
- Anti-pattern: `analysis/production-readiness.md` "Unbounded results"
- Evidencia: `reference/api-reference.md` — 3 endpoints sin paginación

---

### FN-010 Envío de Cotización al Cliente

**Como** asesor comercial
**Quiero** marcar una cotización aprobada como "Enviada" al cliente
**Para** registrar que el cliente ha recibido la propuesta comercial

#### Criterios de Aceptación
- [ ] Dado una cotización en estado "Aprobada", cuando el asesor marca como enviada, entonces el estado cambia a "Enviada" con fecha de envío
- [ ] Dado una cotización no aprobada, cuando se intenta enviar, entonces el sistema rechaza la operación con mensaje descriptivo
- [ ] Dado una cotización enviada, cuando pasa la fecha de vigencia, entonces el sistema puede marcarla como "Vencida" (automático o manual)

#### Notas Técnicas
- Fuente: `behavior/business-logic.md` diagrama de estados (Aprobada → Enviada)
- Estado actual: Transición sin validación — `app.ts`:288
- Complejidad estimada: S (3 SP)

---

### FN-011 Gestión de Vencimiento de Cotizaciones

**Como** sistema
**Quiero** identificar cotizaciones enviadas que superaron su fecha de vigencia
**Para** marcarlas como vencidas y mantener el pipeline comercial actualizado

#### Criterios de Aceptación
- [ ] Dado una cotización en estado "Enviada" con vigencia expirada, cuando se ejecuta el job de vencimiento, entonces el estado cambia a "Vencida"
- [ ] Dado el dashboard, cuando muestra "Próximos a vencer", entonces lista cotizaciones enviadas con vigencia en los próximos 7 días
- [ ] Dado una cotización marcada como vencida, cuando el asesor revisa, entonces puede ver la fecha de vencimiento original

#### Notas Técnicas
- Fuente: `behavior/workflows.md` Workflow 4 — "Próximos a vencer"
- Target: CRON job o scheduled task (NestJS @Cron)
- Complejidad estimada: S (3 SP)

## Referencias

- [Backlog](../backlog.md)
- [Workflows](../../behavior/workflows.md)
- [Business Logic](../../behavior/business-logic.md)
- [Decision Logic](../../behavior/decision-logic.md)
