import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./SignIn.css";
import { useAuth } from "../context/AuthContext";

export default function SignIn() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user, role, loading } = useAuth();
  const redirectPath = location.state?.from?.pathname;

  useEffect(() => {
    if (!loading && user && role) {
      const destination =
        role === "admin"
          ? "/admin"
          : redirectPath && redirectPath !== "/signin"
            ? redirectPath
            : "/";
      navigate(destination, { replace: true });
    }
  }, [loading, navigate, redirectPath, role, user]);

  function handleChange(event) {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const { error } = await signIn({
        email: form.email.trim(),
        password: form.password,
      });

      if (error) {
        setErrorMessage(error.message);
      }
    } catch (error) {
      setErrorMessage(error.message || "Unable to sign in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="signin-page">
      <div className="signin-card">
        <h1 className="signin-title">Sign in to continue</h1>
        <form className="signin-form" onSubmit={handleSubmit}>
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
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
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
            {isSubmitting ? "Signing in…" : "Sign In"}
          </button>

        </form>
      </div>
    </div>
  );
}
