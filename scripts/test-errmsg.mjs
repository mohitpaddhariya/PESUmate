// Self-check for errMsg() in content.js — the fix for "Failed: [object Object]".
// Run: node scripts/test-errmsg.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const src = readFileSync(new URL('../content.js', import.meta.url), 'utf8');
const m = src.match(/function errMsg\(err\) \{[\s\S]*?\n  \}/);
assert.ok(m, 'errMsg() not found in content.js');
const errMsg = new Function(m[0] + '; return errMsg;')();

// The actual bug: jQuery rejects with a jqXHR, which has no .message.
const jqXHR = { readyState: 4, status: 403, statusText: 'Forbidden', responseText: '' };
assert.equal(errMsg(jqXHR), 'HTTP 403 Forbidden');
assert.ok(!errMsg(jqXHR).includes('[object Object]'));

// status 0 = CORS block / offline / aborted — jQuery's most common failure.
assert.match(errMsg({ status: 0, statusText: 'error' }), /^Network error/);

assert.equal(errMsg(new Error('boom')), 'boom');
assert.equal(errMsg('plain string'), 'plain string');
assert.equal(errMsg(null), 'Unknown error');
assert.equal(errMsg(undefined), 'Unknown error');
assert.equal(errMsg({ statusText: 'timeout' }), 'timeout');
// Bare object with nothing useful still must not be silently unreadable upstream.
assert.equal(errMsg({}), '[object Object]');

console.log('errMsg: all checks passed');
