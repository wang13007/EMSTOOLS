import { digestSha256 } from './passwordSecurity';

export const SHARE_TOKEN_QUERY_PARAM = 'share';

export const generateShareToken = () => {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

export const hashShareToken = async (token: string) => {
  const normalized = String(token || '').trim();
  if (!normalized) return '';
  return digestSha256(`ems-survey-share:${normalized}`);
};

export const appendShareTokenToHashUrl = (baseUrl: string, token: string) => {
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}${SHARE_TOKEN_QUERY_PARAM}=${encodeURIComponent(token)}`;
};
