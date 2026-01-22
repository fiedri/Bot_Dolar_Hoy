import axios from "axios";
import * as cheerio from "cheerio";
import https from "https";

class Info {
    async fetchPage() {
        try {
            const { data } = await axios.get('https://www.bcv.org.ve/', {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
                },
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false
                })
            });
            return cheerio.load(data);
        } catch (error) {
            console.error("Error al descargar la página del BCV:", error.message);
            throw error;
        }
    }

    async getDollarPrice() {
        try {
            const $ = await this.fetchPage();
            let tasa = $('#dolar strong').text().trim();

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

    async getEuroPrice() {
        try {
            const $ = await this.fetchPage();
            let tasa = $('#euro strong').text().trim();
            tasa = tasa.replace(',', '.');

            const parsedTasa = parseFloat(tasa);
            if (isNaN(parsedTasa)) {
                throw new Error("No se pudo obtener un valor numérico para la tasa del BCV. El sitio puede haber cambiado.");
            }

            return parsedTasa.toFixed(2);
        } catch (error) {
            console.error("Error al obtener la tasa del Euro:", error.message);
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
    async calculateEuroConversion(amount) {
        if (isNaN(amount) || amount <= 0) {
            throw new Error("El monto debe ser un número válido mayor que cero.");
           
        }
        const tasa = await this.getEuroPrice();
        return (amount * tasa).toFixed(2);
    }
    async calculateEuroReverseConversion(amount) {
        if (isNaN(amount) || amount <= 0) {
            throw new Error("El monto debe ser un número válido mayor que cero.");
        }
        const tasa = await this.getEuroPrice();
        return (amount / tasa).toFixed(2);
    }
}

const info = new Info();
export default info;
