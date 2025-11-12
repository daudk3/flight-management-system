/*
TODO
User can search for flights and see results (using FlightList.jsx)
*/
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import FlightList from "../components/FlightList";
import BookingPopUp from "../components/BookingPopUp";
import { supabase } from "../lib/supabaseClient";

const INITIAL_SEARCH = {
  departure: "",
  arrival: "",
  departureDate: "",
  arrivalDate: "",
};

export default function Home() {
  const [flights, setFlights] = useState([]);
  const [search, setSearch] = useState(INITIAL_SEARCH);
  const [results, setResults] = useState(flights);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const navigate = useNavigate();
  
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
    const departureDateTerm = search.departureDate.trim();
    const arrivalDateTerm = search.arrivalDate.trim();

    const normalizeDate = (value) => {
      if (!value) return "";
      if (typeof value === "string" && value.length >= 10) {
        return value.slice(0, 10);
      }
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        return "";
      }
      return parsed.toISOString().slice(0, 10);
    };

    const filtered = flights.filter((flight) => {
      const departureAirport =
        flight.departure_airport?.toLowerCase?.() ??
        flight.departure?.toLowerCase?.() ??
        "";
      const arrivalAirport =
        flight.destination_airport?.toLowerCase?.() ??
        flight.destination?.toLowerCase?.() ??
        "";

      const matchesDeparture = !departureTerm
        ? true
        : departureAirport.includes(departureTerm);

      const matchesArrival = !arrivalTerm
        ? true
        : arrivalAirport.includes(arrivalTerm);

      const departureDateField =
        flight.departure_time || flight.departureTime || "";
      const arrivalDateField = flight.arrival_time || flight.arrivalTime || "";

      const matchesDepartureDate = !departureDateTerm
        ? true
        : normalizeDate(departureDateField) === departureDateTerm;

      const matchesArrivalDate = !arrivalDateTerm
        ? true
        : normalizeDate(arrivalDateField) === arrivalDateTerm;

      return (
        matchesDeparture &&
        matchesArrival &&
        matchesDepartureDate &&
        matchesArrivalDate
      );
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
    const flightDetails = bookingData?.flight ?? selectedFlight;
    if (!flightDetails) {
      alert("Select a flight before booking.");
      return;
    }

    if (!bookingData?.seatIds?.length) {
      alert("Select at least one seat before continuing to checkout.");
      return;
    }

    const checkoutPayload = {
      flight: flightDetails,
      passengerCount: bookingData.passengers ?? 1,
      travelClass: bookingData.travelClass,
      seatIds: bookingData.seatIds,
      seatCodes: bookingData.seatCodes,
      notes: bookingData.notes,
      firstName: bookingData.firstName,
      lastName: bookingData.lastName,
    };

    navigate("/checkout", {
      state: { booking: checkoutPayload },
    });

    setIsBookingOpen(false);
    setSelectedFlight(null);
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
            Departure Date
            <input
              type="date"
              name="departureDate"
              value={form.departureDate}
              onChange={onChange}
            />
          </label>

          <label>
            Arrival Date
            <input
              type="date"
              name="arrivalDate"
              value={form.arrivalDate}
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
