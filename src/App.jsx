import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import Bookings from "./pages/Bookings";
import Admin from "./pages/Admin";
import SignIn from "./pages/SignIn";
import CreateAccount from "./pages/CreateAccount";
import Settings from "./pages/Settings";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow p-6 bg-gray-50">
            <Routes>
              <Route path="/signin" element={<SignIn />} />
              <Route path="/create-account" element={<CreateAccount />} />

              <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
                <Route path="/" element={<Home />} />
                <Route path="/bookings" element={<Bookings />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                <Route path="/admin" element={<Admin />} />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route path="/settings" element={<Settings />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
