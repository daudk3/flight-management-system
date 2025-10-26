
import React from "react";
export default function Filters({ sortOption, onSortChange, showOptions, onShowChange }) {
  return (
    <aside className="filters">
      <h3>Filters</h3>

      <div className="filter-group">
        <label>
          <input
            type="radio"
            name="sort"
            value="recommended"
            checked={sortOption === "recommended"}
            onChange={() => onSortChange("recommended")}
          />
          Recommended
        </label>

        <label>
          <input
            type="radio"
            name="sort"
            value="earliest"
            checked={sortOption === "earliest"}
            onChange={() => onSortChange("earliest")}
          />
          Earliest departure
        </label>

        <label>
          <input
            type="radio"
            name="sort"
            value="latest"
            checked={sortOption === "latest"}
            onChange={() => onSortChange("latest")}
          />
          Latest departure
        </label>

        <label>
          <input
            type="radio"
            name="sort"
            value="lowest"
            checked={sortOption === "lowest"}
            onChange={() => onSortChange("lowest")}
          />
          Lowest price
        </label>
      </div>

      <hr />


      <div className="filter-group">
        <label>
          <input
            type="checkbox"
            checked={showOptions.flightNumber}
            onChange={() => onShowChange("flightNumber")}
          />
          Flight number
        </label>

        <label>
          <input
            type="checkbox"
            checked={showOptions.aircraftType}
            onChange={() => onShowChange("aircraftType")}
          />
          Aircraft type
        </label>
      </div>
    </aside>
  );
}
