import { generateKeyPairSync } from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Run once: `tsx services/scripts/generate-keys.ts`
// Only Identity ever holds the private key and can mint access tokens.
// The public key is safe to commit — every other service uses it only to verify.

const __dirname = dirname(fileURLToPath(import.meta.url));
const servicesRoot = resolve(__dirname, '..');

const privateKeyPath = resolve(servicesRoot, 'identity/keys/jwt-private.pem');
const publicKeyPath = resolve(servicesRoot, 'shared/keys/jwt-public.pem');

if (existsSync(privateKeyPath)) {
  console.log(`Private key already exists at ${privateKeyPath} — not overwriting. Delete it first to regenerate.`);
  process.exit(0);
}

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

mkdirSync(dirname(privateKeyPath), { recursive: true });
mkdirSync(dirname(publicKeyPath), { recursive: true });

writeFileSync(privateKeyPath, privateKey, { mode: 0o600 });
writeFileSync(publicKeyPath, publicKey);

console.log(`Generated RS256 keypair:
  private -> ${privateKeyPath} (gitignored, Identity only)
  public  -> ${publicKeyPath} (safe to commit, every service reads this)`);
