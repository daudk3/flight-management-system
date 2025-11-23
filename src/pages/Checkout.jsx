import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Checkout.css";
import { supabase } from "../lib/supabaseClient";

const PAYMENT_INITIAL = {
  cardName: "",
  cardNumber: "",
  expiry: "",
  cvv: "",
  agree: false,
};

const currencyFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

const TAX_RATE = 0.13;

const checkoutDateFormatter = new Intl.DateTimeFormat("en-CA", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatDateTime(value) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return checkoutDateFormatter.format(parsed);
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

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking ?? null;
  const [payment, setPayment] = useState(PAYMENT_INITIAL);
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  useEffect(() => {
    if (!booking) {
      return;
    }
    window.scrollTo(0, 0);
  }, [booking]);

  const priceDetails = useMemo(() => {
    if (!booking?.flight) {
      return {
        passengerCount: booking?.passengerCount ?? 1,
        baseFare: 0,
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
      baseFare,
      subtotal,
      taxes,
      total,
    };
  }, [booking]);

  function handlePaymentChange(event) {
    const { name, value, type, checked } = event.target;
    setPayment((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handlePlaceOrder(event) {
    event.preventDefault();
    if (!booking || processing) {
      return;
    }

    if (
      !payment.cardName ||
      !payment.cardNumber ||
      !payment.expiry ||
      !payment.cvv
    ) {
      setErrorMessage(
        "Add the name on card, number, expiry, and CVV to continue."
      );
      return;
    }

    if (!payment.agree) {
      setErrorMessage(
        "Please accept the fare rules and privacy notice to continue."
      );
      return;
    }

    if (!booking.flight?.id) {
      setErrorMessage("Missing flight details. Please start a new booking.");
      return;
    }

    if (!booking.seatIds?.length) {
      setErrorMessage(
        "Seat selection is missing. Please choose your seats again."
      );
      return;
    }

    setProcessing(true);
    setErrorMessage("");
    setInfoMessage("Processing your booking…");

    let bookingRecord = null;
    let reservedSeatIds = [];

    try {
      const { data: userResponse, error: userError } =
        await supabase.auth.getUser();
      if (userError) {
        throw userError;
      }
      const user = userResponse?.user;
      if (!user) {
        throw new Error("Please sign in to complete your booking.");
      }

      const { data: seatRows, error: seatError } = await supabase
        .from("seats")
        .update({ is_booked: true })
        .in("id", booking.seatIds)
        .eq("is_booked", false)
        .select("id");

      if (seatError) {
        throw seatError;
      }

      reservedSeatIds = seatRows?.map((seat) => seat.id) ?? [];

      if (reservedSeatIds.length !== booking.seatIds.length) {
        throw new Error(
          "One or more of your seats was just taken. Please pick different seats."
        );
      }

      const { data: bookingInsert, error: bookingError } = await supabase
        .from("bookings")
        .insert([
          {
            user_id: user.id,
            flight_id: booking.flight.id,
            status: "confirmed",
            booked_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (bookingError) {
        throw bookingError;
      }

      bookingRecord = bookingInsert;

      const seatLinks = reservedSeatIds.map((seatId) => ({
        booking_id: bookingRecord.id,
        seat_id: seatId,
      }));

      const { error: linkError } = await supabase
        .from("booking_seats")
        .insert(seatLinks);

      if (linkError) {
        throw linkError;
      }

      setInfoMessage("Booking confirmed! Redirecting to your trips…");
      setPayment(PAYMENT_INITIAL);
      setTimeout(() => {
        navigate("/bookings", { replace: true });
      }, 900);
    } catch (error) {
      console.error("Checkout failed", error);
      setInfoMessage("");
      setErrorMessage(
        error.message ?? "Unable to complete your booking right now."
      );

      if (bookingRecord?.id) {
        await supabase.from("bookings").delete().eq("id", bookingRecord.id);
      }

      if (reservedSeatIds.length > 0) {
        await supabase
          .from("seats")
          .update({ is_booked: false })
          .in("id", reservedSeatIds);
      }
    } finally {
      setProcessing(false);
    }
  }

  if (!booking) {
    return (
      <main className="checkout-page">
        <section className="checkout-card">
          <h1>Checkout</h1>
          <p>We couldn't find any trip details to review.</p>
          <Link to="/" className="checkout-link">
            Start a new search
          </Link>
        </section>
      </main>
    );
  }

  const flight = booking.flight;
  const travelerName = [booking.firstName, booking.lastName]
    .filter(Boolean)
    .join(" ");
  const readableSeats = booking.seatCodes?.length
    ? booking.seatCodes.join(", ")
    : "Pending";
  const departureLabel = formatDateTime(
    flight?.departure_time || flight?.departureTime
  );
  const arrivalLabel = formatDateTime(
    flight?.arrival_time || flight?.arrivalTime
  );

  return (
    <main className="checkout-page">
      <header className="checkout-header">
        <button
          type="button"
          className="checkout-back"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
        <div>
          <p className="checkout-step">Step 2 of 2</p>
          <h1>Review &amp; Pay</h1>
        </div>
      </header>

      <div className="checkout-grid">
        <section className="checkout-card checkout-summary">
          <header className="checkout-summary-header">
            <div>
              <p className="checkout-step">Trip summary</p>
              <h2>
                {flight?.departure_airport || flight?.departure} →{" "}
                {flight?.destination_airport || flight?.destination}
              </h2>
            </div>
            <span className="checkout-summary-flight">
              Flight {flight?.flight_code || flight?.id}
            </span>
          </header>

          <div className="checkout-summary-section">
            <div>
              <p className="checkout-label">Schedule</p>
              <p className="checkout-value">
                {departureLabel || "TBD"}
                {arrivalLabel ? ` → ${arrivalLabel}` : ""}
              </p>
            </div>
            <div>
              <p className="checkout-label">Cabin</p>
              <p className="checkout-value checkout-pill">
                {(booking.travelClass || "Economy").replace(/-/g, " ")}
              </p>
            </div>
          </div>

          <div className="checkout-summary-section">
            <div>
              <p className="checkout-label">Lead traveler</p>
              <p className="checkout-value">{travelerName || "Pending"}</p>
            </div>
            <div>
              <p className="checkout-label">Seats</p>
              <p className="checkout-value">{readableSeats}</p>
            </div>
            <div className="checkout-notes">
              <p className="checkout-label">Notes</p>
              <p className="checkout-value">{booking.notes || "—"}</p>
            </div>
          </div>

          <div className="checkout-summary-section price">
            <div className="checkout-price-row">
              <span>Base fare × {priceDetails.passengerCount}</span>
              <strong>{currencyFormatter.format(priceDetails.subtotal)}</strong>
            </div>
            <div className="checkout-price-row">
              <span>Tax &amp; fees ({Math.round(TAX_RATE * 100)}%)</span>
              <strong>{currencyFormatter.format(priceDetails.taxes)}</strong>
            </div>
            <div className="checkout-divider" />
            <div className="checkout-price-row checkout-total">
              <span>Total due today</span>
              <strong>{currencyFormatter.format(priceDetails.total)}</strong>
            </div>
          </div>
        </section>

        <section className="checkout-card checkout-payment">
          <h2>Payment</h2>
          <form className="checkout-form" onSubmit={handlePlaceOrder}>
            <label>
              Name on card
              <input
                name="cardName"
                type="text"
                value={payment.cardName}
                onChange={handlePaymentChange}
                placeholder="e.g. Alex Johnson"
                required
              />
            </label>
            <label>
              Card number
              <input
                name="cardNumber"
                type="text"
                inputMode="numeric"
                maxLength={19}
                value={payment.cardNumber}
                onChange={handlePaymentChange}
                placeholder="1234 5678 9012 3456"
                required
              />
            </label>
            <div className="checkout-form-row">
              <label>
                Expiry
                <input
                  name="expiry"
                  type="text"
                  placeholder="MM/YY"
                  maxLength={5}
                  value={payment.expiry}
                  onChange={handlePaymentChange}
                  required
                />
              </label>
              <label>
                CVV
                <input
                  name="cvv"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={payment.cvv}
                  onChange={handlePaymentChange}
                  required
                />
              </label>
            </div>

            <label className="checkout-checkbox">
              <input
                name="agree"
                type="checkbox"
                checked={payment.agree}
                onChange={handlePaymentChange}
              />
              <span>I agree to the carrier fare rules and privacy policy.</span>
            </label>

            {errorMessage && <p className="checkout-error">{errorMessage}</p>}
            {infoMessage && !errorMessage && (
              <p className="checkout-hint">{infoMessage}</p>
            )}

            <button type="submit" className="btn primary" disabled={processing}>
              {processing ? "Confirming…" : "Complete purchase"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
