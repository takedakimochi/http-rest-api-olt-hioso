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

## 📡 Dokumentasi Lengkap API & Contoh Output

Berikut adalah daftar lengkap semua rute API yang tersedia beserta deskripsi dan contoh response JSON-nya:

---

### 1. Meta / Koneksi (Kategori: Meta)

#### 🟢 Cek Koneksi ke OLT
* **Route:** `GET /api/health`
* **Deskripsi:** Melakukan pengecekan apakah server bisa terhubung ke OLT dengan konfigurasi yang ada.
* **Contoh Response:**
```json
{
  "ok": true,
  "status": "connected",
  "oltUrl": "http://10.10.3.5:8080",
  "oltUser": "admin",
  "message": "Koneksi ke OLT Hioso HA7302CST berhasil"
}
```

#### 🟢 Daftar Semua Rute API
* **Route:** `GET /api/menu`
* **Deskripsi:** Menampilkan seluruh daftar rute API yang tersedia beserta metadatanya.
* **Contoh Response:**
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
    ]
  }
}
```

---

### 2. Informasi Sistem (Kategori: `/api/system`)

#### 🟢 Informasi Perangkat & Uptime
* **Route:** `GET /api/system/info`
* **Deskripsi:** Mendapatkan informasi dasar OLT seperti nama sistem, deskripsi, lokasi, waktu sistem, uptime, versi software, dll.
* **Contoh Response:**
```json
{
  "ok": true,
  "data": {
    "systemName": "HIOSO-OLT",
    "systemDescription": "HA7302CST 2-PON OLT",
    "systemLocation": "Server_Room",
    "model": "HA7302CST",
    "currentTime": "2026-07-03 10:45:12",
    "uptime": {
      "days": "15",
      "hours": "04",
      "minutes": "20",
      "seconds": "35"
    }
  }
}
```

#### 🟢 Daftar Administrator OLT
* **Route:** `GET /api/system/users`
* **Deskripsi:** Mendapatkan daftar user login beserta grup wewenangnya (misal: admin, guest).
* **Contoh Response:**
```json
{
  "ok": true,
  "data": [
    { "username": "admin", "group": "admin" },
    { "username": "guest", "group": "guest" }
  ]
}
```

#### 🟢 Konfigurasi Network OLT
* **Route:** `GET /api/system/network`
* **Deskripsi:** Mendapatkan konfigurasi IP Management OLT.
* **Contoh Response:**
```json
{
  "ok": true,
  "data": {
    "deviceIp": "10.10.3.5",
    "netmask": "255.255.255.0",
    "gateway": "10.10.3.1",
    "dhcp": false
  }
}
```

#### 🟢 Konfigurasi Waktu (NTP)
* **Route:** `GET /api/system/time`
* **Deskripsi:** Mendapatkan konfigurasi waktu NTP server yang digunakan OLT.
* **Contoh Response:**
```json
{
  "ok": true,
  "data": {
    "year": "2026",
    "month": "7",
    "day": "3",
    "hour": "10",
    "minute": "45",
    "second": "12",
    "currentTime": "2026-7-3 10:45:12",
    "ntpServer": "pool.ntp.org"
  }
}
```

#### 🟢 System Log Terstruktur (Pencarian Log)
* **Route:** `GET /api/system/log`
* **Query Params:** `?filter=Lost` (Opsional, untuk memfilter tipe log tertentu)
* **Deskripsi:** Mendapatkan log dari perangkat OLT yang diparse secara terstruktur dengan vendor lookup otomatis pada alamat MAC.
* **Contoh Response (`GET /api/system/log?filter=Lost`):**
```json
{
  "ok": true,
  "filter": "Lost",
  "count": 1,
  "data": [
    {
      "timestamp": "Jul 03 10:20:15",
      "module": "EPON",
      "onuId": "0/1/1:2",
      "macAddress": "c2:30:10:08:1c:68",
      "macVendor": "Hioso Technology",
      "onuName": "ONU-Pelanggan-A",
      "event": "Lost",
      "raw": "Jul 03 10:20:15 EPON: Slot 0/1/1:2 Onu c2:30:10:08:1c:68[ONU-Pelanggan-A] Lost"
    }
  ]
}
```

#### 🟢 System Tasks (Polling Parameter)
* **Route:** `GET /api/system/tasks`
* **Deskripsi:** Mengambil parameter pooling internal sistem OLT.
* **Contoh Response:**
```json
{
  "ok": true,
  "data": {
    "params": ["10", "30", "60", "120", "300"],
    "raw": ["10", "30", "60", "120", "300"]
  }
}
```

#### 🟢 HTTP Port Aktif
* **Route:** `GET /api/system/http-port`
* **Deskripsi:** Mendapatkan port HTTP yang aktif untuk web interface OLT.
* **Contoh Response:**
```json
{
  "ok": true,
  "data": {
    "httpPort": "8080"
  }
}
```

#### 🟢 Konfigurasi Cloud Management
* **Route:** `GET /api/system/cloud`
* **Deskripsi:** Status integrasi cloud management OLT.
* **Contoh Response:**
```json
{
  "ok": true,
  "data": {
    "enabled": false,
    "serverAddr": "cloud.hioso.com",
    "token": "abcdefg123456"
  }
}
```

#### 🟢 Server Syslog Config
* **Route:** `GET /api/system/log-config`
* **Deskripsi:** Mendapatkan alamat IP Syslog Server eksternal (jika ada).
* **Contoh Response:**
```json
{
  "ok": true,
  "data": {
    "syslogServer": "192.168.1.50"
  }
}
```

---

### 3. Konfigurasi OLT (Kategori: `/api/olt`)

#### 🟢 Ringkasan/Overview OLT
* **Route:** `GET /api/olt/overview`
* **Deskripsi:** Mengambil detail ringkasan perangkat keras OLT (MAC, Vendor, Versi, Jumlah Port PON, Status).
* **Contoh Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "1",
      "name": "HA7302CST",
      "macAddr": "00:11:22:33:44:55",
      "macVendor": "Hioso Technology",
      "version": "V2.3",
      "ponNum": "2",
      "status": "Running"
    }
  ]
}
```

#### 🟢 OLT CTC Config
* **Route:** `GET /api/olt/ctc`
* **Deskripsi:** Status fitur CTC (China Telecom Corporation) Extensions pada OLT.
* **Contoh Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "1",
      "name": "HA7302CST",
      "macAddr": "00:11:22:33:44:55",
      "macVendor": "Hioso Technology",
      "version": "V2.3",
      "ponNum": "2",
      "status": "Running",
      "ctcEnable": "Enable",
      "ctcExtEnable": "Enable"
    }
  ]
}
```

#### 🟢 OLT Bridge (MAC learning limit)
* **Route:** `GET /api/olt/bridge`
* **Deskripsi:** Mengambil status MAC learning limit port OLT.
* **Contoh Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "1",
      "status": "Enable",
      "macLearningLimit": "1024"
    }
  ]
}
```

#### 🟢 Mode Autentikasi OLT (Authentication Mode)
* **Route:** `GET /api/olt/auth-mode`
* **Deskripsi:** Mode autentikasi ONU yang digunakan (misal: MAC, LOID, atau Hybrid).
* **Contoh Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "1",
      "name": "HA7302CST",
      "macAddr": "00:11:22:33:44:55",
      "macVendor": "Hioso Technology",
      "version": "V2.3",
      "ponNum": "2",
      "status": "Running",
      "authMode": "MAC-Only"
    }
  ]
}
```

---

### 4. Manajemen ONU (Kategori: `/api/onu`)

#### 🟢 Daftar Port PON & Statistik ONU
* **Route:** `GET /api/onu/pon-list`
* **Deskripsi:** Mendapatkan list Port PON beserta summary jumlah ONU yang online/offline.
* **Contoh Response:**
```json
{
  "ok": true,
  "data": [
    {
      "ponId": "0/1/1",
      "information": "ONU Total=64,Online=60,Offline=4",
      "stats": {
        "total": 64,
        "online": 60,
        "offline": 4
      }
    }
  ]
}
```

#### 🟢 List ONU pada PON Tertentu (Path Parameter / Query Parameter)
* **Route:** 
  * `GET /api/onu/list/:olt/:pon/:port` (Contoh: `/api/onu/list/0/1/1`)
  * `GET /api/onu/list?ponId=0/1/1` (Melalui query param)
* **Deskripsi:** Menampilkan detail semua ONU pada port PON tersebut, lengkap dengan jarak, info RX/TX optical power, status, nama, dan Vendor OUI Lookup otomatis.
* **Contoh Response:**
```json
{
  "ok": true,
  "ponId": "0/1/1",
  "data": [
    {
      "onuId": "0/1/1:1",
      "name": "ONU_Pelanggan_A",
      "macAddr": "c2:30:10:0a:20:fe",
      "macVendor": "Hioso Technology",
      "status": "Up",
      "firmware": "V1.0.3",
      "port": "GE1",
      "distanceM": 450,
      "txPower": "1.5",
      "rxPowerDbm": "-23.5"
    }
  ]
}
```

#### 🟢 Cari ONU Berdasarkan MAC Address
* **Route:** `GET /api/onu/search?mac=xx:xx:xx`
* **Deskripsi:** Mencari ONU terdaftar di OLT berdasarkan MAC Address-nya.
* **Contoh Response:**
```json
{
  "ok": true,
  "query": "c2:30:10:0a:20:fe",
  "data": {
    "searchResult": [
      {
        "onuId": "0/1/1:1",
        "name": "ONU_Pelanggan_A",
        "macAddr": "c2:30:10:0a:20:fe",
        "macVendor": "Hioso Technology",
        "status": "Up",
        "firmware": "V1.0.3",
        "chipId": "c230",
        "interfaceNum": "1"
      }
    ],
    "ctcStatusLabels": ["Up", "Down", "Testing"],
    "found": true
  }
}

#### 🟢 IGMP Snooping ONU per PON
* **Route:** `GET /api/onu/igmp-snooping`
* **Deskripsi:** Status konfigurasi IGMP Snooping di tiap-tiap port PON.
* **Contoh Response:**
```json
{
  "ok": true,
  "data": [
    {
      "ponId": "0/1/1",
      "information": "IGMP Snooping=Enable"
    }
  ]
}
```

#### 🟢 Daftar Status Hapus ONU per PON
* **Route:** `GET /api/onu/delete-list`
* **Deskripsi:** Menampilkan daftar port PON untuk kebutuhan status delete ONU.
* **Contoh Response:**
```json
{
  "ok": true,
  "data": [
    {
      "ponId": "0/1/1",
      "information": "Onu Delete List"
    }
  ]
}
```

---

### 5. Pengaturan Traffic (Kategori: `/api/traffic`)

#### 🟢 Informasi VLAN
* **Route:** `GET /api/traffic/vlan`
* **Deskripsi:** Mendapatkan konfigurasi VLAN yang aktif pada OLT.
* **Contoh Response:**
```json
{
  "ok": true,
  "data": {
    "note": "VLAN data loaded dynamically via JavaScript",
    "entries": ["100", "200", "300"]
  }
}
```

---

### 6. Pengaturan Port GE (Kategori: `/api/port`)

#### 🟢 Ringkasan & Status Semua Port GE
* **Route:** `GET /api/port/overview`
* **Deskripsi:** Mendapatkan status lengkap semua port GE (Port ID, status enabled, link status, speed, flow control) beserta summary hitungannya.
* **Contoh Response:**
```json
{
  "ok": true,
  "summary": {
    "total": 4,
    "up": 2,
    "down": 2,
    "enabled": 4
  },
  "data": [
    {
      "portId": "GE0/1/1",
      "portEnable": "Enable",
      "linkStatus": "LinkUp",
      "isUp": true,
      "portSpeed": "1000M",
      "flowControl": "Disable"
    }
  ]
}
```

#### 🟢 Hanya Port GE yang Aktif (LinkUp)
* **Route:** `GET /api/port/up`
* **Deskripsi:** Filter cepat untuk hanya mengambil port GE yang berstatus Up.
* **Contoh Response:**
```json
{
  "ok": true,
  "count": 2,
  "data": [
    {
      "portId": "GE0/1/1",
      "portEnable": "Enable",
      "linkStatus": "LinkUp",
      "isUp": true,
      "portSpeed": "1000M",
      "flowControl": "Disable"
    }
  ]
}
```

#### 🟢 Hanya Port GE yang Mati (LinkDown)
* **Route:** `GET /api/port/down`
* **Deskripsi:** Filter cepat untuk hanya mengambil port GE yang berstatus Down.
* **Contoh Response:**
```json
{
  "ok": true,
  "count": 2,
  "data": [
    {
      "portId": "GE0/1/2",
      "portEnable": "Enable",
      "linkStatus": "LinkDown",
      "isUp": false,
      "portSpeed": "N/A",
      "flowControl": "Disable"
    }
  ]
}
```

#### 🟢 Detail Satu Port GE
* **Route:** `GET /api/port/detail?id=GE0/1/1`
* **Deskripsi:** Mendapatkan rincian status untuk satu Port GE spesifik berdasarkan parameter `id`.
* **Contoh Response:**
```json
{
  "ok": true,
  "data": {
    "portId": "GE0/1/1",
    "portEnable": "Enable",
    "linkStatus": "LinkUp",
    "isUp": true,
    "portSpeed": "1000M",
    "flowControl": "Disable"
  }
}
```

#### 🟢 Tabel MAC Address ONU
* **Route:** `GET /api/port/mac-table`
* **Query Params:** 
  * `?onuId=0/1/1:1` (Detail MAC untuk satu ONU tertentu)
  * `?ponId=0/1/1` (Semua MAC ONU di satu port PON)
  * (Kosong) -> Mengambil MAC ONU dari seluruh port PON secara rekursif
* **Deskripsi:** Mendapatkan tabel MAC address dari ONU yang terdaftar beserta vendor lookup dari MAC tersebut.
* **Contoh Response (`GET /api/port/mac-table?onuId=0/1/1:1`):**
```json
{
  "ok": true,
  "onuId": "0/1/1:1",
  "name": "ONU_Pelanggan_A",
  "macAddress": "c2:30:10:0a:20:fe",
  "macVendor": "Hioso Technology",
  "ponId": "0/1/1",
  "count": 1,
  "data": [
    {
      "index": 1,
      "macAddress": "00:11:22:33:44:55",
      "macVendor": "Hioso Technology"
    }
  ]
}
```

---

## 🧪 Mau Tes Doang?
Kalo lu cuma mau ngetes ping-ping menu OLT jalan apa nggak (tanpa ngejalanin server API), lu bisa jajal file `utama.js`:
```bash
node utama.js
```
*(Cuma inget ya, edit dulu hardcode IP/Username/Password di dalem file `utama.js` itu kalo lu pakenya beda).*

Gitu aja bro! Kalo ada error santai aja, pantau log terminalnya, terus obok-obok lagi kodingannya. Gas! 🛵💨
