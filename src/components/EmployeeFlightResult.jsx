// src/components/EmployeeFlightResult.jsx
import React from "react";
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
          flight={{
            ...flight,
            departure_airport: flight.departure_airport,
            destination_airport: flight.destination_airport,
            departure_time: flight.departure_time,
            arrive_time: flight.arrive_time,
            price: flight.price,
          }}
          onEdit={(selectedFlight) => onEdit?.(selectedFlight)}
        />
      ))}
    </div>
  );
}

export default EmployeeFlightResult;
