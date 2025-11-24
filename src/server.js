/* eslint-env node */
import dotenv from "dotenv";
import Stripe from "stripe";
import express from "express";
import { createClient } from "@supabase/supabase-js";

// Load env from .env.local first (if present), then fall back to .env
dotenv.config({ path: ".env.local" });
dotenv.config();
const PORT = process.env.PORT || 4242;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const allowedOrigin = process.env.CLIENT_DOMAIN || "http://localhost:5173";
const allowedOrigins = (process.env.ALLOWED_ORIGINS || allowedOrigin)
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
const supabaseUrl =
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||~
  process.env.SUPABASE_SECRET ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "";

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY in environment");
}

const stripe = new Stripe(stripeSecretKey);
const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;
const app = express();
app.use(express.static("public"));

// Webhook needs the raw body for signature verification; mount before json parser.
app.use("/webhook", express.raw({ type: "application/json" }));

app.use(express.json());

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  const originToUse = allowedOrigins.includes(requestOrigin)
    ? requestOrigin
    : allowedOrigins[0];
  if (originToUse) {
    res.header("Access-Control-Allow-Origin", originToUse);
  }
  res.header("Vary", "Origin");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

const YOUR_DOMAIN = allowedOrigin;

app.post("/create-checkout-session", async (req, res) => {
  const amount = Number(req.body?.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    res.status(400).send("Missing or invalid amount in cents.");
    return;
  }

  const booking = req.body?.booking || {};
  const seatIds = Array.isArray(booking.seatIds)
    ? booking.seatIds.map(String)
    : [];
  const flightId = booking.flightId ? String(booking.flightId) : "";
  const userId = booking.userId ? String(booking.userId) : "";
  const travelerName = booking.travelerName ? String(booking.travelerName) : "";
  const notes = booking.notes ? String(booking.notes) : "";

  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    line_items: [
      {
        price_data: {
          currency: "cad",
          product_data: { name: "Flight booking" },
          unit_amount: Math.round(amount),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: {
      flight_id: flightId,
      seat_ids: seatIds.join(","),
      user_id: userId,
      traveler_name: travelerName,
      notes: notes.slice(0, 200),
    },
    return_url: `${YOUR_DOMAIN}/stripe-return?session_id={CHECKOUT_SESSION_ID}`,
  });

  res.send({ clientSecret: session.client_secret });
});

app.get("/session-status", async (req, res) => {
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id);

  res.send({
    status: session.status,
    customer_email: session.customer_details.email,
  });
});

app.post("/webhook", async (req, res) => {
  if (!stripeWebhookSecret) {
    res.status(500).send("Webhook secret not configured.");
    return;
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      stripeWebhookSecret
    );
  } catch (err) {
    console.error("Webhook signature verification failed", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    try {
      await finalizeBookingFromSession(session);
    } catch (error) {
      console.error("Failed to finalize booking from webhook", error);
    }
  }

  res.status(200).send({ received: true });
});

async function finalizeBookingFromSession(session) {
  if (!supabase) {
    console.warn(
      "Supabase client not configured; skipping booking finalization."
    );
    return;
  }

  const metadata = session?.metadata || {};
  const seatIds = (metadata.seat_ids || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const flightId = metadata.flight_id || null;
  const userId = metadata.user_id || null;

  await finalizeBooking({ seatIds, flightId, userId });
}

async function finalizeBooking({
  seatIds = [],
  flightId = null,
  userId = null,
}) {
  if (!seatIds.length || !flightId || !userId) {
    throw new Error("Missing booking metadata; cannot finalize checkout.");
  }

  // Mark seats as booked if still available.
  const { data: seatRows, error: seatError } = await supabase
    .from("seats")
    .update({ is_booked: true })
    .in("id", seatIds)
    .eq("is_booked", false)
    .select("id");

  if (seatError) {
    throw seatError;
  }

  const reservedSeatIds = seatRows?.map((s) => s.id) || [];
  if (reservedSeatIds.length !== seatIds.length) {
    throw new Error("One or more seats were already taken during checkout.");
  }

  // Create booking.
  const bookingPayload = {
    user_id: userId,
    flight_id: flightId,
    status: "confirmed",
    booked_at: new Date().toISOString(),
  };

  const { data: bookingInsert, error: bookingError } = await supabase
    .from("bookings")
    .insert([bookingPayload])
    .select()
    .single();

  if (bookingError) {
    // Roll back seat reservations.
    await supabase
      .from("seats")
      .update({ is_booked: false })
      .in("id", reservedSeatIds);
    throw bookingError;
  }

  const seatLinks = reservedSeatIds.map((seatId) => ({
    booking_id: bookingInsert.id,
    seat_id: seatId,
  }));

  const { error: linkError } = await supabase
    .from("booking_seats")
    .insert(seatLinks);

  if (linkError) {
    console.error("Failed to link seats to booking", linkError);
  }

  return { booking: bookingInsert, seatIds: reservedSeatIds };
}

app.listen(PORT, "127.0.0.1", () =>
  console.log(`Running on port ${PORT} (host 127.0.0.1)`)
);
