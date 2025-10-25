import { useState, useEffect } from "react";
import "./EditFlightPopup.css";

export default function EditFlightPopup({ flight, onClose, onSave }) {
  const [tempFlight, setTempFlight] = useState(null);
  const [error, setError] = useState("");
  const [editedSeats, setEditedSeats] = useState({});
  const [newPassenger, setNewPassenger] = useState({ name: "", seat: "" });

  useEffect(() => {
    if (flight) {
      const clone = JSON.parse(JSON.stringify(flight));
      clone.bookedPassengers = clone.bookedPassengers || [];
      setTempFlight(clone);
    }
  }, [flight]);

  if (!tempFlight) return null;

  const passengers = tempFlight.bookedPassengers;
  const allSeats = generateSeats(passengers);
  const takenSeats = passengers.map((p) => p.seat.toUpperCase().trim());

  function handleSeatClick(seat) {
    if (takenSeats.includes(seat)) return;
    setNewPassenger({ ...newPassenger, seat });
    setError("");
  }

  function handleAddPassenger() {
    const name = newPassenger.name.trim();
    const seat = newPassenger.seat.toUpperCase().trim();

    if (!name || !seat) {
      setError("Both name and seat are required.");
      return;
    }
    if (takenSeats.includes(seat)) {
      setError(`Seat ${seat} is already taken.`);
      return;
    }

    setTempFlight({
      ...tempFlight,
      bookedPassengers: [...passengers, { name, seat }],
    });
    setNewPassenger({ name: "", seat: "" });
    setError("");
  }

  function handleRemovePassenger(index) {
    const updated = passengers.filter((_, i) => i !== index);
    setTempFlight({ ...tempFlight, bookedPassengers: updated });
  }

  function commitSeatChange(index, newSeat) {
    const seat = newSeat.toUpperCase().trim();
    const originalSeat = passengers[index].seat;
    const match = seat.match(/^(\d{1,2})([A-F])$/i);

    if (!match) {
      setError("Invalid seat format. Example: 12C");
      revertSeat(index, originalSeat);
      return;
    }
    if (takenSeats.includes(seat) && seat !== originalSeat) {
      setError(`Seat ${seat} is already taken.`);
      revertSeat(index, originalSeat);
      return;
    }

    const updated = [...passengers];
    updated[index].seat = seat;
    setTempFlight({ ...tempFlight, bookedPassengers: updated });
    setEditedSeats({});
    setError("");
  }

  function revertSeat(index, originalSeat) {
    const updated = [...passengers];
    updated[index].seat = originalSeat;
    setTempFlight({ ...tempFlight, bookedPassengers: updated });
    setEditedSeats({});
  }

  function handleSave() {
    onSave(tempFlight);
    onClose();
  }

  function handleCancel() {
    setTempFlight(JSON.parse(JSON.stringify(flight)));
    onClose();
  }

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2>Edit Flight {flight.id}</h2>
        <p>
          <strong>{flight.airline}</strong> — {flight.departure} →{" "}
          {flight.destination}
        </p>
        {error && <p className="error-msg">{error}</p>}

        {/* Flight Details Section */}
        <div className="section">
          <h3>Flight Details</h3>
          <div className="flight-details">
            <label>
              Departure Time:
              <input
                type="datetime-local"
                value={tempFlight.departureTime}
                onChange={(e) =>
                  setTempFlight({
                    ...tempFlight,
                    departureTime: e.target.value,
                  })
                }
              />
            </label>

            <label>
              Arrival Time:
              <input
                type="datetime-local"
                value={tempFlight.arrivalTime}
                onChange={(e) =>
                  setTempFlight({
                    ...tempFlight,
                    arrivalTime: e.target.value,
                  })
                }
              />
            </label>

            <label>
              Status:
              <select
                value={tempFlight.status}
                onChange={(e) =>
                  setTempFlight({ ...tempFlight, status: e.target.value })
                }
              >
                <option>On Time</option>
                <option>Delayed</option>
                <option>Cancelled</option>
                <option>Full</option>
              </select>
            </label>

            <label>
              Gate:
              <input
                type="text"
                value={tempFlight.gate}
                onChange={(e) =>
                  setTempFlight({ ...tempFlight, gate: e.target.value })
                }
              />
            </label>
          </div>
        </div>

        {/* Passenger List Section */}
        <div className="section">
          <h3>Passengers</h3>
          {passengers.length === 0 ? (
            <p>No passengers yet.</p>
          ) : (
            <table className="passenger-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Seat</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {passengers.map((p, i) => (
                  <tr key={i}>
                    <td>
                      <input value={p.name} disabled />
                    </td>
                    <td>
                      <input
                        value={editedSeats[i] ?? p.seat}
                        onChange={(e) =>
                          setEditedSeats({
                            ...editedSeats,
                            [i]: e.target.value,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            commitSeatChange(i, editedSeats[i] ?? p.seat);
                            e.target.blur();
                          } else if (e.key === "Escape") {
                            revertSeat(i, p.seat);
                            e.target.blur();
                          }
                        }}
                      />
                    </td>
                    <td>
                      <button
                        onClick={() => handleRemovePassenger(i)}
                        className="btn small danger"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Seat Map Section */}
        <div className="section">
          <h3>Seat Map</h3>
          <div className="seat-grid">
            {allSeats.map((seat) => {
              const isTaken = takenSeats.includes(seat);
              const isSelected = newPassenger.seat === seat;
              return (
                <div
                  key={seat}
                  className={`seat ${isTaken ? "taken" : "available"} ${
                    isSelected ? "selected" : ""
                  }`}
                  onClick={() => handleSeatClick(seat)}
                >
                  {seat}
                </div>
              );
            })}
          </div>
          <p className="legend">
            <span className="seat available legend-box"></span> Available &nbsp;
            <span className="seat taken legend-box"></span> Taken
          </p>
        </div>

        {/* Add Passenger Section */}
        <div className="section">
          <h3>Add Passenger</h3>
          <div className="add-row">
            <input
              type="text"
              placeholder="Full Name"
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
              Add
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="button-row">
          <button className="btn save-btn" onClick={handleSave}>
            Save Changes
          </button>
          <button className="btn cancel-btn" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* Seat Layout Generator */
function generateSeats(
  passengers,
  baseRows = 15,
  seatsPerRow = ["A", "B", "C", "D", "E", "F"]
) {
  const maxRow = Math.max(
    ...passengers.map((p) => parseInt(p.seat.match(/\d+/)?.[0] || 0)),
    baseRows
  );
  const totalRows = Math.min(maxRow + 5, 60);
  const layout = [];
  for (let i = 1; i <= totalRows; i++) {
    for (let s of seatsPerRow) layout.push(`${i}${s}`);
  }
  return layout;
}
