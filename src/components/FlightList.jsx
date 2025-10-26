/*
TODO
Reusable component that displays results from flight search (by both users and admins)
*/
import { useState, useMemo } from "react";
import { generateTestFlights } from "../utils";
import FlightCard from "./FlightCard";
import "./FlightList.css";


export default function FlightList({ filters = {}, mode = "user" }) {
  const [flights, setFlights] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const [sortOption, setSortOption] = useState("recommended");
  const [showOptions, setShowOptions] = useState({
    flightNumber: true,
    aircraftType: true,
  });

  const filteredFlights = useMemo(() => {
    const normalize = (v) => v.trim().toLowerCase();

    return flights.filter((f) => {
      const matchDeparture = filters.departure
        ? f.departure.toLowerCase().includes(normalize(filters.departure))
        : true;
      const matchDestination = filters.destination
        ? f.destination.toLowerCase().includes(normalize(filters.destination))
        : true;
      const matchDate = filters.date
        ? f.departureTime.startsWith(filters.date)
        : true;

      return matchDeparture && matchDestination && matchDate;
    });
  }, [filters, flights]);

  const sortedFlights = useMemo(() => {
    const sorted = [...filteredFlights];
    if (sortOption === "earliest")
      sorted.sort(
        (a, b) => new Date(a.departureTime) - new Date(b.departureTime)
      );
    else if (sortOption === "latest")
      sorted.sort(
        (a, b) => new Date(b.departureTime) - new Date(a.departureTime)
      );
    else if (sortOption === "lowest")
      sorted.sort(
        (a, b) => parseInt(a.price.slice(1)) - parseInt(b.price.slice(1))
      );
    return sorted;
  }, [filteredFlights, sortOption]);

  function handleSearch() {
    setFlights(generateTestFlights());
    setHasSearched(true);
  }

  return (
    <section className="flightlist">
      <div className="flightlist-header">
        <h2 className="flightlist-title">Results</h2>
        <button className="btn search-btn" onClick={handleSearch}>
          Search
        </button>
      </div>

      <div className="filter-options">
        <label>
          <input
            type="radio"
            name="sort"
            value="recommended"
            checked={sortOption === "recommended"}
            onChange={() => setSortOption("recommended")}
          />
          Recommended
        </label>
        <label>
          <input
            type="radio"
            name="sort"
            value="earliest"
            checked={sortOption === "earliest"}
            onChange={() => setSortOption("earliest")}
          />
          Earliest
        </label>
        <label>
          <input
            type="radio"
            name="sort"
            value="latest"
            checked={sortOption === "latest"}
            onChange={() => setSortOption("latest")}
          />
          Latest
        </label>
        <label>
          <input
            type="radio"
            name="sort"
            value="lowest"
            checked={sortOption === "lowest"}
            onChange={() => setSortOption("lowest")}
          />
          Lowest price
        </label>

        <hr />

        <label>
          <input
            type="checkbox"
            checked={showOptions.flightNumber}
            onChange={() =>
              setShowOptions((p) => ({ ...p, flightNumber: !p.flightNumber }))
            }
          />
          Flight number
        </label>
        <label>
          <input
            type="checkbox"
            checked={showOptions.aircraftType}
            onChange={() =>
              setShowOptions((p) => ({ ...p, aircraftType: !p.aircraftType }))
            }
          />
          Aircraft type
        </label>
      </div>

      {!hasSearched && (
        <p className="flightlist-empty">
          Search for flights to display results here.
        </p>
      )}

      {hasSearched && sortedFlights.length === 0 && (
        <p className="flightlist-empty">No flights match your filters.</p>
      )}

      {sortedFlights.length > 0 && (
        <div className="flightlist-results">
          {sortedFlights.map((flight) => (
            <FlightCard
              key={flight.id}
              flight={flight}
              mode={mode}
              showOptions={showOptions}
            />
          ))}
        </div>
      )}
    </section>
  );
}
