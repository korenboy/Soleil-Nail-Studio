/**
 * tests/dateAndPhoneHelpers.test.js
 * Unit tests verifying date handling and WhatsApp phone sanitization.
 */

const assert = require('assert');

// The implementations from app.js and admin.html
function getLocalDateString(dateInput = new Date()) {
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return dateInput;
    }
    const d = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseLocalDate(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return new Date();
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
}

function formatPhoneForWhatsApp(phone) {
    if (!phone) return '';
    let cleaned = String(phone).replace(/\D/g, '');
    if (cleaned.startsWith('972')) cleaned = cleaned.substring(3);
    if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
    return cleaned;
}

console.log('--- Running Date and Phone Helper Tests ---');

// Test 1: getLocalDateString with specific Date
const d1 = new Date(2026, 9, 13, 1, 30); // 2026-10-13 01:30 local
assert.strictEqual(getLocalDateString(d1), '2026-10-13');
console.log('  [PASS #1] Local date object: 2026-10-13 01:30 -> 2026-10-13');

// Test 2: getLocalDateString with YYYY-MM-DD string
assert.strictEqual(getLocalDateString('2026-12-31'), '2026-12-31');
console.log('  [PASS #2] YYYY-MM-DD string preserved without UTC shift: 2026-12-31 -> 2026-12-31');

// Test 3: parseLocalDate preserves day, month, year
const parsed = parseLocalDate('2026-10-13');
assert.strictEqual(parsed.getFullYear(), 2026);
assert.strictEqual(parsed.getMonth(), 9);
assert.strictEqual(parsed.getDate(), 13);
console.log('  [PASS #3] parseLocalDate parses components safely');

// Test 4: formatPhoneForWhatsApp with Israeli 10-digit mobile
assert.strictEqual(formatPhoneForWhatsApp('0501234567'), '501234567');
console.log('  [PASS #4] 0501234567 -> 501234567');

// Test 5: formatPhoneForWhatsApp with dashes and spaces
assert.strictEqual(formatPhoneForWhatsApp('050-123-4567'), '501234567');
assert.strictEqual(formatPhoneForWhatsApp('052 838 1886'), '528381886');
console.log('  [PASS #5] Dashes and spaces stripped');

// Test 6: formatPhoneForWhatsApp with international +972
assert.strictEqual(formatPhoneForWhatsApp('+972501234567'), '501234567');
assert.strictEqual(formatPhoneForWhatsApp('+972-52-8381886'), '528381886');
console.log('  [PASS #6] International +972 correctly converted');

// Test 7: formatPhoneForWhatsApp with empty or invalid
assert.strictEqual(formatPhoneForWhatsApp(''), '');
assert.strictEqual(formatPhoneForWhatsApp(null), '');
console.log('  [PASS #7] Null/empty handled gracefully');

console.log('✅ All Date & Phone Helper tests passed!\n');
