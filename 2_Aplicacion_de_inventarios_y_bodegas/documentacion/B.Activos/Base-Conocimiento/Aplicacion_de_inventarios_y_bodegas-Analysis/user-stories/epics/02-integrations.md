# Épica 2: Integraciones — StockControl

## Descripción

El sistema actual NO tiene integraciones externas. Es una aplicación autocontenida (self-contained) que opera exclusivamente con su base de datos SQLite local. No se detectaron connection strings a sistemas externos, APIs consumidas, ni servicios SOAP/REST invocados.

## Estado

**No aplica** — 0 HUs en esta épica.

## Integraciones Futuras Potenciales

Si el sistema evoluciona, las integraciones más probables serían:

| Integración | Tipo | Prioridad | Justificación |
|---|---|---|---|
| ERP/Contabilidad | REST API (export) | Media | Sincronizar movimientos y costos |
| Escáner de códigos de barras | WebSocket/Serial | Baja | Entrada rápida de productos |
| Sistema de compras | REST API (import) | Media | Generar entradas automáticas desde órdenes |
| Notificaciones (email/SMS) | SMTP/API | Baja | Alertas de stock bajo |

[SUPUESTO: Las integraciones listadas son potenciales basadas en el dominio de inventarios, no en evidencia del código.]

## Referencias

- [Backlog](../backlog.md)
- [Specialized Documentation](../../specialized/specialized-documentation.md)
