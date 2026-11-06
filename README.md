# Poquito

Prototipo visual navegable de Habit Tracker. HTML, CSS y JavaScript sin dependencias de compilación. Esta versión es una vista previa web; no incluye aún el proyecto nativo Android.

## Ejecutar localmente

Requiere Node.js 20 o superior. No necesita instalar dependencias.

```sh
npm start
```

Abrir http://127.0.0.1:4173. También se puede ejecutar `node server.cjs`.

## Comprobar sintaxis

```sh
npm run check
```

## Alcance del prototipo

Vistas: Hoy, Calendario, Progreso, Metas y Ajustes. Incluye registro de hábitos, contadores, creación de hábitos, navegación por fecha, filtros, tema oscuro y colores de acento. Estado en memoria; recargar restablece la demo. Las estadísticas, el historial y las metas usan datos ilustrativos. Los recordatorios son una simulación dentro de la interfaz. No hay almacenamiento ni notificaciones del sistema.

El diseño utiliza una ilustración SVG propia y fuentes de Google Fonts con fuentes locales de respaldo.

## Archivos principales

- `dist/index.html`: estructura inicial y formulario para crear hábitos.
- `dist/style.css`: diseño adaptable, colores pastel y modo oscuro.
- `dist/app.js`: vistas, navegación y estado temporal de la demo.
- `server.cjs`: servidor HTTP local.

La carpeta `dist/` contiene los archivos fuente de este prototipo sin compilación y se incluye intencionalmente en Git.

## Próximos pasos previstos

Trasladar el diseño a React Native + Expo, incorporar almacenamiento SQLite, recordatorios del dispositivo y respaldo JSON/CSV. La sincronización y la aplicación Android aún no están implementadas.
