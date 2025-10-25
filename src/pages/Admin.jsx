/* 
TODO
Admin/staff can search for flights (using FlightList.jsx), manually add flights, and delete flights and bookings
*/
import { useMemo, useState } from "react";
import { generateTestFlights } from "../utils";
import EmployeeSearchBar from "../components/EmployeeSearchBar";
import EmployeeFlightResult from "../components/EmployeeFlightResult";

const initialFilters = {
  departure: "",
  destination: "",
  date: "",
  flightId: "",
};

export default function Admin() {
  const [filters, setFilters] = useState(initialFilters);
  const [flights, setFlights] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const filteredFlights = useMemo(() => {
    const searchTerm = (value) => value.trim().toLowerCase();

    return flights.filter((flight) => {
      const matchesDeparture = filters.departure
        ? flight.departure.toLowerCase().includes(searchTerm(filters.departure))
        : true;

      const matchesDestination = filters.destination
        ? flight.destination
            .toLowerCase()
            .includes(searchTerm(filters.destination))
        : true;

      const matchesDate = filters.date
        ? flight.departureTime.startsWith(filters.date)
        : true;

      const matchesFlightId = filters.flightId
        ? flight.id.toLowerCase().includes(searchTerm(filters.flightId))
        : true;

      return (
        matchesDeparture && matchesDestination && matchesDate && matchesFlightId
      );
    });
  }, [filters, flights]);

  function handleChange(field, value) {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  function handleSearch() {
    setFlights(generateTestFlights());
    setHasSearched(true);
  }

  return (
    <main className="admin-page">
      <section>
        <EmployeeSearchBar
          departure={filters.departure}
          destination={filters.destination}
          date={filters.date}
          flightId={filters.flightId}
          onChange={handleChange}
          onSearch={handleSearch}
        />
      </section>

      <section>
        <EmployeeFlightResult
          flights={filteredFlights}
          hasSearched={hasSearched}
        />
      </section>
    </main>
  );
}
