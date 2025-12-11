# Frontend: Gestor de Tareas Interactivo

Este documento describe las funcionalidades y la experiencia de usuario que ofrece la parte visual de nuestra aplicación, el **frontend**. Nuestro objetivo es proporcionar una herramienta de gestión de tareas que sea no solo potente, sino también agradable y fluida de usar.

## 1. El Propósito de la Aplicación

Esta aplicación está diseñada para ayudar a las personas a organizar su vida diaria y profesional. El frontend actúa como el puente entre el usuario y la lógica de negocio (el backend), traduciendo las peticiones del usuario en acciones concretas y presentando la información de manera clara y accesible.

## 2. Funcionalidades Clave

El frontend ofrece un conjunto de características esenciales para una gestión de tareas eficiente, todas ellas diseñadas para una interacción directa y sin fricciones.

### 2.1. Gestión Completa de Tareas (CRUD)

El corazón de la aplicación es la capacidad de manejar tareas de principio a fin.

| Funcionalidad | Descripción | Experiencia de Usuario |
| :--- | :--- | :--- |
| **Creación de Tareas** | Permite añadir nuevas tareas al sistema con un formulario simple y directo. | El proceso es rápido y la nueva tarea aparece inmediatamente en la lista con una animación sutil. |
| **Visualización de Tareas** | Muestra una lista organizada de todas las tareas pendientes y completadas. | La lista se presenta de forma clara, permitiendo al usuario escanear rápidamente su carga de trabajo. |
| **Edición Rápida** | El usuario puede modificar el contenido o los detalles de una tarea existente. | La edición se realiza en línea o a través de un modal, minimizando la interrupción del flujo de trabajo. |
| **Eliminación Segura** | Permite borrar tareas que ya no son necesarias. | Se incluye una confirmación para evitar eliminaciones accidentales, asegurando la integridad de los datos. |

### 2.2. Interacción y Estado

El frontend se encarga de reflejar el estado de las tareas y permitir cambios de manera intuitiva.

*   **Marcado de Finalización:** Con un solo clic o toque, el usuario puede marcar una tarea como completada. La tarea cambia visualmente de estado y, si está configurado, se mueve a una sección de tareas finalizadas.
*   **Feedback Visual:** Cada acción (crear, editar, eliminar) genera una respuesta visual inmediata. Por ejemplo, al completar una tarea, se utiliza una animación suave para indicar el éxito de la operación.

### 2.3. Experiencia de Usuario Fluida

Hemos puesto especial énfasis en la sensación de uso de la aplicación, utilizando la librería **GSAP** para mejorar la interacción.

*   **Transiciones Animadas:** La navegación entre vistas y la aparición/desaparición de elementos (como formularios o modales) se manejan con animaciones fluidas. Esto hace que la aplicación se sienta moderna y reactiva.
*   **Rutas de Navegación:** Gracias a **React Router DOM**, la aplicación se comporta como una aplicación de una sola página (SPA), lo que significa que la navegación es instantánea sin recargas de página.

## 3. Comunicación con el Backend

El frontend gestiona toda la comunicación con la API del backend de forma transparente para el usuario.

*   **Peticiones Asíncronas:** Utilizamos **Axios** para enviar y recibir datos de la API. Esto asegura que la interfaz de usuario nunca se bloquee mientras se espera una respuesta del servidor.
*   **Manejo de Errores:** El sistema está diseñado para mostrar mensajes de error claros y comprensibles al usuario si la comunicación con el servidor falla o si una operación no puede completarse (por ejemplo, si se intenta crear una tarea sin un título).

## 4. Estructura de la Interfaz (Vistas Principales)

La aplicación se organiza en vistas principales, accesibles a través de la navegación:

| Vista (Página) | Propósito Principal |
| :--- | :--- |
| **Inicio/Dashboard** | Presentación general del estado de las tareas, posiblemente con resúmenes o estadísticas. |
| **Lista de Tareas** | La vista central donde se gestionan todas las tareas pendientes y completadas. |
| **Autenticación** | Vistas para el inicio de sesión (`Login`) y el registro de nuevos usuarios (`Register`), asegurando que solo los usuarios autorizados puedan acceder a sus tareas. |

En resumen, este frontend no es solo una interfaz, sino una experiencia de usuario cuidadosamente diseñada para hacer que la gestión de tareas sea lo más sencilla y agradable posible.
