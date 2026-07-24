# Plan de Implementación: MiAlqui (Alquileres y Ventas)

Este plan describe los cambios necesarios para dividir la plataforma **MiAlqui** en dos secciones principales: **Alquileres** y **Ventas**, manteniendo el mapa interactivo, filtros, detalles de contacto por WhatsApp y panel de administración en ambas.

---

## Decisiones de Diseño y Arquitectura

1. **Selector Global en Cabecera**:
   - Añadiremos un control segmentado tipo "pill" en la barra de navegación para alternar entre **Alquileres** y **Ventas**.
   - Al cambiar de sección, se filtrará instantáneamente la lista de propiedades y los pines en el mapa según el tipo seleccionado.
2. **Esquema de Datos de Propiedades**:
   - Cada propiedad tendrá un campo `type` (cuyos valores serán `"alquiler"` o `"venta"`).
   - Actualizaremos los alquileres existentes en `mockData.js` y asignaremos algunas propiedades a la sección de "Venta" con precios realistas del mercado inmobiliario de Coronel Oviedo.
3. **Control Dinámico del Filtro de Precios**:
   - **Alquileres**: El rango de precios filtrará de `0 Gs.` a `5.000.000 Gs.`.
   - **Ventas**: El rango de precios filtrará de `0 Gs.` a `2.000.000.000 Gs.` (2.000 millones Gs.).
   - Al cambiar entre Alquiler y Venta, el control deslizante de precios (slider) en la cabecera reconfigurará su valor mínimo, máximo y paso automáticamente.
4. **Sufijos de Precio y Mensajes de WhatsApp**:
   - En la sección de **Alquileres**, los precios mostrarán el sufijo `/ mes` y el mensaje de WhatsApp dirá *"estoy interesado/a en alquilar..."*.
   - En la sección de **Ventas**, los precios se mostrarán como precio final (sin sufijo) y el mensaje de WhatsApp dirá *"estoy interesado/a en comprar..."*.
5. **Panel de Administración adaptado**:
   - Se añadirá el campo **"Tipo de Publicación"** (Alquiler / Venta) en el formulario de creación/edición.
   - La tabla de control del administrador reflejará el tipo de propiedad para facilitar la gestión.

---

## Preguntas Abiertas

> [!NOTE]
> 1. **Rangos de Precios**: He propuesto un máximo de `5.000.000 Gs.` para alquileres y `2.000.000.000 Gs.` para ventas. ¿Te parecen correctos estos límites para el buscador de Coronel Oviedo?
> 2. **Ubicación del Selector**: Proponemos ubicarlo en el centro de la cabecera (Header), lo que se ve muy moderno. ¿Estás de acuerdo?

---

## Cambios Propuestos

### [MODIFY] [index.html](file:///C:/Users/a-l-d/.gemini/antigravity/scratch/mialqui/index.html)
- Añadir el contenedor `<div class="type-switcher" id="type-switcher">` en el header.
- Añadir el campo de selección del tipo de propiedad (Alquiler / Venta) en el formulario de creación del panel de administración.
- Adaptar las etiquetas del slider de precios en la búsqueda.

### [MODIFY] [style.css](file:///C:/Users/a-l-d/.gemini/antigravity/scratch/mialqui/style.css)
- Añadir estilos premium para el componente `.type-switcher` y sus estados activos.
- Asegurar responsividad del nuevo selector en cabeceras móviles.

### [MODIFY] [app.js](file:///C:/Users/a-l-d/.gemini/antigravity/scratch/mialqui/app.js)
- Definir la variable de estado global `let currentType = "alquiler";`.
- Actualizar los filtros en `renderProperties()` para que apliquen `prop.type === currentType`.
- Añadir lógica para cambiar los valores mínimo, máximo y paso del slider de precios al alternar el tipo.
- Adaptar la generación del mensaje de WhatsApp y los sufijos de precios (`/ mes` para alquileres, sin sufijo para ventas).
- Modificar el guardado y edición de propiedades en el panel de administrador para capturar y rellenar el campo `type`.
- Añadir la clave `type` en la migración de base de datos local para que los alquileres ya guardados se clasifiquen como `"alquiler"` por defecto.

### [MODIFY] [mockData.js](file:///C:/Users/a-l-d/.gemini/antigravity/scratch/mialqui/mockData.js)
- Añadir la propiedad `type: "alquiler"` o `type: "venta"` a las 5 propiedades iniciales.
- Ajustar precios de las propiedades marcadas como venta (ej: `350.000.000 Gs.` y `750.000.000 Gs.`).

---

## Plan de Verificación

### Pruebas Manuales
1. **Alternar Tipo**: Presionar "Alquileres" y "Ventas" en la cabecera. Verificar que el catálogo y el mapa se filtren al instante.
2. **Filtro de Precios**: Validar que el slider de precios llegue hasta 5 millones en alquileres, y hasta 2.000 millones en ventas.
3. **Flujo de Admin**: Crear una propiedad de tipo "Venta", verificar que aparezca solo en la pestaña de Ventas y que no lleve la etiqueta `/ mes`.
4. **Mensaje de WhatsApp**: Probar el botón de contacto en una venta y verificar que el mensaje se adapte a *"estoy interesado/a en comprar..."*.
