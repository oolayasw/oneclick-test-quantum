# Guía de Proceso de Modernización Basada en Assessment

## Objetivo

Iniciar con una fase de entendimiento integral del assessment para obtener el contexto completo de la solución. Esta fase debe permitir comprender:

- Funcionalidades actuales.
- Alcance funcional y técnico.
- Proceso de modernización definido.

Antes de cualquier cambio, se debe realizar un análisis completo de la información disponible para definir la arquitectura objetivo. La modernización debe respetar la estructura, las funcionalidades y los hallazgos identificados en el assessment.

## Lineamientos Generales

- Durante la fase inicial no se deben crear, modificar ni eliminar archivos.
- Al finalizar la fase inicial se deben reportar hallazgos y solicitar aprobación explícita del usuario para continuar.
- Una vez aprobada la continuación, se debe iniciar la modernización tomando como base las funcionalidades identificadas en el assessment del proyecto.
- Incluir un lineamiento de UX en cada decisión funcional y técnica, priorizando claridad, consistencia y facilidad de uso para el usuario final.
- Está prohibida la ejecución de pruebas automatizadas, de calidad o de seguridad (incluyendo SAST/DAST, escaneo de vulnerabilidades y validaciones equivalentes).
- La única validación permitida es funcional y manual, levantando las aplicaciones en modo debug/local.

## Alcance del Proceso

1. Analizar completamente el assessment para entender contexto, funcionalidades, alcance y proceso de modernización esperado.
2. No crear, modificar ni eliminar archivos durante la fase inicial de entendimiento.
3. Informar hallazgos principales del assessment y solicitar aprobación para continuar.
4. Analizar completamente la información del assessment y la solución actual.
5. Validar la estructura existente de la solución en la carpeta `App`.
6. Definir la arquitectura objetivo que se aplicará al proyecto.
7. Construir los componentes requeridos según la arquitectura y el stack tecnológico objetivo definido para este laboratorio: frontend en Angular 20 y backend en .NET Core 8, siempre separando frontend y backend.
8. Crear una carpeta llamada OutPut donde estaran las aplicaciones creadas (backend y frontend) separadas de acuerdo a la responsabilidad de cada una.
9. Habilitar CORS para permitir la comunicación entre frontend y backend.
10. Levantar localmente los proyectos en modo debug para validación funcional manual.
11. Confirmar que la aplicación funciona localmente.
12. Solicitar aprobación explícita del usuario antes de cualquier despliegue a Azure.
13. Para el despliegue, solicitar únicamente el ID de la suscripción de Azure.

## Restricciones Obligatorias

- No crear, modificar ni eliminar archivos durante la fase inicial de entendimiento del assessment.
- No iniciar la modernización sin aprobación explícita del usuario después de la fase de entendimiento.
- No ejecutar pruebas automatizadas.
- No ejecutar pruebas de calidad.
- No ejecutar pruebas de seguridad.
- No ejecutar análisis estático ni dinámico de seguridad.
- No asumir información no presente en el assessment, en la solución actual o no confirmada por el usuario.
- No crear recursos en Azure sin aprobación previa del usuario.
- No finalizar el proceso hasta que el usuario confirme que el entregable es funcional.
- No modificar el proyecto actual

## Fase 1: Entendimiento del Assessment

### Actividades

Antes de modificar cualquier archivo, realizar un análisis completo del assessment para comprender:

- Contexto general de la solución.
- Funcionalidades actuales identificadas.
- Alcance funcional.
- Alcance técnico.
- Proceso de modernización esperado.
- Restricciones indicadas en el assessment.
- Componentes actuales de la solución.
- Riesgos o dependencias relevantes.
- Posibles brechas de información.

Durante esta fase no se deben realizar cambios en el repositorio.

### Entregable de la fase

Al finalizar, entregar al usuario un resumen con:

- Entendimiento general de la solución.
- Funcionalidades identificadas.
- Alcance de modernización interpretado.
- Arquitectura preliminar sugerida (si aplica).
- Riesgos o dudas detectadas.
- Supuestos identificados.
- Recomendación para continuar.

Después de presentar este resumen, solicitar aprobación explícita para continuar con la fase de modernización.

## Fase 2: Análisis Técnico Previo a la Modernización

Una vez el usuario apruebe continuar, analizar:

- Funcionalidades identificadas en el assessment.
- Estructura actual de la solución en la carpeta `App`.
- Stack tecnológico existente.
- Stack tecnológico objetivo obligatorio para la modernización: frontend Angular 20 y backend .NET Core 8.
- Dependencias principales.
- Componentes frontend y backend.
- Requerimientos funcionales inferidos desde el assessment.
- Restricciones técnicas existentes.

Con base en este análisis, definir la arquitectura objetivo a aplicar durante la modernización.

## Fase 3: Construcción de Componentes

Construir los componentes necesarios respetando:

- Arquitectura definida.
- Stack tecnológico identificado.
- Stack tecnológico objetivo obligatorio: frontend Angular 20 y backend .NET Core 8.
- Separación entre frontend y backend.
- Funcionalidades encontradas en el assessment.
- Estructura actual de la solución, salvo reorganización arquitectónica debidamente justificada.
- Aplica siempre arquitectura limpia
- Aplica siempre pincipios SOLID y Clean Code
- Aplica siempre patrones de diseño
- Separar por vistas cada una de las funcionalidades a construir
- El inicio de sesión no puede compartir vista con otra funcionalidad y es obligatorio realizar el login para poder acceder a todo el sistema
- Asegurar que el backend implemente una política CORS obligatoria que permita la comunicación con el frontend.


## Fase 4: Validación Funcional Local

Una vez construidos los artefactos:

- Levantar el backend en modo debug/local.
- Levantar el frontend en modo debug/local.
- Validar manualmente la comunicación entre ambos componentes.
- Verificar que las funcionalidades principales se ejecutan localmente.
- No ejecutar pruebas automatizadas ni herramientas de validación de calidad o seguridad.

Al completar la validación funcional local, informar resultados al usuario y solicitar aprobación explícita para continuar con el despliegue hacia Azure.

## Fase 5: Despliegue en Azure

Antes de iniciar el despliegue:

1. Solicitar al usuario el ID de la suscripción de Azure.
2. Validar si ya existe un grupo de recursos con información similar antes de crear uno nuevo.
3. Definir el nombre del grupo de recursos concatenando un nombre base con un GUID único por ejecución (por ejemplo: `rg-bankscore-<guid>`), para evitar colisiones de nombres en sesiones de capacitación con suscripciones compartidas.
4. Solicitar aprobación del usuario para cada recurso a crear.
5. Justificar brevemente por qué se requiere cada recurso.
6. Crear un único grupo de recursos en `eastus` o `eastus2`.
7. Desplegar el backend en un App Service con sistema operativo Windows, con los permisos disponibles del usuario.
8. Desplegar el frontend en un Storage Account para hosting estático, con los permisos disponibles del usuario.
9. No crear recursos adicionales sin aprobación explícita.

## Recursos Mínimos Esperados en Azure

- Un único grupo de recursos.
- Un App Service (Windows) para backend.
- Un Storage Account para frontend.
- Configuración necesaria para habilitar comunicación entre frontend y backend.

Si se requiere un recurso adicional, primero se debe explicar su necesidad y solicitar aprobación explícita del usuario.

## Finalización del Proceso

El proceso solo podrá finalizar cuando el usuario confirme explícitamente que el entregable es funcional.

Después de esa confirmación, construir la documentación completa de arquitectura con los siguientes entregables:

### Decisiones Arquitectónicas

- ADR separados.
- Un archivo por cada decisión arquitectónica.

### Definición de Arquitectura

- Descripción de la arquitectura implementada.
- Justificación de las decisiones tomadas.
- Relación entre componentes frontend, backend e infraestructura.

### Drivers de Arquitectura

Documentar:

- Drivers funcionales.
- Drivers no funcionales.
- Atributos de calidad.
- Restricciones.
- Riesgos.

### Documentación General

Incluir:

- Overview de la solución.
- Stakeholders.
- Contexto de la solución.
- Estructura general del proyecto.
- Descripción de componentes.
- Consideraciones de despliegue.
- Consideraciones operativas.
- Riesgos identificados.
- Supuestos aplicados.

## Condiciones de Cierre

No marcar el proceso como terminado hasta que:

1. El assessment haya sido analizado completamente.
2. El usuario haya aprobado continuar después de la fase inicial de entendimiento.
3. La aplicación haya sido construida.
4. La aplicación haya sido levantada localmente en modo debug.
5. El usuario haya aprobado continuar con el despliegue.
6. El despliegue en Azure haya sido realizado, si el usuario lo aprueba.
7. El usuario confirme que el entregable es funcional.
8. La documentación de arquitectura haya sido generada.
