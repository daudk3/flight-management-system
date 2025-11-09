// src/utils.js

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
