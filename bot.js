const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

// Inisialisasi Client WhatsApp dengan konfigurasi aman untuk Cloud Hosting (Linux/Render)
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
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
    // Menampilkan QR code di terminal untuk di-scan pertama kali
    console.log('SCAN QR CODE INI DI WHATSAPP ANDA:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Alhamdulillah, Bot WhatsApp Tahfidz Berhasil Terhubung dan Siap 24 Jam!');
});

// Contoh fungsi pengiriman pesan otomatis / penjadwalan harian
// Anda bisa menyesuaikan nomor tujuan (Grup atau Channel WhatsApp)
const kirimPesanOtomatis = async (nomorTujuan, pesan) => {
    try {
        await client.sendMessage(nomorTujuan, pesan);
        console.log('Pesan Berhasil Terkirim!');
    } catch (error) {
        console.error('Gagal mengirim pesan:', error);
    }
};

// Menjalankan client WhatsApp
client.initialize();