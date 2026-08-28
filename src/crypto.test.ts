import { describe, expect, it } from 'vitest';
import { decryptBundle, encryptBundle } from './crypto';
describe('encrypted bundle', () => {
  it('round trips payloads', async () => { const b = await encryptBundle({ value: 'private' }, 'long enough secret'); await expect(decryptBundle(b, 'long enough secret')).resolves.toEqual({ value: 'private' }); });
  it('rejects a wrong passphrase', async () => { const b = await encryptBundle({ value: 'private' }, 'long enough secret'); await expect(decryptBundle(b, 'wrong passphrase')).rejects.toThrow('Could not open'); });
});
