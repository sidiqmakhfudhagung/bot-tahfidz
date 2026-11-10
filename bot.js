// Fungsi untuk mengambil 1 materi saja berurutan berdasarkan hari
function ambilMateriSatuSatu(filePath) {
    try {
        if (!fs.existsSync(filePath)) return null;
        const raw = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(raw);

        if (Array.isArray(data)) {
            if (data.length === 0) return null;

            // KUNCI TANGGAL MULAI KE HARI SENIN KEMARIN (9 November 2026)
            const tanggalMulai = new Date('2026-11-09T00:00:00+07:00'); 
            
            const sekarang = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
            const selisihWaktu = sekarang.getTime() - tanggalMulai.getTime();
            let selisihHari = Math.floor(selisihWaktu / (1000 * 3600 * 24));
            
            if (selisihHari < 0) selisihHari = 0;

            // Ambil materi secara berurutan
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