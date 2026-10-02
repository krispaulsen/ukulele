import { use, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";
import { parseResetToken } from "../lib/resetToken";
import { UserContext } from "../context/UserContext";
import { Form, Input } from "../components/Forms";
import { Button, Link } from "../components/ui";

export default function ResetPasswordPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { completeLogin } = use(UserContext);

    const token = useMemo(
        () => parseResetToken({ search: location.search, hash: location.hash }),
        [location.search, location.hash]
    );

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsSubmitting(true);
        try {
            const data = await apiRequest("/api/auth/reset-password", {
                method: "POST",
                body: JSON.stringify({ token, password }),
            });
            await completeLogin(data.user);
            navigate("/", { replace: true });
        } catch (submitError) {
            setError(submitError.message || "Failed to reset password");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (!token) {
        return (
            <section className="details auth-panel">
                <h2>Reset password</h2>
                <p role="alert">This reset link is missing or invalid.</p>
                <p className="mt-4">
                    <Link to="/auth/forgot" className="text-orange-300 hover:underline">
                        Request a new reset link
                    </Link>
                </p>
            </section>
        );
    }

    return (
        <section className="details auth-panel">
            <h2>Choose a new password</h2>
            <Form className="auth-form" onSubmit={handleSubmit}>
                <Input
                    id="password"
                    type="password"
                    label="New password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={8}
                    required
                    autoComplete="new-password"
                />
                <Input
                    id="confirmPassword"
                    type="password"
                    label="Confirm new password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    minLength={8}
                    required
                    autoComplete="new-password"
                />
                <Button type="submit" disabled={isSubmitting} className="my-2">
                    {isSubmitting ? "Please wait..." : "Update password"}
                </Button>
            </Form>
            {error ? <p role="alert">{error}</p> : null}
            <Link to="/auth" className="text-orange-300 hover:underline">Back to login</Link>
        </section>
    );
}
