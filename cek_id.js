const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({ 
    authStrategy: new LocalAuth(), 
    puppeteer: { 
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    } 
});

client.on('ready', () => {
    console.log('\n====================================');
    console.log('✅ BOT PELACAK SUPER SENSITIF AKTIF');
    console.log('====================================');
    console.log('Silakan buka HP Anda sekarang.');
    console.log('Kirim pesan apa saja ke dalam Saluran Anda...');
});

// Menangkap SEMUA pergerakan pesan tanpa terkecuali
client.on('message_create', message => {
    const idTarget = message.to.includes('@') ? message.to : message.from;
    
    if (idTarget.endsWith('@newsletter')) {
        console.log(`\n🎉 KETEMU! Ini ID Saluran Anda:`);
        console.log(`-> ${idTarget}`);
        console.log(`Silakan Copy ID di atas, lalu tekan Ctrl + C.\n`);
    } else {
        console.log(`[Aktivitas Terdeteksi] ID: ${idTarget}`);
    }
});

client.initialize();