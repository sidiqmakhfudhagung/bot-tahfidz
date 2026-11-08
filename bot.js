const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const chromium = require('@sparticuz/chromium');
const express = require('express');

// --- SERVER BOHONGAN UNTUK MENGAKALI RENDER ---
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot WhatsApp Tahfidz Sedang Berjalan 24 Jam!');
});

app.listen(port, () => {
    console.log(`Web server bohongan menyala di port ${port} agar Render aman`);
});
// ----------------------------------------------

async function startBot() {
    console.log('Menyiapkan browser untuk server cloud...');
    
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
                    '--single-process'
                ]
            }
        });

        client.on('qr', (qr) => {
            console.log('SCAN QR CODE INI DI WHATSAPP ANDA:');
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