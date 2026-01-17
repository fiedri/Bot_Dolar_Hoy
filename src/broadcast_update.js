import "dotenv/config";
import TelegramBot from "node-telegram-bot-api";
import userService from "./utils.js";
import { connectDB } from "./users.js";

const botToken = process.env.BOT_TOKEN;

// Definimos el nuevo teclado (copiado de index.js)
const newKeyboard = {
  keyboard: [
    [{ text: "📊 VER TASAS DEL BCV" }],
    [{ text: "💵 (USD -> BS)" }, { text: "🇻🇪 (BS -> USD)" }],
    [{ text: "💶 (BS -> EUR)"}, {text: "(BS -> EUR)"}], // Las nuevas opciones
    [{ text: "ℹ️ /help" }]
  ],
  resize_keyboard: true,
  one_time_keyboard: false,
};

const broadcastUpdate = async () => {
  try {
    console.log("Iniciando conexión a BD...");
    await connectDB();

    if (!botToken) {
      throw new Error("BOT_TOKEN no está definido.");
    }

    const bot = new TelegramBot(botToken, { polling: false }); // Polling false porque solo vamos a enviar
    const users = await userService.getAllUsers();

    console.log(`Comenzando difusión a ${users.length} usuarios...`);

    let successCount = 0;
    let failCount = 0;

    for (const user of users) {
      try {
        await bot.sendMessage(
          user.chatId,
          `<b>📢 ACTUALIZACIÓN DISPONIBLE</b>\n\nHemos mejorado nuestras capacidades. Ahora puedes realizar conversiones con <b>Euros (€)</b>.\n\n✅ <b>Nuevas funciones:</b>\n• Calculadora Euro ➔ Bs\n• Calculadora Bs ➔ Euro\n\n<i>Tu teclado se ha actualizado automáticamente con las nuevas opciones. 👇</i>`,
          {
            parse_mode: 'HTML',
            reply_markup: newKeyboard // Esto fuerza la actualización del teclado
          }
        );
        successCount++;
        await new Promise(resolve => setTimeout(resolve, 50)); 
      } catch (error) {
        failCount++;
        if (error.response && error.response.statusCode === 403) {
          console.log(`Usuario bloqueado/inactivo: ${user.chatId}. Eliminando...`);
          await userService.deleteuser(user.chatId);
        } else {
          console.error(`Error enviando a ${user.chatId}:`, error.message);
        }
      }
    }

    console.log(`\n--- REPORTE FINAL ---`);
    console.log(`✅ Enviados con éxito: ${successCount}`);
    console.log(`❌ Fallidos: ${failCount}`);
    console.log(`---------------------`);

    process.exit(0);

  } catch (e) {
    console.error("Error fatal en el script:", e);
    process.exit(1);
  }
};

broadcastUpdate();
