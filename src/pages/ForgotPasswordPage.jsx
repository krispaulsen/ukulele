import { useState } from "react";
import { apiRequest } from "../lib/api";
import { Form, Input } from "../components/Forms";
import { Button, Link } from "../components/ui";

const SUCCESS_COPY =
    "If an account exists for that email, we sent a password reset link. Check your inbox and spam folder.";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [devResetUrl, setDevResetUrl] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);
        try {
            const data = await apiRequest("/api/auth/forgot-password", {
                method: "POST",
                body: JSON.stringify({ email }),
            });
            setSubmitted(true);
            setDevResetUrl(typeof data?.resetUrl === "string" ? data.resetUrl : "");
        } catch (submitError) {
            setError(submitError.message || "Failed to request a password reset");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <section className="details auth-panel">
            <h2>Forgot password</h2>
            {submitted ? (
                <>
                    <p className="max-w-md break-words">{SUCCESS_COPY}</p>
                    {devResetUrl ? (
                        <p className="mt-2 text-sm">
                            Development only:{" "}
                            <a href={devResetUrl} className="text-orange-300 hover:underline">
                                Open reset link
                            </a>
                        </p>
                    ) : null}
                    <p className="mt-4">
                        <Link to="/auth" className="text-orange-300 hover:underline">Back to login</Link>
                    </p>
                </>
            ) : (
                <>
                    <p className="mb-2 max-w-md break-words">
                        Enter your account email and we will send a reset link.
                    </p>
                    <Form className="auth-form" onSubmit={handleSubmit}>
                        <Input
                            id="email"
                            type="email"
                            label="Email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                            autoComplete="email"
                        />
                        <Button type="submit" disabled={isSubmitting} className="my-2">
                            {isSubmitting ? "Please wait..." : "Send reset link"}
                        </Button>
                    </Form>
                    {error ? <p role="alert">{error}</p> : null}
                    <Link to="/auth" className="text-orange-300 hover:underline">Back to login</Link>
                </>
            )}
        </section>
    );
}
