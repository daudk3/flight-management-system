import FlightCard from "./FlightCard";

export default function FlightList({ flights = [], onSelectFlight }) {
  const hasFlights = flights.length > 0;

  return (
    <section className="flightlist">
      <div className="flightlist-header">
        <h2 className="flightlist-title">Results</h2>
        {hasFlights && (
          <span className="flightlist-count">
            {flights.length} {flights.length === 1 ? "flight" : "flights"}
          </span>
        )}
      </div>

      {hasFlights ? (
        <div className="flightlist-grid">
          {flights.map((flight) => (
            <FlightCard
              key={flight.id}
              flight={flight}
              onSelect={onSelectFlight}
            />
          ))}
        </div>
      ) : (
        <p className="flightlist-empty">
          No flights match your search. Try adjusting departure, arrival, or date
          filters.
        </p>
      )}
    </section>
  );
}
