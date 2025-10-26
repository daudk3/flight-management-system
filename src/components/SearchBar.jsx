import { useState } from 'react';
import "./SearchBar.css";

export default function SearchBar({ onSearch }) {
  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');

  const handleSearch = () => {
    onSearch({ departure, destination, date });
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Departure Airport"
        value={departure}
        onChange={e => setDeparture(e.target.value)}
        className="input-field"
      />
      <input
        type="text"
        placeholder="Destination"
        value={destination}
        onChange={e => setDestination(e.target.value)}
        className="input-field"
      />
      <input
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        className="input-field"
      />
      <button onClick={handleSearch} className="btn-primary">Search Flights</button>
    </div>
  );
}