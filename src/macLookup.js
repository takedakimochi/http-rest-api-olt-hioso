'use strict';

const { toVendor } = require('@network-utils/vendor-lookup');

/**
 * Mendapatkan vendor MAC address menggunakan @network-utils/vendor-lookup.
 * @param {string} macAddress
 * @returns {Promise<string>}
 */
async function getVendor(macAddress) {
    if (!macAddress) return 'Unknown';
    try {
        const vendor = toVendor(macAddress);
        if (!vendor || vendor === '<random MAC>') {
            return 'Unknown';
        }
        return vendor;
    } catch (e) {
        return 'Unknown';
    }
}

module.exports = {
    getVendor
};
