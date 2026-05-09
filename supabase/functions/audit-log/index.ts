import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.97.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const LOG_TYPES = new Set(['login', 'survey', 'user', 'system']);
const RESULTS = new Set(['成功', '失败']);

const encoder = new TextEncoder();

const toJson = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

const getRequiredEnv = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const normalizeUuid = (value: unknown) => {
  const raw = String(value || '').trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw)
    ? raw
    : null;
};

const normalizeString = (value: unknown, fallback = '') => String(value ?? fallback).trim();

const normalizeContent = (value: unknown) => {
  const content = normalizeString(value).slice(0, 1000);
  return content || '未命名操作';
};

const isOriginAllowed = (request: Request) => {
  const allowedOrigins = normalizeString(Deno.env.get('AUDIT_ALLOWED_ORIGINS'));
  if (!allowedOrigins) return true;

  const origin = normalizeString(request.headers.get('origin'));
  if (!origin) return true;

  const allowed = allowedOrigins
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return allowed.includes(origin);
};

const getClientIp = (request: Request) => {
  const headers = request.headers;
  const candidates = [
    headers.get('cf-connecting-ip'),
    headers.get('x-real-ip'),
    headers.get('x-forwarded-for')?.split(',')[0],
    headers.get('fly-client-ip'),
    headers.get('x-nf-client-connection-ip'),
  ];
  return candidates.map((item) => normalizeString(item)).find(Boolean) || 'unknown';
};

const bytesToHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

const hmacSha256 = async (secret: string, value: string) => {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return bytesToHex(signature);
};

const buildCanonicalPayload = (payload: Record<string, unknown>) =>
  JSON.stringify(
    Object.keys(payload)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = payload[key];
        return acc;
      }, {}),
  );

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return toJson({ error: 'Method not allowed' }, 405);
  }

  try {
    if (!isOriginAllowed(request)) {
      return toJson({ error: 'Origin is not allowed' }, 403);
    }

    const supabaseUrl = getRequiredEnv('SUPABASE_URL');
    const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');
    const integritySecret = getRequiredEnv('AUDIT_LOG_HMAC_SECRET');
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const body = await request.json().catch(() => ({}));
    const type = normalizeString(body.type);
    const result = normalizeString(body.result, '成功');
    if (!LOG_TYPES.has(type)) {
      return toJson({ error: 'Invalid log type' }, 400);
    }
    if (!RESULTS.has(result)) {
      return toJson({ error: 'Invalid operation result' }, 400);
    }

    const requestId = crypto.randomUUID();
    const createTime = new Date().toISOString();
    const ipAddress = getClientIp(request);
    const userAgent = normalizeString(request.headers.get('user-agent'), 'unknown').slice(0, 500);
    const origin = normalizeString(request.headers.get('origin')).slice(0, 300);
    const operatorId = normalizeUuid(body.operator_id);
    const clientMetadata = body && typeof body === 'object' ? body : {};

    const { data: previousRows } = await supabase
      .from('system_logs')
      .select('integrity_hash')
      .not('integrity_hash', 'is', null)
      .order('create_time', { ascending: false })
      .limit(1);

    const previousHash = previousRows?.[0]?.integrity_hash || null;
    const metadata = {
      request_id: requestId,
      user_agent: userAgent,
      origin,
      client_address_hint: normalizeString(body.client_address_hint),
      client_time: normalizeString(body.client_time),
      location: clientMetadata.location || null,
      source: 'edge-function',
    };

    const canonical = buildCanonicalPayload({
      request_id: requestId,
      operator_id: operatorId,
      type,
      content: normalizeContent(body.content),
      ip_address: ipAddress,
      result,
      create_time: createTime,
      previous_hash: previousHash,
      metadata,
    });
    const integrityHash = await hmacSha256(integritySecret, canonical);

    const hardenedPayload = {
      operator_id: operatorId,
      type,
      content: normalizeContent(body.content),
      ip_address: ipAddress,
      result,
      create_time: createTime,
      request_id: requestId,
      user_agent: userAgent,
      source: 'edge-function',
      metadata,
      previous_hash: previousHash,
      integrity_hash: integrityHash,
    };

    const inserted = await supabase.from('system_logs').insert(hardenedPayload).select().maybeSingle();
    if (!inserted.error) {
      return toJson({ log: inserted.data });
    }

    const missingSchema =
      inserted.error.code === 'PGRST204' ||
      /request_id|user_agent|source|metadata|previous_hash|integrity_hash/i.test(inserted.error.message || '');

    if (!missingSchema) {
      console.error('audit-log insert failed', inserted.error);
      return toJson({ error: 'Failed to write audit log' }, 500);
    }

    const compatibilityPayload = {
      operator_id: operatorId,
      type,
      content: normalizeContent(body.content),
      ip_address: ipAddress,
      result,
      create_time: createTime,
    };
    const fallback = await supabase.from('system_logs').insert(compatibilityPayload).select().maybeSingle();
    if (fallback.error) {
      console.error('audit-log compatibility insert failed', fallback.error);
      return toJson({ error: 'Failed to write audit log' }, 500);
    }

    return toJson({
      log: fallback.data,
      warning: 'Audit hardening columns are missing. Run supabase-audit-hardening.sql.',
    });
  } catch (error) {
    console.error('audit-log unexpected error', error);
    return toJson({ error: 'Unexpected audit log error' }, 500);
  }
});
