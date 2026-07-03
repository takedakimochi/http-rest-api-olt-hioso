'use strict';

const { Router }     = require('express');
const { fetchPage }  = require('../session');
const P              = require('../parser');
const { getVendor }  = require('../macLookup');

const router = Router();

// ──────────────────────────────────────────────────────────────────
//  GET /api/system/info
// ──────────────────────────────────────────────────────────────────
router.get('/info', async (req, res, next) => {
    try {
        const { html } = await fetchPage('/system.asp');
        res.json({ ok: true, data: P.parseSystemInfo(html) });
    } catch (e) { next(e); }
});

// ──────────────────────────────────────────────────────────────────
//  GET /api/system/users
// ──────────────────────────────────────────────────────────────────
router.get('/users', async (req, res, next) => {
    try {
        const { html } = await fetchPage('/userOverview.asp');
        res.json({ ok: true, data: P.parseUserList(html) });
    } catch (e) { next(e); }
});

// ──────────────────────────────────────────────────────────────────
//  GET /api/system/network
// ──────────────────────────────────────────────────────────────────
router.get('/network', async (req, res, next) => {
    try {
        const { html } = await fetchPage('/host_ip.asp');
        res.json({ ok: true, data: P.parseNetworkConfig(html) });
    } catch (e) { next(e); }
});

// ──────────────────────────────────────────────────────────────────
//  GET /api/system/time
// ──────────────────────────────────────────────────────────────────
router.get('/time', async (req, res, next) => {
    try {
        const { html } = await fetchPage('/ntp.asp');
        res.json({ ok: true, data: P.parseSystemTime(html) });
    } catch (e) { next(e); }
});

// ──────────────────────────────────────────────────────────────────
//  GET /api/system/log
//  Query params:
//    - filter: string filter kata kunci (contoh: Lost, Discovery, dying-gasp)
// ──────────────────────────────────────────────────────────────────
router.get('/log', async (req, res, next) => {
    try {
        const filter = req.query.filter || '';
        
        // Set filter di OLT
        await fetchPage(`/goform/setLogSearchTarget?log_target=${encodeURIComponent(filter)}`);
        
        // Ambil halaman log page 0
        const { html } = await fetchPage('/sys_log_page.asp?page=0');
        const rawLines = P.parseSysLogPage(html);
        
        // Parse tiap baris log menjadi terstruktur
        const parsedLines = await Promise.all(rawLines.map(async (line) => {
            // Contoh: Jun 21 08:25:54 EPON: Slot 0/1/2:20 Onu 58:60:10:08:1c:68[HARMADI] Lost
            const eponMatch = line.match(/^([A-Za-z]{3}\s+\d+\s+\d{2}:\d{2}:\d{2})\s+([A-Za-z0-9_-]+):\s+Slot\s+([0-9/:]+)\s+Onu\s+([0-9a-fA-F:]{17})\[([^\]]*)\]\s+(.*)$/i);
            if (eponMatch) {
                const mac = eponMatch[4];
                return {
                    timestamp: eponMatch[1],
                    module: eponMatch[2],
                    onuId: eponMatch[3],
                    macAddress: mac,
                    macVendor: await getVendor(mac),
                    onuName: eponMatch[5],
                    event: eponMatch[6].trim(),
                    raw: line
                };
            }
            
            // Contoh: Jun 21 10:59:46 Web: web connection , current web client=1
            const genericMatch = line.match(/^([A-Za-z]{3}\s+\d+\s+\d{2}:\d{2}:\d{2})\s+([A-Za-z0-9_-]+):\s+(.*)$/i);
            if (genericMatch) {
                return {
                    timestamp: genericMatch[1],
                    module: genericMatch[2],
                    event: null,
                    message: genericMatch[3].trim(),
                    raw: line
                };
            }
            
            return {
                timestamp: null,
                module: null,
                event: null,
                message: line,
                raw: line
            };
        }));
        
        res.json({
            ok: true,
            filter: filter || null,
            count: parsedLines.length,
            data: parsedLines
        });
    } catch (e) { next(e); }
});

// ──────────────────────────────────────────────────────────────────
//  GET /api/system/tasks
// ──────────────────────────────────────────────────────────────────
router.get('/tasks', async (req, res, next) => {
    try {
        const { html } = await fetchPage('/sysTask.asp');
        res.json({ ok: true, data: P.parseSystemTask(html) });
    } catch (e) { next(e); }
});

// ──────────────────────────────────────────────────────────────────
//  GET /api/system/http-port
// ──────────────────────────────────────────────────────────────────
router.get('/http-port', async (req, res, next) => {
    try {
        const { html } = await fetchPage('/httpPort.asp');
        res.json({ ok: true, data: P.parseHttpPort(html) });
    } catch (e) { next(e); }
});

// ──────────────────────────────────────────────────────────────────
//  GET /api/system/cloud
// ──────────────────────────────────────────────────────────────────
router.get('/cloud', async (req, res, next) => {
    try {
        const { html } = await fetchPage('/system_cloud.asp');
        res.json({ ok: true, data: P.parseCloudConfig(html) });
    } catch (e) { next(e); }
});

// ──────────────────────────────────────────────────────────────────
//  GET /api/system/log-config
// ──────────────────────────────────────────────────────────────────
router.get('/log-config', async (req, res, next) => {
    try {
        const { html } = await fetchPage('/logServer.asp');
        res.json({ ok: true, data: P.parseLogServer(html) });
    } catch (e) { next(e); }
});

module.exports = router;
