import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ---------- Date/Time Formatting ----------
const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  month: "short",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-CA", {
  hour: "numeric",
  minute: "2-digit",
});

function formatDateTime(isoString) {
  if (!isoString) return "TBD";

  // 👇 Parse as "local" time by replacing the 'T' with a space
  // and preventing Date() from auto-converting from UTC
  const parts = isoString.replace("T", " ").split(/[- :]/);
  const [year, month, day, hour, minute, second] = parts.map(Number);

  const parsed = new Date(year, month - 1, day, hour, minute, second || 0);

  const date = dateFormatter.format(parsed);
  const time = timeFormatter.format(parsed);
  return `${date} • ${time}`;
}



// ---------- Component ----------
export default function EmployeeFlightCard({ flight, onEdit }) {
  console.log(flight)
  const [seatsLeft, setSeatsLeft] = useState(null);

  useEffect(() => {
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

    if (flight?.id) {
      fetchSeats();
    }
  }, [flight?.id]);

  if (!flight) return null;

  // ---------- Derived fields ----------
  const departure = flight.departure_airport || "Unknown Departure";
  const destination = flight.destination_airport || "Unknown Destination";
  const departureTime = formatDateTime(flight.departure_time);
  const arrivalTime = formatDateTime(flight.arrival_time);
  const gateLabel = flight.gate_num ? `Gate ${flight.gate_num}` : "Gate TBD";
  const statusLabel = flight.status || "Scheduled";
  const priceDisplay =
    typeof flight.price === "string" && flight.price.trim().length > 0
      ? flight.price
      : `$${flight.price ?? "N/A"}`;
  const statusClass = statusLabel
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z-]/g, "");

  // ---------- UI ----------
  return (
    <article
      className="flight-card"
      style={{
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        padding: "1rem",
        marginBottom: "1rem",
        backgroundColor: "white",
        boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
        transition: "transform 0.1s ease",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.75rem",
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontWeight: "600" }}>
            {departure} → {destination}
          </h3>
          <p style={{ color: "#6b7280", fontSize: "0.9rem", margin: 0 }}>
            {flight.flight_code || "Flight"} • #{flight.id}
          </p>
        </div>

        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontWeight: "600", fontSize: "1rem" }}>
            {priceDisplay}
          </p>
          <p
            className={`status-${statusClass}`}
            style={{
              fontSize: "0.85rem",
              color:
                statusLabel === "Delayed"
                  ? "#eab308"
                  : statusLabel === "Full"
                  ? "#ef4444"
                  : "#16a34a",
              fontWeight: "500",
              marginTop: "0.2rem",
            }}
          >
            {statusLabel}
          </p>
        </div>
      </header>

      {/* Flight details */}
      <div
        className="flight-card-body"
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          fontSize: "0.9rem",
          color: "#374151",
        }}
      >
        <div>
          <span style={{ fontWeight: "600" }}>Departure</span>
          <p>{departureTime}</p>
          <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>{gateLabel}</p>
        </div>

        <div>
          <span style={{ fontWeight: "600" }}>Arrival</span>
          <p>{arrivalTime}</p>
          <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>
            Seats {seatsLeft !== null ? seatsLeft : "Loading..."}
          </p>
        </div>

        <div style={{ alignSelf: "center" }}>
          <button
            onClick={() => onEdit(flight)}
            style={{
              padding: "6px 12px",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            Edit
          </button>
        </div>
      </div>
    </article>
  );
}
