# QuoteFlow — Diagramas de Secuencia

## Flujo 1: Autenticación (Login)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant LC as LoginComponent
    participant AS as AppService
    participant BE as Express app.ts
    participant MEM as Arrays In-Memory

    U->>LC: Ingresa email + password
    LC->>AS: login(email, password)
    AS->>BE: POST /api/auth/login {email, password}
    BE->>MEM: USUARIOS.find(u => u.email === email)
    alt Usuario encontrado y password === texto plano
        MEM-->>BE: usuario encontrado
        BE->>BE: token = 'FAKE_TOKEN_' + id + '_' + Date.now()
        BE-->>AS: 200 {usuario, token}
        AS->>AS: localStorage.setItem('token', token)
        AS->>AS: this.usuarioActual = usuario
        AS-->>LC: success
        LC->>LC: router.navigate(['/dashboard'])
    else Credenciales invalidas
        MEM-->>BE: null
        BE-->>AS: 401 {error: 'Credenciales invalidas'}
        AS-->>LC: error
        LC->>U: Muestra mensaje "Error al iniciar sesion"
    end
```

Este diagrama muestra que la autenticación es simulada: el token es una concatenación predecible sin firma criptográfica, y las contraseñas se comparan en texto plano directamente contra arrays en memoria (`app.ts`:165).

## Flujo 2: Crear Cotización

```mermaid
sequenceDiagram
    participant U as Usuario (Asesor)
    participant COT as CotizacionComponent
    participant AS as AppService
    participant BE as Express app.ts
    participant MEM as Arrays In-Memory

    U->>COT: Click "Nueva Cotizacion"
    COT->>COT: vista = 'nueva'
    U->>COT: Selecciona cliente, agrega items
    COT->>COT: calcularTotales() - local
    U->>COT: Click "Guardar"
    COT->>AS: crearCotizacion(datos)
    AS->>BE: POST /api/cotizaciones {cliente, items, ...}
    BE->>BE: id = COTIZACIONES.length + 1
    BE->>BE: calcularTotales(items) - backend
    BE->>BE: estado = 'borrador'
    BE->>MEM: COTIZACIONES.push(nuevaCotizacion)
    MEM-->>BE: OK
    BE-->>AS: 201 {cotizacion completa}
    AS->>AS: this.cotizaciones.push(response)
    AS-->>COT: cotizacion creada
    COT->>U: Muestra detalle de la cotizacion
```

Este flujo evidencia la duplicación de lógica de cálculo: `calcularTotales()` se ejecuta tanto en el frontend (para vista previa) como en el backend (para persistir). Ambas implementaciones son independientes y pueden producir resultados diferentes (`app.service.ts`:208 vs `app.ts`:320).

## Flujo 3: Aprobación de Cotización

```mermaid
sequenceDiagram
    participant U as Supervisor
    participant APR as AprobacionComponent
    participant AS as AppService
    participant BE as Express app.ts
    participant MEM as Arrays In-Memory

    U->>APR: Accede a /aprobaciones
    APR->>AS: obtenerCotizaciones()
    AS->>BE: GET /api/cotizaciones
    BE->>MEM: COTIZACIONES (todas)
    MEM-->>BE: Array completo
    BE-->>AS: 200 [cotizaciones]
    AS-->>APR: lista completa
    APR->>APR: filtrar estado === 'enviada'
    U->>APR: Click "Aprobar" en cotizacion X
    APR->>AS: cambiarEstadoCotizacion(id, 'aprobada')
    AS->>BE: PUT /api/cotizaciones/{id}/estado {estado: 'aprobada'}
    BE->>MEM: cot = COTIZACIONES.find(c => c.id === id)
    alt Cotizacion encontrada
        BE->>BE: cot.estado = 'aprobada'
        BE->>BE: cot.fechaAprobacion = new Date()
        BE-->>AS: 200 {cotizacion actualizada}
        AS-->>APR: success
        APR->>U: Badge verde "Aprobada"
    else No encontrada
        BE-->>AS: 404 {error: 'Cotizacion no encontrada'}
        AS-->>APR: error
        APR->>U: console.log(error) - sin feedback visual
    end
```

Este flujo revela que no hay validación de transición de estados: cualquier estado puede transicionar a cualquier otro (sin verificar que `enviada` → `aprobada` sea válido). La validación es solo por existencia del registro, no por regla de negocio (`app.ts`:287-295).

## Flujo 4: CRUD Clientes

```mermaid
sequenceDiagram
    participant U as Usuario
    participant CLI as ClientesComponent
    participant AS as AppService
    participant BE as Express app.ts
    participant MEM as CLIENTES[]

    U->>CLI: Accede a /clientes
    CLI->>AS: obtenerClientes()
    AS->>BE: GET /api/clientes
    BE->>MEM: return CLIENTES (array completo)
    MEM-->>BE: [...todos los clientes]
    BE-->>AS: 200 [clientes]
    AS->>AS: this.clientes = response
    AS-->>CLI: datos cargados
    CLI->>U: Renderiza tabla

    U->>CLI: Click "Nuevo Cliente"
    CLI->>CLI: vista = 'nuevo'
    U->>CLI: Llena formulario, click Guardar
    CLI->>AS: crearCliente(formData)
    AS->>BE: POST /api/clientes {nombre, nit, ...}
    BE->>BE: id = CLIENTES.length + 1
    BE->>MEM: CLIENTES.push({id, ...datos})
    BE-->>AS: 201 {cliente creado}
    AS->>AS: this.clientes.push(response)
    AS-->>CLI: success
    CLI->>U: Vuelve a lista actualizada
```

Se evidencia que la generación de IDs es secuencial sin garantía de unicidad (`CLIENTES.length + 1`), lo que puede causar colisiones si se eliminan registros y se crean nuevos.

## Hallazgos Clave de los Flujos

- **Sin validación de estados** — la máquina de estados es implícita y permisiva
- **Lógica duplicada** — cálculos financieros en frontend Y backend independientemente
- **Sin feedback de error real** — errores del backend se loguean en consola sin notificar al usuario
- **Sin paginación** — todas las queries retornan arrays completos sin límite
- **IDs frágiles** — generación basada en `.length + 1` no es robusta

## Referencias

- [Workflows](../../behavior/workflows.md)
- [Lógica de Negocio](../../behavior/business-logic.md)
- [Error Handling](../../behavior/error-handling.md)
- [Diagrama de Arquitectura](../architecture/system-context.md)
