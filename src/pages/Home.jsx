/*
TODO
User can search for flights and see results (using FlightList.jsx)
*/
import { useEffect, useState } from "react";
import "./Home.css";
import FlightList from "../components/FlightList";
import BookingPopUp from "../components/BookingPopUp";
import { supabase } from "../lib/supabaseClient";

const INITIAL_SEARCH = {
  departure: "",
  arrival: "",
  date: "",
};

export default function Home() {
  const [flights, setFlights] = useState([]);
  const [search, setSearch] = useState(INITIAL_SEARCH);
  const [results, setResults] = useState(flights);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  
    useEffect(() => {
    async function fetchFlights() {
      const { data, error } = await supabase.from("flights").select("*");
      if (error) {
        console.error(" Error fetching flights:", error);
      } else {
        setFlights(data);
        setResults(data); 
      }
    }
    fetchFlights();
  }, []);

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
        flight.departure_airport?.toLowerCase?.().includes(departureTerm);

      const matchesArrival =
        !arrivalTerm ||
        flight.destination_airport?.toLowerCase?.().includes(arrivalTerm);

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

  async function handleBookingSubmit() {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      const { error } = await supabase.from("bookings").insert([
        {
          user_id: user.id,
          flight_id: selectedFlight.id,
          status: "confirmed",
        },
      ]);
      if (error) {
        console.error("Booking failed:", error);
        alert("Booking failed!");
      } else {
        alert("Flight booked successfully!");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
    }
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
