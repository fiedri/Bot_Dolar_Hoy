# Bot Monitor_BCV

Este repositorio contiene un bot de Telegram para consultar la tasa oficial del dólar publicada por el Banco Central de Venezuela (BCV) y realizar conversiones entre USD y Bs. También envía un reporte diario automático.

**Características principales**
- Consulta en tiempo real de la tasa oficial del BCV.
- Conversión bidireccional: USD → BS y BS → USD.
- Interfaz de teclado en Telegram para interacción sencilla.
- Envío automático diario de la tasa.

**Archivos importantes**
- `src/getInfo.js`: lógica para obtener la tasa del BCV (web scraping con `axios` + `cheerio`) y funciones de conversión.
- `src/index.js`: bot de Telegram (manejo de comandos, teclado, conversiones y tarea programada).
- `src/users.js`: Esquema y conexión a MongoDB para la gestión de usuarios.
- `src/utils.js`: Servicios para la interacción con la base de datos de usuarios.
- `package.json`: dependencias y metadatos del proyecto.

Requisitos
- Node.js (versión moderna recomendada, p. ej. Node 18+).
- pnpm o npm para instalar dependencias.
- Una base de datos MongoDB.

Instalación
1. Clona el repositorio.
2. Instala dependencias:

```bash
pnpm install
# o
npm install
```

Configuración
- Crea un archivo `.env` en la raíz con las variables obligatorias:

```
BOT_TOKEN=tu_token_de_telegram
MONGODB_URI=tu_uri_de_conexion_a_mongodb
```


Ejecución

```bash
node src/index.js
```


Detalles técnicos
- La tasa se obtiene mediante scraping de la página del BCV con `axios` y `cheerio` en `src/getInfo.js`. Se ha mejorado la validación para asegurar que el valor obtenido sea numérico.
- Los montos ingresados aceptan comas o puntos como separador decimal (`replace(',', '.')`).
- La tarea programada para el reporte diario está configurada con la expresión cron `'0 12 * * *'` (se ejecuta diariamente a las 12:00 PM, hora del servidor). Si el servidor está adelantado 4 horas respecto a la hora local, esto resultará en un envío a las 8 AM hora local.
- La conexión a la base de datos MongoDB ahora se gestiona de forma encapsulada, asegurando que el bot solo inicie una vez que la conexión a la DB sea exitosa.
- Las operaciones de usuario en la base de datos (verificación y adición) se han optimizado en una única operación atómica `findOrCreateUser` para mayor eficiencia.
- Se han añadido bloques `try...catch` en el manejador de mensajes principal para mejorar la robustez del bot y prevenir caídas inesperadas.

Precauciones
- **Advertencia de Seguridad (SSL/TLS):** Para que el bot pueda obtener la tasa del BCV, se ha deshabilitado la verificación del certificado SSL (`rejectUnauthorized: false`). Esto se debe a que el sitio del BCV a menudo presenta una cadena de certificados incompleta, lo que causa errores de validación en Node.js. **Esta configuración expone al bot a posibles ataques de intermediario (Man-in-the-Middle).** Una solución más segura implicaría configurar correctamente las autoridades de certificación de confianza o gestionar los certificados intermedios faltantes.
- Al basarse en scraping, si la estructura del sitio del BCV cambia drásticamente, la extracción puede fallar. El bot ahora lanza un error explícito si no puede obtener un valor numérico.
- Asegúrate de no exponer tu `BOT_TOKEN` y `MONGODB_URI` públicamente.

Contribuciones y mejoras sugeridas
- Leer el chat id del reporte desde una variable de entorno.
- Agregar validaciones o límites en montos.
- Añadir tests y manejo avanzado de errores y reintentos.

Autor
- Desarrollado por Fiedri.

Licencia
- Ver `package.json` para la licencia (ISC).
