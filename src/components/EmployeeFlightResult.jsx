import EmployeeFlightCard from "./EmployeeFlightCard";

function EmployeeFlightResult({ flights, onEdit, hasSearched = false }) {
  if (!hasSearched) {
    return (
      <div className="employee-flight-result__empty">
        Use the search filters to find flights.
      </div>
    );
  }

  if (!flights?.length) {
    return (
      <div className="employee-flight-result__empty">
        No flights match your current filters.
      </div>
    );
  }

  return (
    <div className="employee-flight-result__list">
      {flights.map((flight) => (
        <EmployeeFlightCard
          key={flight.id}
          flight={flight}
          onEdit={(selectedFlight) => onEdit?.(selectedFlight)}
        />
      ))}
    </div>
  );
}

export default EmployeeFlightResult;