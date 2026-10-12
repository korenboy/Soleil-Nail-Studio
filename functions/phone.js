/**
 * Shared Israeli phone normalization helper.
 * Standard 3.2:
 * - Removes spaces, dashes, parentheses
 * - Converts +972 / 972 to leading 0
 * - Adds leading 0 if 9 digits starting with 5 (e.g. 541234567 -> 0541234567)
 * - Validates strict Israeli mobile format: /^05\d{8}$/
 * - Returns normalized 10-digit phone string, or null if invalid
 */
function normalizePhone(raw) {
    if (!raw || (typeof raw !== 'string' && typeof raw !== 'number')) return null;
    let p = String(raw).trim().replace(/[\s\-()]/g, '');
    if (p.startsWith('+972')) p = '0' + p.slice(4);
    else if (p.startsWith('972')) p = '0' + p.slice(3);
    if (!p.startsWith('0') && p.length === 9 && p.startsWith('5')) {
        p = '0' + p;
    }
    return /^05\d{8}$/.test(p) ? p : null;
}

module.exports = {
    normalizePhone
};
