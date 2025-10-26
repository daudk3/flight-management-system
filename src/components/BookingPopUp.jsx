import { useEffect, useMemo, useState } from "react";
import "./BookingPopUp.css";

const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  passengers: "1",
  travelClass: "economy",
  notes: "",
};

export default function BookingPopUp({
  isOpen = false,
  flight = null,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(INITIAL_FORM);

  const flightSummary = useMemo(() => {
    if (!flight) {
      return null;
    }

    const {
      flightNumber,
      origin,
      destination,
      departureTime,
      arrivalTime,
      price,
    } = flight;

    return {
      title:
        flightNumber ||
        `${origin ?? "Origin"} → ${destination ?? "Destination"}`,
      subTitle:
        origin && destination ? `${origin} → ${destination}` : null,
      schedule:
        departureTime && arrivalTime
          ? `${departureTime} - ${arrivalTime}`
          : departureTime || null,
      price: price ? `$${price}` : null,
    };
  }, [flight]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setForm((prev) => ({
      ...INITIAL_FORM,
      travelClass:
        flight?.travelClass?.toLowerCase?.() ?? INITIAL_FORM.travelClass,
      passengers: "1",
    }));
  }, [isOpen, flight]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleOverlayClick(event) {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    const bookingData = {
      ...form,
      passengers: Number(form.passengers) || 1,
      flight,
    };

    onSubmit?.(bookingData);
    onClose?.();
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="booking-popup-overlay"
      role="presentation"
      onClick={handleOverlayClick}
    >
      <section
        className="booking-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-popup-title"
      >
        <button
          type="button"
          className="booking-popup-close"
          onClick={() => onClose?.()}
          aria-label="Close booking popup"
        >
          ×
        </button>
        <header className="booking-popup-header">
          <h2 id="booking-popup-title">Book Flight</h2>
          {flightSummary ? (
            <div className="booking-popup-flight">
              <h3>{flightSummary.title}</h3>
              {flightSummary.subTitle && <p>{flightSummary.subTitle}</p>}
              {flightSummary.schedule && (
                <p className="booking-popup-schedule">
                  {flightSummary.schedule}
                </p>
              )}
              {flightSummary.price && (
                <p className="booking-popup-price">{flightSummary.price}</p>
              )}
            </div>
          ) : (
            <p className="booking-popup-flight-placeholder">
              Select a flight to see the details here.
            </p>
          )}
        </header>

        <form className="booking-popup-form" onSubmit={handleSubmit}>
          <div className="booking-popup-grid">
            <label>
              First Name
              <input
                name="firstName"
                type="text"
                value={form.firstName}
                onChange={handleChange}
                placeholder="e.g. Alex"
                required
              />
            </label>
            <label>
              Last Name
              <input
                name="lastName"
                type="text"
                value={form.lastName}
                onChange={handleChange}
                placeholder="e.g. Johnson"
                required
              />
            </label>
            <label>
              Email
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="alex@example.com"
                required
              />
            </label>
            <label>
              Phone
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="+1 555-123-4567"
              />
            </label>
            <label>
              Passengers
              <input
                name="passengers"
                type="number"
                min="1"
                max="9"
                value={form.passengers}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Cabin Class
              <select
                name="travelClass"
                value={form.travelClass}
                onChange={handleChange}
              >
                <option value="economy">Economy</option>
                <option value="premium-economy">Premium Economy</option>
                <option value="business">Business</option>
                <option value="first">First</option>
              </select>
            </label>
          </div>
          <label className="booking-popup-notes">
            Special Requests
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Add meal preferences, accessibility needs, or other notes."
              rows={3}
            />
          </label>
          <div className="booking-popup-actions">
            <button
              type="button"
              className="btn secondary"
              onClick={() => onClose?.()}
            >
              Cancel
            </button>
            <button type="submit" className="btn primary">
              Confirm Booking
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
