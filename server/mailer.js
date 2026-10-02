import nodemailer from "nodemailer";
import { config } from "./config.js";

let transporter = null;

export function isSmtpConfigured(smtp = config.smtp) {
    return Boolean(smtp?.host);
}

export function buildPasswordResetEmail({ resetUrl, ttlMinutes = 60 }) {
    const subject = "Reset your My Ukulele Songbook password";
    const text = [
        "We received a request to reset the password for your My Ukulele Songbook account.",
        "",
        `Open this link within ${ttlMinutes} minutes to choose a new password:`,
        resetUrl,
        "",
        "If you did not request a password reset, you can ignore this email.",
    ].join("\n");
    const html = [
        "<p>We received a request to reset the password for your My Ukulele Songbook account.</p>",
        `<p><a href="${resetUrl}">Reset your password</a> (expires in ${ttlMinutes} minutes).</p>`,
        "<p>If you did not request a password reset, you can ignore this email.</p>",
    ].join("");
    return { subject, text, html };
}

function getTransporter() {
    if (!isSmtpConfigured()) return null;
    if (!transporter) {
        const smtp = config.smtp;
        const options = {
            host: smtp.host,
            port: smtp.port,
            secure: smtp.secure,
        };
        if (smtp.user) {
            options.auth = { user: smtp.user, pass: smtp.pass };
        }
        transporter = nodemailer.createTransport(options);
    }
    return transporter;
}

export async function sendPasswordResetEmail({ to, resetUrl }) {
    const transport = getTransporter();
    if (!transport) {
        console.warn("SMTP is not configured; password reset email was not sent.");
        return { sent: false };
    }

    const ttlMinutes = Math.max(1, Math.round(config.passwordResetTtlMs / 60000));
    const { subject, text, html } = buildPasswordResetEmail({ resetUrl, ttlMinutes });

    await transport.sendMail({
        from: config.smtp.from,
        to,
        subject,
        text,
        html,
    });

    return { sent: true };
}
