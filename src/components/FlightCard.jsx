
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
  const gateLabel = flight.gate ? `Gate ${flight.gate}` : "Gate TBD";
  const seatsLabel =
    typeof flight.seatsAvailable === "number"
      ? `Seats ${flight.seatsAvailable}`
      : "Seats TBD";

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
            {flight.departure} → {flight.destination}
          </h3>
          <p className="flight-card-subtitle">
            {flight.airline} • {flight.id}
          </p>
        </div>
        <p className="flight-card-price">{priceDisplay}</p>
      </header>

      <div className="flight-card-body">
        <div>
          <span className="flight-card-label">Departure</span>
          <p>{formatDateTime(flight.departureTime)}</p>
          <span className="flight-card-meta">{gateLabel}</span>
        </div>
        <div>
          <span className="flight-card-label">Arrival</span>
          <p>{formatDateTime(flight.arrivalTime)}</p>
          <span className="flight-card-meta">{seatsLabel}</span>
        </div>
        <div>
          <span className="flight-card-label">Status</span>
          <p
            className={`flight-card-status status-${statusClass}`}
          >
            {statusLabel}
          </p>
        </div>
      </div>
    </article>
  );
}
