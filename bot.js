const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const express = require('express');
const pino = require('pino');

// Server bohongan agar Render tidak mematikan bot
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot Tahfidz Aktif 24 Jam!'));
app.listen(port, () => console.log(`Web server nyala di port ${port}`));

async function startBot() {
    console.log('Memulai mesin Baileys (Sangat Ringan & Anti-Crash)...');
    
    // Menyimpan sesi login agar tidak perlu scan QR terus-menerus
    const { state, saveCreds } = await useMultiFileAuthState('sesi_bot_tahfidz');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }), // Mematikan log bawaan yang terlalu ramai
        browser: ['Bot Tahfidz', 'Chrome', '1.0.0']
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('\n=========================================');
            console.log('SCAN QR CODE INI DI WHATSAPP ANDA:');
            console.log('=========================================\n');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus. Mencoba menyambung ulang...', shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('Alhamdulillah, Bot WhatsApp Tahfidz Berhasil Terhubung dan Siap 24 Jam!');
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

startBot();