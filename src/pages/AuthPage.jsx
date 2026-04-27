import { useState } from "react";
import { apiRequest } from "../lib/api";
import { useUser } from "../context/UserContext";

export default function AuthPage({ defaultMode = "login", onAuthSuccess }) {
  const [mode, setMode] = useState(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, logout } = useUser();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const user = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      onAuthSuccess(user);
    } catch (submitError) {
      setError(submitError.message || "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="details auth-panel">
      <h2>{mode === "login" ? "Member Login" : "Create Account"}</h2>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
        />

        {/* TODO: if mode === 'register', add inputs for first name, last name, screen name, dark mode preference, chord color preference, chord position preference */}
        {/* TODO: add profile page, change PW form */}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>

      {error ? <p role="alert">{error}</p> : null}

      <button className="text-btn" onClick={() => setMode(mode === "login" ? "register" : "login")}>
        {mode === "login" ? "Need an account? Register" : "Already a member? Log in"}
      </button>
    </section>
  );
}
