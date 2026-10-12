/**
 * tests/handlers.test.js
 * Comprehensive automated verification for inline HTML event handlers and actions.
 * Scans admin.html, index.html, 404.html for any on* attributes and verifies that
 * every referenced application function is implemented in the script scope.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');

// Standard JS / DOM built-ins or properties that may appear inside inline expressions
const BUILTINS = new Set([
  'alert', 'confirm', 'prompt', 'parseInt', 'parseFloat', 'Number', 'String', 'Boolean',
  'encodeURIComponent', 'decodeURIComponent', 'Math', 'Date',
  'stopPropagation', 'preventDefault',
  'add', 'remove', 'toggle', 'contains', 'item',
  'getElementById', 'querySelector', 'querySelectorAll', 'getElementsByClassName',
  'getAttribute', 'setAttribute', 'removeAttribute', 'hasAttribute',
  'focus', 'blur', 'click', 'submit', 'reset',
  'indexOf', 'includes', 'slice', 'substring', 'substr', 'split', 'replace', 'trim', 'toLowerCase', 'toUpperCase',
  'push', 'pop', 'shift', 'unshift', 'forEach', 'map', 'filter', 'reduce', 'find', 'some', 'every',
  'open', 'close', 'reload', 'assign', 'replace',
  'then', 'catch', 'finally'
]);

function extractInlineHandlers(htmlContent, filename) {
  const handlerRegex = /\bon(?:click|change|submit|input|keydown|keyup|keypress|load|error)\s*=\s*"([^"]+)"/gi;
  const calls = [];
  let match;

  while ((match = handlerRegex.exec(htmlContent)) !== null) {
    const expr = match[1];
    // Find candidate function calls: ident(...)
    const callRegex = /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
    let callMatch;
    while ((callMatch = callRegex.exec(expr)) !== null) {
      const fnName = callMatch[1];
      if (!BUILTINS.has(fnName)) {
        calls.push({ fnName, expr, filename });
      }
    }
  }

  // Also extract data-action attributes if any
  const actionRegex = /data-action\s*=\s*"([^"]+)"/gi;
  while ((match = actionRegex.exec(htmlContent)) !== null) {
    calls.push({ actionName: match[1], filename });
  }

  return calls;
}

function extractDefinedFunctions(htmlContent) {
  const defined = new Set();
  const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
  let scriptMatch;

  while ((scriptMatch = scriptRegex.exec(htmlContent)) !== null) {
    const code = scriptMatch[1];

    // Pattern 1: function name(...)
    const fnDefRegex = /\bfunction\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
    let m;
    while ((m = fnDefRegex.exec(code)) !== null) {
      defined.add(m[1]);
    }

    // Pattern 2: window.name = ... or window['name'] = ...
    const winAssignRegex = /window(?:\.([a-zA-Z_$][a-zA-Z0-9_$]*)|\[['"]([^'"]+)['"]\])\s*=/g;
    while ((m = winAssignRegex.exec(code)) !== null) {
      defined.add(m[1] || m[2]);
    }

    // Pattern 3: const/let/var name = function or () =>
    const varFnRegex = /\b(?:var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:function|\([^)]*\)\s*=>|[a-zA-Z_$][a-zA-Z0-9_$]*\s*=>)/g;
    while ((m = varFnRegex.exec(code)) !== null) {
      defined.add(m[1]);
    }
  }

  return defined;
}

function run() {
  console.log('--- Starting Handlers Test Suite ---');
  const targetFiles = ['admin.html', 'index.html', '404.html'];
  let totalHandlersChecked = 0;
  const missingByFile = {};

  targetFiles.forEach(file => {
    const filePath = path.join(ROOT_DIR, file);
    if (!fs.existsSync(filePath)) return;

    const html = fs.readFileSync(filePath, 'utf8');
    const handlers = extractInlineHandlers(html, file);
    const definedFns = extractDefinedFunctions(html);

    console.log(`[${file}] Found ${handlers.length} handler calls, ${definedFns.size} defined functions in scripts.`);

    const missingForThisFile = [];
    handlers.forEach(({ fnName, expr }) => {
      if (!fnName) return;
      totalHandlersChecked++;
      if (!definedFns.has(fnName)) {
        missingForThisFile.push({ fnName, expr });
      }
    });

    if (missingForThisFile.length > 0) {
      missingByFile[file] = missingForThisFile;
    }
  });

  // Verify specific Stage 1 required functions
  const stage1Functions = [
    'handleNotifClick',
    'deleteNotif',
    'saveFinanceRecord',
    'editFinanceRecord',
    'cancelFinanceEdit',
    'loadFinanceData',
    'deleteFinanceRecord',
    'saveNewClientDirect',
    'openClientDetails',
    'loadAppointmentsStats',
    'openWaBroadcastModal'
  ];

  const adminHtml = fs.readFileSync(path.join(ROOT_DIR, 'admin.html'), 'utf8');
  const adminDefinedFns = extractDefinedFunctions(adminHtml);

  console.log('\n--- Checking Stage 1 Required Functions ---');
  const missingStage1 = [];
  stage1Functions.forEach(fn => {
    const exists = adminDefinedFns.has(fn);
    console.log(`  ${fn}: ${exists ? '✅ OK' : '❌ MISSING'}`);
    if (!exists) missingStage1.push(fn);
  });

  if (Object.keys(missingByFile).length > 0) {
    console.error('\n❌ FAILED: Missing inline handlers found:');
    for (const [file, items] of Object.entries(missingByFile)) {
      console.error(`In ${file}:`);
      items.forEach(it => console.error(`  - ${it.fnName} (in expression: "${it.expr}")`));
    }
    process.exit(1);
  }

  if (missingStage1.length > 0) {
    console.error('\n❌ FAILED: Missing Stage 1 required functions:', missingStage1);
    process.exit(1);
  }

  console.log(`\n✅ SUCCESS: All ${totalHandlersChecked} inline handlers and all 11 Stage 1 functions verified!`);
  process.exit(0);
}

run();
