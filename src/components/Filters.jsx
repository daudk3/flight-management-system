import { useState } from "react";

export default function Filters({ onFilter }) {
  const [maxPrice, setMaxPrice] = useState('');
  const [timeFilter, setTimeFilter] = useState('');
  const [sort, setSort] = useState('recommend');

  const handleFilter = () => {
    onFilter({ maxPrice, timeFilter, sort });
  };

  return (
    <div className="filters">
      <div className="filters__fields">
        <input
          type="number"
          placeholder="Max Price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="input-field"
        />
        <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="input-field">
          <option value="">Any Time</option>
          <option value="morning">Morning (6AM-12PM)</option>
          <option value="afternoon">Afternoon (12PM-6PM)</option>
          <option value="evening">Evening (6PM-12AM)</option>
        </select>
      </div>
      <div className="filters__sort">
        <label><input type="radio" value="recommend" checked={sort === "recommend"} onChange={(e) => setSort(e.target.value)} /> Recommend</label>
        <label><input type="radio" value="earliest" checked={sort === "earliest"} onChange={(e) => setSort(e.target.value)} /> Earliest Departure</label>
        <label><input type="radio" value="latest" checked={sort === "latest"} onChange={(e) => setSort(e.target.value)} /> Latest Departure</label>
        <label><input type="radio" value="lowest" checked={sort === "lowest"} onChange={(e) => setSort(e.target.value)} /> Lowest Price</label>
      </div>
      <button onClick={handleFilter} className="btn-primary">Apply Filters</button>
    </div>
  );
}