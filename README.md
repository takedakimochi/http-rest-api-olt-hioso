# REST API OLT Hioso HA7302CST 🚀

Halo bro! 👋 Ini project mantap buat nyulap OLT Hioso HA7302CST lu jadi punya REST API sendiri. Daripada pusing buka web bawaannya yang jadul banget (GoAhead-Webs), mending tarik aja datanya pake JSON! Gue udah rakit ini pake Node.js, Express, Axios, sama Cheerio.

## 🛠️ Persyaratan Tempur
Sebelum tempur, pastiin kompi lu udah terpasang amunisi ini:
- **Node.js** (Saran gue pake versi 18 ke atas)
- **NPM** (Udah sepaket sama Node.js sih biasanya, nyantai aja)

## 📥 Cara Install

1. Buka terminal lu yang paling kece, terus arahin ke folder project ini:
   ```bash
   cd /home/safa/Documents/http-rest-api-olt-hioso
   ```

2. Sedot semua dependency-nya pake jurus andalan:
   ```bash
   npm install
   ```
   Tungguin bentar sambil ngopi sampe kelar. ☕

## ⚙️ Setting Konfigurasi

Project ini secara default udah gue set buat nembak OLT di IP `http://10.10.3.5:8080` pake username `admin` dan password `admin`.
Kalo misal IP atau password OLT lu beda, tenang aja! Lu bisa ganti environment variables-nya pas jalanin app-nya.

Variabel sakti yang bisa lu ubah:
- `PORT` (Bawaan pabrik: `3000`) - Buat port server API lu.
- `OLT_URL` (Bawaan pabrik: `http://10.10.3.5:8080`) - Alamat IP OLT kesayangan lu.
- `OLT_USER` (Bawaan pabrik: `admin`) - Username OLT lu.
- `OLT_PASS` (Bawaan pabrik: `admin`) - Password OLT lu.

Contoh kalo lu mau jalanin pake custom config:
```bash
PORT=8080 OLT_URL="http://192.168.1.100" OLT_USER="admin" OLT_PASS="rahasia" npm start
```

## 🚀 Cara Ngejalanin

Kalo amunisi dan config udah siap, langsung aja gaskan servernya:

```bash
npm start
```
Atau kalau lu lagi iseng-iseng ngoding (development):
```bash
npm run dev
```

Kalo berhasil, ntar di terminal bakal muncul ginian bro:
```
╔══════════════════════════════════════════════╗
║   REST API — OLT HIOSO HA7302CST             ║
╚══════════════════════════════════════════════╝
  Server  : http://localhost:3000
  OLT     : http://10.10.3.5:8080
  User    : admin

  Endpoint utama:
    GET http://localhost:3000/api/health
    GET http://localhost:3000/api/menu
```
Nah, lu tinggal buka browser atau Postman lu, terus tembak deh `http://localhost:3000/api/menu` buat liat semua list menu yang ada!

## 📡 Daftar Endpoint & Contoh Output
Biar lu dapet gambaran, ini beberapa contoh endpoint favorit dan hasil output JSON-nya:

### 1. Cek Koneksi (Health Check)
**GET** `/api/health`
```json
{
  "ok": true,
  "status": "connected",
  "oltUrl": "http://10.10.3.5:8080",
  "oltUser": "admin",
  "message": "Koneksi ke OLT Hioso HA7302CST berhasil"
}
```

### 2. Lihat Semua Menu / Route API
**GET** `/api/menu`
```json
{
  "ok": true,
  "version": "1.0.0",
  "oltUrl": "http://10.10.3.5:8080",
  "endpoints": {
    "meta": [
      { "method": "GET", "path": "/api/health", "desc": "Status koneksi OLT" },
      { "method": "GET", "path": "/api/menu", "desc": "Daftar semua endpoint" }
    ],
    "system": [
      { "method": "GET", "path": "/api/system/info", "desc": "Informasi sistem (nama, CPU, memori, uptime)" }
      // ... dan buanyak menu lainnya
    ]
  }
}
```

### 3. Cek Info Sistem OLT
**GET** `/api/system/info`
```json
{
  "ok": true,
  "data": {
    "deviceName": "HA7302CST",
    "cpuUsage": "12%",
    "memUsage": "45%",
    "uptime": "10 days, 02:30:15"
  }
}
```
*(Catatan: isi datanya pasti ngikutin spek OLT lu pas ditembak bro)*

### 4. Overview OLT
**GET** `/api/olt/overview`
```json
{
  "ok": true,
  "data": {
    "macAddress": "00:11:22:33:44:55",
    "hardwareVersion": "V1.0",
    "softwareVersion": "V2.3.4",
    "status": "Normal"
  }
}
```

### 5. Daftar PON & Status ONU
**GET** `/api/onu/pon-list`
```json
{
  "ok": true,
  "data": [
    {
      "ponPort": "GE0/1/1",
      "totalOnu": 64,
      "online": 60,
      "offline": 4
    },
    {
      "ponPort": "GE0/1/2",
      "totalOnu": 32,
      "online": 20,
      "offline": 12
    }
  ]
}
```

Lu tinggal copas endpoint yang lu butuhin ke Postman atau script lu! 🚀

## 🧪 Mau Tes Doang?
Kalo lu cuma mau ngetes ping-ping menu OLT jalan apa nggak (tanpa ngejalanin server API), lu bisa jajal file `utama.js`:
```bash
node utama.js
```
*(Cuma inget ya, edit dulu hardcode IP/Username/Password di dalem file `utama.js` itu kalo lu pakenya beda).*

Gitu aja bro! Kalo ada error santai aja, pantau log terminalnya, terus obok-obok lagi kodingannya. Gas! 🛵💨
