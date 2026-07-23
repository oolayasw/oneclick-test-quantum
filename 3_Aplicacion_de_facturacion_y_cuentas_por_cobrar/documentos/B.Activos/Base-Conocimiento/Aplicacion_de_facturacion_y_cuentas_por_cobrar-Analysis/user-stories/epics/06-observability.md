# Épica 6: Observabilidad

## Descripción

Implementar monitoreo y logging para poder operar la aplicación en producción de forma segura y diagnosticar problemas rápidamente.

## HUs Contenidas

---

### OB-001 Implementar structured logging

**Como** equipo de operaciones
**Quiero** logs estructurados (JSON) con niveles (info, warn, error)
**Para** poder diagnosticar problemas en producción sin acceso al navegador del usuario

#### Criterios de Aceptación
- [ ] Logger centralizado con niveles: debug, info, warn, error
- [ ] Cada operación de negocio genera log de info (factura creada, pago aplicado)
- [ ] Cada error genera log de error con stack trace
- [ ] Logs enviados a servicio de agregación (CloudWatch, DataDog, o stdout para containers)
- [ ] Formato JSON: `{timestamp, level, message, userId, action, metadata}`

#### Notas Técnicas
- Fuente: `analysis/production-readiness.md` — "0 console.log en 830 LOC"
- Estado actual: 0 líneas de logging — cero visibilidad
- Complejidad: M
- Dependencias: IN-001 (backend donde enviar logs)

#### Evidencia del Análisis
- 0 `console.log`, 0 `console.error` detectados en `app.js` (830 LOC)

---

### OB-002 Implementar health checks

**Como** orquestador (Docker/K8s/ECS)
**Quiero** un endpoint `/health` que reporte el estado de la aplicación
**Para** saber si la instancia está viva y puede recibir tráfico

#### Criterios de Aceptación
- [ ] `GET /health` retorna 200 con `{status: "healthy", uptime, version}`
- [ ] Si la BD no responde, retorna 503 con `{status: "unhealthy", reason}`
- [ ] Response time del health check < 100ms
- [ ] Usado por Docker HEALTHCHECK y/o load balancer

#### Notas Técnicas
- Fuente: `analysis/production-readiness.md` — "Sin health checks"
- Estado actual: No hay endpoint de salud — "orchestrator ciego"
- Complejidad: S
- Dependencias: IN-001 (backend necesario para endpoint)

#### Evidencia del Análisis
- 0 health checks detectados (sin backend, no hay dónde ponerlos)

## Resumen de Épica

| Tipo | Cantidad | SP Estimados |
|---|---|---|
| Observabilidad (OB) | 2 | 8 |

## Referencias

- [Backlog](../backlog.md)
- [Production Readiness](../../analysis/production-readiness.md)
