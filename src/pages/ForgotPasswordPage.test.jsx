/**
 * @vitest-environment jsdom
 */
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ForgotPasswordPage from "./ForgotPasswordPage";
import ResetPasswordPage from "./ResetPasswordPage";
import { UserContext } from "../context/UserContext";

function renderPage(ui, { route = "/" } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <UserContext value={{ completeLogin: async () => {} }}>
        {ui}
      </UserContext>
    </MemoryRouter>
  );
}

describe("ForgotPasswordPage", () => {
  it("renders the email form and a back-to-login link", () => {
    renderPage(<ForgotPasswordPage />, { route: "/auth/forgot" });
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to login/i })).toHaveAttribute("href", "/auth");
  });
});

describe("ResetPasswordPage", () => {
  it("shows an invalid-link message when no token is present", () => {
    renderPage(<ResetPasswordPage />, { route: "/auth/reset" });
    expect(screen.getByRole("alert")).toHaveTextContent(/missing or invalid/i);
    expect(screen.getByRole("link", { name: /request a new reset link/i })).toHaveAttribute(
      "href",
      "/auth/forgot"
    );
  });

  it("shows the new-password form when the query contains a token", () => {
    renderPage(<ResetPasswordPage />, { route: "/auth/reset?token=abc123" });
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /update password/i })).toBeInTheDocument();
  });
});
