'use strict';

const { Router }    = require('express');
const { fetchPage } = require('../session');
const P             = require('../parser');
const { getVendor } = require('../macLookup');

const router = Router();

// ──────────────────────────────────────────────────────────────────
//  GET /api/port/overview
//  Semua port GE: status, speed, flow control
// ──────────────────────────────────────────────────────────────────
router.get('/overview', async (req, res, next) => {
    try {
        const { html } = await fetchPage('/portOverview.asp');
        const ports = P.parsePortOverview(html);

        // Hitung ringkasan
        const summary = {
            total  : ports.length,
            up     : ports.filter(p => p.isUp).length,
            down   : ports.filter(p => !p.isUp).length,
            enabled: ports.filter(p => p.portEnable === 'Enable').length,
        };

        res.json({ ok: true, summary, data: ports });
    } catch (e) { next(e); }
});

// ──────────────────────────────────────────────────────────────────
//  GET /api/port/up
//  Hanya port yang LinkUp
// ──────────────────────────────────────────────────────────────────
router.get('/up', async (req, res, next) => {
    try {
        const { html } = await fetchPage('/portOverview.asp');
        const ports = P.parsePortOverview(html).filter(p => p.isUp);
        res.json({ ok: true, count: ports.length, data: ports });
    } catch (e) { next(e); }
});

// ──────────────────────────────────────────────────────────────────
//  GET /api/port/down
//  Hanya port yang LinkDown
// ──────────────────────────────────────────────────────────────────
router.get('/down', async (req, res, next) => {
    try {
        const { html } = await fetchPage('/portOverview.asp');
        const ports = P.parsePortOverview(html).filter(p => !p.isUp);
        res.json({ ok: true, count: ports.length, data: ports });
    } catch (e) { next(e); }
});

// ──────────────────────────────────────────────────────────────────
//  GET /api/port/:portId
//  Detail satu port tertentu — contoh: /api/port/GE0%2F1%2F1
//  atau query: /api/port/detail?id=GE0/1/1
// ──────────────────────────────────────────────────────────────────
router.get('/detail', async (req, res, next) => {
    try {
        const portId = req.query.id;
        if (!portId) {
            return res.status(400).json({
                ok   : false,
                error: 'Query parameter id diperlukan. Contoh: /api/port/detail?id=GE0/1/1',
            });
        }
        const { html } = await fetchPage('/portOverview.asp');
        const ports = P.parsePortOverview(html);
        const port  = ports.find(p => p.portId === portId);
        if (!port) {
            return res.status(404).json({
                ok     : false,
                error  : `Port ${portId} tidak ditemukan`,
                available: ports.map(p => p.portId),
            });
        }
        res.json({ ok: true, data: port });
    } catch (e) { next(e); }
});

// ──────────────────────────────────────────────────────────────────
//  GET /api/port/mac-table
//  Mendapatkan tabel MAC address ONU
//  Query params:
//    - onuId: detail MAC untuk satu ONU (contoh: 0/1/1:1)
//    - ponId: tabel MAC untuk semua ONU di satu PON (contoh: 0/1/1)
//  Jika tanpa query params, akan mengambil seluruh data dari semua PON
// ──────────────────────────────────────────────────────────────────
router.get('/mac-table', async (req, res, next) => {
    try {
        const onuId = req.query.onuId;
        const ponId = req.query.ponId;

        if (onuId) {
            if (!onuId.includes(':')) {
                return res.status(400).json({
                    ok: false,
                    error: 'Format onuId salah. Contoh: /api/port/mac-table?onuId=0/1/1:1'
                });
            }
            const ponIdParsed = onuId.split(':')[0];
            
            // Ambil detail MAC dan list ONU secara paralel untuk mendapatkan nama & MAC asli ONU
            const [macRes, onuListRes] = await Promise.all([
                fetchPage(`/onuLlidMac.asp?onuno=${encodeURIComponent(onuId)}&oltponno=${encodeURIComponent(ponIdParsed)}`),
                fetchPage(`/onuLlidMacOnuList.asp?oltponno=${encodeURIComponent(ponIdParsed)}`)
            ]);
            
            const macTable = P.parseOnuLlidMac(macRes.html);
            const onus = P.parseOnuList(onuListRes.html);
            const targetOnu = onus.find(o => o.onuId === onuId);

            const targetOnuMac = targetOnu ? targetOnu.macAddr : null;
            const onuVendor = targetOnuMac ? await getVendor(targetOnuMac) : null;

            const macTableWithVendor = await Promise.all(macTable.map(async (item) => ({
                index: item.index,
                macAddress: item.macAddress,
                macVendor: await getVendor(item.macAddress)
            })));

            return res.json({
                ok: true,
                onuId,
                name: targetOnu ? targetOnu.name : null,
                macAddress: targetOnuMac,
                macVendor: onuVendor,
                ponId: ponIdParsed,
                count: macTable.length,
                data: macTableWithVendor
            });
        }

        if (ponId) {
            const { html: onuListHtml } = await fetchPage(`/onuLlidMacOnuList.asp?oltponno=${encodeURIComponent(ponId)}`);
            const onus = P.parseOnuList(onuListHtml);
            const activeOnus = onus.filter(o => o.status === 'Up');
            const offlineOnus = onus.filter(o => o.status !== 'Up');

            const data = await Promise.all(activeOnus.map(async (onu) => {
                try {
                    const { html: macHtml } = await fetchPage(`/onuLlidMac.asp?onuno=${encodeURIComponent(onu.onuId)}&oltponno=${encodeURIComponent(ponId)}`);
                    const macTable = P.parseOnuLlidMac(macHtml);

                    const onuVendor = await getVendor(onu.macAddr);
                    const macTableWithVendor = await Promise.all(macTable.map(async (item) => ({
                        index: item.index,
                        macAddress: item.macAddress,
                        macVendor: await getVendor(item.macAddress)
                    })));

                    return {
                        onuId: onu.onuId,
                        name: onu.name,
                        macAddress: onu.macAddr,
                        macVendor: onuVendor,
                        status: onu.status,
                        macTable: macTableWithVendor
                    };
                } catch (e) {
                    return {
                        onuId: onu.onuId,
                        name: onu.name,
                        macAddress: onu.macAddr,
                        macVendor: await getVendor(onu.macAddr),
                        status: onu.status,
                        macTable: [],
                        error: e.message
                    };
                }
            }));

            return res.json({
                ok: true,
                ponId,
                onuCount: onus.length,
                onlineOnuCount: activeOnus.length,
                offlineOnuCount: offlineOnus.length,
                data
            });
        }

        // Jika tidak mengirim onuId maupun ponId, tarik data dari SEMUA PON
        const { html: ponHtml } = await fetchPage('/onuLlidMacPonList.asp');
        const pons = P.parsePonList(ponHtml);

        const data = await Promise.all(pons.map(async (pon) => {
            try {
                const { html: onuListHtml } = await fetchPage(`/onuLlidMacOnuList.asp?oltponno=${encodeURIComponent(pon.ponId)}`);
                const onus = P.parseOnuList(onuListHtml);
                const activeOnus = onus.filter(o => o.status === 'Up');

                const onusWithMac = await Promise.all(activeOnus.map(async (onu) => {
                    try {
                        const { html: macHtml } = await fetchPage(`/onuLlidMac.asp?onuno=${encodeURIComponent(onu.onuId)}&oltponno=${encodeURIComponent(pon.ponId)}`);
                        const macTable = P.parseOnuLlidMac(macHtml);

                        const onuVendor = await getVendor(onu.macAddr);
                        const macTableWithVendor = await Promise.all(macTable.map(async (item) => ({
                            index: item.index,
                            macAddress: item.macAddress,
                            macVendor: await getVendor(item.macAddress)
                        })));

                        return {
                            onuId: onu.onuId,
                            name: onu.name,
                            macAddress: onu.macAddr,
                            macVendor: onuVendor,
                            status: onu.status,
                            macTable: macTableWithVendor
                        };
                    } catch (e) {
                        return {
                            onuId: onu.onuId,
                            name: onu.name,
                            macAddress: onu.macAddr,
                            macVendor: await getVendor(onu.macAddr),
                            status: onu.status,
                            macTable: [],
                            error: e.message
                        };
                    }
                }));

                return {
                    ponId: pon.ponId,
                    information: pon.information,
                    stats: pon.stats,
                    onus: onusWithMac
                };
            } catch (e) {
                return {
                    ponId: pon.ponId,
                    information: pon.information,
                    error: e.message,
                    onus: []
                };
            }
        }));

        return res.json({
            ok: true,
            description: 'Semua ONU MAC Table dari semua PON port',
            data
        });

    } catch (e) {
        next(e);
    }
});

module.exports = router;

