// src/utils.js
import { supabase } from "./lib/supabaseClient";

// Fetch all flights with all necessary fields
export async function getFlights() {
  const { data, error } = await supabase
    .from("flights")
    .select(
      "id, flight_code, departure_airport, destination_airport, departure_time, arrival_time, price, gate_num, created_at"
    )
    .order("departure_time", { ascending: true });

  if (error) {
    console.error("Error fetching flights from Supabase:", error);
    return [];
  }

  return data || [];
}


/*Fetch a single flight and its seat map*/
export async function getFlightById(flightId) {
  const { data, error } = await supabase
    .from("flights")
    .select(`
      id,
      departure_airport,
      destination_airport,
      departure_time,
      arrive_time,
      price,
      seats(id, seat_code, is_booked)
    `)
    .eq("id", flightId)
    .single();

  if (error) throw error;
  return data;
}

/*Fetch all seats for a flight*/
export async function getSeatsForFlight(flightId) {
  const { data, error } = await supabase
    .from("seats")
    .select("id, seat_code, is_booked")
    .eq("flight_id", flightId);

  if (error) throw error;
  return data;
}

/*Update flight details (Edit Popup)*/
export async function updateFlight(flightId, updates) {
  const { error } = await supabase
    .from("flights")
    .update(updates)
    .eq("id", flightId);
  if (error) throw error;
}

/*Mark a seat as booked/unbooked*/
export async function updateSeatStatus(seatId, isBooked) {
  const { error } = await supabase
    .from("seats")
    .update({ is_booked: isBooked })
    .eq("id", seatId);
  if (error) throw error;
}

/*Create a booking and assign seats*/
export async function createBooking(userId, flightId, seatIds) {
  const { data: booking, error } = await supabase
    .from("bookings")
    .insert([{ user_id: userId, flight_id: flightId, booked_at: new Date(), status: "confirmed" }])
    .select()
    .single();

  if (error) throw error;

  //Link seats
  const seatLinks = seatIds.map((sid) => ({
    booking_id: booking.id,
    seat_id: sid,
  }));
  const { error: seatError } = await supabase.from("booking_seats").insert(seatLinks);
  if (seatError) throw seatError;

  //Update seats as booked
  await Promise.all(seatIds.map((sid) => updateSeatStatus(sid, true)));

  return booking;
}
