/*
TODO
Reusable component with company name, sign-in button, and booked trips button
*/
// src/components/Header.jsx
import { Link } from "react-router-dom";
import { UserIcon } from "@heroicons/react/24/outline";
import "./Header.css"; 

export default function Header() {
  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">Flight Management System</Link>
        <div className="navbar-buttons">
            <Link to="/bookings" className="btn btn-primary">My Trips</Link>
            <Link to="/signin" className="btn btn-primary">
              <UserIcon className="icon" />
              Sign In
            </Link>
        </div>
      </div>
    </ header>
  );
}