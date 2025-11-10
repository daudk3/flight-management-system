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
  departureDate: "",
  arrivalDate: "",
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

  async function handleBookingSubmit(bookingData) {
    if (!selectedFlight) {
      alert("Select a flight before booking.");
      return;
    }

    if (!bookingData?.seatId) {
      alert("Select a seat before confirming your booking.");
      return;
    }

    let seatReserved = false;
    let bookingRecord = null;
    try {
      const { data: userResponse } = await supabase.auth.getUser();
      const user = userResponse?.user;

      if (!user) {
        alert("Please sign in before booking.");
        return;
      }

      const { data: reservedSeat, error: seatReserveError } = await supabase
        .from("seats")
        .update({ is_booked: true })
        .eq("id", bookingData.seatId)
        .eq("is_booked", false)
        .select("id")
        .maybeSingle();

      if (seatReserveError) {
        throw seatReserveError;
      }

      if (!reservedSeat) {
        throw new Error("That seat was just taken. Please pick another seat.");
      }

      seatReserved = true;

      const { data: booking, error } = await supabase
        .from("bookings")
        .insert([
          {
            user_id: user.id,
            flight_id: selectedFlight.id,
            status: "confirmed",
            booked_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }
      bookingRecord = booking;

      const { error: linkError } = await supabase
        .from("booking_seats")
        .insert([{ booking_id: booking.id, seat_id: bookingData.seatId }]);
      if (linkError) {
        throw linkError;
      }

      alert(
        `Flight booked successfully! Seat ${bookingData.seatCode} is reserved for you.`,
      );
      handleBookingClose();
    } catch (err) {
      console.error("Unexpected error:", err);
      if (bookingRecord?.id) {
        await supabase.from("bookings").delete().eq("id", bookingRecord.id);
      }
      if (seatReserved) {
        await supabase
          .from("seats")
          .update({ is_booked: false })
          .eq("id", bookingData.seatId);
      }
      alert(err.message ?? "Booking failed. Please try again.");
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
