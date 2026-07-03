'use strict';

const { Router }    = require('express');
const { fetchPage } = require('../session');
const P             = require('../parser');

const router = Router();

// ──────────────────────────────────────────────────────────────────
//  GET /api/traffic/vlan
// ──────────────────────────────────────────────────────────────────
router.get('/vlan', async (req, res, next) => {
    try {
        const { html } = await fetchPage('/vlan.asp');
        res.json({ ok: true, data: P.parseVlan(html) });
    } catch (e) { next(e); }
});

module.exports = router;
