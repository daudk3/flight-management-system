import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";


const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  month: "short",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-CA", {
  hour: "numeric",
  minute: "2-digit",
});

function formatDateTime(isoString) {
  if (!isoString) {
    return "TBD";
  
  }
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) {
    return isoString;
  }
  const date = dateFormatter.format(parsed);
  const time = timeFormatter.format(parsed);
  return `${date} • ${time}`;
}

export default function FlightCard({ flight, onSelect }) {
  const [seatsLeft, setSeatsLeft] = useState(null);

  useEffect(() => {
    if (!flight?.id) {
      return;
    }

    async function fetchSeats() {
      const { count, error } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("flight_id", flight.id);

      if (error) {
        console.error("Error counting bookings:", error);
      } else {
        const totalSeats = 120;
        const remaining = totalSeats - (count || 0);
        setSeatsLeft(remaining);
      }
    }

    fetchSeats();
  }, [flight?.id]);

  if (!flight) {
    return null;
  }
  
  const statusLabel = flight.status || "Scheduled";
  const statusClass = statusLabel
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z-]/g, "");
  const priceDisplay =
    typeof flight.price === "string" && flight.price.trim().length > 0
      ? flight.price
      : `$${flight.price ?? "N/A"}`;
  const gateLabel = flight.gate_num ? `Gate ${flight.gate_num}` : "Gate TBD";

  function handleClick() {
    onSelect?.(flight);
  }

  function handleKeyDown(event) {
    if (!onSelect) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(flight);
    }
  }

  return (
    <article
      className={`flight-card${onSelect ? " clickable" : ""}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-label={
        onSelect
          ? `Open booking popup for flight ${flight.id}`
          : undefined
      }
    >
      <header className="flight-card-header">
        <div>
          <h3>
            {flight.departure_airport} → {flight.destination_airport}
          </h3>
          <p className="flight-card-subtitle">
            {flight.flight_code || "Flight"} • {flight.id}
          </p>
        </div>
        <p className="flight-card-price">{priceDisplay}</p>
      </header>

      <div className="flight-card-body">
        <div>
          <span className="flight-card-label">Departure</span>
          <p>{formatDateTime(flight.departure_time)}</p>
          <span className="flight-card-meta">{gateLabel}</span>
        </div>
        <div>
          <span className="flight-card-label">Arrival</span>
          <p>{formatDateTime(flight.arrival_time)}</p>
          <span className="flight-card-meta">
              Seats{" "}
            {seatsLeft !== null
              ? seatsLeft
              : "Loading..."}</span>
        </div>
        <div>
          <span className="flight-card-label">Status</span>
          <p className={`flight-card-status status-${statusClass}`}>
            {statusLabel}
            {seatsLeft !== null && seatsLeft <= 0 && ( <span style={{ color: "#b91c1c", fontWeight: "600" }}> • Full</span>)}
          </p>
        </div>
      </div>
    </article>
  );
}
