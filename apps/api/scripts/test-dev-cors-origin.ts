import assert from 'node:assert/strict';
import { isLocalNetworkDevOrigin } from '../src/infrastructure/cors/dev-cors-origin';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    console.error(`  ✗ ${name}`);
    throw error;
  }
}

console.log('dev-cors-origin tests');

test('allows localhost on dev port', () => {
  assert.equal(isLocalNetworkDevOrigin('http://localhost:5173'), true);
});

test('allows 127.0.0.1 on dev port', () => {
  assert.equal(isLocalNetworkDevOrigin('http://127.0.0.1:5173'), true);
});

test('allows private LAN IP on dev port', () => {
  assert.equal(isLocalNetworkDevOrigin('http://192.168.1.42:5173'), true);
  assert.equal(isLocalNetworkDevOrigin('http://10.0.0.15:5173'), true);
  assert.equal(isLocalNetworkDevOrigin('http://172.16.0.5:5173'), true);
});

test('allows vite preview port', () => {
  assert.equal(isLocalNetworkDevOrigin('http://192.168.1.42:4173'), true);
});

test('rejects public origins', () => {
  assert.equal(isLocalNetworkDevOrigin('https://medscreen.ro'), false);
});

test('rejects LAN IP on unexpected port', () => {
  assert.equal(isLocalNetworkDevOrigin('http://192.168.1.42:3000'), false);
});

console.log('All dev-cors-origin tests passed.');
