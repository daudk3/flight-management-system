function EmployeeFlightCard({ flight, onEdit = () => {} }) {
  // choose a small color accent for the flight status
  const statusColor =
    flight.status === "Delayed"
      ? "#eab308" // yellow
      : flight.status === "Full"
      ? "#ef4444" // red
      : "#22c55e"; // green

  return (
    <div
      style={{
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        padding: "1rem",
        marginBottom: "1rem",
        backgroundColor: "white",
        boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
      }}
    >
      {/* Header row: Flight ID + Status */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "0.4rem",
        }}
      >
        <div style={{ fontWeight: "600" }}>{flight.id}</div>
        <div
          style={{
            backgroundColor: statusColor,
            color: "white",
            borderRadius: "5px",
            padding: "2px 8px",
            fontSize: "0.8rem",
          }}
        >
          {flight.status}
        </div>
      </div>

      {/* Route and timing */}
      <div style={{ marginBottom: "0.4rem" }}>
        <div style={{ fontWeight: "500" }}>
          {flight.departure} → {flight.destination}
        </div>
        <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>
          {flight.departureTime} – {flight.arrivalTime}
        </div>
      </div>

      {/* Flight details */}
      <div style={{ color: "#4b5563", fontSize: "0.9rem" }}>
        Gate: {flight.gate} &nbsp;|&nbsp; Seats: {flight.seatsAvailable}{" "}
        &nbsp;|&nbsp; Price: {flight.price}
      </div>

      {/* Edit button */}
      <div style={{ textAlign: "right", marginTop: "0.8rem" }}>
        <button
          onClick={() => onEdit(flight)}
          style={{
            padding: "6px 12px",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Edit
        </button>
      </div>
    </div>
  );
}

export default EmployeeFlightCard;
