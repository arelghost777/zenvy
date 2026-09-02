// supabase/functions/check-in-scan/index.ts
//
// POST /check-in/scan  { qr_data, event_id, device_id }
//
// The client (scanner app) NEVER decides validity — this function is the
// only place that can mark a ticket as checked_in, via the check_in_ticket()
// SQL function (SECURITY DEFINER, granted to service_role only).

import { createClient } from "@supabase/supabase-js";
import { verifyTicketQr } from "../_shared/ticket_crypto.ts";

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
};

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Tune per event size; a large event with 20 legitimate scanners needs headroom.
const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_SCANS = 40;

const ALLOWED_ROLES = [
  "ADMIN",
  "ORGANIZER",
  "CHECKIN_MANAGER",
  "CHECKIN_AGENT",
];

interface RequestBody {
  qr_data?: string;
  event_id?: number;
  device_id?: string;
}

Deno.serve(async (req) => {
  if (req.method !== "POST")
    return json(
      { success: false, status: "ERROR", message: "Méthode non supportée." },
      405,
    );

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader)
    return json(
      {
        success: false,
        status: "UNAUTHORIZED",
        message: "Authentification requise.",
      },
      401,
    );

  const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: authError,
  } = await callerClient.auth.getUser();
  if (authError || !user)
    return json(
      { success: false, status: "UNAUTHORIZED", message: "Session invalide." },
      401,
    );

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json(
      { success: false, status: "MALFORMED", message: "Requête invalide." },
      400,
    );
  }

  const { qr_data, event_id, device_id } = body;
  if (!qr_data || !event_id) {
    return json(
      { success: false, status: "MALFORMED", message: "Requête incomplète." },
      400,
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // --- Step 1: authorize the scanner for this specific event ---
  const { data: staff } = await admin
    .from("event_staff")
    .select("role")
    .eq("event_id", event_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!staff || !ALLOWED_ROLES.includes(staff.role)) {
    await admin.from("ticket_scan_logs").insert({
      event_id,
      scanner_user_id: user.id,
      scanner_device_id: device_id ?? null,
      result: "UNAUTHORIZED",
      reason: "not staff for this event",
      ip_address: ip,
    });
    return json(
      {
        success: false,
        status: "UNAUTHORIZED",
        message: "Vous n'êtes pas autorisé à scanner cet événement.",
      },
      403,
    );
  }

  // --- Step 2: rate limiting, per scanner per event ---
  const windowStart = new Date(
    Date.now() - RATE_LIMIT_WINDOW_SECONDS * 1000,
  ).toISOString();
  const { count } = await admin
    .from("ticket_scan_logs")
    .select("id", { count: "exact", head: true })
    .eq("scanner_user_id", user.id)
    .eq("event_id", event_id)
    .gte("scanned_at", windowStart);

  if ((count ?? 0) >= RATE_LIMIT_MAX_SCANS) {
    return json(
      {
        success: false,
        status: "RATE_LIMITED",
        message: "Trop de scans, ralentissez.",
      },
      429,
    );
  }

  // --- Step 3 & 4: QR format + signature verification (never trust the payload) ---
  const verified = await verifyTicketQr(qr_data);
  if (!verified.ok) {
    await admin.from("ticket_scan_logs").insert({
      event_id,
      scanner_user_id: user.id,
      scanner_device_id: device_id ?? null,
      result:
        verified.reason === "INVALID_SIGNATURE"
          ? "INVALID_SIGNATURE"
          : "TICKET_NOT_FOUND",
      reason: verified.reason,
      ip_address: ip,
    });
    return json(
      {
        success: false,
        status:
          verified.reason === "INVALID_SIGNATURE"
            ? "INVALID_SIGNATURE"
            : "INVALID_QR",
        message: "Billet invalide.",
      },
      400,
    );
  }

  // --- Step 5: atomic check-in, fully handled by the DB function ---
  const { data: result, error: rpcError } = await admin.rpc("check_in_ticket", {
    p_ticket_id: verified.ticketId,
    p_event_id: event_id,
    p_scanner_user_id: user.id,
    p_device_id: device_id ?? null,
    p_ip: ip,
  });

  if (rpcError || !result) {
    return json(
      {
        success: false,
        status: "ERROR",
        message: "Erreur serveur, réessayez.",
      },
      500,
    );
  }

  return json(result, result.success ? 200 : 409);
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
