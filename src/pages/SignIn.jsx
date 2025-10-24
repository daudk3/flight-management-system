/*
TODO
Standalone sign-in screen (centered card)
*/
import { useState } from "react";
import "./SignIn.css";
import GoogleIcon from "../components/GoogleIcon"; // ← use your new icon

export default function SignIn() {
  const [form, setForm] = useState({ username: "", password: "" });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    console.log("Signing in with:", form);
  }

  function handleGoogleLogin() {
    console.log("Google login clicked");
  }

  return (
    <div className="signin-page">
      <div className="signin-card">
        <form className="signin-form" onSubmit={handleSubmit}>
          <label>
            Username
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter your username"
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
              required
            />
          </label>

          <button type="submit" className="btn search-btn full-width">
            Sign In
          </button>

          <button
            type="button"
            className="btn google-btn full-width"
            onClick={handleGoogleLogin}
          >
            <GoogleIcon className="google-icon" />
            Login with Google
          </button>
        </form>
      </div>
    </div>
  );
}
