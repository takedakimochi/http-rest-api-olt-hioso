'use strict';

const { Router }    = require('express');
const { fetchPage } = require('../session');
const P             = require('../parser');
const { getVendor } = require('../macLookup');

const router = Router();

// ──────────────────────────────────────────────────────────────────
//  GET /api/onu/pon-list
//  Daftar semua PON port beserta statistik ONU
// ──────────────────────────────────────────────────────────────────
router.get('/pon-list', async (req, res, next) => {
    try {
        const { html } = await fetchPage('/onuConfigPonList.asp');
        res.json({ ok: true, data: P.parsePonList(html) });
    } catch (e) { next(e); }
});

// ──────────────────────────────────────────────────────────────────
//  GET /api/onu/list/:ponId
//  Daftar ONU pada satu PON port tertentu
//  Contoh: GET /api/onu/list/0%2F1%2F1
//          GET /api/onu/list/0/1/1   (path segments)
// ──────────────────────────────────────────────────────────────────
router.get('/list/:olt/:pon/:port', async (req, res, next) => {
    try {
        const { olt, pon, port } = req.params;
        const ponId = `${olt}/${pon}/${port}`;
        const { html } = await fetchPage(`/onuConfigOnuList.asp?oltponno=${encodeURIComponent(ponId)}`);
        const data = P.parseOnuList(html);
        
        const dataWithVendor = await Promise.all(data.map(async (onu) => ({
            onuId       : onu.onuId,
            name        : onu.name,
            macAddr     : onu.macAddr,
            macVendor   : await getVendor(onu.macAddr),
            status      : onu.status,
            firmware    : onu.firmware,
            port        : onu.port,
            distanceM   : onu.distanceM,
            txPower     : onu.txPower,
            rxPowerDbm  : onu.rxPowerDbm
        })));

        res.json({ ok: true, ponId, data: dataWithVendor });
    } catch (e) { next(e); }
});

// Alias: query string ?ponId=0/1/1
router.get('/list', async (req, res, next) => {
    try {
        const ponId = req.query.ponId;
        if (!ponId) {
            return res.status(400).json({ ok: false, error: 'Query parameter ponId diperlukan. Contoh: /api/onu/list?ponId=0/1/1' });
        }
        const { html } = await fetchPage(`/onuConfigOnuList.asp?oltponno=${encodeURIComponent(ponId)}`);
        const data = P.parseOnuList(html);
        
        const dataWithVendor = await Promise.all(data.map(async (onu) => ({
            onuId       : onu.onuId,
            name        : onu.name,
            macAddr     : onu.macAddr,
            macVendor   : await getVendor(onu.macAddr),
            status      : onu.status,
            firmware    : onu.firmware,
            port        : onu.port,
            distanceM   : onu.distanceM,
            txPower     : onu.txPower,
            rxPowerDbm  : onu.rxPowerDbm
        })));

        res.json({ ok: true, ponId, data: dataWithVendor });
    } catch (e) { next(e); }
});

// ──────────────────────────────────────────────────────────────────
//  GET /api/onu/search?mac=xx:xx:xx:xx:xx:xx
//  Cari ONU berdasarkan MAC address
// ──────────────────────────────────────────────────────────────────
router.get('/search', async (req, res, next) => {
    try {
        const mac = req.query.mac || '';
        let path = '/onuSearch.asp';
        if (mac) {
            path += `?mac=${encodeURIComponent(mac)}`;
        }
        const { html } = await fetchPage(path);
        const data = P.parseOnuSearch(html);
        
        // Konversi flat array dari parseOnuSearch ke array of objects dengan macVendor
        const chunked = [];
        const flat = data.searchResult;
        for (let i = 0; i + 9 <= flat.length; i += 9) {
            chunked.push({
                onuId       : flat[i + 0],
                name        : flat[i + 1],
                macAddr     : flat[i + 2],
                macVendor   : await getVendor(flat[i + 2]),
                status      : flat[i + 3],
                firmware    : flat[i + 4],
                chipId      : flat[i + 5],
                interfaceNum: flat[i + 6]
            });
        }

        res.json({
            ok: true,
            query: mac || null,
            data: {
                searchResult: chunked,
                ctcStatusLabels: data.ctcStatusLabels,
                found: chunked.length > 0
            }
        });
    } catch (e) { next(e); }
});

// ──────────────────────────────────────────────────────────────────
//  GET /api/onu/igmp-snooping
// ──────────────────────────────────────────────────────────────────
router.get('/igmp-snooping', async (req, res, next) => {
    try {
        const { html } = await fetchPage('/onuIgmpSnoopingPonList.asp');
        res.json({ ok: true, data: P.parseIgmpSnooping(html) });
    } catch (e) { next(e); }
});

// ──────────────────────────────────────────────────────────────────
//  GET /api/onu/delete-list
// ──────────────────────────────────────────────────────────────────
router.get('/delete-list', async (req, res, next) => {
    try {
        const { html } = await fetchPage('/onuDeletePonList.asp');
        res.json({ ok: true, data: P.parseDeletePonList(html) });
    } catch (e) { next(e); }
});

module.exports = router;
