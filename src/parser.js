'use strict';

/**
 * ══════════════════════════════════════════════════════════════════
 *  PARSER — HTML OLT Hioso → Structured JSON
 *
 *  OLT GoAhead-Webs menyimpan data sebagai JavaScript Array di dalam
 *  HTML, bukan sebagai JSON. Contoh:
 *    var olttable = new Array('0/1','KIOS_R28','78:5c:72:50:00:00','c230','2','Up');
 *
 *  Parser ini mengekstrak array JS tersebut lalu memetakannya ke
 *  field yang bermakna sesuai tiap halaman.
 * ══════════════════════════════════════════════════════════════════
 */

// ──────────────────────────────────────────────────────────────────
//  HELPER UMUM
// ──────────────────────────────────────────────────────────────────

/**
 * Ekstrak satu JS Array dari HTML.
 * @param {string} html
 * @param {string} varName  nama variabel JS (contoh: 'olttable')
 * @returns {string[]}
 */
function extractJsArray(html, varName) {
    // Cocokkan: var varName = new Array( ... );
    // Juga cocokkan: var varName=new Array( ... )
    const re = new RegExp(
        `var\\s+${varName}\\s*=\\s*new\\s+Array\\s*\\(([\\s\\S]*?)\\)\\s*;`,
        'i'
    );
    const match = html.match(re);
    if (!match) return [];

    const raw = match[1].trim();
    if (!raw) return [];

    // Parse nilai array — bisa pakai tanda petik tunggal atau ganda
    const items = [];
    const tokenRe = /['"]([^'"]*)['"]/g;
    let m;
    while ((m = tokenRe.exec(raw)) !== null) {
        items.push(m[1]);
    }
    // Kalau tidak ada string, coba angka tanpa petik
    if (items.length === 0) {
        raw.split(',').forEach(v => {
            const trimmed = v.trim();
            if (trimmed !== '') items.push(trimmed);
        });
    }
    return items;
}

/**
 * Bagi flat array menjadi array of object dengan field yg ditentukan.
 * @param {string[]} flat   array flat
 * @param {string[]} fields nama field per kolom
 * @returns {object[]}
 */
function chunkToObjects(flat, fields) {
    const n = fields.length;
    const result = [];
    for (let i = 0; i + n <= flat.length; i += n) {
        const obj = {};
        fields.forEach((f, j) => { obj[f] = flat[i + j]; });
        result.push(obj);
    }
    return result;
}

/**
 * Ambil semua input[name=value] dari HTML sebagai plain object.
 * @param {string} html
 * @returns {object}
 */
function extractFormInputs(html) {
    const result = {};
    // Tangkap value dari input biasa dan select
    const re = /<input[^>]+name=['"']?(\w+)['"']?[^>]*(?:value=['"]([^'"]*)['"'])?/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
        if (!(m[1] in result)) {   // ambil value pertama saja
            result[m[1]] = m[2] || '';
        }
    }
    return result;
}

/**
 * Ambil satu variabel JS skalar dari HTML.
 * Contoh: var SystemName = "KIOS";
 */
function extractJsVar(html, varName) {
    const re = new RegExp(`var\\s+${varName}\\s*=\\s*['"]?([^;'"\\n]+)['"]?\\s*;`, 'i');
    const m = html.match(re);
    return m ? m[1].trim() : null;
}

// ──────────────────────────────────────────────────────────────────
//  PARSER PER HALAMAN
// ──────────────────────────────────────────────────────────────────

/** system.asp — System Information */
function parseSystemInfo(html) {
    // Data disimpan dalam JS array sysInfo[]:
    // sysInfo[0..2] = nama, deskripsi, lokasi
    // sysInfo[3..] = nilai label
    const sysInfo = extractJsArray(html, 'sysInfo');

    // Fallback: coba ambil via var langsung
    const sysName  = extractJsVar(html, 'SysName')  || sysInfo[0] || '';
    const sysDesc  = extractJsVar(html, 'SysDesc')  || sysInfo[1] || '';
    const sysLoc   = extractJsVar(html, 'SysLoc')   || sysInfo[2] || '';

    // rowName array berisi label-label UI
    const rowName  = extractJsArray(html, 'rowName');

    // Waktu & uptime dari JS var
    const yyyy = extractJsVar(html, 'yyyy');
    const mm   = extractJsVar(html, 'mm');
    const dd   = extractJsVar(html, 'dd');
    const hour = extractJsVar(html, 'hour');
    const minute = extractJsVar(html, 'minute');
    const second = extractJsVar(html, 'second');
    const up_days    = extractJsVar(html, 'up_days');
    const up_hours   = extractJsVar(html, 'up_hours');
    const up_minutes = extractJsVar(html, 'up_minutes');
    const up_seconds = extractJsVar(html, 'up_seconds');

    // Model dari top.asp (jika tersedia)
    const model = extractJsVar(html, 'model_str') || 'HA7302CST';

    // Bangun objek dari sysInfo + rowName (jika ada)
    const extra = {};
    if (rowName.length > 0 && sysInfo.length > 3) {
        rowName.forEach((label, i) => {
            if (label && sysInfo[i + 3] !== undefined) {
                const key = label.replace(/\s+/g, '_').toLowerCase();
                extra[key] = sysInfo[i + 3];
            }
        });
    }

    return {
        systemName       : sysName,
        systemDescription: sysDesc,
        systemLocation   : sysLoc,
        model            : model,
        currentTime      : (yyyy && mm && dd)
            ? `${yyyy}-${mm}-${dd} ${hour || ''}:${minute || ''}:${second || ''}`
            : null,
        uptime: (up_days !== null)
            ? { days: up_days, hours: up_hours, minutes: up_minutes, seconds: up_seconds }
            : null,
        ...extra,
    };
}

/** userOverview.asp — User List */
function parseUserList(html) {
    const raw = extractJsArray(html, 'userList');
    // Format: nama, grup, nama, grup, ...
    return chunkToObjects(raw, ['username', 'group']);
}

/** host_ip.asp — Network Config */
function parseNetworkConfig(html) {
    const raw = extractJsArray(html, 'NetArr');
    // Format: ip, netmask, gateway, dhcp(0/1)
    return {
        deviceIp : raw[0] || null,
        netmask  : raw[1] || null,
        gateway  : raw[2] || null,
        dhcp     : raw[3] === '1',
    };
}

/** ntp.asp — System Time & NTP */
function parseSystemTime(html) {
    const raw = extractJsArray(html, 'systemTime');
    // Format: year, month, day, hour, minute, second, ntpServer
    return {
        year      : raw[0] || null,
        month     : raw[1] || null,
        day       : raw[2] || null,
        hour      : raw[3] || null,
        minute    : raw[4] || null,
        second    : raw[5] || null,
        currentTime: raw.length >= 6
            ? `${raw[0]}-${raw[1]}-${raw[2]} ${raw[3]}:${raw[4]}:${raw[5]}`
            : null,
        ntpServer : raw[6] || null,
    };
}

/** sysTask.asp — System Task */
function parseSystemTask(html) {
    const raw = extractJsArray(html, 'pollingparam');
    // Format: param[0..4]
    return {
        params: raw,
        raw   : raw,
    };
}

/** httpPort.asp — HTTP Port */
function parseHttpPort(html) {
    const inputs = extractFormInputs(html);
    // Cari variabel port
    const portMatch = html.match(/var\s+httpPort\s*=\s*(\d+)/i)
                   || html.match(/value=['"']?(\d+)['"']?[^>]*name=['"']?port/i);
    return {
        httpPort: portMatch ? portMatch[1] : (inputs['port'] || inputs['httpport'] || null),
        inputs  : inputs,
    };
}

/** system_cloud.asp — Remote Cloud */
function parseCloudConfig(html) {
    const raw = extractJsArray(html, 'SysCloudConf');
    // Format: enabled(0/1), serverAddr, token
    return {
        enabled   : raw[0] === '1',
        serverAddr: raw[1] || null,
        token     : raw[2] || null,
    };
}

/** sys_log.asp — System Log */
function parseSysLog(html) {
    // Log entries biasanya di-generate lewat JS atau di dalam table
    // Coba cari di dalam <pre> atau <textarea> atau baris teks
    const logMatch = html.match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/i)
                  || html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
    const raw = extractJsArray(html, 'logTable') || [];

    // Fallback: ambil dari body teks bersih
    let entries = [];
    if (logMatch) {
        entries = logMatch[1]
            .split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 0);
    } else if (raw.length > 0) {
        entries = raw;
    }

    return { entries, count: entries.length };
}

/** sys_log_page.asp — System Log Page */
function parseSysLogPage(html) {
    const entries = [];
    const re = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let m;
    while ((m = re.exec(html)) !== null) {
        const text = m[1].replace(/<[^>]*>/g, '').trim();
        if (text) {
            entries.push(text);
        }
    }
    return entries;
}

/** logServer.asp — Syslog Config */
function parseLogServer(html) {
    const raw = extractJsArray(html, 'syslogInfo');
    return {
        syslogServer: raw[0] || null,
    };
}

/** oltOverview.asp — OLT Table */
function parseOltOverview(html) {
    const raw = extractJsArray(html, 'olttable');
    return chunkToObjects(raw, ['id', 'name', 'macAddr', 'version', 'ponNum', 'status']);
}

/** oltCtc.asp — OLT CTC */
function parseOltCtc(html) {
    const raw = extractJsArray(html, 'oltCtcTable');
    return chunkToObjects(raw, ['id', 'name', 'macAddr', 'version', 'ponNum', 'status', 'ctcEnable', 'ctcExtEnable']);
}

/** oltBridge.asp — OLT Bridge */
function parseOltBridge(html) {
    const raw = extractJsArray(html, 'oltBridgeTable');
    return chunkToObjects(raw, ['id', 'status', 'macLearningLimit']);
}

/** oltAuthMode.asp — OLT Auth Mode */
function parseOltAuthMode(html) {
    const raw = extractJsArray(html, 'oltAuthModeTable');
    return chunkToObjects(raw, ['id', 'name', 'macAddr', 'version', 'ponNum', 'status', 'authMode']);
}

/** onuConfigPonList.asp — PON List */
function parsePonList(html) {
    const raw = extractJsArray(html, 'ponListTable');
    const rows = chunkToObjects(raw, ['ponId', 'information']);

    // Filter dan parse information string: "ONU Total=6,Online=6,Offline=0"
    return rows
        .filter(r => r.information && r.information !== 'N/A' && r.ponId)
        .map(r => {
            const totalMatch   = r.information.match(/Total=(\d+)/i);
            const onlineMatch  = r.information.match(/Online=(\d+)/i);
            const offlineMatch = r.information.match(/Offline=(\d+)/i);
            return {
                ponId      : r.ponId,
                information: r.information,
                stats      : {
                    total  : totalMatch   ? parseInt(totalMatch[1])   : null,
                    online : onlineMatch  ? parseInt(onlineMatch[1])  : null,
                    offline: offlineMatch ? parseInt(offlineMatch[1]) : null,
                },
            };
        });
}

/** onuConfigOnuList.asp?oltponno=X — ONU List per PON */
function parseOnuList(html) {
    // Array: ponOnuTable, 13 field per ONU
    // Fields: onuId, name, macAddr, status, distance(m), firmware, port,
    //         txPower, rxPower1, rxPower2, rxPower3, rxPower(dBm), rawDist
    const raw = extractJsArray(html, 'ponOnuTable');

    if (raw.length === 0) return [];

    const rows = chunkToObjects(raw, [
        'onuId', 'name', 'macAddr', 'status',
        'distance', 'firmware', 'port',
        'txPower', 'rxPower1', 'rxPower2',
        'rxPower3', 'rxPowerDbm', 'rawDistance',
    ]);

    // Konversi distance ke meter (formula dari JS OLT: distance*1.6393 - 157)
    return rows.map(r => {
        const rawDist = parseFloat(r.rawDistance);
        let distanceM = null;
        if (!isNaN(rawDist)) {
            distanceM = Math.max(1, Math.round((rawDist * 1.6393) - 157));
        }
        return {
            onuId       : r.onuId,
            name        : r.name,
            macAddr     : r.macAddr,
            status      : r.status,
            firmware    : r.firmware,
            port        : r.port,
            distanceM   : distanceM,
            txPower     : r.txPower,
            rxPowerDbm  : r.rxPowerDbm !== '-inf' ? r.rxPowerDbm : null,
        };
    });
}

/** onuSearch.asp — Hasil pencarian ONU */
function parseOnuSearch(html) {
    const result = extractJsArray(html, 'searchResult');
    const ctcStatus = extractJsArray(html, 'ctc_status');
    return {
        searchResult: result,
        ctcStatusLabels: ctcStatus,
        found: result.length > 0,
    };
}

/** onuIgmpSnoopingPonList.asp — IGMP Snooping PON List */
function parseIgmpSnooping(html) {
    const raw = extractJsArray(html, 'ponListTable')
             || extractJsArray(html, 'igmpPonList');
    return chunkToObjects(raw, ['ponId', 'information']);
}

/** onuDeletePonList.asp — Delete ONU PON List */
function parseDeletePonList(html) {
    const raw = extractJsArray(html, 'ponListTable')
             || extractJsArray(html, 'deletePonList');
    return chunkToObjects(raw, ['ponId', 'information']);
}

/** portOverview.asp — Port Config & Status
 *  Array: portWorkStatus, 5 field per port:
 *  portId, portEnable, linkStatus, portSpeed, flowControl
 */
function parsePortOverview(html) {
    const raw = extractJsArray(html, 'portWorkStatus');
    if (raw.length === 0) return [];

    return chunkToObjects(raw, [
        'portId', 'portEnable', 'linkStatus', 'portSpeed', 'flowControl',
    ]).map(p => ({
        portId      : p.portId,
        portEnable  : p.portEnable,
        linkStatus  : p.linkStatus,
        isUp        : p.linkStatus === 'LinkUp',
        portSpeed   : p.portSpeed,
        flowControl : p.flowControl,
    }));
}

function parseVlan(html) {
    const raw = extractJsArray(html, 'vlanInfo')
             || extractJsArray(html, 'vlanTable');
    if (raw.length === 0) {
        // vlan.asp mungkin load via AJAX / iframe
        return { note: 'VLAN data loaded dynamically via JavaScript', entries: [] };
    }
    return { entries: raw };
}

/** onuLlidMac.asp — ONU MAC Address Table
 *  Array: llidmactab
 */
function parseOnuLlidMac(html) {
    const raw = extractJsArray(html, 'llidmactab');
    return raw.map((mac, idx) => ({
        index: idx + 1,
        macAddress: mac,
    }));
}

// ──────────────────────────────────────────────────────────────────
//  EXPORT
// ──────────────────────────────────────────────────────────────────
module.exports = {
    // Helpers
    extractJsArray,
    extractFormInputs,
    extractJsVar,
    chunkToObjects,

    // System
    parseSystemInfo,
    parseUserList,
    parseNetworkConfig,
    parseSystemTime,
    parseSystemTask,
    parseHttpPort,
    parseCloudConfig,
    parseSysLog,
    parseSysLogPage,
    parseLogServer,

    // OLT
    parseOltOverview,
    parseOltCtc,
    parseOltBridge,
    parseOltAuthMode,

    // ONU
    parsePonList,
    parseOnuList,
    parseOnuSearch,
    parseIgmpSnooping,
    parseDeletePonList,
    parseOnuLlidMac,

    // Traffic
    parseVlan,

    // Port Config
    parsePortOverview,
};

