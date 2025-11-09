// src/components/EditFlightPopup.jsx
import { useState, useEffect } from "react";
import "./EditFlightPopup.css";
import { updateFlight } from "../utils";
import { supabase } from "../supabaseClient";

export default function EditFlightPopup({ flight, onClose, onSave }) {
  const [tempFlight, setTempFlight] = useState(null);
  const [error, setError] = useState("");
  const [editedSeats, setEditedSeats] = useState({});
  const [newPassenger, setNewPassenger] = useState({ name: "", seat: "" });
  const [seats, setSeats] = useState([]);

  useEffect(() => {
    if (flight) {
      const clone = JSON.parse(JSON.stringify(flight));
      setTempFlight(clone);
      loadSeats(flight.id);
    }
  }, [flight]);

  async function loadSeats(flightId) {
    try {
      const { data, error } = await supabase
        .from("seats")
        .select("id, seat_code, is_booked")
        .eq("flight_id", flightId);
      if (error) throw error;
      setSeats(data);
    } catch (err) {
      console.error("Error loading seats:", err.message);
    }
  }

  if (!tempFlight) return null;

  const takenSeats = seats.filter((s) => s.is_booked).map((s) => s.seat_code);

  async function handleSave() {
    try {
      await updateFlight(flight.id, {
        departure_time: tempFlight.departure_time,
        arrive_time: tempFlight.arrive_time,
        price: tempFlight.price,
      });
      onSave(tempFlight);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error saving flight changes.");
    }
  }

  async function handleSeatClick(seatCode) {
    if (takenSeats.includes(seatCode)) {
      setError(`Seat ${seatCode} is already booked.`);
      return;
    }
    setNewPassenger({ ...newPassenger, seat: seatCode });
    setError("");
  }

  async function handleAddPassenger() {
    if (!newPassenger.name || !newPassenger.seat) {
      setError("Enter passenger name and select a seat.");
      return;
    }

    try {
      const { data: seat } = await supabase
        .from("seats")
        .select("id")
        .eq("seat_code", newPassenger.seat)
        .eq("flight_id", flight.id)
        .single();

      if (!seat) {
        setError("Seat not found.");
        return;
      }

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert([
          {
            user_id: null, // 🔸 until login system connects users
            flight_id: flight.id,
            booked_at: new Date(),
            status: "confirmed",
          },
        ])
        .select()
        .single();
      if (bookingError) throw bookingError;

      // Link booking + seat
      const { error: linkError } = await supabase
        .from("booking_seats")
        .insert([{ booking_id: booking.id, seat_id: seat.id }]);
      if (linkError) throw linkError;

      // Mark seat as booked
      await supabase.from("seats").update({ is_booked: true }).eq("id", seat.id);

      alert("Passenger successfully added.");
      loadSeats(flight.id);
      setNewPassenger({ name: "", seat: "" });
    } catch (err) {
      console.error(err);
      setError("Error adding passenger.");
    }
  }

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2>Edit Flight {flight.id}</h2>
        {error && <p className="error-msg">{error}</p>}

        <div className="section">
          <h3>Flight Details</h3>
          <label>
            Departure Time:
            <input
              type="datetime-local"
              value={tempFlight.departure_time?.slice(0, 16) || ""}
              onChange={(e) =>
                setTempFlight({
                  ...tempFlight,
                  departure_time: e.target.value,
                })
              }
            />
          </label>

          <label>
            Arrival Time:
            <input
              type="datetime-local"
              value={tempFlight.arrive_time?.slice(0, 16) || ""}
              onChange={(e) =>
                setTempFlight({
                  ...tempFlight,
                  arrive_time: e.target.value,
                })
              }
            />
          </label>

          <label>
            Price:
            <input
              type="number"
              value={tempFlight.price || ""}
              onChange={(e) =>
                setTempFlight({ ...tempFlight, price: e.target.value })
              }
            />
          </label>
        </div>

        <div className="section">
          <h3>Seat Map</h3>
          <div className="seat-grid">
            {seats.map((s) => (
              <div
                key={s.id}
                className={`seat ${s.is_booked ? "taken" : "available"} ${
                  newPassenger.seat === s.seat_code ? "selected" : ""
                }`}
                onClick={() => handleSeatClick(s.seat_code)}
              >
                {s.seat_code}
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <h3>Add Passenger</h3>
          <input
            type="text"
            placeholder="Full name"
            value={newPassenger.name}
            onChange={(e) =>
              setNewPassenger({ ...newPassenger, name: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Seat"
            value={newPassenger.seat}
            readOnly
          />
          <button className="btn add-btn" onClick={handleAddPassenger}>
            Add Passenger
          </button>
        </div>

        <div className="button-row">
          <button className="btn save-btn" onClick={handleSave}>
            Save Changes
          </button>
          <button className="btn cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
