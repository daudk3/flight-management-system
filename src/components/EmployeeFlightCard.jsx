import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

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

  const parts = isoString.replace("T", " ").split(/[- :]/);
  const [year, month, day, hour, minute, second] = parts.map(Number);

  const parsed = new Date(year, month - 1, day, hour, minute, second || 0);

  const date = dateFormatter.format(parsed);
  const time = timeFormatter.format(parsed);
  return `${date} • ${time}`;
}

export default function EmployeeFlightCard({ flight, onEdit }) {
  const [seatsLeft, setSeatsLeft] = useState(null);

  useEffect(() => {
    async function fetchSeats() {
      const { count, error } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("flight_id", flight.id)
        .eq("status", "confirmed");

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

  const departure = flight.departure_airport || "Unknown Departure";
  const destination = flight.destination_airport || "Unknown Destination";
  const departureTime = formatDateTime(
    flight.departure_time || flight.departureTime,
  );
  const arrivalTime = formatDateTime(flight.arrival_time || flight.arrive_time);
  const gateLabel = flight.gate_num ? `Gate ${flight.gate_num}` : "Gate TBD";
  const status = flight.status || "On Time";
  const priceDisplay =
    typeof flight.price === "string" && flight.price.trim().length > 0
      ? flight.price
      : `$${flight.price ?? "N/A"}`;
  const statusClass = status
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z-]/g, "");

  return (
    <article
      className="flight-card"
      style={{
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        padding: "1.25rem",
        marginBottom: "1rem",
        backgroundColor: "white",
        boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
        transition: "transform 0.1s ease",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        minHeight: "100%",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
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
                status === "Delayed"
                  ? "#eab308"
                  : status === "Full"
                  ? "#ef4444"
                  : status === "Cancelled"
                  ? "#6b7280"
                  : status === "On Time"
                  ? "#16a34a"
                  : "#16a34a",
              fontWeight: "500",
              marginTop: "0.2rem",
            }}
          >
            {status}
          </p>
        </div>
      </header>

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
      </div>

      <div
        style={{
          marginTop: "auto",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={() => onEdit(flight)}
          style={{
            padding: "0.6rem 1.1rem",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Edit
        </button>
      </div>
    </article>
  );
}
