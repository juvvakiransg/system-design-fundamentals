import test from 'node:test';
import assert from 'node:assert/strict';
import { validateUrl, validateCode } from '../src/validation.js';
test('accepts normal HTTPS URL', () => assert.equal(validateUrl('https://example.com/path?q=1'), true));
test('rejects unsafe URL schemes', () => assert.equal(validateUrl('javascript:alert(1)'), false));
test('rejects credentials in URL', () => assert.equal(validateUrl('https://user:pass@example.com'), false));
test('rejects localhost and private IPv4', () => { assert.equal(validateUrl('http://localhost/admin'), false); assert.equal(validateUrl('http://192.168.1.1'), false); });
test('validates short codes', () => { assert.equal(validateCode('aB7x9K'), true); assert.equal(validateCode('../etc'), false); });
