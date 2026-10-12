/**
 * tests/normalizePhone.test.js
 * Unit test suite for unified Israeli phone normalization (Standard 3.2).
 */

const assert = require('assert');
const { normalizePhone } = require('../functions/phone');

const testCases = [
  // 1. Standard 10-digit mobile
  { input: '0501234567', expected: '0501234567', desc: 'Standard 10-digit mobile' },
  // 2. Mobile with dashes
  { input: '050-123-4567', expected: '0501234567', desc: 'Mobile with dashes' },
  // 3. Mobile with single dash
  { input: '054-1234567', expected: '0541234567', desc: 'Mobile with single dash' },
  // 4. Mobile with spaces
  { input: '052 838 1886', expected: '0528381886', desc: 'Mobile with spaces' },
  // 5. Mobile with parentheses
  { input: '(053) 9876543', expected: '0539876543', desc: 'Mobile with parentheses' },
  // 6. International +972 prefix
  { input: '+972501234567', expected: '0501234567', desc: 'International +972 prefix' },
  // 7. International +972 prefix with dashes
  { input: '+972-52-8381886', expected: '0528381886', desc: 'International +972 with dashes' },
  // 8. International 972 without plus
  { input: '972541234567', expected: '0541234567', desc: 'International 972 without +' },
  // 9. 9-digit without leading 0 (e.g. 541234567)
  { input: '541234567', expected: '0541234567', desc: '9-digit without leading 0' },
  // 10. Number type input
  { input: 501234567, expected: '0501234567', desc: 'Number type input 9 digits' },
  // 11. String with leading/trailing spaces
  { input: '  0587654321  ', expected: '0587654321', desc: 'Leading and trailing spaces' },
  // 12. Invalid: null
  { input: null, expected: null, desc: 'Invalid: null input' },
  // 13. Invalid: undefined
  { input: undefined, expected: null, desc: 'Invalid: undefined input' },
  // 14. Invalid: empty string
  { input: '', expected: null, desc: 'Invalid: empty string' },
  // 15. Invalid: too short
  { input: '05012345', expected: null, desc: 'Invalid: too short (8 digits)' },
  // 16. Invalid: too long
  { input: '05012345678', expected: null, desc: 'Invalid: too long (11 digits)' },
  // 17. Invalid: landline 03 prefix
  { input: '031234567', expected: null, desc: 'Invalid: landline 03 prefix' },
  // 18. Invalid: landline 02 prefix with 10 digits
  { input: '0212345678', expected: null, desc: 'Invalid: landline 02 with 10 digits' },
  // 19. Invalid: letters/alphanumeric
  { input: '050123456a', expected: null, desc: 'Invalid: contains letter' },
  // 20. Invalid: boolean input
  { input: true, expected: null, desc: 'Invalid: boolean input' },
  // 21. Invalid: object input
  { input: { phone: '0501234567' }, expected: null, desc: 'Invalid: object input' },
  // 22. Invalid: special characters only
  { input: '---()---', expected: null, desc: 'Invalid: symbols only' }
];

console.log('--- Running normalizePhone Unit Tests ---');
let passed = 0;
let failed = 0;

testCases.forEach((tc, idx) => {
  const result = normalizePhone(tc.input);
  if (result === tc.expected) {
    console.log(`  [PASS #${idx + 1}] ${tc.desc}: "${tc.input}" -> ${JSON.stringify(result)}`);
    passed++;
  } else {
    console.error(`  [FAIL #${idx + 1}] ${tc.desc}: input "${tc.input}", expected ${JSON.stringify(tc.expected)}, got ${JSON.stringify(result)}`);
    failed++;
  }
});

console.log(`\nResults: ${passed} passed, ${failed} failed out of ${testCases.length} tests.`);
if (failed > 0) {
  process.exit(1);
}
console.log('✅ All normalizePhone tests passed!');
process.exit(0);
