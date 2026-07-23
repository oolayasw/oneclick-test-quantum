# Épica 2: Integraciones

## Descripción

Modernización de la capa de integración. El sistema actual opera 100% client-side sin backend. Esta épica introduce el backend REST necesario para multi-usuario, persistencia real y envío de emails.

## HUs Contenidas

---

### IN-001 Backend REST API para persistencia

**Como** equipo de desarrollo
**Quiero** un backend REST API que gestione la persistencia de datos
**Para** reemplazar localStorage y habilitar multi-usuario

#### Criterios de Aceptación
- [ ] API RESTful con endpoints CRUD para: invoices, payments, clients, creditNotes, audit
- [ ] Autenticación via JWT en todos los endpoints
- [ ] Respuestas en JSON con códigos HTTP estándar (200, 201, 400, 401, 404, 500)
- [ ] Validaciones de negocio ejecutadas server-side (no confiar en cliente)
- [ ] Documentación OpenAPI/Swagger

#### Notas Técnicas
- Fuente: `analysis/production-readiness.md` — "Sin backend, todo en localStorage"
- Estado actual: `JSON.parse(localStorage.getItem(...))` — `app.js:13-14`
- Complejidad: XL (endpoints CRUD + auth + validaciones server-side)
- Dependencias: DT-001 (DataStore interface define los contratos), SC-001 (Auth)

#### Evidencia del Análisis
- Persistencia actual: `app.js:13-14, 39-40` — localStorage sin transacciones
- 8 entidades a persistir: invoices, payments, clients, products, creditNotes, audit, companyInfo, numeration

## Referencias

- [Backlog](../backlog.md)
- [Production Readiness](../../analysis/production-readiness.md)
- [Database Schema](../../database/schema-analysis.md)
