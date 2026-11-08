const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, delay } = require('@whiskeysockets/baileys');
const express = require('express');
const pino = require('pino');
const cron = require('node-cron');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
let qrCodeData = ''; 

app.get('/', (req, res) => {
    if (qrCodeData) {
        res.send(`
            <html lang="id">
            <body style="text-align:center; padding: 50px; font-family: Arial, sans-serif; background-color: #f0f2f5;">
                <h2 style="color: #075e54;">Tautkan Bot WhatsApp Tahfidz</h2>
                <div style="margin: 20px; padding: 20px; background: white; display: inline-block; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCodeData)}&size=300x300" alt="QR Code" />
                </div>
            </body>
            </html>
        `);
    } else {
        res.send(`<h2 style="text-align:center; color: #2e7d32; margin-top:50px;">Alhamdulillah! Bot Aktif dan Jadwal Berjalan.</h2>`);
    }
});

app.listen(port, () => console.log(`Web server menyala di port ${port}`));

// ==========================================================
// DAFTAR SELURUH TARGET (GRUP, JAPRI, DAN STATUS WA)
// ==========================================================
const daftarGrup = [
    '628564305104-1507311543@g.us',
    '120363085718653344@g.us',
    '120363044211428304@g.us',
    '120363324492590630@g.us',
    '62881023405935-1601532899@g.us',
    '120363103623228409@g.us',
    '120363164769501166@g.us',
    '6285169705477@s.whatsapp.net', // Diubah dari @c.us agar tidak error di Baileys
    'status@broadcast'              // Otomatis terkirim ke Status WA
];

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('sesi_bot_tahfidz');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['Bot Tahfidz', 'Chrome', '1.0.0']
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) qrCodeData = qr; 

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            qrCodeData = ''; 
            console.log('Bot Terhubung! Menyiapkan alarm jadwal otomatis untuk seluruh Grup, Nomor, dan Status WA...');

            // ==========================================================
            // ALARM MATERI PAGI (05:00 WIB)
            // ==========================================================
            cron.schedule('0 5 * * *', async () => {
                console.log('Menyiarkan materi pagi...');
                try {
                    const dataPagi = JSON.parse(fs.readFileSync('./materi_pagi.json', 'utf8'));
                    const isiMateri = JSON.stringify(dataPagi, null, 2); 
                    const pesanPagi = `*Bismillah, Materi Pagi Tahfidz:*\n\n${isiMateri}`;
                    
                    for (const target of daftarGrup) {
                        try {
                            await sock.sendMessage(target, { text: pesanPagi });
                            await delay(2000); // Jeda 2 detik antar pengiriman agar anti-banned
                        } catch (err) {
                            console.error(`Gagal kirim pagi ke target ${target}`);
                        }
                    }
                    console.log('Alhamdulillah, selesai kirim materi pagi ke semua saluran!');
                } catch (error) {
                    console.error('Gagal memproses file materi_pagi.json', error);
                }
            }, { timezone: "Asia/Jakarta" });

            // ==========================================================
            // ALARM QUOTE MALAM (20:00 WIB)
            // ==========================================================
            cron.schedule('0 20 * * *', async () => {
                console.log('Menyiarkan quote malam...');
                try {
                    const dataMalam = JSON.parse(fs.readFileSync('./quote_malam.json', 'utf8'));
                    const isiQuote = JSON.stringify(dataMalam, null, 2);
                    const pesanMalam = `*Quote Malam Tahfidz:*\n\n${isiQuote}`;
                    
                    for (const target of daftarGrup) {
                        try {
                            await sock.sendMessage(target, { text: pesanMalam });
                            await delay(2000); // Jeda 2 detik antar pengiriman agar anti-banned
                        } catch (err) {
                            console.error(`Gagal kirim malam ke target ${target}`);
                        }
                    }
                    console.log('Alhamdulillah, selesai kirim quote malam ke semua saluran!');
                } catch (error) {
                    console.error('Gagal memproses file quote_malam.json', error);
                }
            }, { timezone: "Asia/Jakarta" });
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

startBot();