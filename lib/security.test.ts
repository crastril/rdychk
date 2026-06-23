import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { isSafeUrl } from './security.ts';

describe('isSafeUrl', () => {
    it('should allow safe http and https URLs with public IPs', async () => {
        assert.strictEqual(await isSafeUrl('http://8.8.8.8'), true);
        assert.strictEqual(await isSafeUrl('https://8.8.4.4'), true);
    });

    it('should reject unsafe protocols', async () => {
        assert.strictEqual(await isSafeUrl('ftp://example.com'), false);
        assert.strictEqual(await isSafeUrl('file:///etc/passwd'), false);
        assert.strictEqual(await isSafeUrl('data:text/plain;base64,SGVsbG8sIFdvcmxkIQ%3D%3D'), false);
        assert.strictEqual(await isSafeUrl('javascript:alert(1)'), false);
        assert.strictEqual(await isSafeUrl('gopher://example.com'), false);
    });

    it('should reject invalid URLs', async () => {
        assert.strictEqual(await isSafeUrl('not a url'), false);
        assert.strictEqual(await isSafeUrl(''), false);
    });

    it('should reject private and loopback IPv4 addresses', async () => {
        // Loopback
        assert.strictEqual(await isSafeUrl('http://127.0.0.1'), false);
        assert.strictEqual(await isSafeUrl('http://127.255.255.255'), false);

        // Current network
        assert.strictEqual(await isSafeUrl('http://0.0.0.0'), false);

        // Class A private
        assert.strictEqual(await isSafeUrl('http://10.0.0.1'), false);
        assert.strictEqual(await isSafeUrl('http://10.255.255.255'), false);

        // Class B private
        assert.strictEqual(await isSafeUrl('http://172.16.0.1'), false);
        assert.strictEqual(await isSafeUrl('http://172.31.255.255'), false);

        // Class C private
        assert.strictEqual(await isSafeUrl('http://192.168.0.1'), false);
        assert.strictEqual(await isSafeUrl('http://192.168.255.255'), false);

        // Link-local
        assert.strictEqual(await isSafeUrl('http://169.254.169.254'), false);
    });

    it('should reject private and loopback IPv6 addresses', async () => {
        // Loopback
        assert.strictEqual(await isSafeUrl('http://[::1]'), false);

        // Unique Local Address
        assert.strictEqual(await isSafeUrl('http://[fc00::1]'), false);
        assert.strictEqual(await isSafeUrl('http://[fd00::1]'), false);

        // Link-local
        assert.strictEqual(await isSafeUrl('http://[fe80::1]'), false);
        assert.strictEqual(await isSafeUrl('http://[febf::1]'), false);

        // IPv4-mapped private IPs
        assert.strictEqual(await isSafeUrl('http://[::ffff:127.0.0.1]'), false);
        assert.strictEqual(await isSafeUrl('http://[::ffff:192.168.1.1]'), false);
    });

    // Instead of messing with node:test unmockable modules or live networks,
    // we use a specific predictable network behavior testing approach for CI determinism:
    // we use localhost for private IP tests which resolves deterministically via OS to 127.0.0.1,
    // and a known non-existent TLD for DNS failure, which resolves deterministically to ENOTFOUND.
    // For public resolution, we rely on the implementation's handling.
    it('should test DNS resolution handling', async () => {
        // Localhost should resolve to loopback and be blocked
        assert.strictEqual(await isSafeUrl('http://localhost'), false);

        // A guaranteed non-existent domain should throw during DNS lookup and be caught, returning false.
        assert.strictEqual(await isSafeUrl('http://this-domain-does-not-exist.invalid'), false);
    });
});
