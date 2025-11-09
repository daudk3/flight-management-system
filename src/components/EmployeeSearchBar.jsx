import { useState } from "react";
import "./EmployeeSearchBar.css";

export default function EmployeeSearchBar({ onSearch, onReset }) {
  const [filters, setFilters] = useState({
    departure: "",
    destination: "",
    date: "",
    flightId: "",
  });

  // Handle typing in any input field
  function handleChange(field, value) {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  // When user clicks Search
  function handleSearchClick() {
    if (onSearch) onSearch(filters);
  }

  // When user clicks Reset
  function handleResetClick() {
    setFilters({
      departure: "",
      destination: "",
      date: "",
      flightId: "",
    });
    if (onReset) onReset();
  }

  return (
    <div className="employee-searchbar">
      {/* Departure */}
      <div className="employee-searchbar__field">
        <label className="employee-searchbar__label">Departure</label>
        <input
          type="text"
          value={filters.departure}
          onChange={(e) => handleChange("departure", e.target.value)}
          placeholder="e.g. Toronto"
          className="employee-searchbar__input"
        />
      </div>

      {/* Destination */}
      <div className="employee-searchbar__field">
        <label className="employee-searchbar__label">Destination</label>
        <input
          type="text"
          value={filters.destination}
          onChange={(e) => handleChange("destination", e.target.value)}
          placeholder="e.g. Vancouver"
          className="employee-searchbar__input"
        />
      </div>

      {/* Date */}
      <div className="employee-searchbar__field">
        <label className="employee-searchbar__label">Date</label>
        <input
          type="date"
          value={filters.date}
          onChange={(e) => handleChange("date", e.target.value)}
          className="employee-searchbar__input"
        />
      </div>

      {/* Flight ID */}
      <div className="employee-searchbar__field">
        <label className="employee-searchbar__label">Flight ID</label>
        <input
          type="text"
          value={filters.flightId}
          onChange={(e) => handleChange("flightId", e.target.value)}
          placeholder="optional"
          className="employee-searchbar__input"
        />
      </div>

      {/* Buttons */}
      <div className="employee-searchbar__actions">
        <button
          onClick={handleSearchClick}
          className="employee-searchbar__button"
        >
          Search
        </button>
        <button
          onClick={handleResetClick}
          className="employee-searchbar__button reset"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
