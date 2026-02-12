# Auditoría de MyMoneyApp
## Resumen general

El proyecto mymoneyapp es una PWA de control de gastos construida con Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 y un diseño propio de liquid glass. La aplicación incluye una barra de navegación flotante, formularios para registrar transacciones, vistas de análisis (gráficas y anomalías), pantalla de perfil con configuraciones (tema, notificaciones, Face ID) y un flujo de desbloqueo con PIN/biometría. Tras revisar el código y la estructura del repositorio se identificaron problemas de usabilidad, accesibilidad y coherencia visual. A continuación se detallan los hallazgos y propuestas de mejora.

## Problemas principales y causas

### 1. Interacciones poco fiables y controles pequeños
- **Múltiples taps para activar botones**: El contenedor de la barra de navegación móvil tiene `pointer-events: none` y sólo los elementos hijos reactivan los eventos. Esto hace que algunos toques se pierdan.
- **Tamaños de toque insuficientes**: Muchos botones e iconos tienen dimensiones menores a los 44 px recomendados para iOS.
- **Dificultad al desplazarse**: El botón “Ver mi reporte” dirige a un ancla interna lejana. El scroll horizontal de las tarjetas de cuentas se esconde por la barra.

### 2. Inconsistencia de tema claro/oscuro
- Uso de colores hardcodeados (como `text-slate-400`) en lugar de tokens semánticos.
- Fondos opacos que no se adaptan bien al tema claro.

### 3. Configuración de seguridad insuficiente
- **Face ID no configurable al inicio**: Se lanza automáticamente si está habilitado; no hay configuración inicial guiada.
- **Ausencia de PIN aparte del Face ID**: No hay opción de cambiar PIN o exigir biometría/PIN cada vez que se abre la app.

### 4. Modal de nueva transacción poco accesible
- **Jerarquía visual confusa**: El input de monto carece de foco visual fuerte.
- **Segmented control para Gasto/Ingreso**: Implementación no accesible (sin labels adecuados).
- **Selección de método de pago**: Carrusel horizontal apretado con hit areas pequeñas.
- **Navegación con teclado**: No trapea el foco ni devuelve el foco original.

### 5. Diseño del navigation bar
- Bajo contraste en modo claro (`text-slate-400`).
- El FAB azul central no armoniza con el resto de la barra.
- No respeta `env(safe-area-inset-bottom)`.

### 6. Pantalla de perfil y ajustes
- Tema oscuro no persistente en algunos componentes.
- Face ID solo activa/desactiva registro, sin configurar el flujo de seguridad.

### 7. Sección de análisis y reportes
- Gráficas no responsivas en móviles.
- Falta un resumen global dinámico (“Mi reporte”).

## Recomendaciones y propuestas de mejora

### 1. Simplificar interacción y accesibilidad
- Eliminar `pointer-events: none` en wrappers.
- Ampliar hit targets a ≥ 44 px.
- Optimizar scroll con `scrollIntoView` suavizado o páginas dedicadas.
- Soporte ARIA completo para modales y controles.

### 2. Tema coherente y persistente
- Definir tokens semánticos en `globals.css` (`--color-text-primary`, etc.).
- Script de bloqueo de flash de tema en `layout.tsx`.

### 3. Seguridad: Face ID y PIN
- Onboarding de configuración de Face ID/PIN.
- PIN secundario y modo privado (blur al cambiar app).

### 4. Rediseño del formulario de nueva transacción
- Input de monto tipo "hero".
- Segmented control accesible (`role="tablist"`).
- Selector de pago vertical en 2 columnas (grid).
- Sticky footer para botones de acción.

### 5. Navegación móvil estilo iOS 26
- Barra más ancha (~70 px), iconos sobre etiquetas.
- FAB integrado orgánicamente.
- Respetar safe areas.

### 6. Mejora de la sección “Mi reporte” y análisis
- Nueva página `/reporte` con resumen global.
- Gráficas responsivas (Recharts o Chart.js optimizado).
- Timeline de anomalías con badges de severidad.
