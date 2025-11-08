/*
TODO
User can search for flights and see results (using FlightList.jsx)
*/
import { useMemo, useState } from "react";
import "./Home.css";
import FlightList from "../components/FlightList";
import BookingPopUp from "../components/BookingPopUp";
import { generateTestFlights } from "../utils";

const INITIAL_SEARCH = {
  departure: "",
  arrival: "",
  date: "",
};

export default function Home() {
  const flights = useMemo(() => generateTestFlights(), []);
  const [search, setSearch] = useState(INITIAL_SEARCH);
  const [results, setResults] = useState(flights);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);

  function handleSearchChange(event) {
    const { name, value } = event.target;
    setSearch((prev) => ({ ...prev, [name]: value }));
  }

  function filterFlights() {
    const departureTerm = search.departure.trim().toLowerCase();
    const arrivalTerm = search.arrival.trim().toLowerCase();
    const dateTerm = search.date.trim();

    const filtered = flights.filter((flight) => {
      const matchesDeparture =
        !departureTerm ||
        flight.departure.toLowerCase().includes(departureTerm) ||
        flight.origin?.toLowerCase?.().includes(departureTerm);

      const matchesArrival =
        !arrivalTerm ||
        flight.destination.toLowerCase().includes(arrivalTerm) ||
        flight.arrival?.toLowerCase?.().includes(arrivalTerm);

      const matchesDate =
        !dateTerm ||
        (flight.departureTime && flight.departureTime.startsWith(dateTerm));

      return matchesDeparture && matchesArrival && matchesDate;
    });

    setResults(filtered);
  }

  function handleSearchSubmit(event) {
    event?.preventDefault();
    filterFlights();
  }

  function handleReset() {
    setSearch(INITIAL_SEARCH);
    setResults(flights);
  }

  function handleSelectFlight(flight) {
    setSelectedFlight(flight);
    setIsBookingOpen(true);
  }

  function handleBookingClose() {
    setIsBookingOpen(false);
    setSelectedFlight(null);
  }

  function handleBookingSubmit(bookingData) {
    // Placeholder for integrating with backend submission later.
    console.info("Booking submitted", bookingData);
  }

  return (
    <main>
      <Search
        form={search}
        onChange={handleSearchChange}
        onSubmit={handleSearchSubmit}
        onReset={handleReset}
      />
      <FlightList flights={results} onSelectFlight={handleSelectFlight} />
      <BookingPopUp
        isOpen={isBookingOpen}
        flight={selectedFlight}
        onClose={handleBookingClose}
        onSubmit={handleBookingSubmit}
      />
    </main>
  );
}

function Search({ form, onChange, onSubmit, onReset }) {
  return (
    <section className="home">
      <h2 className="home-title">Search Flights</h2>

      <form className="flight-form" onSubmit={onSubmit}>
        <div className="form-row">
          <label>
            Departure
            <input
              type="text"
              name="departure"
              value={form.departure}
              onChange={onChange}
              placeholder="e.g. Toronto"
            />
          </label>

          <label>
            Arrival
            <input
              type="text"
              name="arrival"
              value={form.arrival}
              onChange={onChange}
              placeholder="e.g. Vancouver"
            />
          </label>

          <label>
            Date
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={onChange}
            />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn search-btn">
              Search
            </button>
            <button type="button" className="btn reset-btn" onClick={onReset}>
              Reset
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
