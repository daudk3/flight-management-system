import { useState } from "react";
import "./EmployeeSearchBar.css";

export default function EmployeeSearchBar({ onSearch, onReset }) {
  const [filters, setFilters] = useState({
    departure: "",
    destination: "",
    date: "",
    flightId: "",
  });

  function handleChange(field, value) {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  function handleResetClick() {
    setFilters({
      departure: "",
      destination: "",
      date: "",
      flightId: "",
    });
    onReset?.();
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSearch?.(filters);
  }

  return (
    <form className="employee-searchbar" onSubmit={handleSubmit}>
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

      <div className="employee-searchbar__field">
        <label className="employee-searchbar__label">Date</label>
        <input
          type="date"
          value={filters.date}
          onChange={(e) => handleChange("date", e.target.value)}
          className="employee-searchbar__input"
        />
      </div>

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

      <div className="employee-searchbar__actions">
        <button
          type="submit"
          className="employee-searchbar__button"
        >
          Search
        </button>
        <button
          type="button"
          onClick={handleResetClick}
          className="employee-searchbar__button reset"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
