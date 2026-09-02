// supabase/functions/create-order/index.ts
//
// Replaces the previous client-side insert in orderService.ts. Never trust
// prices or totals sent by the client: this function recomputes them from
// ticket_types before writing anything.

import { createClient } from "@supabase/supabase-js";
import { signTicket, CURRENT_KEY_VERSION } from "../_shared/ticket_crypto.ts";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
};

interface RequestBody {
  event_id: number;
  items: { ticketTypeId: number; quantity: number }[];
  client_name: string;
  client_email: string;
  client_phone: string;
}

Deno.serve(async (req) => {
  if (req.method !== "POST")
    return json({ success: false, message: "Méthode non supportée." }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader)
    return json({ success: false, message: "Authentification requise." }, 401);

  const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: authError,
  } = await callerClient.auth.getUser();
  if (authError || !user)
    return json({ success: false, message: "Session invalide." }, 401);

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ success: false, message: "Requête invalide." }, 400);
  }

  const { event_id, items, client_name, client_email, client_phone } = body;
  if (
    !event_id ||
    !items?.length ||
    !client_name ||
    !client_email ||
    !client_phone
  ) {
    return json({ success: false, message: "Requête incomplète." }, 400);
  }
  if (items.some((it) => it.quantity <= 0 || it.quantity > 20)) {
    return json(
      { success: false, message: "Quantité de billets invalide." },
      400,
    );
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Fetch authoritative prices — never trust item.price if the client sent one
  const typeIds = items.map((it) => it.ticketTypeId);
  const { data: types, error: typesError } = await admin
    .from("ticket_types")
    .select("id, name, price, event_id")
    .in("id", typeIds);

  if (typesError || !types || types.length !== new Set(typeIds).size) {
    return json({ success: false, message: "Type de billet invalide." }, 400);
  }
  if (types.some((t) => t.event_id !== event_id)) {
    return json(
      {
        success: false,
        message: "Un des billets n'appartient pas à cet événement.",
      },
      400,
    );
  }

  const priceById = new Map(types.map((t) => [t.id, t.price]));
  const totalPrice = items.reduce(
    (sum, it) => sum + (priceById.get(it.ticketTypeId) ?? 0) * it.quantity,
    0,
  );

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: user.id,
      event_id,
      total_price: totalPrice,
      status: "paid", // no external payment gateway wired up yet — see ARCHITECTURE.md note
      client_name,
      client_email,
      client_phone,
    })
    .select()
    .single();

  if (orderError || !order)
    return json(
      { success: false, message: "Impossible de créer la commande." },
      500,
    );

  const rows = items.flatMap((it) =>
    Array.from({ length: it.quantity }).map(() => ({
      order_id: order.id,
      event_id,
      user_id: user.id,
      ticket_type_id: it.ticketTypeId,
      client_name,
      client_email,
      client_phone,
      price: priceById.get(it.ticketTypeId),
      status: "valid",
      key_version: CURRENT_KEY_VERSION,
    })),
  );

  const { data: tickets, error: ticketError } = await admin
    .from("tickets")
    .insert(rows)
    .select();

  if (ticketError || !tickets) {
    await admin
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", order.id);
    return json(
      { success: false, message: "Impossible de générer les billets." },
      500,
    );
  }

  const signedTickets = await Promise.all(
    tickets.map(async (t) => ({
      id: t.id,
      ticketTypeId: t.ticket_type_id,
      ticketTypeName: types.find((ty) => ty.id === t.ticket_type_id)?.name,
      price: t.price,
      uniqueCode: t.id.slice(0, 8).toUpperCase(), // display-only short code, NOT the QR content
      qrPayload: await signTicket(t.id, t.key_version), // this JSON is what gets encoded in the QR
    })),
  );

  return json({ success: true, order, tickets: signedTickets });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
