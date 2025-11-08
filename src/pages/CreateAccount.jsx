import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./SignIn.css";
import { supabase } from "../lib/supabaseClient";

const initialFormState = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

export default function CreateAccount() {
  const [form, setForm] = useState(initialFormState);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    if (form.password !== form.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const trimmedEmail = form.email.trim();
      const trimmedPhone = form.phone.trim();
      const trimmedFullName = form.fullName.trim();

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: form.password,
        phone: trimmedPhone || undefined,
        options: {
          data: {
            full_name: trimmedFullName,
            phone: trimmedPhone || undefined,
          },
        },
      });

      if (error) {
        throw error;
      }

      const newUserId = data?.user?.id;
      if (!newUserId) {
        throw new Error(
          "Account created, but we could not finish setting up your profile. Please try signing in.",
        );
      }

      const { error: profileError } = await supabase.from("profiles").insert({
        id: newUserId,
        full_name: trimmedFullName,
        role: "customer",
      });

      if (profileError) {
        throw profileError;
      }

      navigate("/signin", {
        replace: true,
        state: { accountCreated: true },
      });
    } catch (error) {
      setErrorMessage(
        error.message || "Unable to create your account. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="signin-page">
      <div className="signin-card">
        <h1 className="signin-title">Create your customer account</h1>
        <p className="create-account-note">
          Create an account to start booking flights.
        </p>

        <form className="signin-form" onSubmit={handleSubmit}>
          <label>
            Full Name
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Jane Doe"
              autoComplete="name"
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>
          <label>
            Phone Number
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+1 555 123 4567"
              autoComplete="tel"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create a strong password"
              autoComplete="new-password"
              required
            />
          </label>
          <label>
            Confirm Password
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              autoComplete="new-password"
              required
            />
          </label>

          {errorMessage && (
            <p className="signin-error" role="alert">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            className="btn search-btn full-width"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="create-account-footer">
          Already registered?{" "}
          <Link className="create-account-link" to="/signin">
            Return to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
