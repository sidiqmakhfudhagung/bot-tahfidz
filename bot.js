const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const express = require('express');
const pino = require('pino');
const cron = require('node-cron');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;
let qrCodeData = ''; 
let sock; // Dibuat global agar bisa diakses web

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
        res.send(`
            <div style="text-align:center; font-family: Arial; padding:50px;">
                <h2 style="color: #2e7d32;">Alhamdulillah! Bot Aktif dan Jadwal Berjalan.</h2>
                <br>
                <a href="/cek-id" style="padding: 10px 20px; background: #075e54; color: white; text-decoration: none; border-radius: 5px;">Cek Daftar ID Grup & Komunitas</a>
            </div>
        `);
    }
});

// FITUR BARU: Pelacak ID Grup & Komunitas Asli
app.get('/cek-id', async (req, res) => {
    if (!sock) {
        return res.send('Bot belum siap, silakan *refresh* halaman ini beberapa detik lagi.');
    }
    try {
        const groups = await sock.groupFetchAllParticipating();
        let html = '<h2 style="font-family: Arial;">Daftar ID Grup & Komunitas Asli:</h2><ul style="font-family: Arial; line-height: 1.8;">';
        for (const id in groups) {
            html += `<li><strong>${groups[id].subject}</strong> <br> ID: <code style="background:#eee; padding:2px 5px;">${id}</code></li>`;
        }
        html += '</ul><p style="font-family: Arial; color: red;">*Silakan COPY ID di atas dan ganti ke dalam daftarGrup di kode bot.js Bapak!*</p>';
        res.send(html);
    } catch (error) {
        res.send('Gagal mengambil data grup: ' + error.message);
    }
});

app.listen(port, () => console.log(`Web server menyala di port ${port}`));

// ⚠️ NANTI GANTI ID DI BAWAH INI DENGAN HASIL DARI WEB /CEK-ID
const daftarGrup = [
    '628564305104-1507311543@g.us', // Ganti nanti
    '120363085718653344@g.us', // Ganti nanti
    '120363044211428304@g.us', // Ganti nanti
    '120363324492590630@g.us', // Ganti nanti
    '62881023405935-1601532899@g.us', // Ganti nanti
    '120363103623228409@g.us', // Ganti nanti
    '120363164769501166@g.us', // Ganti nanti
    '6285169705472@s.whatsapp.net', // Nomor Pribadi Bapak (Sudah Diperbaiki)
    'status@broadcast'
];

// Fungsi Jeda Custom (3 detik)
const jeda = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function ambilMateriSatuSatu(filePath) {
    try {
        if (!fs.existsSync(filePath)) return null;
        const raw = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(raw);

        if (Array.isArray(data)) {
            if (data.length === 0) return null;
            const tanggalMulai = new Date('2026-11-09T00:00:00+07:00'); 
            const sekarang = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
            const selisihWaktu = sekarang.getTime() - tanggalMulai.getTime();
            let selisihHari = Math.floor(selisihWaktu / (1000 * 3600 * 24));
            if (selisihHari < 0) selisihHari = 0;
            const index = selisihHari % data.length;
            const item = data[index];
            if (typeof item === 'string') return item;
            if (typeof item === 'object') {
                return item.materi || item.quote || item.teks || item.isi || JSON.stringify(item, null, 2);
            }
            return String(item);
        }
        return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    } catch (err) {
        console.error(`Gagal membaca ${filePath}:`, err.message);
        return null;
    }
}

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
                console.log('Koneksi terputus, menyambung ulang...');
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

// Fungsi untuk mengirim pesan yang membedakan Status dan Chat Biasa
async function kirimPesanAman(target, teks) {
    try {
        if (target === 'status@broadcast') {
            // Syarat WA agar status bisa terkirim (Wajib ada statusJidList)
            await sock.sendMessage('status@broadcast', { text: teks }, {
                statusJidList: [
                    '6285169705472@s.whatsapp.net', // Nomor Bapak
                    sock.user.id.split(':')[0] + '@s.whatsapp.net' // Nomor Bot itu sendiri
                ]
            });
        } else {
            await sock.sendMessage(target, { text: teks });
        }
        console.log(`[SUKSES] Terkirim ke: ${target}`);
    } catch (err) {
        console.error(`[GAGAL] Target: ${target} | Alasan:`, err.message || err);
    }
}

function mulaiJadwal() {
    cron.schedule('30 5 * * *', async () => {
        console.log('Menyiarkan materi pagi...');
        const isiMateri = ambilMateriSatuSatu('./materi_pagi.json');
        if (!isiMateri) return console.log('Materi pagi kosong.');
        const pesanPagi = `*Bismillah, Materi Pagi Tahfidz:*\n\n${isiMateri}`;
        
        for (const target of daftarGrup) {
            await kirimPesanAman(target, pesanPagi);
            await jeda(3000); 
        }
        console.log('Selesai kirim materi pagi!');
    }, { timezone: "Asia/Jakarta" });

    cron.schedule('30 19 * * *', async () => {
        console.log('Menyiarkan quote malam...');
        const isiQuote = ambilMateriSatuSatu('./quote_malam.json');
        if (!isiQuote) return console.log('Quote malam kosong.');
        const pesanMalam = `*Quote Malam Tahfidz:*\n\n${isiQuote}`;
        
        for (const target of daftarGrup) {
            await kirimPesanAman(target, pesanMalam);
            await jeda(3000); 
        }
        console.log('Selesai kirim quote malam!');
    }, { timezone: "Asia/Jakarta" });
}

startBot();