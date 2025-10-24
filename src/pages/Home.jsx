/*
TODO
User can search for flights and see results (using FlightList.jsx)
*/
// src/pages/Home.jsx
// src/pages/Home.jsx
import { useState } from "react";
import "./Home.css";
import FlightList from "../components/FlightList";

export default function Home() {
  return (
    <main>
      <Search/>
      <FlightListHome/> 
    </main>
  );
}

function Search() {
  const [form, setForm] = useState({
    departure: "",
    arrival: "",
    date: "",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleReset() {
    setForm({ departure: "", arrival: "", date: "" });
  }

  return (
    <main className="home">
      <h2 className="home-title">Search Flights</h2>

      <form className="flight-form">
        <div className="form-row">
          <label>
            Departure
            <input
              type="text"
              name="departure"
              value={form.departure}
              onChange={handleChange}
              placeholder="e.g. Toronto (YYZ)"
            />
          </label>

          <label>
            Arrival
            <input
              type="text"
              name="arrival"
              value={form.arrival}
              onChange={handleChange}
              placeholder="e.g. Atlanta (ATL)"
            />
          </label>

          <label>
            Date
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
            />
          </label>
          <div>
            <button
              type="button"
              className="btn search-btn"
              onClick={handleReset}
            >
              Search
            </button>
            <button
              type="button"
              className="btn reset-btn"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}

function FlightListHome(){
  return (
    <FlightList/>
  );
}