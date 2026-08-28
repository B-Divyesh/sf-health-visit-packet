const enc = new TextEncoder();
const dec = new TextDecoder();
const b64 = (data: Uint8Array) => btoa(String.fromCharCode(...data));
const unb64 = (data: string) => Uint8Array.from(atob(data), c => c.charCodeAt(0));

export type EncryptedBundle = { format: 'health-visit-packet.encrypted.v1'; salt: string; iv: string; ciphertext: string; createdAt: string };
async function keyFrom(password: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt.buffer as ArrayBuffer, iterations: 210000, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function encryptBundle(payload: unknown, password: string): Promise<EncryptedBundle> {
  if (password.length < 8) throw new Error('Choose a passphrase with at least 8 characters.');
  const salt = crypto.getRandomValues(new Uint8Array(16)); const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await keyFrom(password, salt);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv.buffer as ArrayBuffer }, key, enc.encode(JSON.stringify(payload))));
  return { format: 'health-visit-packet.encrypted.v1', salt: b64(salt), iv: b64(iv), ciphertext: b64(ciphertext), createdAt: new Date().toISOString() };
}
export async function decryptBundle(bundle: EncryptedBundle, password: string): Promise<unknown> {
  if (bundle.format !== 'health-visit-packet.encrypted.v1') throw new Error('That is not a Health Visit Packet encrypted bundle.');
  try { const key = await keyFrom(password, unb64(bundle.salt)); const raw = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(bundle.iv).buffer as ArrayBuffer }, key, unb64(bundle.ciphertext).buffer as ArrayBuffer); return JSON.parse(dec.decode(raw)); }
  catch { throw new Error('Could not open this bundle. Check the passphrase and file.'); }
}
