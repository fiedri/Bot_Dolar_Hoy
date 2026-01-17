import "dotenv/config";
import TelegramBot from "node-telegram-bot-api";
import info from "./getInfo.js";
import cron from "node-cron";
import userService from "./utils.js";
import { connectDB } from "./users.js";


const botToken = process.env.BOT_TOKEN;
const userState = {};
let options = {
  "💵 (USD -> BS)": {
    reply: "Ingrese monto en USD:"
  },
  "🇻🇪 (BS -> USD)": {
    reply: "Ingrese monto en BS:"
  },
  "💶 (EUR -> BS)":{
    reply: "Ingrese monto en EUR:"
  },
  "(BS -> EUR)":{
    reply: "Ingrese monto en BS:"
  }
};
let bot;

const startBot = async () => {
  try {
    await connectDB();

    if (!botToken) {
      throw new Error("BOT_TOKEN is not defined in environment variables");
    }
    bot = new TelegramBot(botToken, { polling: true });

    console.log("Bot encendido y esperando mensajes...");
  } catch (e) {
    console.error("Error initializing Telegram Bot:", e.message);
    process.exit(1);
  }

 
  cron.schedule('0 12 * * *', async () => {
      const tasa = await info.getDollarPrice();
      const tasaEuro = await info.getEuroPrice();
      const users = await userService.getAllUsers();
  
      for (const user of users) {
          try {
              await bot.sendMessage(user.chatId, `📊 <b>REPORTE DIARIO</b>\nDolar: <code>${tasa}</code> Bs.\nEuro: <code>${tasaEuro}</code> Bs.`, { parse_mode: 'HTML' });
          } catch (error) {
             
              if (error.response && error.response.statusCode === 403) {
                  console.log(`[CLEANUP] Eliminando usuario ${user.chatId} por bloqueo/eliminación.`);
                  await userService.deleteuser(user.chatId);
              } else {
                  console.error(`Error enviando a ${user.chatId}:`, error.message);
              }
          }
      }
  });
  
  bot.onText(/\/start/, (msg) => {
    const opts = {
      parse_mode: 'HTML',
      reply_markup: {
        keyboard: [
          [{ text: "📊 VER TASAS DEL BCV" }],
          [{ text: "💵 (USD -> BS)" }, { text: "🇻🇪 (BS -> USD)" }],
          [{ text: "💶 (EUR -> BS)"}, {text: "(BS -> EUR)"}],
          [{ text: "ℹ️ /help" }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    };
    bot.sendMessage(
      msg.chat.id,
     `<b>📊 SISTEMA DE CONSULTA CAMBIARIA</b>

<b>Capacidades:</b>
• <b>Tasa Oficial:</b> Datos directos del BCV.
• <b>Conversión:</b> Cálculo inmediato (USD/VES y EUR/VES).
• <b>Reporte Diario:</b> Recibe la tasa cada mañana automáticamente.

<i>Seleccione una operación en el menú inferior.</i>

---
<a href="https://t.me/fiedri">Desarrollado por Fiedri</a>`, opts
    );
  });
  
  
  bot.onText(/\/help/, (msg) => {
    bot.sendMessage(
      msg.chat.id, `
<b>MANUAL DE OPERACIONES</b>

<b>COMANDOS</b>
• /start - Inicializa el teclado y reinicia la sesión.
• /help  - Despliega esta documentación técnica.

<b>FUNCIONES:</b>
1. <b>Ver tasa BCV:</b> Obtiene en tiempo real la tasa oficial publicada por el Banco Central de Venezuela.
2. <b>Calculadora USD ➔ BS:</b> Inyecta un monto en dolares para obtener su equivalente en moneda local según tasa actual.
3. <b>Calculadora BS ➔ USD:</b> Procesa montos en bolívares para determinar su valor en dolares.
4. <b>Calculadora EUR ➔ BS:</b> Inyecta un monto en euros para obtener su equivalente en moneda local según tasa actual.
5. <b>Calculadora BS ➔ EUR:</b> Procesa montos en bolívares para determinar su valor en euros.

<b>FLUJO DE TRABAJO:</b>
Seleccione un método de cálculo ➔ Ingrese el valor numérico ➔ Reciba el resultado.

<i>El sistema rechaza cualquier entrada no numérica durante los procesos de cálculo.</i>
  `, { parse_mode: 'HTML' }
    );
  });
  
  
  bot.on('message', async (msg) => {
    try {
    
      await userService.findOrCreateUser(msg.chat.id, msg.chat.username || 'NoUsername');
    
      if (userState[msg.chat.id] && userState[msg.chat.id].state === 'awaiting_amount') {
        const amount = parseFloat(msg.text.replace(',', '.'));
    
        if (isNaN(amount)) {
          return bot.sendMessage(msg.chat.id, "Envie un número válido.");
        }
    
        try {
          let conversion;
          let moneda
          if (userState[msg.chat.id].method === "💵 (USD -> BS)") {
            conversion = await info.calculateConversion(amount);
            moneda = "Bs"
          } else if (userState[msg.chat.id].method === "🇻🇪 (BS -> USD)") {
            conversion = await info.calculateReverseConversion(amount);
            moneda = "USD"
          } else if (userState[msg.chat.id].method === "💶 (EUR -> BS)") {
            conversion = await info.calculateEuroConversion(amount);
            moneda = "Bs"
          } else if (userState[msg.chat.id].method === "(BS -> EUR)") {
            conversion = await info.calculateEuroReverseConversion(amount);
            moneda = "EUR"
          }

          bot.sendMessage(msg.chat.id, `El resultado de la conversión es: <code>${conversion}</code> ${moneda}`, { parse_mode: 'HTML' });
        } catch (e) {
          bot.sendMessage(msg.chat.id, `Error: ${e.message}`);
        }
    
        delete userState[msg.chat.id];
        return;
      }
    
      if (msg.text === "📊 VER TASAS DEL BCV") {
        bot.sendMessage(msg.chat.id, "Obteniendo informacion del BCV...");
        bot.sendChatAction(msg.chat.id, 'typing');
        const tasa = await info.getDollarPrice();
        const tasaEuro = await info.getEuroPrice();
        await bot.deleteMessage(msg.chat.id, msg.message_id + 1);
        bot.sendMessage(msg.chat.id, 
          `<b>Tasas oficiales del BCV</b>
📈 Dólar: <code>${tasa}</code> Bs
📈 Euro: <code>${tasaEuro}</code> Bs`, { parse_mode: 'HTML' });
    
        return;
      }

      if (msg.text === "💵 (USD -> BS)" || msg.text === "🇻🇪 (BS -> USD)" || msg.text === "💶 (EUR -> BS)" || msg.text === "(BS -> EUR)") {
        const opt = {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Cancelar', callback_data: 'cancel' }]
            ]
          }
        }
        userState[msg.chat.id] = { state: 'awaiting_amount', method: msg.text };
        bot.sendMessage(msg.chat.id, options[msg.text].reply, opt);
        return;
      }
    } catch (error) {
      console.error(`Error procesando el mensaje: ${error.message}`);
      bot.sendMessage(msg.chat.id, "Ocurrió un error inesperado. Por favor, intente de nuevo.");
    }
  })
  
  bot.on('callback_query', (callbackQuery) => {
    const msg = callbackQuery.message;
    if (callbackQuery.data === 'cancel') {
  
      delete userState[msg.chat.id];
      bot.answerCallbackQuery(callbackQuery.id, { text: 'Operación cancelada.' });
      bot.sendMessage(msg.chat.id, "Operación cancelada.");
      bot.deleteMessage(msg.chat.id, msg.message_id);
    }
  })
  
  bot.on('polling_error', (error) => {
    console.log(`[Error de conexión]: ${error.code}`);
  });
};

startBot();


