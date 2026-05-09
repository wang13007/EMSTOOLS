const LEGACY_PASSWORD_HASH_PREFIX = 'sha256:';
const PBKDF2_PASSWORD_HASH_PREFIX = 'pbkdf2-sha256:';
const PBKDF2_ITERATIONS = 210000;

const toHex = (bytes: ArrayBuffer) => {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

export const digestSha256 = async (value: string) => {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return toHex(digest);
};

const fromHex = (hex: string) => {
  const normalized = String(hex || '').trim();
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
};

const timingSafeEqualHex = (left: string, right: string) => {
  const leftBytes = fromHex(left);
  const rightBytes = fromHex(right);
  if (leftBytes.length !== rightBytes.length) return false;

  let diff = 0;
  for (let i = 0; i < leftBytes.length; i += 1) {
    diff |= leftBytes[i] ^ rightBytes[i];
  }
  return diff === 0;
};

const getRandomHex = (length: number) => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
};

const derivePbkdf2Hash = async (password: string, saltHex: string, iterations: number) => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: fromHex(saltHex),
      iterations,
    },
    key,
    256,
  );
  return toHex(bits);
};

export const hashPassword = async (password: string) => {
  const salt = getRandomHex(16);
  const digest = await derivePbkdf2Hash(password, salt, PBKDF2_ITERATIONS);
  return `${PBKDF2_PASSWORD_HASH_PREFIX}${PBKDF2_ITERATIONS}:${salt}:${digest}`;
};

export const isHashedPassword = (value: string | undefined | null) => {
  const stored = String(value || '');
  return stored.startsWith(LEGACY_PASSWORD_HASH_PREFIX) || stored.startsWith(PBKDF2_PASSWORD_HASH_PREFIX);
};

export const shouldUpgradePasswordHash = (value: string | undefined | null) => {
  return !String(value || '').startsWith(PBKDF2_PASSWORD_HASH_PREFIX);
};

export const verifyPassword = async (password: string, storedValue: string | undefined | null) => {
  const stored = String(storedValue || '');
  if (!stored) return false;
  if (stored.startsWith(PBKDF2_PASSWORD_HASH_PREFIX)) {
    const [, iterationsRaw, salt, digest] = stored.split(':');
    const iterations = Number(iterationsRaw);
    if (!iterations || !salt || !digest) return false;
    const candidate = await derivePbkdf2Hash(password, salt, iterations);
    return timingSafeEqualHex(candidate, digest);
  }
  if (stored.startsWith(LEGACY_PASSWORD_HASH_PREFIX)) {
    return timingSafeEqualHex(await digestSha256(password), stored.slice(LEGACY_PASSWORD_HASH_PREFIX.length));
  }
  return stored === password;
};

export const generateTemporaryPassword = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
};
