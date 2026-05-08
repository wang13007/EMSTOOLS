const PASSWORD_HASH_PREFIX = 'sha256:';

const toHex = (bytes: ArrayBuffer) => {
  return Array.from(new Uint8Array(bytes))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

const digestSha256 = async (value: string) => {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return toHex(digest);
};

export const hashPassword = async (password: string) => {
  return `${PASSWORD_HASH_PREFIX}${await digestSha256(password)}`;
};

export const isHashedPassword = (value: string | undefined | null) => {
  return String(value || '').startsWith(PASSWORD_HASH_PREFIX);
};

export const verifyPassword = async (password: string, storedValue: string | undefined | null) => {
  const stored = String(storedValue || '');
  if (!stored) return false;
  if (!isHashedPassword(stored)) return stored === password;
  return stored === await hashPassword(password);
};

export const generateTemporaryPassword = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
};
