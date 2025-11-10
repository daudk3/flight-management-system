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

export function generateTestFlights() {
  const flights = [
    {
      id: "AC102",
      airline: "Air Canada",
      departure: "Toronto",
      destination: "Vancouver",
      departureTime: "2025-10-25T09:45",
      arrivalTime: "2025-10-25T12:15",
      price: "$420",
      seatsAvailable: 8,
      status: "On Time",
      gate: "A12",
      bookedPassengers: [
        { name: "Nick James", seat: "12A" },
        { name: "Natalie Park", seat: "12B" },
        { name: "Abe Ahmed", seat: "14C" },
      ],
    },
    {
      id: "WS308",
      airline: "WestJet",
      departure: "Calgary",
      destination: "Montreal",
      departureTime: "2025-10-25T07:30",
      arrivalTime: "2025-10-25T12:05",
      price: "$390",
      seatsAvailable: 0,
      status: "Full",
      gate: "B7",
      bookedPassengers: [
        { name: "Anna Lee", seat: "7A" },
        { name: "Kevin Tran", seat: "7B" },
      ],
    },
    {
      id: "PD220",
      airline: "Porter Airlines",
      departure: "Ottawa",
      destination: "Halifax",
      departureTime: "2025-10-25T13:15",
      arrivalTime: "2025-10-25T15:50",
      price: "$280",
      seatsAvailable: 22,
      status: "Delayed",
      gate: "C2",
      bookedPassengers: [],
    },
    {
      id: "UA525",
      airline: "United Airlines",
      departure: "Toronto",
      destination: "Chicago",
      departureTime: "2025-10-25T06:00",
      arrivalTime: "2025-10-25T07:45",
      price: "$340",
      seatsAvailable: 5,
      status: "On Time",
      gate: "B14",
      bookedPassengers: [
        { name: "John Doe", seat: "3C" },
      ],
    },
    {
      id: "DL210",
      airline: "Delta",
      departure: "Vancouver",
      destination: "New York",
      departureTime: "2025-10-25T23:15",
      arrivalTime: "2025-10-26T06:00",
      price: "$510",
      seatsAvailable: 3,
      status: "On Time",
      gate: "D3",
      bookedPassengers: [
        { name: "Chris Evans", seat: "18A" },
        { name: "Tony Stark", seat: "18B" },
      ],
    },
  ];

  return flights;
}
