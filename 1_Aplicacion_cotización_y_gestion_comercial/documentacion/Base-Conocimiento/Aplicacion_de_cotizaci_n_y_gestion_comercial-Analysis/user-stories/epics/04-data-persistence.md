# Épica 4: Datos y Persistencia

> Migración de datos in-memory a base de datos PostgreSQL con schema, migraciones y seeds.

## HUs de esta Épica

---

### DT-001 Schema de Base de Datos PostgreSQL

**Como** sistema
**Quiero** un schema de base de datos PostgreSQL que represente el dominio de QuoteFlow
**Para** persistir datos de forma duradera (el sistema actual pierde todos los datos al reiniciar)

#### Criterios de Aceptación
- [ ] Dado el análisis de entidades, cuando se diseña el schema, entonces incluye tablas: usuarios, clientes, productos, listas_precios, cotizaciones, cotizacion_items, historial_estados
- [ ] Dado la tabla cotizaciones, cuando se define, entonces tiene FK a usuarios (creado_por) y clientes (cliente_id)
- [ ] Dado la tabla cotizacion_items, cuando se define, entonces tiene FK a cotizaciones y productos, con campos: cantidad, precio_unitario, descuento_item, impuesto, subtotal
- [ ] Dado la tabla historial_estados, cuando se define, entonces registra: cotizacion_id, estado_anterior, estado_nuevo, comentario, usuario_id, created_at
- [ ] Dado las tablas, cuando se definen, entonces incluyen campos de auditoría: created_at, updated_at, deleted_at (soft delete)

#### Notas Técnicas
- Fuente: `reference/data-models.md`
- Situación actual: `app.ts`:32-156 — arrays `any[]` in-memory
- Target: TypeORM entities + PostgreSQL managed (cloud)
- Complejidad estimada: M (5 SP)

#### Evidencia del Análisis
- Entidades detectadas: `reference/data-models.md`
- Anti-pattern: `analysis/production-readiness.md` — "No persistencia"
- Migration plan: `migration/component-order.md` Ola 0

---

### DT-002 Migraciones de Base de Datos

**Como** equipo de desarrollo
**Quiero** gestionar cambios al schema mediante migraciones versionadas
**Para** que los cambios de BD sean reproducibles en todos los ambientes

#### Criterios de Aceptación
- [ ] Dado un cambio al schema, cuando se genera una migración, entonces crea un archivo versionado con Up y Down
- [ ] Dado el pipeline CI/CD, cuando se despliega, entonces ejecuta automáticamente las migraciones pendientes
- [ ] Dado un ambiente limpio, cuando se ejecutan todas las migraciones, entonces el schema queda en el estado esperado
- [ ] Dado una migración fallida, cuando ocurre, entonces el pipeline falla y se puede hacer rollback

#### Notas Técnicas
- Target: TypeORM migrations (`typeorm migration:generate` + `typeorm migration:run`)
- Complejidad estimada: S (3 SP)

---

### DT-003 Seeds de Datos de Prueba

**Como** equipo de desarrollo y QA
**Quiero** cargar datos de prueba reproducibles en ambientes de desarrollo y testing
**Para** poder trabajar con datos representativos sin depender de datos de producción

#### Criterios de Aceptación
- [ ] Dado el ambiente de desarrollo, cuando se ejecuta el seed, entonces crea: 3 usuarios (asesor, supervisor, admin), 5 clientes, 10 productos, 2 listas de precios, 5 cotizaciones en estados variados
- [ ] Dado el seed, cuando se ejecuta múltiples veces, entonces es idempotente (no crea duplicados)
- [ ] Dado el ambiente de producción, cuando se verifica, entonces el seed NO se puede ejecutar en producción

#### Notas Técnicas
- Fuente: `app.ts`:32-156 — datos hardcodeados que sirven como referencia para el seed
- Target: NestJS Seeder + `@nestjs/typeorm` + env guard para prod
- Complejidad estimada: S (3 SP)

---

### DT-004 Soft Delete en Entidades

**Como** sistema
**Quiero** implementar borrado lógico en lugar de eliminación física
**Para** mantener trazabilidad e historial de datos eliminados (el sistema actual borra permanentemente)

#### Criterios de Aceptación
- [ ] Dado un cliente "eliminado", cuando se consulta por ID, entonces retorna 404 (no 200 con registro borrado)
- [ ] Dado un cliente "eliminado", cuando se lista, entonces NO aparece en los resultados
- [ ] Dado la BD, cuando se inspecciona, entonces el registro existe con `deleted_at` no nulo
- [ ] Dado un admin, cuando consulta "eliminados", entonces puede ver el historial de registros borrados
- [ ] Dado una cotización activa, cuando hace referencia a un cliente eliminado, entonces no se permite el borrado del cliente

#### Notas Técnicas
- Fuente: `behavior/workflows.md` Workflow 5 — "borrado físico permanente"
- Bug actual: `app.ts`:233 DELETE elimina permanentemente del array
- Target: TypeORM `@DeleteDateColumn` + `SoftDelete` query strategy
- Complejidad estimada: S (2 SP)

#### Evidencia del Análisis
- Bug documentado: `behavior/workflows.md` Workflow 5 y `reference/api-reference.md` DELETE /api/clientes/:id

## Referencias

- [Backlog](../backlog.md)
- [Data Models](../../reference/data-models.md)
- [Production Readiness](../../analysis/production-readiness.md)
- [Migration Plan](../../migration/component-order.md)
