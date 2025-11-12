import { useEffect, useMemo, useState } from "react";
import "./BookingPopUp.css";
import { supabase } from "../lib/supabaseClient";

const INITIAL_FORM = {
  firstName: "",
  lastName: "",
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
  const [seats, setSeats] = useState([]);
  const [seatLoading, setSeatLoading] = useState(false);
  const [seatFetchError, setSeatFetchError] = useState("");
  const [seatSelectionError, setSeatSelectionError] = useState("");
  const [selectedSeats, setSelectedSeats] = useState([]);

  const flightSummary = useMemo(() => {
    if (!flight) {
      return null;
    }

    const {
      flightNumber,
      id,
      origin,
      departure,
      destination,
      departureTime,
      arrivalTime,
      price,
    } = flight;

    const originCity =
      (origin ?? departure)?.toString().trim() || null;
    const destinationCity = destination?.toString().trim() || null;
    const fallbackTitle =
      originCity && destinationCity
        ? `${originCity} → ${destinationCity}`
        : originCity ?? destinationCity ?? "Flight Details";

    return {
      title: flightNumber || id || fallbackTitle,
      subTitle:
        originCity && destinationCity
          ? `${originCity} → ${destinationCity}`
          : null,
      schedule:
        departureTime && arrivalTime
          ? `${departureTime} - ${arrivalTime}`
          : departureTime || null,
      price:
        typeof price === "number"
          ? `$${price}`
          : price?.toString().trim() || null,
    };
  }, [flight]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setForm(() => ({
      ...INITIAL_FORM,
      travelClass:
        flight?.travelClass?.toLowerCase?.() ?? INITIAL_FORM.travelClass,
      passengers: "1",
    }));
    setSelectedSeats([]);
    setSeatSelectionError("");
  }, [isOpen, flight]);

  useEffect(() => {
    if (!isOpen || !flight?.id) {
      setSeats([]);
      return;
    }

    let isMounted = true;

    async function fetchSeats() {
      setSeatLoading(true);
      setSeatFetchError("");
      const { data, error } = await supabase
        .from("seats")
        .select("id, seat_code, is_booked")
        .eq("flight_id", flight.id)
        .order("seat_code", { ascending: true });

      if (!isMounted) return;

      if (error) {
        setSeatFetchError("We couldn't load the seat map. Please try again.");
        setSeats([]);
      } else if (!data?.length) {
        setSeatFetchError("Seats have not been configured for this flight yet.");
        setSeats([]);
      } else {
        setSeats(data);
      }

      setSeatLoading(false);
    }

    fetchSeats();

    return () => {
      isMounted = false;
    };
  }, [flight?.id, isOpen]);

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
    if (name === "passengers") {
      const nextCount = Math.max(1, Number(value) || 1);
      setSelectedSeats((prev) => prev.slice(0, nextCount));
      setSeatSelectionError("");
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleOverlayClick(event) {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  }

  const passengerCount = Math.max(1, Number(form.passengers) || 1);

  function handleSeatSelect(seat) {
    if (seat.is_booked) {
      setSeatSelectionError(`Seat ${seat.seat_code} is already taken.`);
      return;
    }

    setSeatSelectionError("");

    setSelectedSeats((prev) => {
      const alreadySelected = prev.some((s) => s.id === seat.id);
      if (alreadySelected) {
        return prev.filter((s) => s.id !== seat.id);
      }

      if (prev.length >= passengerCount) {
        setSeatSelectionError(
          `You can select up to ${passengerCount} seat${passengerCount > 1 ? "s" : ""}.`,
        );
        return prev;
      }

      return [...prev, seat];
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedSeats.length) {
      setSeatSelectionError("Select at least one seat before continuing.");
      return;
    }

    if (selectedSeats.length !== passengerCount) {
      setSeatSelectionError(
        `Select ${passengerCount} seat${passengerCount > 1 ? "s" : ""} to match your passenger count.`,
      );
      return;
    }

    const bookingData = {
      ...form,
      passengers: Number(form.passengers) || 1,
      flight,
      seatIds: selectedSeats.map((seat) => seat.id),
      seatCodes: selectedSeats.map((seat) => seat.seat_code),
    };

    try {
      await onSubmit?.(bookingData);
    } catch (err) {
      console.error(err);
      setSeatSelectionError(err.message ?? "Unable to submit booking right now.");
    }
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

        <section className="booking-seat-section">
          <header className="booking-seat-header">
            <h3>Select Your Seats</h3>
            <p>Choose enough available seats for everyone in your party.</p>
          </header>

          {seatLoading ? (
            <p className="booking-seat-hint">Loading seat map…</p>
          ) : seatFetchError ? (
            <p className="booking-seat-error">{seatFetchError}</p>
          ) : (
            <>
              <div className="booking-seat-grid" role="listbox" aria-label="Seat map">
                {seats.map((seat) => {
                  const isTaken = seat.is_booked;
                  const isSelected = selectedSeats.some((s) => s.id === seat.id);
                  return (
                    <button
                      type="button"
                      key={seat.id}
                      className={`booking-seat ${isTaken ? "taken" : "available"} ${
                        isSelected ? "selected" : ""
                      }`}
                      onClick={() => handleSeatSelect(seat)}
                      disabled={isTaken}
                      aria-pressed={isSelected}
                      aria-label={`Seat ${seat.seat_code}${isTaken ? " (taken)" : ""}`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      {seat.seat_code}
                    </button>
                  );
                })}
              </div>
              <div className="booking-seat-legend">
                <span>
                  <span className="booking-seat-legend-box available" /> Available
                </span>
                <span>
                  <span className="booking-seat-legend-box taken" /> Taken
                </span>
                <span>
                  <span className="booking-seat-legend-box selected" /> Selected
                </span>
              </div>
              {!!selectedSeats.length && !seatSelectionError && (
                <p className="booking-seat-hint">
                  Selected seats ({selectedSeats.length}/{passengerCount}):{" "}
                  {selectedSeats.map((seat) => seat.seat_code).join(", ")}
                </p>
              )}
              {seatSelectionError && (
                <p className="booking-seat-error">{seatSelectionError}</p>
              )}
            </>
          )}
        </section>

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
