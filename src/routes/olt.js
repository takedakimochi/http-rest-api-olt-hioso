'use strict';

const { Router }    = require('express');
const { fetchPage } = require('../session');
const P             = require('../parser');
const { getVendor } = require('../macLookup');

const router = Router();

// ──────────────────────────────────────────────────────────────────
//  GET /api/olt/overview
// ──────────────────────────────────────────────────────────────────
router.get('/overview', async (req, res, next) => {
    try {
        const { html } = await fetchPage('/oltOverview.asp');
        const data = P.parseOltOverview(html);
        const dataWithVendor = await Promise.all(data.map(async (item) => ({
            id: item.id,
            name: item.name,
            macAddr: item.macAddr,
            macVendor: await getVendor(item.macAddr),
            version: item.version,
            ponNum: item.ponNum,
            status: item.status
        })));
        res.json({ ok: true, data: dataWithVendor });
    } catch (e) { next(e); }
});

// ──────────────────────────────────────────────────────────────────
//  GET /api/olt/ctc
// ──────────────────────────────────────────────────────────────────
router.get('/ctc', async (req, res, next) => {
    try {
        const { html } = await fetchPage('/oltCtc.asp');
        const data = P.parseOltCtc(html);
        const dataWithVendor = await Promise.all(data.map(async (item) => ({
            id: item.id,
            name: item.name,
            macAddr: item.macAddr,
            macVendor: await getVendor(item.macAddr),
            version: item.version,
            ponNum: item.ponNum,
            status: item.status,
            ctcEnable: item.ctcEnable,
            ctcExtEnable: item.ctcExtEnable
        })));
        res.json({ ok: true, data: dataWithVendor });
    } catch (e) { next(e); }
});

// ──────────────────────────────────────────────────────────────────
//  GET /api/olt/bridge
// ──────────────────────────────────────────────────────────────────
router.get('/bridge', async (req, res, next) => {
    try {
        const { html } = await fetchPage('/oltBridge.asp');
        res.json({ ok: true, data: P.parseOltBridge(html) });
    } catch (e) { next(e); }
});

// ──────────────────────────────────────────────────────────────────
//  GET /api/olt/auth-mode
// ──────────────────────────────────────────────────────────────────
router.get('/auth-mode', async (req, res, next) => {
    try {
        const { html } = await fetchPage('/oltAuthMode.asp');
        const data = P.parseOltAuthMode(html);
        const dataWithVendor = await Promise.all(data.map(async (item) => ({
            id: item.id,
            name: item.name,
            macAddr: item.macAddr,
            macVendor: await getVendor(item.macAddr),
            version: item.version,
            ponNum: item.ponNum,
            status: item.status,
            authMode: item.authMode
        })));
        res.json({ ok: true, data: dataWithVendor });
    } catch (e) { next(e); }
});

module.exports = router;
