import { use, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { UserContext } from "../context/UserContext";
import { Form, Input } from "../components/Forms";
import { Button } from "@material-tailwind/react";

export default function AuthPage({ defaultMode = "login", onAuthSuccess }) {
    const [mode, setMode] = useState(defaultMode);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [screenName, setScreenName] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user, login, register } = use(UserContext);

    const location = useLocation();
    const navigate = useNavigate();

    // Snapshot the intended return target exactly once when this AuthPage mounts.
    // This captures the `from` (with search like ?page=4) from the navigation state.
    // Using a ref ensures we don't lose it due to later re-renders or route swaps.
    const redirectTargetRef = useRef(null);
    if (redirectTargetRef.current === null) {
        const from = location.state?.from;
        redirectTargetRef.current = (from && typeof from === "object")
            ? {
                pathname: from.pathname || "/",
                search: from.search || "",
                hash: from.hash || "",
            }
            : { pathname: "/" };
    }

    // If the user is already logged in on mount (or becomes logged in), send them back.
    useEffect(() => {
        if (user?.isLoggedIn) {
            navigate(redirectTargetRef.current, { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.isLoggedIn]);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);
        try {
            if (mode === "login") {
                await login(email, password);
            } else {
                await register(email, password, screenName);
            }
            // Success: navigate back to the captured location (or home).
            // The effect above will also fire due to the user state change.
            navigate(redirectTargetRef.current, { replace: true });
        } catch (submitError) {
            setError(submitError.message || "Authentication failed");
            // Context already called logout() on failure.
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

            <Button variant="link" onClick={() => setMode(mode === "login" ? "register" : "login")}>
                {mode === "login" ? "Need an account? Register" : "Already a member? Log in"}
            </Button>
        </section>
    );
}
