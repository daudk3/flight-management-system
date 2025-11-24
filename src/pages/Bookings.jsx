/*
TODO
User can list/manage bookings (trips)
*/
import { useEffect, useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { supabase } from "../lib/supabaseClient";
import NarrationButton from "../components/NarrationButton";

export default function Bookings() {
  const [trips, setTrips] = useState([]);
  const [cancellingId, setCancellingId] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);

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

  function formatDateTime(value) {
    if (!value) return "TBD";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    return parsed.toLocaleString();
  }

  function safeText(value) {
    const str = value == null ? "" : String(value);
    return str.replace(/[^\r\n\x20-\x7E]/g, " ");
  }

  async function handleGenerateReceipt(trip) {
    if (!trip) return;
    setGeneratingId(trip.id);
    try {
      const doc = await PDFDocument.create();
      const page = doc.addPage([612, 792]); // US Letter
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const bold = await doc.embedFont(StandardFonts.HelveticaBold);
      const { width, height } = page.getSize();
      let y = height - 60;
      const lineHeight = 20;

      const drawLine = (label, value, isBold = false) => {
        page.drawText(`${label}: ${safeText(value)}`, {
          x: 60,
          y,
          size: 12,
          font: isBold ? bold : font,
          color: rgb(0.1, 0.12, 0.16),
        });
        y -= lineHeight;
      };

      page.drawText("Flight Receipt", {
        x: 60,
        y,
        size: 20,
        font: bold,
        color: rgb(0.05, 0.18, 0.42),
      });
      y -= lineHeight * 1.5;

      drawLine("Booking ID", trip.id, true);
      drawLine("Status", trip.status || "N/A");
      drawLine("Booked at", formatDateTime(trip.booked_at));
      y -= 8;
      drawLine(
        "Flight",
        trip.flights?.flight_code || "Flight details unavailable",
        true,
      );
      drawLine("Route", `${trip.flights?.departure_airport ?? "TBD"} to ${
        trip.flights?.destination_airport ?? "TBD"
      }`);
      drawLine("Departure", formatDateTime(trip.flights?.departure_time));
      drawLine("Arrival", formatDateTime(trip.flights?.arrival_time));
      drawLine("Gate", trip.flights?.gate_num ?? "TBD");
      drawLine("Fare", `$${trip.flights?.price ?? "N/A"}`);

      y -= lineHeight;
      page.drawText("Notes", {
        x: 60,
        y,
        size: 14,
        font: bold,
        color: rgb(0.1, 0.12, 0.16),
      });
      y -= lineHeight;
      page.drawText(
        "Please arrive at the gate at least 45 minutes before departure. Bring a valid ID and this receipt.",
        {
          x: 60,
          y,
          size: 11,
          font,
          color: rgb(0.22, 0.26, 0.32),
          maxWidth: width - 120,
          lineHeight: 14,
        },
      );

      const pdfBytes = await doc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `flight-receipt-${trip.id}.pdf`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => window.URL.revokeObjectURL(url), 200);

      // Fallback for browsers that block programmatic download
      if (!document.hasFocus()) {
        window.open(url, "_blank");
      }
    } catch (error) {
      console.error("Failed to generate receipt", error);
      alert("We could not generate your receipt. Please try again.");
    } finally {
      setGeneratingId(null);
    }
  }

  return (
    <main className="flightlist">
      <div className="flightlist-header">
        <div className="flightlist-title-row">
          <h2 className="flightlist-title">My Trips</h2>
          <NarrationButton
            text={
              trips.length > 0
                ? `You have ${trips.length} booked ${
                    trips.length === 1 ? "trip" : "trips"
                  }. Select a trip to review its details.`
                : "You have no bookings yet."
            }
            label="Hear a summary of your bookings"
            small
          />
        </div>
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
                <button
                  type="button"
                  className="booking-receipt-btn"
                  onClick={() => handleGenerateReceipt(trip)}
                  disabled={generatingId === trip.id}
                >
                  {generatingId === trip.id
                    ? "Generating receipt…"
                    : "Download receipt"}
                </button>
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
