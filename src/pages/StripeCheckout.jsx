import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Navigate,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import "./StripeCheckout.css";
import { useAuth } from "../context/AuthContext";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4242";

export default function StripeCheckoutPage() {
  const [stripePromise, setStripePromise] = useState(null);
  const [stripeLoadError, setStripeLoadError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const location = useLocation();
  const booking = location.state?.booking ?? null;
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const priceDetails = useMemo(() => computePriceDetails(booking), [booking]);

  const amountInCents = useMemo(() => {
    // Prefer amount from booking price (with tax) if available, otherwise URL param or default.
    if (priceDetails.total > 0) {
      return Math.round(priceDetails.total * 100);
    }
    const amountParam = Number(searchParams.get("amount") || 0);
    if (Number.isFinite(amountParam) && amountParam > 0) {
      return Math.round(amountParam);
    }
    return 2500;
  }, [priceDetails.total, searchParams]);

  useEffect(() => {
    if (!publishableKey) {
      setStripePromise(null);
      return;
    }

    const promise = loadStripe(publishableKey);
    promise.catch((error) => {
      console.error("Stripe.js failed to load", error);
      setStripeLoadError(
        "Stripe.js could not load. Check your network/ad blocker and publishable key."
      );
    });
    setStripePromise(promise);
  }, [publishableKey]);

  const fetchClientSecret = useCallback(async () => {
    setErrorMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountInCents,
          booking: booking
            ? {
                seatIds: booking.seatIds,
                flightId: booking.flight?.id,
                userId: user?.id,
                travelerName: [booking.firstName, booking.lastName]
                  .filter(Boolean)
                  .join(" "),
                notes: booking.notes || "",
              }
            : null,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        const errorText =
          message || "Unable to start a Stripe checkout session right now.";
        setErrorMessage(errorText);
        throw new Error(errorText);
      }

      const data = await response.json();
      if (!data?.clientSecret) {
        const errorText = "Server did not return a client secret.";
        setErrorMessage(errorText);
        throw new Error(errorText);
      }

      return data.clientSecret;
    } catch (error) {
      const message =
        error?.message ||
        "Network error starting checkout. Ensure the server on port 4242 is running.";
      setErrorMessage(message);
      throw error;
    }
  }, [amountInCents]);

  const options = useMemo(() => ({ fetchClientSecret }), [fetchClientSecret]);

  if (!publishableKey) {
    return (
      <main className="max-w-3xl mx-auto p-6 bg-white shadow rounded">
        <h1 className="text-2xl font-semibold mb-4">Stripe checkout</h1>
        <p className="text-gray-700">
          Add your Stripe publishable key to{" "}
          <code className="text-sm">VITE_STRIPE_PUBLISHABLE_KEY</code> and
          restart the dev server.
        </p>
      </main>
    );
  }

  if (stripeLoadError) {
    return (
      <main className="max-w-3xl mx-auto p-6 bg-white shadow rounded">
        <h1 className="text-2xl font-semibold mb-4">Checkout</h1>
        <p className="text-gray-700">{stripeLoadError}</p>
      </main>
    );
  }

  if (!stripePromise) {
    return (
      <main className="max-w-3xl mx-auto p-6 bg-white shadow rounded">
        <h1 className="text-2xl font-semibold mb-4">Checkout</h1>
        <p className="text-gray-700">Loading Stripe…</p>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-6 bg-white shadow rounded">
      <header className="mb-4">
        <p className="text-sm text-gray-500 uppercase tracking-wide">
          Payments
        </p>
        <h1 className="text-2xl font-semibold">Checkout</h1>
        <p className="text-gray-600">
          Review your flight and complete payment securely.
        </p>
      </header>

      <div className="stripe-layout">
        <FlightSummary booking={booking} priceDetails={priceDetails} />

        <div className="stripe-card">
          {errorMessage && (
            <p className="mb-3 text-red-600 text-sm">{errorMessage}</p>
          )}

          <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </main>
  );
}

export function StripeReturnPage() {
  const [status, setStatus] = useState("loading");
  const [customerEmail, setCustomerEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionId) {
      setErrorMessage("Missing session id. Please start checkout again.");
      setStatus("error");
      return;
    }

    async function loadStatus() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/session-status?session_id=${sessionId}`
        );
        if (!response.ok) {
          throw new Error("Unable to fetch session status.");
        }
        const data = await response.json();
        setStatus(data.status);
        setCustomerEmail(data.customer_email);
      } catch (error) {
        setErrorMessage(error.message || "Could not load payment status.");
        setStatus("error");
      }
    }

    loadStatus();
  }, [sessionId]);

  useEffect(() => {
    if (status !== "complete") {
      return undefined;
    }
    const timer = setTimeout(
      () => navigate("/bookings", { replace: true }),
      1200
    );
    return () => clearTimeout(timer);
  }, [navigate, status]);

  if (status === "open") {
    return <Navigate to="/stripe-checkout" replace />;
  }

  if (status === "complete") {
    return (
      <main className="max-w-3xl mx-auto p-6 bg-white shadow rounded">
        <h1 className="text-2xl font-semibold mb-2">Payment complete</h1>
        <p className="text-gray-700">
          Thanks for your purchase! A confirmation email will be sent to{" "}
          <strong>{customerEmail || "the email on file"}</strong>.
        </p>
        <p className="text-gray-600 mt-3">
          Redirecting you to My Trips to view your booking…
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-semibold mb-2">Checking payment status…</h1>
      {errorMessage ? (
        <p className="text-red-600">{errorMessage}</p>
      ) : (
        <p className="text-gray-700">Please wait while we confirm.</p>
      )}
    </main>
  );
}

function FlightSummary({ booking, priceDetails }) {
  if (!booking?.flight) {
    return (
      <section className="mt-4 p-4 border rounded bg-white">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Flight summary
        </h3>
        <p className="text-gray-600 text-sm">
          No flight details were provided. Continue with the demo checkout or
          return to booking to select a flight.
        </p>
      </section>
    );
  }

  const flight = booking.flight;
  const departureLabel = formatDateTime(
    flight.departure_time || flight.departureTime
  );
  const arrivalLabel = formatDateTime(
    flight.arrival_time || flight.arrivalTime
  );
  const travelerName = [booking.firstName, booking.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <section className="flight-summary-card">
      <div className="flight-summary-header">
        <h3>Flight details</h3>
        <span className="pill">Review before pay</span>
      </div>

      <div className="flight-route">
        <div className="route-codes">
          <strong>{flight.departure_airport || flight.departure}</strong>
          <span>→</span>
          <strong>{flight.destination_airport || flight.destination}</strong>
        </div>
        <span className="flight-code">
          Flight {flight.flight_code || flight.id || "TBD"}
        </span>
      </div>

      <div className="flight-meta">
        <div>
          <p className="label">Schedule</p>
          <p className="value">
            {departureLabel || "Departure TBD"}
            {arrivalLabel ? ` → ${arrivalLabel}` : ""}
          </p>
        </div>
        <div>
          <p className="label">Cabin</p>
          <p className="value">
            {(booking.travelClass || "Economy").replace(/-/g, " ")}
          </p>
        </div>
        <div>
          <p className="label">Seats</p>
          <p className="value">
            {booking.seatCodes?.length ? booking.seatCodes.join(", ") : "Pending"}
          </p>
        </div>
        {travelerName && (
          <div>
            <p className="label">Lead traveler</p>
            <p className="value">{travelerName}</p>
          </div>
        )}
        {booking.notes && (
          <div className="notes">
            <p className="label">Notes</p>
            <p className="value">{booking.notes}</p>
          </div>
        )}
      </div>

      <div className="price-card">
        <div className="price-row">
          <span>Base fare × {priceDetails.passengerCount}</span>
          <span>${priceDetails.subtotal.toFixed(2)}</span>
        </div>
        <div className="price-row">
          <span>Tax &amp; fees (13%)</span>
          <span>${priceDetails.taxes.toFixed(2)}</span>
        </div>
        <div className="price-row total">
          <span>Total</span>
          <span>${priceDetails.total.toFixed(2)}</span>
        </div>
      </div>
    </section>
  );
}

const TAX_RATE = 0.13;

function computePriceDetails(booking) {
  if (!booking?.flight) {
    return {
      passengerCount: booking?.passengerCount ?? 1,
      subtotal: 0,
      taxes: 0,
      total: 0,
    };
  }

  const passengerCount = Math.max(1, Number(booking.passengerCount) || 1);
  const baseFare = coercePrice(booking.flight.price);
  const subtotal = baseFare * passengerCount;
  const taxes = Number((subtotal * TAX_RATE).toFixed(2));
  const total = subtotal + taxes;

  return {
    passengerCount,
    subtotal,
    taxes,
    total,
  };
}

function coercePrice(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const cleaned = Number(value.replace(/[^0-9.]/g, ""));
    if (!Number.isNaN(cleaned)) {
      return cleaned;
    }
  }
  return 0;
}

function formatDateTime(value) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}
