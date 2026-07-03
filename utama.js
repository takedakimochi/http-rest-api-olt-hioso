const axios = require('axios');
const cheerio = require('cheerio');

// ─────────────────────────────────────────────────────────────────
//  KONFIGURASI
// ─────────────────────────────────────────────────────────────────
const BASE_URL = 'http://[IP_ADDRESS]'; // ip login hioso
const USERNAME = 'admin'; // sesuaikan dengan username OLT HA7302CST
const PASSWORD = 'admin'; // sesuaikan dengan password OLT HA7302CST

// ─────────────────────────────────────────────────────────────────
//  PETA MENU — diambil dari item.asp OLT HA7302CST
// ─────────────────────────────────────────────────────────────────
const MENU = {
    'System': {
        'System Info': 'system.asp',
        'Administrator': 'userOverview.asp',
        'Network': 'host_ip.asp',
        'System Time': 'ntp.asp',
        'System Task': 'sysTask.asp',
        'Http Port': 'httpPort.asp',
        'Remote Cloud': 'system_cloud.asp',
        'System Log': 'sys_log.asp',
        'System Log Config': 'logServer.asp',
        'Backup Config': 'system_backup_restore.asp',
        'Factory Setting': 'system_factory.asp',
        'System Reboot': 'system_reboot.asp',
        'System Upgrade': 'system_upgrade.asp',
    },
    'OLT Management': {
        'OLT Overview': 'oltOverview.asp',
        'OLT Ctc': 'oltCtc.asp',
        'OLT Bridge': 'oltBridge.asp',
        'OLT AuthMode': 'oltAuthMode.asp',
    },
    'ONU Management': {
        'ONU Overview': 'onuConfigPonList.asp',
        'Search ONU': 'onuSearch.asp',
        'ONU IgmpSnooping': 'onuIgmpSnoopingPonList.asp',
        'Delete ONU': 'onuDeletePonList.asp',
    },
    'Traffic': {
        'VLAN Config': 'vlan.asp',
    },
};

// ─────────────────────────────────────────────────────────────────
//  BUAT SESI AXIOS (HTTP Basic Auth — GoAhead-Webs)
// ─────────────────────────────────────────────────────────────────
function buatSesi() {
    return axios.create({
        baseURL: BASE_URL,
        auth: { username: USERNAME, password: PASSWORD },
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
            'Referer': BASE_URL + '/',
        },
        timeout: 10000,
        maxRedirects: 5,
        validateStatus: (s) => s >= 200 && s < 500,
    });
}

// ─────────────────────────────────────────────────────────────────
//  LOGIN & VALIDASI
// ─────────────────────────────────────────────────────────────────
async function loginHioso() {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   LOGIN OLT HIOSO HA7302CST                  ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log(`  URL  : ${BASE_URL}`);
    console.log(`  User : ${USERNAME}`);
    console.log('');

    const sesi = buatSesi();

    try {
        const res = await sesi.get('/');
        if (res.status === 200) {
            console.log('✅ Login BERHASIL!');
            console.log(`   Status : ${res.status}`);
            console.log(`   Server : ${res.headers['server'] || '-'}`);
            console.log('');
            return sesi;
        }
        if (res.status === 401) {
            console.error('❌ Login GAGAL — 401 Unauthorized. Cek username/password.');
            return null;
        }
        console.error(`⚠️  Status tak terduga: ${res.status}`);
        return null;
    } catch (err) {
        console.error('❌ Koneksi gagal:', err.message);
        if (err.code === 'ECONNREFUSED') console.error('   OLT tidak bisa diakses — cek IP/port.');
        if (err.code === 'ETIMEDOUT') console.error('   Timeout — OLT tidak merespons.');
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────
//  TAMPILKAN PETA MENU
// ─────────────────────────────────────────────────────────────────
function tampilkanPetaMenu() {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   PETA MENU OLT HIOSO HA7302CST              ║');
    console.log('╚══════════════════════════════════════════════╝');
    for (const [grup, items] of Object.entries(MENU)) {
        console.log(`\n  📁 ${grup}`);
        for (const [nama, path] of Object.entries(items)) {
            console.log(`       ├─ ${nama.padEnd(22)} → /${path}`);
        }
    }
    console.log('');
}

// ─────────────────────────────────────────────────────────────────
//  BUKA SATU HALAMAN MENU & TAMPILKAN ISI
// ─────────────────────────────────────────────────────────────────
async function bukaMenu(sesi, path, namaMenu) {
    console.log(`\n──────────────────────────────────────────────`);
    console.log(`  📄 Membuka: ${namaMenu}`);
    console.log(`     Path   : /${path}`);
    console.log(`──────────────────────────────────────────────`);

    try {
        const res = await sesi.get('/' + path);

        if (res.status === 404) {
            console.log('  ⬜ 404 — Halaman tidak ditemukan di perangkat ini.');
            return null;
        }
        if (res.status !== 200) {
            console.log(`  ⚠️  HTTP ${res.status}`);
            return null;
        }

        const html = String(res.data);
        const $ = cheerio.load(html);
        const judul = $('title').text().trim() || $('h1').first().text().trim() || namaMenu;

        // Bersihkan teks konten
        $('script, style').remove();
        const teks = $('body').text().replace(/\s+/g, ' ').trim();

        console.log(`  ✅ Judul   : ${judul}`);
        console.log(`     Ukuran : ${html.length} byte`);
        if (teks.length > 0) {
            console.log(`     Konten : ${teks.slice(0, 400)}${teks.length > 400 ? '...' : ''}`);
        }

        return { path, namaMenu, judul, html };

    } catch (err) {
        console.log(`  ❌ Error: ${err.message}`);
        return null;
    }
}

// ─────────────────────────────────────────────────────────────────
//  SCAN SEMUA MENU — CEK STATUS AKSES
// ─────────────────────────────────────────────────────────────────
async function scanSemuaMenu(sesi) {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   SCAN AKSES SEMUA MENU                      ║');
    console.log('╚══════════════════════════════════════════════╝\n');

    const tersedia = [];

    for (const [grup, items] of Object.entries(MENU)) {
        console.log(`  📁 ${grup}`);
        for (const [nama, path] of Object.entries(items)) {
            try {
                const res = await sesi.get('/' + path);
                const ikon = res.status === 200 ? '✅' : (res.status === 404 ? '⬜' : '⚠️ ');
                console.log(`     ${ikon} [${res.status}] ${nama.padEnd(22)} → /${path}`);
                if (res.status === 200) tersedia.push({ grup, nama, path });
            } catch (err) {
                console.log(`     ❌ [ERR] ${nama.padEnd(22)} → /${path} (${err.message})`);
            }
        }
        console.log('');
    }

    console.log(`📊 Tersedia: ${tersedia.length} menu dari ${Object.values(MENU).reduce((a, b) => a + Object.keys(b).length, 0)} total\n`);
    return tersedia;
}

// ─────────────────────────────────────────────────────────────────
//  MAIN
// ─────────────────────────────────────────────────────────────────
async function main() {
    // 1. Login
    const sesi = await loginHioso();
    if (!sesi) {
        console.error('Tidak bisa melanjutkan tanpa sesi valid.');
        process.exit(1);
    }

    // 2. Tampilkan peta menu
    tampilkanPetaMenu();

    // 3. Scan akses semua menu
    const menuTersedia = await scanSemuaMenu(sesi);

    // 4. Buka beberapa menu penting sebagai demo
    const DEMO_MENU = [
        { nama: 'System Info', path: 'system.asp' },
        { nama: 'OLT Overview', path: 'oltOverview.asp' },
        { nama: 'ONU Overview', path: 'onuConfigPonList.asp' },
    ];

    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   AKSES MENU DEMO                            ║');
    console.log('╚══════════════════════════════════════════════╝');

    for (const m of DEMO_MENU) {
        await bukaMenu(sesi, m.path, m.nama);
    }

    console.log('\n✔️  Selesai. Sesi aktif & siap untuk operasi lanjutan.');
    console.log('   Gunakan fungsi bukaMenu(sesi, path, nama) untuk akses halaman lain.');
}

main();
