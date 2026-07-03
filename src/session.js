'use strict';

const axios = require('axios');
require('dotenv').config({ override: true });

const BASE_URL = process.env.BASE_URL || process.env.OLT_URL;
const USERNAME = process.env.USERNAME || process.env.OLT_USER;
const PASSWORD = process.env.PASSWORD || process.env.OLT_PASS;


// Singleton session — reuse across all requests
let _session = null;

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
        timeout: 12000,
        maxRedirects: 5,
        validateStatus: (s) => s >= 200 && s < 500,
    });
}

/**
 * Mengembalikan sesi axios yang sudah divalidasi.
 * Kalau koneksi gagal, throw Error.
 */
async function getSession() {
    if (!_session) {
        _session = buatSesi();
    }
    // Quick health-check
    try {
        const res = await _session.get('/');
        if (res.status === 401) {
            _session = null;
            throw new Error('401 Unauthorized — cek username/password OLT');
        }
        if (res.status !== 200) {
            _session = null;
            throw new Error(`OLT merespons HTTP ${res.status}`);
        }
    } catch (err) {
        _session = null;
        throw err;
    }
    return _session;
}

/**
 * Ambil raw HTML dari path OLT. Sudah include auth.
 */
async function fetchPage(path) {
    const sesi = await getSession();
    const res = await sesi.get(path);
    if (res.status === 401) throw new Error('401 Unauthorized');
    if (res.status === 404) throw new Error(`404 Not Found: ${path}`);
    return { html: String(res.data), status: res.status };
}

module.exports = { getSession, fetchPage, BASE_URL, USERNAME };
