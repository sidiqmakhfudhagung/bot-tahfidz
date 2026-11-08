const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
const fs = require('fs');

const client = new Client({ 
    authStrategy: new LocalAuth(), 
    puppeteer: { 
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    } 
});

client.on('qr', (qr) => { 
    qrcode.generate(qr, { small: true }); 
});

client.on('ready', () => {
    console.log('\n====================================');
    console.log('✅ BOT TAHFIDZ & STATUS WA AKTIF');
    console.log('====================================\n');
    
    // Daftar semua ID Grup yang sudah dilacak
    const daftarGrup = [
        '628564305104-1507311543@g.us',
        '120363085718653344@g.us',
        '120363044211428304@g.us',
        '120363324492590630@g.us',
        '62881023405935-1601532899@g.us',
        '120363103623228409@g.us',
        '120363164769501166@g.us',
        '6285169705477@c.us'
    ]; 
    
    // Membaca file database
    const databasePagi = JSON.parse(fs.readFileSync('./materi_pagi.json', 'utf-8'));
    const databaseMalam = JSON.parse(fs.readFileSync('./quote_malam.json', 'utf-8'));
    
    // Tanggal acuan rotasi hari
    const tanggalMulai = new Date('2026-11-04').getTime();

    // ==========================================
    // 1. JADWAL PAGI (05:30) - Kirim ke Grup & Status
    // ==========================================
    cron.schedule('30 5 * * *', async () => { 
        const selisih = Math.floor((new Date().getTime() - tanggalMulai) / 86400000);
        const pesanPagi = databasePagi[selisih % databasePagi.length];
        
        // A. Kirim ke daftar Grup
        for (let grupId of daftarGrup) {
            try {
                await client.sendMessage(grupId, pesanPagi);
                console.log(`[05:30] Materi terkirim ke: ${grupId}`);
            } catch (error) { console.log(`[05:30] Gagal kirim ke grup: ${grupId}`); }
        }
        
        // B. Jadikan Status WhatsApp
        try {
            await client.sendMessage('status@broadcast', pesanPagi);
            console.log('[05:30] Status WA Pagi berhasil diunggah!');
        } catch (error) { console.log('[05:30] Gagal unggah Status WA'); }
    });

    // ==========================================
    // 2. JADWAL MALAM (20:00) - Kirim ke Grup & Status
    // ==========================================
    cron.schedule('0 20 * * *', async () => { 
        const selisih = Math.floor((new Date().getTime() - tanggalMulai) / 86400000);
        const pesanMalam = databaseMalam[selisih % databaseMalam.length];
        
        // A. Kirim ke daftar Grup
        for (let grupId of daftarGrup) {
            try {
                await client.sendMessage(grupId, pesanMalam);
                console.log(`[20:00] Evaluasi terkirim ke: ${grupId}`);
            } catch (error) { console.log(`[20:00] Gagal kirim ke grup: ${grupId}`); }
        }

        // B. Jadikan Status WhatsApp
        try {
            await client.sendMessage('status@broadcast', pesanMalam);
            console.log('[20:00] Status WA Malam berhasil diunggah!');
        } catch (error) { console.log('[20:00] Gagal unggah Status WA'); }
    });
});

client.initialize();