# Walkthrough: MiAlqui (Alquileres y Ventas en Coronel Oviedo)

Hemos completado la evolución de **MiAlqui**, dividiendo la plataforma en dos secciones principales: **Alquileres** y **Ventas**, manteniendo el mapa interactivo, la categorización de favoritos, el panel de administración CRUD y los botones de contacto directo por WhatsApp en ambas secciones de manera fluida y responsiva.

---

## Concepto Visual y Estilo

A continuación se muestra el concepto visual desarrollado para las propiedades premium en la zona rural y urbana de Coronel Oviedo:

![MiAlqui Premium Concept](C:/Users/a-l-d/.gemini/antigravity/brain/269efd80-aa3d-44ee-a48f-67d203c113e0/mialqui_banner_1780371560615.png)

---

## Archivos Actualizados del Proyecto

Todos los archivos han sido modificados en la carpeta local: [mialqui](file:///C:/Users/a-l-d/.gemini/antigravity/scratch/mialqui/)

1. [index.html](file:///C:/Users/a-l-d/.gemini/antigravity/scratch/mialqui/index.html): Añadido selector segmentado de tipo de publicación (`Alquileres` / `Ventas`) en la cabecera y el campo de selección correspondiente en el formulario de creación/edición del panel de administrador.
2. [style.css](file:///C:/Users/a-l-d/.gemini/antigravity/scratch/mialqui/style.css): Diseñado el componente segmentado de selección de tipo (`.type-switcher`) con transiciones fluidas y adaptabilidad responsiva para visualización en teléfonos móviles.
3. [app.js](file:///C:/Users/a-l-d/.gemini/antigravity/scratch/mialqui/app.js):
   - Definición del estado de sección global `currentType`.
   - Lógica de redibujado instantáneo de listado y pines en el mapa Leaflet según el tipo seleccionado.
   - Reconfiguración dinámica de los rangos del slider del buscador (hasta `5.000.000 Gs.` para alquileres y hasta `2.000.000.000 Gs.` para ventas).
   - Control dinámico de sufijos de precios (`/ mes` en alquileres, sin sufijo en ventas) y textos dinámicos de los enlaces de WhatsApp ("comprar" o "alquilar").
   - Captura e integración del campo `type` en el flujo CRUD y persistencia en `LocalStorage`.
   - Rutina de migración automática para clasificar publicaciones antiguas sin clasificar como `"alquiler"`.
4. [mockData.js](file:///C:/Users/a-l-d/.gemini/antigravity/scratch/mialqui/mockData.js): Banco de datos inicial con 8 propiedades reales en Coronel Oviedo clasificadas entre alquileres (5) y ventas (3) con precios realistas en Guaraníes.

---

## Detalles de las Nuevas Características

### 1. Selector Segmentado en Cabecera
- Ubicado de forma destacada en la cabecera del portal.
- Al cambiar entre **Alquileres** y **Ventas**, se filtran inmediatamente las propiedades en el catálogo y los pines del mapa, recalculándose los límites y valores del slider de búsqueda automáticamente.

### 2. Filtro de Precios Inteligente
- **Alquileres**: El rango de precios del buscador se sitúa de `0 Gs.` a `5.000.000 Gs.`, con saltos (steps) de `100.000 Gs.`.
- **Ventas**: El rango de precios del buscador se sitúa de `0 Gs.` a `2.000.000.000 Gs.`, con saltos (steps) de `50.000.000 Gs.`.
- Los textos del slider ("Cualquiera" o el valor actual) se formatean dinámicamente.

### 3. Sufijos y Etiquetas de Precios
- En las tarjetas del catálogo, popups de Leaflet, panel de administración y modal de detalles:
  - Si la propiedad es un **Alquiler**, el precio se muestra con el formato `X.XXX.XXX Gs. / mes`.
  - Si la propiedad es una **Venta**, el precio se muestra como precio final `X.XXX.XXX Gs.` (sin sufijo de temporalidad).

### 4. Mensajes de WhatsApp y Botones Dinámicos
- Al hacer clic en contactar, el botón muestra dinámicamente `Contactar para Alquilar` o `Contactar para Comprar`.
- El mensaje enviado al WhatsApp del propietario se adapta automáticamente:
  - *Alquiler*: "Hola! Estoy interesado/a en **alquilar** la propiedad..."
  - *Venta*: "Hola! Estoy interesado/a en **comprar** la propiedad..."

### 5. Soporte Administrativo Completo
- El panel de administración CRUD incluye la columna "Tipo de Publicación" (Alquiler o Venta) mediante un select de formulario y muestra badges distintivos de colores en la tabla de gestión de publicaciones.

---

## Cómo Ejecutar y Probar la Aplicación

1. **Abrir localmente**:
   Abre el archivo [index.html](file:///C:/Users/a-l-d/.gemini/antigravity/scratch/mialqui/index.html) directamente en tu navegador. Al ser una aplicación pura del lado del cliente, no requiere servidores de back-end.
2. **Probar el Switcher de Tipo**:
   - Cambia entre la pestaña "Alquileres" y "Ventas". Observa cómo se actualizan las propiedades mostradas y cómo el slider de búsqueda se adapta a los nuevos límites.
3. **Probar el Panel**:
   - Haz clic en el menú del usuario (arriba a la derecha) o en la pestaña **"Panel de Administrador"** en el móvil.
   - Credenciales: `admin@mialqui.com` / `oviedo2026`.
   - Al crear una nueva propiedad, puedes elegir si es para "Alquiler" o "Venta". Guarda los cambios y valida que se muestre en la pestaña correspondiente del portal principal.
