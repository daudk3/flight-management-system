// src/pages/Admin.jsx
import { useEffect, useState } from "react";
import EmployeeSearchBar from "../components/EmployeeSearchBar";
import EmployeeFlightResult from "../components/EmployeeFlightResult";
import EditFlightPopup from "../components/editFlightPopup";
import { supabase } from "../lib/supabaseClient";

export default function Admin() {
  const [flights, setFlights] = useState([]);
  const [filteredFlights, setFilteredFlights] = useState([]);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    async function fetchFlights() {
      const { data, error } = await supabase.from("flights").select("*");
      if (error) {
        console.error("Error fetching flights:", error);
      } else {
        setFlights(data);
        setFilteredFlights(data);
      }
    }
    fetchFlights();
  }, []);

  const handleSearch = (filters) => {
    const { departure, destination, date, flightId } = filters || {};
    setHasSearched(true);

    const depTerm = (departure || "").toLowerCase();
    const destTerm = (destination || "").toLowerCase();
    const dateTerm = date?.trim();
    const idTerm = flightId?.trim();

    const filtered = flights.filter((flight) => {
      const departureField =
        flight.departure_airport || flight.departure || "";
      const destinationField =
        flight.destination_airport || flight.destination || "";
      const departureTimeField =
        flight.departure_time || flight.departureTime || "";

      const matchesDeparture = !depTerm
        ? true
        : departureField.toLowerCase().includes(depTerm);

      const matchesDestination = !destTerm
        ? true
        : destinationField.toLowerCase().includes(destTerm);

      const matchesDate = !dateTerm
        ? true
        : departureTimeField.slice(0, 10) === dateTerm;

      const matchesId = !idTerm
        ? true
        : String(flight.id).toLowerCase().includes(idTerm.toLowerCase());

      return (
        matchesDeparture && matchesDestination && matchesDate && matchesId
      );
    });

    setFilteredFlights(filtered);
  };

  const handleReset = () => {
    setFilteredFlights(flights);
    setHasSearched(false);
  };

  const handleEdit = (flight) => {
    setSelectedFlight(flight);
  };

  const handleSaveFlight = async (updatedFlight) => {
    try {
      const updates = {
        departure_time: updatedFlight.departure_time,
        arrival_time: updatedFlight.arrival_time,
        price:
          updatedFlight.price === "" || updatedFlight.price === null
            ? null
            : Number(updatedFlight.price),
        departure_airport: updatedFlight.departure_airport,
        destination_airport: updatedFlight.destination_airport,
        gate_num: updatedFlight.gate_num,
        flight_code: updatedFlight.flight_code,
        status: updatedFlight.status ?? "On Time",
      };

      const { data: updatedRow, error } = await supabase
        .from("flights")
        .update(updates)
        .eq("id", updatedFlight.id)
        .select("*")
        .single();

      if (error) throw error;

      const nextFlight = updatedRow ?? { ...updatedFlight, ...updates };

      setFlights((prev) =>
        prev.map((f) => (f.id === updatedFlight.id ? nextFlight : f))
      );
      setFilteredFlights((prev) =>
        prev.map((f) => (f.id === updatedFlight.id ? nextFlight : f))
      );
      setSelectedFlight(null);
      alert("✅ Flight updated successfully!");
    } catch (err) {
      console.error("Error updating flight:", err);
      alert("❌ Failed to update flight.");
    }
  };

  return (
    <main className="admin-page">
      <EmployeeSearchBar onSearch={handleSearch} onReset={handleReset} />

      <EmployeeFlightResult
        flights={filteredFlights}
        hasSearched={hasSearched}
        onEdit={handleEdit}
      />

      {selectedFlight && (
        <EditFlightPopup
          flight={selectedFlight}
          onSave={handleSaveFlight}
          onClose={() => setSelectedFlight(null)}
        />
      )}
    </main>
  );
}
