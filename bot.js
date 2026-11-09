const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
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

const daftarGrup = [
    '628564305104-1507311543@g.us',
    '120363085718653344@g.us',
    '120363044211428304@g.us',
    '120363324492590630@g.us',
    '62881023405935-1601532899@g.us',
    '120363103623228409@g.us',
    '120363164769501166@g.us',
    '6285169705477@s.whatsapp.net',
    'status@broadcast'
];

// Fungsi Jeda Custom (3 detik)
const jeda = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fungsi untuk mengambil 1 materi saja berurutan berdasarkan hari
function ambilMateriSatuSatu(filePath) {
    try {
        if (!fs.existsSync(filePath)) return null;
        const raw = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(raw);

        // Jika JSON berupa array/daftar isi materi
        if (Array.isArray(data)) {
            if (data.length === 0) return null;

            // Hitung indeks berdasarkan hari ke-berapa dalam setahun (kebal restart server)
            const hariKe = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
            const index = (hariKe - 1) % data.length;
            const item = data[index];

            if (typeof item === 'string') return item;
            if (typeof item === 'object') {
                return item.materi || item.quote || item.teks || item.isi || JSON.stringify(item, null, 2);
            }
            return String(item);
        }

        // Jika JSON bukan array, kirim teksnya langsung
        return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    } catch (err) {
        console.error(`Gagal membaca ${filePath}:`, err.message);
        return null;
    }
}

let sock;
let jadwalAktif = false;

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('sesi_bot_tahfidz');

    sock = makeWASocket({
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
            if (shouldReconnect) {
                console.log('Koneksi terputus sesaat, otomatis menyambung ulang...');
                startBot(); 
            }
        } else if (connection === 'open') {
            qrCodeData = ''; 
            console.log('Bot Terhubung ke WhatsApp!');

            if (!jadwalAktif) {
                console.log('Menyiapkan alarm jadwal otomatis...');
                mulaiJadwal();
                jadwalAktif = true;
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

function mulaiJadwal() {
    // ALARM MATERI PAGI (05:00 WIB)
    cron.schedule('0 5 * * *', async () => {
        console.log('Menyiarkan materi pagi...');
        const isiMateri = ambilMateriSatuSatu('./materi_pagi.json');
        if (!isiMateri) return console.log('Materi pagi kosong/gagal dibaca.');

        const pesanPagi = `*Bismillah, Materi Pagi Tahfidz:*\n\n${isiMateri}`;
        
        for (const target of daftarGrup) {
            try {
                await sock.sendMessage(target, { text: pesanPagi });
                console.log(`[SUKSES] Terkirim ke: ${target}`);
                await jeda(3000); 
            } catch (err) {
                console.error(`[GAGAL] Target: ${target} | Alasan:`, err.message || err);
            }
        }
        console.log('Selesai kirim materi pagi!');
    }, { timezone: "Asia/Jakarta" });

    // ALARM QUOTE MALAM (20:00 WIB)
    cron.schedule('0 20 * * *', async () => {
        console.log('Menyiarkan quote malam...');
        const isiQuote = ambilMateriSatuSatu('./quote_malam.json');
        if (!isiQuote) return console.log('Quote malam kosong/gagal dibaca.');

        const pesanMalam = `*Quote Malam Tahfidz:*\n\n${isiQuote}`;
        
        for (const target of daftarGrup) {
            try {
                await sock.sendMessage(target, { text: pesanMalam });
                console.log(`[SUKSES] Terkirim ke: ${target}`);
                await jeda(3000); 
            } catch (err) {
                console.error(`[GAGAL] Target: ${target} | Alasan:`, err.message || err);
            }
        }
        console.log('Selesai kirim quote malam!');
    }, { timezone: "Asia/Jakarta" });
}

startBot();