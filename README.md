# FoodPlease Dashboard

Quiero desarrollar la interfaz web MVP de FoodPlease, una plataforma de pedidos y delivery de comida que forma parte de un proyecto académico desarrollado con Flutter y que ahora necesita complementar su experiencia móvil con una interfaz web.

CONTEXTO DEL PROYECTO

FoodPlease busca reducir la incertidumbre del cliente y las tareas manuales que dificultan la coordinación entre restaurantes y repartidores.

Las principales problemáticas identificadas en el proyecto son:

Dependencia de procesos manuales en el restaurante.

Asignación manual de repartidores.

Uso de mapas físicos para coordinar entregas.

Falta de seguimiento visible del pedido.

Necesidad de mejorar la coordinación entre cliente, restaurante y repartidor.

El MVP móvil ya contempla:

Autenticación y registro.

Exploración de restaurantes.

Categorías y menú.

Carrito.

Confirmación del pedido.

Seguimiento mediante estados.

Historial y perfil.

Vista operativa de restaurante.

Vista de repartidor.

Representación de una ruta A-B mediante mapa.

Los estados principales de un pedido son:

Recibido

En preparación

Listo

En camino

Entregado

En esta primera etapa NO quiero construir un sistema backend completo. Quiero construir una interfaz web MVP navegable, utilizando datos mock/locales para demostrar visualmente el funcionamiento.

OBJETIVO DE ESTA PRIMERA VERSIÓN

Crear un Dashboard Web para restaurantes de FoodPlease.

La interfaz debe permitir que un restaurante:

Visualice pedidos nuevos.

Vea pedidos en preparación.

Vea pedidos listos.

Identifique pedidos en camino.

Consulte pedidos entregados.

Cambie el estado de un pedido.

Consulte el detalle de cada pedido.

Visualice información básica del repartidor asignado.

Visualice una representación de la ruta de entrega.

Consulte métricas básicas del restaurante.

El objetivo es que la interfaz permita demostrar cómo FoodPlease mejora la coordinación operacional del restaurante.

ESTILO VISUAL

La interfaz debe sentirse como un producto tecnológico moderno, profesional y listo para convertirse posteriormente en una aplicación real.

Mantener coherencia visual con la aplicación móvil FoodPlease.

Identidad visual

Color principal:

Orange: #FF5722

Utilizar además:

Carbón oscuro para textos principales.

Fondos claros.

Blanco para tarjetas y superficies.

Gris suave para elementos secundarios.

Verde para estados positivos/completados.

Amarillo o ámbar para estados pendientes.

Rojo solamente para errores o acciones destructivas.

No utilizar demasiados colores.

Diseño

Moderno.

Limpio.

Minimalista.

Profesional.

Alta legibilidad.

Bordes suavemente redondeados.

Sombras muy sutiles.

Espaciado generoso.

Jerarquía visual clara.

Diseño responsive.

Desktop-first para el dashboard, pero correctamente adaptable a tablet y móvil.

Evitar una apariencia excesivamente corporativa o genérica de plantilla administrativa.

La interfaz debe sentirse como una plataforma de delivery moderna.

ESTRUCTURA GENERAL

Crear un layout principal con:

Sidebar izquierda

Logo FoodPlease.

Opciones:

Dashboard

Pedidos

Menú

Repartidores

Historial

Configuración

En la parte inferior:

Nombre del restaurante.

Estado: "Abierto".

Avatar del usuario.

Opción de cerrar sesión.

Header

Mostrar:

Título de la sección actual.

Buscador.

Icono de notificaciones.

Avatar del usuario.

Nombre del restaurante.

PÁGINA 1 — DASHBOARD

Crear una pantalla inicial de resumen.

Título:

"Dashboard"

Subtítulo:

"Resumen de la operación de hoy"

Mostrar cuatro tarjetas principales:

Pedidos de hoy

Pedidos pendientes

Pedidos en preparación

Ventas del día

Debajo, crear dos áreas principales:

Pedidos recientes

Tabla o lista con:

ID pedido

Cliente

Hora

Total

Estado

Repartidor

Acción "Ver detalle"

Utilizar datos ficticios realistas.

Actividad reciente

Mostrar eventos como:

"Pedido #1048 recibido"

"Pedido #1045 pasó a En preparación"

"Repartidor asignado al pedido #1042"

"Pedido #1039 fue entregado"

PÁGINA 2 — PEDIDOS

Esta debe ser una de las páginas principales del MVP.

Título:

"Pedidos"

Crear filtros por estado:

Todos

Recibidos

En preparación

Listos

En camino

Entregados

También incluir:

Buscador por número de pedido o cliente.

Filtro por fecha.

Mostrar los pedidos en una tabla.

Columnas:

Pedido

Cliente

Hora

Productos

Total

Estado

Repartidor

Acción

Cada estado debe tener un badge visual claramente diferenciable.

DETALLE DEL PEDIDO

Al seleccionar un pedido, abrir una página o panel lateral con:

Información del pedido

Pedido #1048

Cliente:
"María González"

Hora:
19:42

Dirección:
"Av. Providencia 1234"

Productos

Ejemplo:

Hamburguesa Clásica × 1
Papas Fritas × 1
Bebida × 1

Subtotal
Despacho
Total

Estado

Mostrar un timeline horizontal o vertical:

✓ Pedido recibido
✓ En preparación
○ Listo
○ En camino
○ Entregado

Permitir avanzar el pedido mediante un botón:

"Marcar como listo"

Cuando el estado cambie, actualizar visualmente el timeline.

ASIGNACIÓN DEL REPARTIDOR

Dentro del detalle del pedido mostrar:

"Repartidor"

Si todavía no existe:

"Buscando repartidor..."

y un botón:

"Asignar repartidor"

Mostrar una lista de repartidores ficticios disponibles con:

Nombre

Estado

Distancia aproximada

Vehículo

Botón "Asignar"

Después de asignarlo, mostrar:

Nombre del repartidor.

Estado "Asignado".

Vehículo.

Hora de asignación.

Esta funcionalidad puede ser completamente simulada mediante estado local.

MAPA

Crear una sección de mapa para representar la entrega.

No necesito GPS real en esta primera versión.

Utilizar una representación visual de una ruta A-B:

A = Restaurante
B = Dirección del cliente

Mostrar:

Marcador del restaurante.

Marcador del cliente.

Línea/ruta entre ambos.

Información del repartidor.

El mapa puede utilizar datos simulados.

IMPORTANTE:
No presentar esta funcionalidad como GPS real ni como navegación productiva.

Debe quedar visualmente claro que es una representación del flujo logístico del MVP.

PÁGINA 3 — MENÚ

Crear una interfaz para administrar el menú del restaurante.

Mostrar categorías:

Hamburguesas

Acompañamientos

Bebidas

Postres

Cada producto debe mostrar:

Imagen.

Nombre.

Descripción.

Precio.

Disponibilidad.

Categoría.

Permitir visualmente:

Agregar producto.

Editar producto.

Activar/desactivar disponibilidad.

No necesito backend todavía.

Utilizar datos mock.

PÁGINA 4 — REPARTIDORES

Crear una página para visualizar repartidores.

Mostrar tarjetas o tabla con:

Nombre.

Estado.

Vehículo.

Pedidos actuales.

Última actividad.

Estados:

Disponible

En entrega

Fuera de servicio

Agregar una vista de detalle del repartidor.

PÁGINA 5 — HISTORIAL

Crear historial de pedidos.

Mostrar:

Número de pedido.

Fecha.

Cliente.

Total.

Repartidor.

Estado final.

Agregar filtros por:

Fecha.

Estado.

Cliente.

PÁGINA 6 — CONFIGURACIÓN

Crear una página sencilla de configuración del restaurante.

Secciones:

Información del restaurante

Nombre.

Dirección.

Teléfono.

Horario.

Estado del restaurante

Toggle:

"Restaurante abierto"

Preferencias

Notificaciones de nuevos pedidos.

Notificaciones de cambios de estado.

Estas opciones pueden funcionar solamente a nivel visual/local.

DATOS MOCK

Crear un pequeño dataset local para que la interfaz se vea completamente funcional.

Utilizar aproximadamente:

8–12 pedidos.

5–6 productos.

4–5 repartidores.

Diferentes estados de pedido.

Los datos deben ser consistentes entre las distintas páginas.

Por ejemplo:

Si un pedido cambia de "Recibido" a "En preparación", el cambio debe reflejarse en el Dashboard y en la página de Pedidos durante la sesión.

No utilizar datos reales ni información personal real.

INTERACCIONES DEL MVP

Implementar funcionalmente con estado local:

Navegación entre páginas.

Filtros de pedidos.

Búsqueda.

Apertura del detalle de pedido.

Cambio de estado del pedido.

Asignación simulada de repartidor.

Activación/desactivación de productos.

Cambio del estado abierto/cerrado del restaurante.

Actualización de métricas cuando corresponda.

Notificaciones visuales/toasts cuando se realiza una acción.

El objetivo es que el usuario pueda hacer clic y sentir que está utilizando una aplicación real, aunque los datos todavía sean simulados.

RESPONSIVE DESIGN

La aplicación debe funcionar correctamente en:

Desktop.

Tablet.

Mobile.

En desktop utilizar sidebar.

En mobile convertir el sidebar en un menú hamburguesa o navegación inferior.

Las tablas deben convertirse en cards o listas cuando el ancho sea reducido.

TECNOLOGÍA

Utilizar una arquitectura limpia y fácil de extender posteriormente.

Preferencias:

React + TypeScript.

Componentes reutilizables.

Tailwind CSS.

Routing para las diferentes páginas.

Estado local para el MVP.

Datos mock separados de los componentes.

Código modular.

Preparar la estructura para que posteriormente podamos reemplazar los datos mock por una API REST.

No implementar autenticación real, pagos reales, GPS real ni backend en esta primera etapa.

CALIDAD DE UX

Priorizar:

Navegación intuitiva.

Feedback visual después de cada acción.

Estados vacíos.

Loading states cuando corresponda.

Mensajes de error amigables.

Confirmaciones antes de acciones importantes.

Consistencia visual.

Accesibilidad básica.

Buen contraste.

Botones claramente identificables.

No llenar la interfaz de elementos innecesarios.

IMPORTANTE

Este es un MVP académico, no un sistema productivo.

Por lo tanto:

Utilizar datos simulados.

No solicitar credenciales reales.

No implementar pagos reales.

No implementar GPS real.

No implementar infraestructura backend todavía.

Mantener una arquitectura preparada para integrar posteriormente una API REST.

Quiero que el resultado inicial sea una interfaz web visualmente atractiva, profesional, coherente con FoodPlease y completamente navegable, que podamos utilizar posteriormente como base para agregar backend y despliegue.

Antes de agregar funcionalidades innecesarias, prioriza que las pantallas principales estén bien diseñadas, conectadas entre sí y que el flujo de gestión de pedidos funcione correctamente.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8a1f7559-b312-4ecb-9339-2075315a11c9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
