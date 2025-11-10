/*
TODO
User can list/manage bookings (trips)
*/
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Bookings() {
  const [trips, setTrips] = useState([]);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    async function fetchTrips() {
      const userResponse = await supabase.auth.getUser();
      const user = userResponse?.data?.user;

      if (!user) {
        console.warn("No user logged in.");
        return;
      }

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          status,
          booked_at,
          flights (
            flight_code,
            departure_airport,
            destination_airport,
            departure_time,
            arrival_time,
            price,
            gate_num
          )
        `)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching trips:", error);
      } else {
        setTrips(data ?? []);
      }
    }

    fetchTrips();
  }, []);

  async function handleCancelBooking(bookingId) {
    if (!bookingId) return;
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this booking?",
    );
    if (!confirmCancel) return;

    setCancellingId(bookingId);
    try {
      const { data: linkedSeats, error: seatLinkError } = await supabase
        .from("booking_seats")
        .select("seat_id")
        .eq("booking_id", bookingId);

      if (seatLinkError) {
        throw seatLinkError;
      }

      const seatIds =
        linkedSeats?.map((seat) => seat.seat_id).filter(Boolean) ?? [];

      const { error: bookingError } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);
      if (bookingError) {
        throw bookingError;
      }

      if (seatIds.length > 0) {
        const { error: seatUpdateError } = await supabase
          .from("seats")
          .update({ is_booked: false })
          .in("id", seatIds);
        if (seatUpdateError) {
          throw seatUpdateError;
        }
      }

      const { error: deleteLinkError } = await supabase
        .from("booking_seats")
        .delete()
        .eq("booking_id", bookingId);
      if (deleteLinkError) {
        throw deleteLinkError;
      }

      setTrips((prev) =>
        prev.map((trip) =>
          trip.id === bookingId ? { ...trip, status: "cancelled" } : trip,
        ),
      );
    } catch (error) {
      console.error("Failed to cancel booking:", error);
      alert("Unable to cancel booking. Please try again.");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <main className="flightlist">
      <div className="flightlist-header">
        <h2 className="flightlist-title">My Trips</h2>
        {trips.length > 0 && (
          <span className="flightlist-count">
            {trips.length} {trips.length === 1 ? "trip" : "trips"}
          </span>
        )}
      </div>

      {trips.length === 0 ? (
        <p className="flightlist-empty">No bookings found.</p>
      ) : (
        <div className="flightlist-grid">
          {trips.map((trip) => (
            <article className="flight-card" key={trip.id}>
              <header className="flight-card-header">
                <div>
                  <h3>
                    {trip.flights?.departure_airport} →{" "}
                    {trip.flights?.destination_airport}
                  </h3>
                  <p className="flight-card-subtitle">
                    {trip.flights?.flight_code}
                  </p>
                </div>
                <p className="flight-card-price">
                  ${trip.flights?.price ?? "N/A"}
                </p>
              </header>

              <div className="flight-card-body">
                <div>
                  <span className="flight-card-label">Departure</span>
                  <p>
                    {trip.flights?.departure_time
                      ? new Date(trip.flights.departure_time).toLocaleString()
                      : "TBD"}
                  </p>
                  <span className="flight-card-meta">
                    Gate {trip.flights?.gate_num || "TBD"}
                  </span>
                </div>

                <div>
                  <span className="flight-card-label">Arrival</span>
                  <p>
                    {trip.flights?.arrival_time
                      ? new Date(trip.flights.arrival_time).toLocaleString()
                      : "TBD"}
                  </p>
                </div>

                <div>
                  <span className="flight-card-label">Status</span>
                  <p
                    className={`flight-card-status ${
                      trip.status === "confirmed"
                        ? "status-on-time"
                        : "status-delayed"
                    }`}
                  >
                    {trip.status}
                  </p>
                </div>
              </div>

              <div className="booking-card-actions">
                {trip.status !== "cancelled" ? (
                  <button
                    type="button"
                    className="booking-cancel-btn"
                    onClick={() => handleCancelBooking(trip.id)}
                    disabled={cancellingId === trip.id}
                  >
                    {cancellingId === trip.id ? "Cancelling…" : "Cancel Booking"}
                  </button>
                ) : (
                  <span className="booking-cancelled-pill">Cancelled</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
