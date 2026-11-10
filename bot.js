// Fungsi untuk mengambil 1 materi saja berurutan berdasarkan hari
function ambilMateriSatuSatu(filePath) {
    try {
        if (!fs.existsSync(filePath)) return null;
        const raw = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(raw);

        // Jika JSON berupa array/daftar isi materi
        if (Array.isArray(data)) {
            if (data.length === 0) return null;

            // KUNCI TANGGAL MULAI (HARI PERTAMA) KE HARI INI
            // Format: YYYY-MM-DD
            const tanggalMulai = new Date('2026-11-10T00:00:00+07:00'); 
            
            // Ambil waktu server dan paksa ke zona waktu WIB (Jakarta)
            const sekarang = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));

            // Hitung selisih hari dari tanggal mulai
            const selisihWaktu = sekarang.getTime() - tanggalMulai.getTime();
            let selisihHari = Math.floor(selisihWaktu / (1000 * 3600 * 24));
            
            if (selisihHari < 0) selisihHari = 0;

            // Ambil materi secara berurutan persis dari urutan ke-1 (index 0)
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