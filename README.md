# Poquito 🌱

Habit Tracker con estética amable: fondo crema, tarjetas pastel, colores personalizables y modo oscuro. La aplicación móvil está en **mobile/**, implementada en React Native + Expo SDK 57, TypeScript y SQLite.

## Empezar en Android

Requisitos: Node.js **22.13 o superior** (recomendado: Node 24 LTS) y Expo Go compatible con SDK 57 en Android, o un emulador Android configurado.

```sh
cd mobile
npm ci
npm start
```

Escanea el QR con Expo Go desde el teléfono, conectado a la misma red que el computador. Con un emulador Android abierto, ejecuta `npm run android`. Desde la raíz, `npm start` también inicia Expo después de instalar las dependencias de `mobile/`.

## Lo que ya funciona

- Navegación nativa con Expo Router: Hoy, Calendario, Progreso, Metas y Ajustes.
- Crear hábitos de completado, cantidad o minutos; elegir icono, color, objetivo diario y días de la semana.
- Marcar/desmarcar y sumar/restar cantidades, con un registro independiente por hábito y fecha local.
- Consultar y corregir días anteriores desde el calendario. No se admiten registros futuros ni anteriores a la creación del hábito.
- Dashboard calculado con registros reales: mes, últimos tres meses naturales y año en curso, gráficos, mapa de actividad y rachas.
- Metas recurrentes semanales o mensuales por días completados o suma de unidades.
- Guardar nombre, tema y color de acento.
- Archivar hábitos sin borrar su historial; la programación termina a partir del día siguiente.
- Almacenamiento SQLite conservado al cerrar/reabrir la aplicación, sin conexión ni cuentas.

La primera apertura crea ocho hábitos sugeridos, **sin registros de ejemplo ni metas inventadas**. Se cargan una sola vez. Los días no programados y anteriores a la creación no cuentan como incumplimientos. Las semanas empiezan el lunes.

Las metas toman el progreso del período actual y se reinician al cambiar de semana/mes, conservando el historial. Las rachas cuentan días programados y mantienen abierto el día actual hasta medianoche. Las fechas se guardan como YYYY-MM-DD según el calendario local del dispositivo, sin conversiones a UTC.

## Validación

```sh
cd mobile
npm run typecheck
npm run lint
npm test
npx expo install --check
npx expo-doctor
npx expo export --platform android --output-dir export-android
```

Desde la raíz, `npm run check` ejecuta TypeScript, lint y pruebas. Las pruebas utilizan SQLite real (node:sqlite), incluyendo cierre/reapertura de un archivo, escrituras concurrentes, validaciones, transacciones, fechas, frecuencias, metas y rachas. El export de Android verifica el bundle Hermes; **no produce una APK**.

## Generar una APK de prueba

La configuración mobile/eas.json incluye un perfil preview para APK. Cuando se haya vinculado el proyecto a una cuenta de Expo:

```sh
cd mobile
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android --profile preview
```

La compilación en la nube requiere tu cuenta y puede solicitar crear una clave de firma. Los identificadores actuales son com.itaustin92.poquito. No se incluyen cuentas, claves de firma ni credenciales en el código.

## Estructura

```text
mobile/
  src/app/       Rutas y navegación de Expo Router
  src/screens/   Pantallas y formularios
  src/ui/        Componentes, tipografía, ilustración y temas
  src/domain/    Modelos, validación, calendario y estadísticas
  src/data/      SQLite, migración inicial y hábitos sugeridos
  src/state/     Estado compartido y operaciones de guardado
  tests/         Pruebas de dominio y persistencia SQLite
  eas.json       Perfiles de compilación Android
```

SQLite usa una conexión serializada, transacciones y consultas parametrizadas. Los registros tienen una clave única (habit_id, date) y conservan el objetivo con el que se registraron. El esquema se controla con PRAGMA user_version; una base de una versión futura se rechaza sin alterarla. Las fuentes y la ilustración están incluidas para funcionar sin internet después de instalarse.

## Prototipo web original

```sh
npm run prototype
```

Abre http://127.0.0.1:4173. El código original está en dist/ y server.cjs. Conserva datos ilustrativos y estado temporal; sus registros no se transfieren a la app móvil. El dashboard web conectado queda para una etapa posterior. Esta versión nativa tiene como objetivo Android; no se ha configurado SQLite para navegador.

## Pendiente

Notificaciones reales, importación/exportación JSON/CSV, edición de hábitos existentes, sincronización y dashboard web conectado. Desinstalar la app o borrar sus datos puede eliminar la base local; todavía no hay un respaldo dentro de la aplicación. En Expo Go los datos pertenecen al entorno de desarrollo, separado de una APK instalada.

La dependencia transitiva decode-uri-component se fija con un override a la versión parcheada 0.5.1 o posterior. No se aplican actualizaciones mayores automáticas que rompan la compatibilidad del SDK.
