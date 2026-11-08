const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const chromium = require('@sparticuz/chromium');

async function startBot() {
    console.log('Menyiapkan browser untuk server cloud...');
    
    const client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
            args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox']
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
}

startBot();