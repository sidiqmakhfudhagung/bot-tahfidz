const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const chromium = require('@sparticuz/chromium');
const express = require('express');

// Server bohongan agar Render aman
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot Aktif!'));
app.listen(port, () => console.log(`Web server nyala di port ${port}`));

async function startBot() {
    console.log('Menyiapkan browser mode super ringan untuk server gratis...');
    
    try {
        const client = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
                args: [
                    ...chromium.args,
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-extensions'
                    // Argumen --single-process DIHAPUS karena memicu crash memori di Render
                ]
            }
        });

        client.on('qr', (qr) => {
            console.log('\n=========================================');
            console.log('SCAN QR CODE INI DI WHATSAPP ANDA:');
            console.log('=========================================\n');
            qrcode.generate(qr, { small: true });
        });

        client.on('ready', () => {
            console.log('Alhamdulillah, Bot WhatsApp Tahfidz Berhasil Terhubung dan Siap 24 Jam!');
        });

        client.initialize();
    } catch (error) {
        console.error('Error saat menyalakan bot:', error);
    }
}

startBot();