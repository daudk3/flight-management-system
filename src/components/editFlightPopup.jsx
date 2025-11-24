import { useEffect, useState } from "react";
import "./editFlightPopup.css";
import { updateFlight } from "../utils";
import { supabase } from "../lib/supabaseClient";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";


export default function EditFlightPopup({ flight, onClose, onSave }) {
  const [tempFlight, setTempFlight] = useState(null);
  const [error, setError] = useState("");
  const [newPassenger, setNewPassenger] = useState({ name: "", seat: "" });
  const [seats, setSeats] = useState([]);
  const [userQuery, setUserQuery] = useState("");
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);


  useEffect(() => {
    if (!flight) {
      return;
    }

    const clone = JSON.parse(JSON.stringify(flight));
    clone.departure_time = clone.departure_time ?? "";
    clone.arrival_time = clone.arrival_time ?? "";
    clone.departure_airport = clone.departure_airport ?? "";
    clone.destination_airport = clone.destination_airport ?? "";
    clone.gate_num = clone.gate_num ?? "";
    clone.flight_code = clone.flight_code ?? "";
    clone.price = clone.price ?? "";
    clone.status = clone.status ?? ""
    
    setTempFlight(clone);
    loadSeats(flight.id);
  }, [flight]);

  async function loadSeats(flightId) {
    try {
      const { data, error: seatError } = await supabase
        .from("seats")
        .select("id, seat_code, is_booked")
        .eq("flight_id", flightId);
      if (seatError) throw seatError;
      setSeats(data ?? []);
    } catch (err) {
      console.error("Error loading seats:", err.message);
    }
  }

  if (!tempFlight) {
    return null;
  }

  const takenSeats = seats.filter((s) => s.is_booked).map((s) => s.seat_code);

  async function handleSave() {
    try {
      await updateFlight(flight.id, {
        departure_time: tempFlight.departure_time,
        arrival_time: tempFlight.arrival_time,
        price: tempFlight.price,
        gate_num: tempFlight.gate_num,
        status: tempFlight.status

      });
      onSave(tempFlight);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Error saving flight changes.");
    }
  }

  async function handleGenerateReport() {
    
    try {
      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage([600, 800]);

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      let y = 760;

      function writeLine(text, size = 12, offset = 20) {
        page.drawText(text, {
          x: 40,
          y,
          size,
          font,
          color: rgb(0, 0, 0),
        });
        y -= offset;
      }

    
      writeLine(`Flight Report`, 22, 30);
      writeLine(`Flight: ${flight.flight_code} (${flight.id})`, 16, 25);

      
      writeLine(`Departure Airport: ${flight.departure_airport}`);
      writeLine(`Destination Airport: ${flight.destination_airport}`);
      writeLine(`Gate: ${flight.gate_num || "N/A"}`);
      writeLine(`Price: $${flight.price}`);
      writeLine(`Status: ${flight.status}`);

      writeLine(
        `Departure Time: ${
          tempFlight.departure_time
            ? new Date(tempFlight.departure_time).toLocaleString()
            : "N/A"
        }`
      );

      writeLine(
        `Arrival Time: ${
          tempFlight.arrival_time
            ? new Date(tempFlight.arrival_time).toLocaleString()
            : "N/A"
        }`
      );

      y -= 20;
      writeLine("Seat Map", 18, 25);

      const cols = 4;
      const colWidth = 130;

      let startY = y;

      seats
        .slice()
        .sort((a, b) => {
          const [, letterA = "", numberA = "0"] =
            /([A-Za-z]+)(\d+)/.exec(a.seat_code ?? "") || [];
          const [, letterB = "", numberB = "0"] =
            /([A-Za-z]+)(\d+)/.exec(b.seat_code ?? "") || [];
          const letterDiff = letterA.localeCompare(letterB);
          if (letterDiff !== 0) return letterDiff;
          return Number(numberA) - Number(numberB);
        })
        .forEach((s, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);

          const x = 40 + col * colWidth;
          const rowY = startY - row * 16;

          if (rowY < 40) {
            const newPage = pdfDoc.addPage([600, 800]);
            page = newPage;
            startY = 760;
          }

          page.drawText(
            `${s.seat_code}: ${s.is_booked ? "BOOKED" : "AVAILABLE"}`,
            {
              x: x,
              y: rowY,
              size: 12,
              font,
              color: rgb(0, 0, 0),
            }
          );
        });

      y = startY - Math.ceil(seats.length / cols) * 16 - 20;


    
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      window.open(url, "_blank");

    } catch (err) {
      console.error("PDF error:", err);
      alert("Failed to generate report.");
    }
}
  async function searchUsers(text) {
    setUserQuery(text);
    setSelectedUser(null);

    if (text.trim().length < 2) {
      setSuggestedUsers([]);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .ilike("full_name", `%${text}%`)
      .limit(5);

    if (error) {
      console.error("User search error:", error);
      return;
    }

    setSuggestedUsers(data);
  }


  function handleSeatClick(seatCode) {
    if (takenSeats.includes(seatCode)) {
      setError(`Seat ${seatCode} is already booked.`);
      return;
    }
    setNewPassenger({ ...newPassenger, seat: seatCode });
    setError("");
  }

  async function handleAddPassenger() {
    if (!selectedUser) {
      setError("Select a user account before adding a passenger.");
      return;
    }
    if (!newPassenger.seat) {
      setError("Select a seat.");
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
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert([
          {
            user_id: selectedUser.id,
            flight_id: flight.id,
            booked_at: new Date(),
            status: "confirmed",
          },
        ])
        .select()
        .single();

      if (bookingError) throw bookingError;
      await supabase.from("booking_seats").insert([
        { booking_id: booking.id, seat_id: seat.id },
      ]);

      await supabase
        .from("seats")
        .update({ is_booked: true })
        .eq("id", seat.id);

      alert(`Passenger added to flight as: ${selectedUser.full_name}`);

      setSelectedUser(null);
      setUserQuery("");
      setSuggestedUsers([]);
      setNewPassenger({ name: "", seat: "" });
      loadSeats(flight.id);
      setError("");

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
              value={tempFlight.arrival_time?.slice(0, 16) || ""}
              onChange={(e) =>
                setTempFlight({
                  ...tempFlight,
                  arrival_time: e.target.value,
                })
              }
            />
          </label>

          <label>
            Gate:
            <input
              type="string"
              value={tempFlight.gate_num || ""}
              onChange={(e) =>
                setTempFlight({
                  ...tempFlight,
                  gate_num: e.target.value,
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

          <label>
            Status:
            <select
              value={tempFlight.status || "On Time"}
              onChange={(e) =>
                setTempFlight({ ...tempFlight, status: e.target.value })
              }
            >
              <option value="On Time">On Time</option>
              <option value="Delayed">Delayed</option>
              <option value="Canceled">Canceled</option>
              <option value="Full">Full</option>
            </select>
          </label>
        </div>

        <div className="section">
          <h3>Seat Map</h3>
          <div className="seat-grid">
            {seats
              .slice()
              .sort((a, b) => {
                const [, letterA = "", numberA = "0"] =
                  /([A-Za-z]+)(\d+)/.exec(a.seat_code ?? "") || [];
                const [, letterB = "", numberB = "0"] =
                  /([A-Za-z]+)(\d+)/.exec(b.seat_code ?? "") || [];
                const letterDiff = letterA.localeCompare(letterB);
                if (letterDiff !== 0) return letterDiff;
                return Number(numberA) - Number(numberB);
              })
              .map((s) => (
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

          <label>
            Search Passenger:
            <input
              type="text"
              value={userQuery}
              onChange={(e) => searchUsers(e.target.value)}
              placeholder="Type 2+ letters…"
            />
          </label>

          {suggestedUsers.length > 0 && (
            <div className="user-dropdown">
              {suggestedUsers.map((u) => (
                <div
                  key={u.id}
                  className="user-option"
                  onClick={() => {
                    setSelectedUser(u);
                    setUserQuery(u.full_name);
                    setSuggestedUsers([]);
                  }}
                >
                  {u.full_name}
                </div>
              ))}
            </div>
          )}

          {selectedUser && (
            <p className="selected-user">
              Selected: <strong>{selectedUser.full_name}</strong>
            </p>
          )}

          <label>
            Seat:
            <input type="text" value={newPassenger.seat} readOnly />
          </label>

          <button className="btn add-btn" onClick={handleAddPassenger}>
            Add Passenger
          </button>

        </div>

        <div className="button-row">
          <button className="btn report-btn" onClick={handleGenerateReport}>
            Generate Flight Report
          </button>
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
