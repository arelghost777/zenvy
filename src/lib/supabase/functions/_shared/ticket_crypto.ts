// supabase/functions/_shared/ticket_crypto.ts
//
// Server-side only. Never import this file from the frontend/client bundle.
// Secrets are read from environment variables set on the Edge Function
// (Supabase project settings → Edge Functions → Secrets), never from
// NEXT_PUBLIC_* / VITE_* style client-exposed variables.

const KEY_VERSIONS: Record<number, string> = {
  1: process.env.TICKET_HMAC_KEY_V1 ?? "",
  2: process.env.TICKET_HMAC_KEY_V2 ?? "",
};

// Bump this after rotating keys; keep the old version's secret in KEY_VERSIONS
// above until every ticket signed with it is checked_in/expired.
export const CURRENT_KEY_VERSION = 1;

async function importKey(secret: string): Promise<CryptoKey> {
  if (!secret) throw new Error("Missing HMAC secret for this key version");
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export interface TicketQrPayload {
  v: number;
  tid: string;
  kv: number;
  sig: string;
}

export async function signTicket(
  ticketId: string,
  keyVersion: number = CURRENT_KEY_VERSION,
): Promise<TicketQrPayload> {
  const secret = KEY_VERSIONS[keyVersion];
  const key = await importKey(secret);
  const message = `1.${ticketId}.${keyVersion}`;
  const sigBuf = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return { v: 1, tid: ticketId, kv: keyVersion, sig: toBase64Url(sigBuf) };
}

export type QrVerifyResult =
  | { ok: true; ticketId: string }
  | {
      ok: false;
      reason:
        | "MALFORMED"
        | "UNKNOWN_VERSION"
        | "UNKNOWN_KEY_VERSION"
        | "INVALID_SIGNATURE";
    };

export async function verifyTicketQr(raw: string): Promise<QrVerifyResult> {
  let payload: Partial<TicketQrPayload>;
  try {
    payload = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "MALFORMED" };
  }

  if (
    typeof payload.v !== "number" ||
    typeof payload.tid !== "string" ||
    typeof payload.kv !== "number" ||
    typeof payload.sig !== "string"
  ) {
    return { ok: false, reason: "MALFORMED" };
  }

  if (payload.v !== 1) return { ok: false, reason: "UNKNOWN_VERSION" };

  const secret = KEY_VERSIONS[payload.kv];
  if (!secret) return { ok: false, reason: "UNKNOWN_KEY_VERSION" };

  const key = await importKey(secret);
  const message = `${payload.v}.${payload.tid}.${payload.kv}`;
  const expectedSigBuf = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  const expectedSig = toBase64Url(expectedSigBuf);

  if (!timingSafeEqual(expectedSig, payload.sig)) {
    return { ok: false, reason: "INVALID_SIGNATURE" };
  }

  return { ok: true, ticketId: payload.tid };
}

// Constant-time comparison to avoid leaking signature info via response timing
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
