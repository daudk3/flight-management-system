import { useState } from "react";
import { Link } from "react-router-dom";
import { Cog6ToothIcon, UserIcon } from "@heroicons/react/24/outline";
import "./Header.css";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const { user, role, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    try {
      setSigningOut(true);
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Flight Management System
        </Link>
        <div className="navbar-buttons">
          {role === "customer" && (
            <Link to="/bookings" className="btn btn-primary">
              My Trips
            </Link>
          )}

          {role === "admin" && (
            <Link to="/admin" className="btn btn-primary">
              Admin Dashboard
            </Link>
          )}

          {user && (
            <Link to="/settings" className="btn btn-primary">
              <Cog6ToothIcon className="icon" />
              Settings
            </Link>
          )}

          {user ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              <UserIcon className="icon" />
              {signingOut ? "Signing out…" : "Sign Out"}
            </button>
          ) : (
            <Link to="/signin" className="btn btn-primary">
              <UserIcon className="icon" />
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
