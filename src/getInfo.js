import axios from "axios";
import * as cheerio from "cheerio";
import https from "https";

class Info{
    async getDollarPrice(){
        try {
        const { data } = await axios.get('https://www.bcv.org.ve/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
            },
            httpsAgent: new https.Agent({  
                rejectUnauthorized: false // WARNING: This disables SSL certificate verification.
                                          // It's used here because the BCV website's certificate chain
                                          // is often incomplete, causing 'unable to verify the first certificate' errors.
                                          // This exposes the bot to potential Man-in-the-Middle attacks.
                                          // A more secure solution would be to properly configure trusted CAs
                                          // or obtain the missing intermediate certificates.
            })
        });

        const dolar = cheerio.load(data);

        let tasa = dolar('#dolar strong').text().trim();

        tasa = tasa.replace(',', '.');

        const parsedTasa = parseFloat(tasa);

        if (isNaN(parsedTasa)) {
            throw new Error("No se pudo obtener un valor numérico para la tasa del BCV. El sitio puede haber cambiado.");
        }

        return parsedTasa.toFixed(2);
    } catch (error) {
        console.error("Error al obtener la tasa del BCV:", error.message);
        return null;
    }
    }
    async calculateConversion(amount) {
        if (isNaN(amount) || amount <= 0) {
            throw new Error("El monto debe ser un número válido mayor que cero.");
        }
        const tasa = await this.getDollarPrice();
        return (amount * tasa).toFixed(2);
    }
    async calculateReverseConversion(amount) {
        if (isNaN(amount) || amount <= 0) {
            throw new Error("El monto debe ser un número válido mayor que cero.");
        }
        const tasa = await this.getDollarPrice();
        return (amount / tasa).toFixed(2);
    }
}

const info = new Info();
export default info;