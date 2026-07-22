# QuoteFlow - Aplicación de Cotización y Gestión Comercial

> **APLICACION DE EJERCICIO DE MODERNIZACION**
> Esta aplicación usa **versiones OBSOLETAS** e implementa **MALAS PRACTICAS** de desarrollo intencionalmente para ser usada como caso de estudio de modernización.

## Stack Tecnológico (OBSOLETO)

| Capa | Tecnología | Versión | Estado |
|------|-----------|---------|--------|
| Frontend | Angular | 12.2.x | EOL Nov 2022 |
| Frontend CSS | Bootstrap | 4.5.2 | EOL 2021 |
| Backend | Node.js + Express | 4.16.x | Desactualizado |
| Lenguaje | TypeScript | 3.9 / 4.3 | Obsoleto |
| Runtime Backend | ts-node | 8.x | Obsoleto |

## Malas Prácticas Implementadas

### Backend (`backend/src/app.ts`)
- **God File**: Todo el backend en un solo archivo de 400+ líneas
- **Estado Global Mutable**: Datos en variables `var` globales (sin base de datos)
- **Sin JWT real**: Tokens son strings concatenados `"FAKE_TOKEN_1_timestamp"`
- **Passwords en texto plano**: Sin bcrypt ni hashing
- **CORS abierto**: `origin: '*'` sin restricciones
- **Código duplicado**: El mismo loop de búsqueda repetido 6 veces
- **Magic numbers**: `impuesto: 19` hardcodeado
- **Sin validación**: Entradas no sanitizadas
- **Lógica de negocio en routes**: Cálculos de totales dentro de los handlers HTTP

### Frontend (`frontend/src/app/`)
- **God Service** (`app.service.ts`): Un solo servicio maneja Auth, Clientes, Productos, Cotizaciones y Dashboard
- **God Components**: Componentes con 20+ propiedades y múltiples responsabilidades
- **`any` en todo**: Sin tipado TypeScript útil
- **Sin Guards**: Rutas privadas accesibles sin autenticación
- **Sin lazy loading**: Todo en AppModule, bundle enorme
- **Código duplicado**: `formatearMoneda()` y `getBadgeClass()` repetidos en 4 componentes
- **Memory leaks**: `subscribe()` sin `unsubscribe()`/`takeUntil()`
- **Token en localStorage**: Vulnerable a XSS
- **Lógica en getters**: Filtros complejos en getters del componente
- **`confirm()` nativo**: En vez de modales Angular

### Antipatrones
- **Copy-Paste Programming**: Validaciones idénticas en frontend y backend
- **Magic Strings**: Estados como `'Pendiente de aprobación'` hardcodeados
- **Global State**: Todo el estado de la app en `AppService.public` properties
- **Primitive Obsession**: Todo tipado como `any`

## Cómo Ejecutar

### 1. Backend

```bash
cd backend
npm install
npm run dev
# Servidor en http://localhost:3000
```

### 2. Frontend

```bash
cd frontend
npm install --legacy-peer-deps

# Con Node.js 17+ (incluyendo Node 24), requiere --openssl-legacy-provider
# por incompatibilidad de Angular 12 obsoleto con OpenSSL 3.x
# (MALA PRACTICA: versión obsoleta incompatible con runtime moderno)
npm start
# App en http://localhost:4200

# O manualmente:
$env:NODE_OPTIONS="--openssl-legacy-provider"  # PowerShell
npx ng serve --proxy-config proxy.conf.json --port 4200
```

## Credenciales de Demo

| Usuario | Email | Password | Rol |
|---------|-------|----------|-----|
| Asesor Demo | asesor@quoteflow.com | 1234 | asesor |
| Supervisor Demo | supervisor@quoteflow.com | 1234 | supervisor |
| Admin Demo | admin@quoteflow.com | 1234 | admin |

## Pantallas Implementadas

1. **Login** - Pantalla de autenticación (credenciales en pantalla)
2. **Dashboard** - KPIs, estados y actividad reciente
3. **Gestión de Clientes** - CRUD completo + historial de cotizaciones
4. **Catálogo** - Productos/servicios + listas de precios
5. **Cotizaciones** - Lista, creación, detalle y cambio de estado
6. **Aprobaciones** - Bandeja de aprobación para supervisores

## API Endpoints (Backend)

```
POST /api/auth/login
GET  /api/clientes
POST /api/clientes
PUT  /api/clientes/:id
DEL  /api/clientes/:id
GET  /api/productos
POST /api/productos
PUT  /api/productos/:id
GET  /api/listas-precios
POST /api/listas-precios
GET  /api/cotizaciones
POST /api/cotizaciones
GET  /api/cotizaciones/:id
PUT  /api/cotizaciones/:id/estado
GET  /api/dashboard
```

## Advertencias

- Los datos se pierden al reiniciar el backend (estado en memoria)
- No usar en producción
- El token de sesión es un string sin firma ni cifrado
