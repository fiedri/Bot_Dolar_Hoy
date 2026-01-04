import "dotenv/config";
import TelegramBot from "node-telegram-bot-api";
import info from "./getInfo.js";
import cron from "node-cron";



const botToken = process.env.BOT_TOKEN;
const userState = {};
let options = {
  "💵 (USD -> BS)": {
    reply: "Ingrese monto en USD:"
  },
  "🇻🇪 (BS -> USD)": {
    reply: "Ingrese monto en BS:"
  }
};
let bot;
try {
  if (!botToken) {
    throw new Error("BOT_TOKEN is not defined in environment variables");
  }
  bot = new TelegramBot(botToken, { polling: true });

  console.log("Bot encendido y esperando mensajes...");
} catch (e) {
  console.error("Error initializing Telegram Bot:", e.message);
}

cron.schedule('0 8 * * *', async () => {
  try {
    const tasa = await info.getDollarPrice();
    const michatid = '1954310113'
    bot.sendMessage(michatid, `📊 <b>REPORTE DIARIO AUTOMÁTICO</b>\nTasa BCV: <code>${tasa}</code> Bs.`, { parse_mode: 'HTML' });
  } catch (error) {
    console.error("Error en la tarea programada:", error.message);
  }
});

bot.onText(/\/start/, (msg) => {
  const opts = {
    parse_mode: 'HTML',
    reply_markup: {
      keyboard: [
        [{ text: "📊 VER TASA BCV" }],
        [{ text: "💵 (USD -> BS)" }, { text: "🇻🇪 (BS -> USD)" }],
        [{ text: "ℹ️ /help" }]
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    },
  };
  bot.sendMessage(
    msg.chat.id,
    `
<b>SISTEMA DE CONSULTA CAMBIARIA</b>
<b>Funciones:</b>
• Consulta directa: BCV.
• Conversión bidireccional: (USD/BS).
• Interfaz: Teclado optimizado.

<i>Seleccione una operación para comenzar.</i>

Desarrollado por <a href="https://t.me/fiedri">Fiedri</a>.`, opts
  );
});

// comando help
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

<b>FLUJO DE TRABAJO:</b>
Seleccione un método de cálculo ➔ Ingrese el valor numérico ➔ Reciba el resultado.

<i>El sistema rechaza cualquier entrada no numérica durante los procesos de cálculo.</i>
  `, { parse_mode: 'HTML' }
  );
});


bot.on('message', async (msg) => {

  if (userState[msg.chat.id] && userState[msg.chat.id].state === 'awaiting_amount') {
    const amount = parseFloat(msg.text.replace(',', '.'));

    if (isNaN(amount)) {
      return bot.sendMessage(msg.chat.id, "Envie un número válido.");
    }

    try {
      let conversion;

      if (userState[msg.chat.id].method === "💵 (USD -> BS)") {
        conversion = await info.calculateConversion(amount);
      } else {
        conversion = await info.calculateReverseConversion(amount);
      }

      bot.sendMessage(msg.chat.id, `El resultado de la conversión es: <code>${conversion}</code> ${userState[msg.chat.id].method === "💵 (USD -> BS)" ? "Bs" : "USD"}`, { parse_mode: 'HTML' });
    } catch (e) {
      bot.sendMessage(msg.chat.id, `Error: ${e.message}`);
    }

    delete userState[msg.chat.id];
    return;
  }

  if (msg.text === "📊 VER TASA BCV") {
    bot.sendMessage(msg.chat.id, "Obteniendo la tasa del BCV...");
    bot.sendChatAction(msg.chat.id, 'typing');
    const tasa = await info.getDollarPrice();
    await bot.deleteMessage(msg.chat.id, msg.message_id + 1);
    bot.sendMessage(msg.chat.id, `La tasa oficial del BCV es: <code>${tasa}</code> Bs`, { parse_mode: 'HTML' });
    console.log(msg.chat.id);
    return;
  }

  if (msg.text === "💵 (USD -> BS)" || msg.text === "🇻🇪 (BS -> USD)") {
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

