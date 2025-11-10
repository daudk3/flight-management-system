/*
TODO
User can list/manage bookings (trips)
*/
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Bookings() {
  const [trips, setTrips] = useState([]);

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
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
