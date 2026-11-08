const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const express = require('express');
const pino = require('pino');

const app = express();
const port = process.env.PORT || 3000;
let qrCodeData = ''; // Menyimpan data QR untuk web

// Halaman web untuk menampilkan QR Code dengan rapi
app.get('/', (req, res) => {
    if (qrCodeData) {
        res.send(`
            <html lang="id">
            <body style="text-align:center; padding: 50px; font-family: Arial, sans-serif; background-color: #f0f2f5;">
                <h2 style="color: #075e54;">Tautkan Bot WhatsApp Tahfidz</h2>
                <p>Buka WhatsApp di HP > Perangkat Tertaut > Tautkan Perangkat</p>
                <div style="margin: 20px; padding: 20px; background: white; display: inline-block; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCodeData)}&size=300x300" alt="QR Code WhatsApp" />
                </div>
                <p style="color: #666; font-size: 14px;">Refresh (F5) halaman ini jika QR gagal di-scan untuk meminta QR baru.</p>
            </body>
            </html>
        `);
    } else {
        res.send(`
            <html lang="id">
            <body style="text-align:center; padding: 50px; font-family: Arial, sans-serif; background-color: #e8f5e9;">
                <h2 style="color: #2e7d32;">Alhamdulillah!</h2>
                <p>Bot WhatsApp Tahfidz saat ini <b>sudah aktif dan terhubung</b> ke server 24 Jam.</p>
            </body>
            </html>
        `);
    }
});

app.listen(port, () => console.log(`Web server menyala di port ${port}`));

async function startBot() {
    console.log('Memulai mesin Baileys...');
    
    const { state, saveCreds } = await useMultiFileAuthState('sesi_bot_tahfidz');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // Matikan print berantakan di log terminal
        logger: pino({ level: 'silent' }),
        browser: ['Bot Tahfidz', 'Chrome', '1.0.0']
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrCodeData = qr; // Simpan QR agar bisa dibuka di browser
            console.log('>>> QR Code berhasil dibuat! Silakan buka tautan web Render Anda untuk melakukan scan. <<<');
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus. Mencoba menyambung ulang...', shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            qrCodeData = ''; // Hapus QR dari web jika sudah berhasil login
            console.log('Alhamdulillah, Bot WhatsApp Tahfidz Berhasil Terhubung dan Siap 24 Jam!');
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

startBot();