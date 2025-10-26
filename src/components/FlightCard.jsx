

export default function FlightCard({ flight, onBook }) {
  const statusColor =
    flight.status === "Delayed"
      ? "#eab308"
      : flight.status === "Full"
      ? "#ef4444"
      : "#22c55e";

  const depTime = new Date(flight.departureTime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const arrTime = new Date(flight.arrivalTime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flight-card">
      <div className="flight-header">
        <span className="flight-id">{flight.id}</span>
        <span
          className="flight-status"
          style={{ backgroundColor: statusColor }}
        >
          {flight.status}
        </span>
      </div>

      <div className="flight-route">
        {flight.departure} → {flight.destination}
      </div>
      <div className="flight-time">
        {depTime} – {arrTime}
      </div>

      <div className="flight-meta">
        Gate: {flight.gate} &nbsp;|&nbsp; Seats: {flight.seatsAvailable}{" "}
        &nbsp;|&nbsp; {flight.price}
      </div>

       {showOptions?.flightNumber && <p>Flight ID: {flight.id}</p>}
      {showOptions?.aircraftType && <p>Airline: {flight.airline}</p>}

      <button
        className="btn"
        disabled={flight.status === "Full"}
        onClick={() => onBook?.(flight)}
      >
        {flight.status === "Full" ? "Unavailable" : "Book"}
      </button>
    </div>
  );
}
