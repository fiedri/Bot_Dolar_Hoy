# Bot Dólar Hoy

Este repositorio contiene un bot de Telegram para consultar la tasa oficial del dólar publicada por el Banco Central de Venezuela (BCV) y realizar conversiones entre USD y Bs. También envía un reporte diario automático.

**Características principales**
- Consulta en tiempo real de la tasa oficial del BCV.
- Conversión bidireccional: USD → BS y BS → USD.
- Interfaz de teclado en Telegram para interacción sencilla.
- Envío automático diario de la tasa a un chat específico (tarea programada con `node-cron`).

**Archivos importantes**
- `src/getInfo.js`: lógica para obtener la tasa del BCV (web scraping con `axios` + `cheerio`) y funciones de conversión.
- `src/index.js`: bot de Telegram (manejo de comandos, teclado, conversiones y tarea programada).
- `package.json`: dependencias y metadatos del proyecto.

Requisitos
- Node.js (versión moderna recomendada, p. ej. Node 18+).
- pnpm o npm para instalar dependencias.

Instalación
1. Clona el repositorio.
2. Instala dependencias:

```bash
pnpm install
# o
npm install
```

Configuración
- Crea un archivo `.env` en la raíz con la variable obligatoria:

```
BOT_TOKEN=tu_token_de_telegram
```

- Nota: la tarea programada envía el reporte diario al chat id definido en `src/index.js` (actualmente está en el código como `'1954310113'`). Si quieres que el reporte llegue a otro chat, cambia ese ID o adapta el código para leerlo desde una variable de entorno.

Ejecución

```bash
node src/index.js
```

Uso en Telegram
- `/start`: muestra el teclado principal y las opciones.
- `/help`: despliega el manual con comandos y flujo de uso.
- Botones del teclado:
  - `📊 VER TASA BCV`: obtiene la tasa oficial y la muestra.
  - `💵 (USD -> BS)`: inicia flujo para convertir USD a Bs. El bot pedirá un monto y devolverá el resultado.
  - `🇻🇪 (BS -> USD)`: inicia flujo para convertir Bs a USD.
- Dentro de los flujos de conversión, se puede cancelar la operación con el botón `Cancelar`.

Detalles técnicos
- La tasa se obtiene mediante scraping de la página del BCV con `axios` y `cheerio` en `src/getInfo.js`.
- Los montos ingresados aceptan comas o puntos como separador decimal (`replace(',', '.')`).
- La tarea programada está configurada con la expresión cron `'0 8 * * *'` (se ejecuta diariamente a las 08:00, según la hora del servidor).

Precauciones
- Al basarse en scraping, si la estructura del sitio del BCV cambia, la extracción puede fallar. El bot maneja errores devolviendo `null` y registrando mensajes en consola.
- Asegúrate de no exponer tu `BOT_TOKEN` públicamente.

Contribuciones y mejoras sugeridas
- Leer el chat id del reporte desde una variable de entorno.
- Agregar validaciones o límites en montos.
- Añadir tests y manejo avanzado de errores y reintentos.

Autor
- Desarrollado por Fiedri.

Licencia
- Ver `package.json` para la licencia (ISC).
