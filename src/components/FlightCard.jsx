

export default function FlightCard({ flight }) {
  return (
    <div className="flight-card">
      <p><strong>Flight:</strong> {flight.name}</p>
      <p><strong>Departure:</strong> {flight.departure} at {flight.departureTime}</p>
      <p><strong>Arrival:</strong> {flight.arrival} at {flight.arrivalTime}</p>
      <p><strong>Price:</strong> ${flight.price}</p>
    </div>
  );
}
