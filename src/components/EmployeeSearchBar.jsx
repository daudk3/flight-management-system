import "./EmployeeSearchBar.css";

function SearchBar({
  departure,
  destination,
  date,
  flightId,
  onChange,
  onSearch,
}) {
  return (
    <div className="employee-searchbar">
      {/* Departure */}
      <div className="employee-searchbar__field">
        <label className="employee-searchbar__label">Departure</label>
        <input
          type="text"
          value={departure}
          onChange={(e) => onChange("departure", e.target.value)}
          placeholder="e.g. Toronto"
          className="employee-searchbar__input"
        />
      </div>

      {/* Destination */}
      <div className="employee-searchbar__field">
        <label className="employee-searchbar__label">Destination</label>
        <input
          type="text"
          value={destination}
          onChange={(e) => onChange("destination", e.target.value)}
          placeholder="e.g. Vancouver"
          className="employee-searchbar__input"
        />
      </div>

      {/* Date */}
      <div className="employee-searchbar__field">
        <label className="employee-searchbar__label">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => onChange("date", e.target.value)}
          className="employee-searchbar__input"
        />
      </div>

      {/* Flight ID */}
      <div className="employee-searchbar__field">
        <label className="employee-searchbar__label">Flight ID</label>
        <input
          type="text"
          value={flightId}
          onChange={(e) => onChange("flightId", e.target.value)}
          placeholder="optional"
          className="employee-searchbar__input"
        />
      </div>

      {/* Search Button */}
      <div className="employee-searchbar__actions">
        <button onClick={onSearch} className="employee-searchbar__button">
          Search
        </button>
      </div>
    </div>
  );
}

export default SearchBar;
