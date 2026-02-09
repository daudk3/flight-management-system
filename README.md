# Flight Management System

Modern flight booking and operations dashboard built with Vite + React 19, Supabase, and Stripe. Customers can search flights, pick seats, pay via embedded Stripe Checkout, and manage trips. Admins can search and edit flights, manage passengers, and export flight reports. The UI includes built‑in narration and contrast controls for accessibility.

## Demo
<video src="assets/demo.mp4" controls title="Flight Management System walkthrough" width="100%"></video>

## Features
- Customer portal: flight search, seat selection, booking popup with special requests, and embedded Stripe payment flow.
- Bookings hub: view trips, cancel reservations, and download PDF receipts.
- Admin tools: search flights, edit schedules/price/status/gate, view seat map, add passengers, and generate flight PDF reports.
- Accessibility: speech narration buttons, text scaling, and high‑contrast theme toggles.
- Data layer: Supabase for auth, profiles, flights, seats, bookings, and seat links.

## Tech Stack
- React 19 + Vite 7
- Supabase JS 2 for auth/database
- Stripe JS + Embedded Checkout
- Express 4 for the payment/webhook service (`src/server.js`)
- pdf-lib for receipts and admin reports

## Prerequisites
- Node.js 20+ and npm
- Stripe account (publishable + secret keys, webhook signing secret)
- Supabase project with Email/Password auth enabled

## Environment Variables
Create two files: one for the Vite client (`.env.local`) and one for the Express server (`.env`). Never commit real secrets.

`.env.local` (used by Vite/react app):
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
# Optional: override the API base that hosts the Express server
VITE_API_BASE_URL=http://localhost:4242
```

`.env` (used by `node src/server.js`):
```
PORT=4242
CLIENT_DOMAIN=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # from Stripe CLI/dashboard
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # use a service key, not anon
```

## Local Development
1) Install deps  
`npm install`

2) Start the frontend (Vite, default http://localhost:5173)  
`npm run dev`

3) Start the backend for Stripe + webhooks (uses the same deps)  
`node src/server.js`

4) (Optional) Verify linting  
`npm run lint`

## Database Notes (Supabase)
- `profiles`: `id (uuid, matches auth.user.id)`, `full_name`, `role` (`customer` | `admin`).
- `flights`: `id`, `flight_code`, `departure_airport`, `destination_airport`, `departure_time`, `arrival_time`, `gate_num`, `price`, `status`.
- `seats`: `id`, `flight_id`, `seat_code`, `is_booked`.
- `bookings`: `id`, `user_id`, `flight_id`, `status`, `booked_at`.
- `booking_seats`: `booking_id`, `seat_id`.

The app reads flights/seats for search, enforces seat availability when booking, and marks seats booked after checkout succeeds.

## Payments & Webhooks
- The customer checkout uses Stripe Embedded Checkout. Amount is derived from the selected flight price plus 13% tax.
- Webhook endpoint: `POST /webhook` (expects raw body). Configure Stripe CLI for local dev:  
  `stripe listen --events checkout.session.completed --forward-to localhost:4242/webhook`
- Successful webhook calls finalize bookings and mark seats as booked in Supabase.

## Deployment
- Frontend: run `npm run build` → deploy the `dist/` output to static hosting (Netlify/Vercel/S3/CloudFront). Add the `VITE_*` vars in the host’s environment settings.
- Backend: deploy `src/server.js` to a Node runtime (Render/Fly/Heroku/railway). Set the server env vars (`STRIPE_*`, `SUPABASE_*`, `CLIENT_DOMAIN`, `ALLOWED_ORIGINS`, `PORT`). Ensure HTTPS and that `CLIENT_DOMAIN` matches the hosted frontend.
- Stripe webhooks: set the live signing secret (`STRIPE_WEBHOOK_SECRET`) in production and point Stripe to `https://your-api-domain/webhook`.

## Useful Scripts
- `npm run dev` — start Vite dev server.
- `npm run build` — production build.
- `npm run preview` — preview the built app locally.
- `npm run lint` — run ESLint.

## Troubleshooting
- Blank flights list: confirm Supabase URL/key and that `flights` table has rows.
- Checkout fails to load: verify `VITE_STRIPE_PUBLISHABLE_KEY` and that the backend at `VITE_API_BASE_URL` is reachable.
- Webhook 400: ensure the endpoint receives the raw body (do not place JSON middleware before `/webhook`) and the signing secret matches your Stripe CLI/dashboard setting.
