# Laboratorio de Modernizacion - BankScore2

## Objetivo del laboratorio
Este laboratorio guia al practicante en el entendimiento inicial del assessment, validacion funcional de la aplicacion actual y arranque del proceso de modernizacion asistido por agente.

## 1) Estructura del folder
En esta carpeta cada practicante encontrara dos folders principales:

- 01-Reporte-Tecnico: contiene todo el analisis realizado para construir la modernizacion (contexto, hallazgos, riesgos, recomendaciones y lineamientos del proceso).
- App: contiene la aplicacion actual a modernizar.

## 2) Que revisar primero
1. Entrar a 01-Reporte-Tecnico y revisar los documentos en orden para entender:
- contexto funcional y tecnico
- alcance de modernizacion
- restricciones del proceso
- recomendaciones de arquitectura

2. Entrar a App para validar la aplicacion actual en local y obtener una linea base funcional.

## 3) Resumen previo del stack tecnologico encontrado en App
A partir de la solucion existente, el stack identificado es:

- Plataforma: ASP.NET Core MVC
- Version objetivo: .NET 5 (TargetFramework net5.0)
- Lenguaje principal: C#
- Frontend server-side: Razor Views (.cshtml)
- Estructura: monolito web (una sola aplicacion web)
- Sesion: Session de ASP.NET Core
- Paquetes relevantes:
  - Newtonsoft.Json 9.0.1
  - System.Data.SqlClient 4.8.3
- Configuracion de arranque local:
  - https://localhost:5001
  - http://localhost:5000

Capacidades funcionales actuales identificadas:
- Inicio de sesion
- Gestion de solicitantes
- Evaluacion de score bancario
- Consulta de historial de evaluaciones

## 4) Instructivo corto para levantar la aplicacion en local
Prerequisitos:
- Tener instalado .NET SDK 5.x (o un entorno con soporte para compilar y ejecutar net5.0)
- Visual Studio o VS Code con herramientas de .NET

Pasos:
1. Abrir la carpeta App.
2. Restaurar dependencias:
- dotnet restore
3. Compilar:
- dotnet build
4. Ejecutar la aplicacion web:
- dotnet run --project BankScoreEvaluator.Web/BankScoreEvaluator.Web.csproj
5. Abrir en navegador:
- https://localhost:5001 o http://localhost:5000

Credenciales de demostracion presentes en la app:
- admin / admin123
- analista / analista2024
- supervisor / pass1234

Resultado esperado:
- Se visualiza la pantalla de login y, al autenticarse, se puede navegar por solicitantes, evaluacion y historial.

## 5) Inicio de modernizacion con agente
Una vez revisada la estructura y validada la app en local:

1. En VS Code, seleccionar el agente OneClickGuardian en el chat.
2. Solicitar el inicio del proceso con el siguiente texto sugerido:
- Para iniciar lee el contexto del proyecto que se encuentra en la carpeta documentacion

## 6) Flujo esperado de la capa cognitiva (patron centauro)
La capa cognitiva bajo el patron centauro iniciara con:

1. Analisis completo del assessment y de la aplicacion actual.
2. Definicion de arquitectura objetivo para la modernizacion.
3. Ejecucion de la modernizacion de la aplicacion.
4. Validacion funcional local.
5. Proceso de despliegue en Azure, respetando los lineamientos definidos en el reporte tecnico.

## 7) Nota operativa para sesiones de capacitacion
Durante el despliegue, al crear el grupo de recursos se debe usar un nombre unico por ejecucion concatenando un nombre base con un GUID (por ejemplo: rg-bankscore-<guid>) para evitar colisiones cuando varios practicantes comparten suscripcion.
