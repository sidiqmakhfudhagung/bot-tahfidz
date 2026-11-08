const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ],
    }
});

client.on('qr', (qr) => {
    console.log('SCAN QR CODE INI DI WHATSAPP ANDA:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Alhamdulillah, Bot WhatsApp Tahfidz Berhasil Terhubung dan Siap 24 Jam!');
});

const kirimPesanOtomatis = async (nomorTujuan, pesan) => {
    try {
        await client.sendMessage(nomorTujuan, pesan);
        console.log('Pesan Berhasil Terkirim!');
    } catch (error) {
        console.error('Gagal mengirim pesan:', error);
    }
};

client.initialize();