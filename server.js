'use strict';

require('dotenv').config({ override: true });

// Jaga process tetap hidup
process.on('uncaughtException', (err) => {
    console.error('[uncaughtException]', err.message);
});
process.on('unhandledRejection', (reason) => {
    console.error('[unhandledRejection]', reason);
});

const express = require('express');
const cors = require('cors');
const { getSession, BASE_URL, USERNAME } = require('./src/session');

const app = express();
const PORT = process.env.PORT || 3001;

// ──────────────────────────────────────────────────────────────────
//  MIDDLEWARE
// ──────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Logging sederhana
app.use((req, _res, next) => {
    const ts = new Date().toISOString();
    console.log(`[${ts}] ${req.method} ${req.url}`);
    next();
});

// ──────────────────────────────────────────────────────────────────
//  ROUTES — META
// ──────────────────────────────────────────────────────────────────

/**
 * GET /api/health
 * Cek koneksi ke OLT
 */
app.get('/api/health', async (req, res) => {
    try {
        await getSession();
        res.json({
            ok: true,
            status: 'connected',
            oltUrl: BASE_URL,
            oltUser: USERNAME,
            message: 'Koneksi ke OLT Hioso HA7302CST berhasil',
        });
    } catch (err) {
        res.status(503).json({
            ok: false,
            status: 'disconnected',
            error: err.message,
        });
    }
});

/**
 * GET /api/menu
 * Daftar semua endpoint REST yang tersedia
 */
app.get('/api/menu', (_req, res) => {
    res.json({
        ok: true,
        version: '1.0.0',
        oltUrl: BASE_URL,
        endpoints: {
            meta: [
                { method: 'GET', path: '/api/health', desc: 'Status koneksi OLT' },
                { method: 'GET', path: '/api/menu', desc: 'Daftar semua endpoint' },
            ],
            system: [
                { method: 'GET', path: '/api/system/info', desc: 'Informasi sistem (nama, CPU, memori, uptime)' },
                { method: 'GET', path: '/api/system/users', desc: 'Daftar user & grup' },
                { method: 'GET', path: '/api/system/network', desc: 'Konfigurasi IP manajemen' },
                { method: 'GET', path: '/api/system/time', desc: 'Waktu sistem & NTP server' },
                { method: 'GET', path: '/api/system/log', desc: 'System log terstruktur dengan vendor lookup (query ?filter=Lost/Discovery/dying-gasp)' },
                { method: 'GET', path: '/api/system/tasks', desc: 'System task & polling parameter' },
                { method: 'GET', path: '/api/system/http-port', desc: 'Port HTTP aktif' },
                { method: 'GET', path: '/api/system/cloud', desc: 'Konfigurasi remote cloud' },
                { method: 'GET', path: '/api/system/log-config', desc: 'Konfigurasi syslog server' },
            ],
            olt: [
                { method: 'GET', path: '/api/olt/overview', desc: 'OLT overview (ID, MAC, versi, status)' },
                { method: 'GET', path: '/api/olt/ctc', desc: 'OLT CTC config' },
                { method: 'GET', path: '/api/olt/bridge', desc: 'OLT Bridge config + MAC limit' },
                { method: 'GET', path: '/api/olt/auth-mode', desc: 'Mode autentikasi ONU' },
            ],
            onu: [
                { method: 'GET', path: '/api/onu/pon-list', desc: 'Daftar PON port + statistik ONU' },
                { method: 'GET', path: '/api/onu/list?ponId=0/1/1', desc: 'ONU pada PON tertentu (query string)' },
                { method: 'GET', path: '/api/onu/list/:olt/:pon/:port', desc: 'ONU pada PON tertentu (path params)' },
                { method: 'GET', path: '/api/onu/search?mac=xx:xx:xx', desc: 'Cari ONU berdasarkan MAC' },
                { method: 'GET', path: '/api/onu/igmp-snooping', desc: 'IGMP Snooping per PON' },
                { method: 'GET', path: '/api/onu/delete-list', desc: 'Daftar ONU yang bisa di-delete' },
            ],
            traffic: [
                { method: 'GET', path: '/api/traffic/vlan', desc: 'Konfigurasi VLAN' },
            ],
            port: [
                { method: 'GET', path: '/api/port/overview', desc: 'Semua port GE: status, speed, flow control + ringkasan' },
                { method: 'GET', path: '/api/port/up', desc: 'Hanya port yang LinkUp' },
                { method: 'GET', path: '/api/port/down', desc: 'Hanya port yang LinkDown' },
                { method: 'GET', path: '/api/port/detail?id=GE0/1/1', desc: 'Detail satu port berdasarkan ID' },
                { method: 'GET', path: '/api/port/mac-table', desc: 'Tabel MAC address ONU (query ?onuId=0/1/1:1 atau ?ponId=0/1/1)' },
            ],
        },
    });
});

// ──────────────────────────────────────────────────────────────────
//  ROUTES — SUB-ROUTER
// ──────────────────────────────────────────────────────────────────
app.use('/api/system', require('./src/routes/system'));
app.use('/api/olt', require('./src/routes/olt'));
app.use('/api/onu', require('./src/routes/onu'));
app.use('/api/traffic', require('./src/routes/traffic'));
app.use('/api/port', require('./src/routes/port'));

// ──────────────────────────────────────────────────────────────────
//  404 handler
// ──────────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        ok: false,
        error: `Endpoint tidak ditemukan: ${req.method} ${req.url}`,
        hint: 'Coba GET /api/menu untuk daftar endpoint yang tersedia',
    });
});

// ──────────────────────────────────────────────────────────────────
//  ERROR handler (Express 5 compatible — 4 params wajib)
// ──────────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use(function errorHandler(err, req, res, next) {
    console.error(`[ERROR] ${req.method} ${req.url} —`, err.message);
    if (res.headersSent) return next(err);
    const status = err.message.includes('401') ? 401
        : err.message.includes('404') ? 404
            : 500;
    res.status(status).json({
        ok: false,
        error: err.message,
    });
});

// ──────────────────────────────────────────────────────────────────
//  START
// ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║   REST API — OLT HIOSO HA7302CST             ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log(`  Server  : http://localhost:${PORT}`);
    console.log(`  OLT     : ${BASE_URL}`);
    console.log(`  User    : ${USERNAME}`);
    console.log('');
    console.log('  Endpoint utama:');
    console.log(`    GET http://localhost:${PORT}/api/health`);
    console.log(`    GET http://localhost:${PORT}/api/menu`);
    console.log(`    GET http://localhost:${PORT}/api/olt/overview`);
    console.log(`    GET http://localhost:${PORT}/api/onu/pon-list`);
    console.log(`    GET http://localhost:${PORT}/api/system/info`);
    console.log('');
});
