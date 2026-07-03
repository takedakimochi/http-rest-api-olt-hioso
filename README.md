# REST API OLT Hioso HA7302CST

Aplikasi REST API berbasis Node.js dan Express untuk berinteraksi, memonitor, dan mengelola OLT Hioso HA7302CST. Aplikasi ini secara otomatis melakukan scraping pada web manajemen HTTP OLT (GoAhead-Webs) dan menyediakannya dalam bentuk endpoint REST API berformat JSON yang terstruktur.

---

## 🚀 Fitur Utama

- **Login & Session Management**: Menggunakan Axios Session & HTTP Basic Auth secara otomatis.
- **System Monitoring**: Mengambil data CPU, RAM, Uptime, NTP, Syslog, dan System Info lainnya.
- **OLT Management**: Membaca info konfigurasi OLT, port bridge, dan mode autentikasi.
- **ONU Management**: 
  - List port PON & ONU yang terdaftar.
  - Pencarian ONU berdasarkan MAC Address.
  - Integrasi Vendor Lookup (OUI) otomatis untuk MAC Address ONU.
- **Port Management**: Status link GE (Up/Down), Speed, Flow Control, dan MAC Table ONU.
- **VLAN Config**: Membaca settingan VLAN pada OLT.

---

## 🛠️ Cara Instalasi & Menjalankan

### 1. Prasyarat
Pastikan sistem Anda sudah terinstal:
- **Node.js** (versi 16 atau lebih baru direkomendasikan)
- **NPM** (biasanya terinstal bersama Node.js)

### 2. Kloning Repositori & Instalasi Dependensi
Jalankan perintah berikut di terminal:
```bash
git clone <url-repositori-anda>
cd http-rest-api-olt-hioso
npm install
```

### 3. Konfigurasi Environment (`.env`)
Buat file bernama `.env` di root direktori proyek dan isikan detail OLT Anda:
```env
PORT=3001
BASE_URL=http://10.10.3.5:8080
USERNAME=sistem
PASSWORD=sistem
```
> **Catatan**: Jika menggunakan port default Express, server akan berjalan di port `3001`.
### 4. Menjalankan Aplikasi

- **Mode Produksi**:
  ```bash
  npm start
  ```
- **Mode Development** (menggunakan nodemon atau hot reload jika ada):
  ```bash
  npm run dev
  ```

### 5. Menjalankan dengan PM2 (Agar Otomatis Jalan saat Booting)
Agar aplikasi REST API tetap berjalan di background dan otomatis aktif kembali saat server Ubuntu reboot/booting, Anda bisa menggunakan **PM2**:

1. **Instal PM2 secara global**:
   ```bash
   sudo npm install -g pm2
   ```

2. **Jalankan aplikasi dengan PM2**:
   ```bash
   pm2 start server.js --name "hioso-rest-api"
   ```

3. **Konfigurasi auto-start saat booting**:
   ```bash
   pm2 startup
   ```
   *Perintah di atas akan menghasilkan sebuah baris perintah `sudo env PATH=...`. Salin (copy) lalu jalankan perintah tersebut di terminal Anda.*

4. **Simpan konfigurasi proses PM2**:
   ```bash
   pm2 save
   ```

5. **Perintah manajemen PM2 lainnya**:
   - Melihat status: `pm2 status`
   - Melihat log: `pm2 logs hioso-rest-api`
   - Menghentikan aplikasi: `pm2 stop hioso-rest-api`
   - Merestart aplikasi: `pm2 restart hioso-rest-api`

---

## 📡 Contoh Endpoint API

Berikut adalah beberapa contoh endpoint yang dapat diakses setelah server berjalan:

### 1. Meta / Health Check
- **Endpoint**: `GET /api/health`
- **Deskripsi**: Memeriksa status koneksi API ke perangkat OLT.
- **Response**:
  ```json
  {
    "ok": true,
    "status": "connected",
    "oltUrl": "http://10.10.3.5:8080",
    "oltUser": "sistem",
    "message": "Koneksi ke OLT Hioso HA7302CST berhasil"
  }
  ```

### 2. Daftar Menu / Endpoints
- **Endpoint**: `GET /api/menu`
- **Deskripsi**: Menampilkan semua daftar endpoint REST API yang tersedia.

### 3. Informasi Sistem OLT
- **Endpoint**: `GET /api/system/info`
- **Deskripsi**: Mengambil data penggunaan CPU, memori, uptime, dll.
- **Response (Contoh)**:
  ```json
  {
    "ok": true,
    "data": {
      "systemName": "HA7302CST",
      "systemDescription": "2-PON EPON OLT",
      "cpuUsage": "12%",
      "memoryUsage": "45%",
      "uptime": "15 days, 4 hours, 23 minutes"
    }
  }
  ```

### 4. Daftar ONU per PON Port
- **Endpoint**: `GET /api/onu/list?ponId=0/1/1`  
  *(Atau menggunakan path params: `GET /api/onu/list/0/1/1`)*
- **Deskripsi**: Mengambil semua daftar ONU yang terhubung pada port PON tertentu.

### 5. Pencarian ONU Berdasarkan MAC Address
- **Endpoint**: `GET /api/onu/search?mac=e0:67:b3:aa:bb:cc`
- **Deskripsi**: Mencari ONU secara spesifik di seluruh port PON berdasarkan MAC Address-nya.
- **Response (Contoh)**:
  ```json
  {
    "ok": true,
    "found": true,
    "onu": {
      "ponId": "0/1/1",
      "onuId": 3,
      "macAddress": "e0:67:b3:aa:bb:cc",
      "vendor": "Hioso",
      "status": "online"
    }
  }
  ```

### 6. Log Sistem Terfilter
- **Endpoint**: `GET /api/system/log?filter=Lost`
- **Deskripsi**: Mengambil daftar log OLT dengan kemampuan penyaringan teks (misal: mencari log ONU yang putus/Lost).

---

## 📂 Struktur Proyek

```text
http-rest-api-olt-hioso/
├── src/
│   ├── routes/          # Kumpulan router Express (system, olt, onu, traffic, port)
│   ├── parser.js        # Parser HTML untuk mengekstrak data dari web OLT
│   ├── session.js       # Manajemen sesi Axios ke OLT
│   └── macLookup.js     # Helper pencarian OUI vendor MAC address
├── .env                 # File konfigurasi 
├── .gitignore           # File pengabaian git
├── package.json         # Dependensi dan script project
├── server.js            # Entry point REST API server
└── utama.js             # Skrip CLI demo mandiri
```

---

✍️ **Credit**: safa @ LDP Blitar

