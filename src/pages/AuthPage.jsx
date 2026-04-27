import { useState } from "react";
import { apiRequest } from "../lib/api";
import { useUser } from "../context/UserContext";
import Button from "../components/ui/Button";
import { Form, Input } from "../components/Forms";

export default function AuthPage({ defaultMode = "login", onAuthSuccess }) {
  const [mode, setMode] = useState(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [screenName, setScreenName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, logout } = useUser();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const userData = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify({ email, password, screenName })
      });
      login(userData);
      console.log('user', userData);
    } catch (submitError) {
      setError(submitError.message || "Authentication failed");
      logout();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="details auth-panel">
      <h2>{mode === "login" ? "Member Login" : "Create Account"}</h2>
      <Form className="auth-form" onSubmit={handleSubmit}>
        <Input
          id="email"
          type="email"
          label="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <Input
          id="password"
          type="password"
          label="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
        />

        {mode === 'register' ? (
          <>
            <Input
              id="screenName"
              type="text"
              label="Screen Name"
              value={screenName}
              onChange={(event) => setScreenName(event.target.value)}
              required
            />
          </>
        ) : null}

        <Button type="submit" disabled={isSubmitting} variant="primary" className="my-2">
          {isSubmitting ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
        </Button>
      </Form>

      {error ? <p role="alert">{error}</p> : null}

      <Button variant="link" className="text-btn" onClick={() => setMode(mode === "login" ? "register" : "login")}>
        {mode === "login" ? "Need an account? Register" : "Already a member? Log in"}
      </Button>
    </section>
  );
}
