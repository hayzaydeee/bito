import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  TargetIcon,
  EnvelopeClosedIcon,
  CheckCircledIcon,
  ExclamationTriangleIcon,
} from "@radix-ui/react-icons";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email is required");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--color-bg-primary)" }}
    >
      {/* ─── Left branded panel (desktop only) ─── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative"
        style={{ backgroundColor: "var(--color-bg-secondary)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "var(--color-brand-600)" }}
          >
            <TargetIcon className="w-5 h-5 text-white" />
          </div>
          <span
            className="text-lg font-bold font-garamond"
            style={{ color: "var(--color-text-primary)" }}
          >
            bito
          </span>
        </div>

        {/* Hero copy */}
        <div className="max-w-md">
          <h1
            className="font-garamond font-bold mb-6"
            style={{
              color: "var(--color-text-primary)",
              fontSize: "2.75rem",
              lineHeight: 1.15,
            }}
          >
            No worries.
          </h1>
          <p
            className="text-base font-spartan leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            It happens to the best of us. We'll help you get back to your habits
            in no time.
          </p>
        </div>

        {/* Bottom tagline */}
        <p
          className="text-xs font-spartan"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Build better habits, bit by bit.
        </p>
      </div>

      {/* ─── Right form panel ─── */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between p-6">
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 text-sm font-spartan transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--color-text-primary)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--color-text-secondary)")
            }
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to login
          </button>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ backgroundColor: "var(--color-brand-600)" }}
            >
              <TargetIcon className="w-4 h-4 text-white" />
            </div>
            <span
              className="text-base font-bold font-garamond"
              style={{ color: "var(--color-text-primary)" }}
            >
              bito
            </span>
          </div>

          <div className="w-16" />
        </div>

        {/* Form centered */}
        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">
            {isSubmitted ? (
              /* ─── Success state ─── */
              <div className="text-center">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ backgroundColor: "rgba(34, 197, 94, 0.1)" }}
                >
                  <CheckCircledIcon
                    className="w-7 h-7"
                    style={{ color: "#22c55e" }}
                  />
                </div>
                <h2
                  className="heading-lg font-garamond mb-2"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Check your email
                </h2>
                <p
                  className="text-sm font-spartan mb-6"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  If an account exists for{" "}
                  <strong style={{ color: "var(--color-text-primary)" }}>
                    {email}
                  </strong>
                  , we've sent a password reset link. It expires in 1 hour.
                </p>
                <div
                  className="rounded-xl border p-5 mb-6"
                  style={{
                    backgroundColor: "var(--color-surface-primary)",
                    borderColor: "var(--color-border-primary)",
                  }}
                >
                  <p
                    className="text-xs font-spartan"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    Didn't receive the email? Check your spam folder, or{" "}
                    <button
                      onClick={() => {
                        setIsSubmitted(false);
                        setError("");
                      }}
                      className="font-medium transition-colors"
                      style={{ color: "var(--color-brand-500)" }}
                    >
                      try again
                    </button>
                    .
                  </p>
                </div>
                <button
                  onClick={() => navigate("/login")}
                  className="btn btn-primary w-full justify-center btn-md"
                >
                  <span className="font-spartan">Back to login</span>
                </button>
              </div>
            ) : (
              /* ─── Form state ─── */
              <>
                {/* Header */}
                <div className="mb-8">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
                    style={{
                      backgroundColor: "rgba(99, 102, 241, 0.1)",
                    }}
                  >
                    <EnvelopeClosedIcon
                      className="w-6 h-6"
                      style={{ color: "var(--color-brand-500)" }}
                    />
                  </div>
                  <h2
                    className="heading-lg font-garamond mb-2"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Forgot password?
                  </h2>
                  <p
                    className="text-sm font-spartan"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Enter your email and we'll send you a link to reset your
                    password.
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div
                    className="mb-6 p-3 rounded-lg flex items-center gap-3 animate-shake"
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.08)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      color: "#f87171",
                    }}
                  >
                    <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-spartan">{error}</span>
                  </div>
                )}

                {/* Form card */}
                <div
                  className="rounded-xl border p-6"
                  style={{
                    backgroundColor: "var(--color-surface-primary)",
                    borderColor: "var(--color-border-primary)",
                  }}
                >
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email */}
                    <div>
                      <label
                        htmlFor="reset-email-input"
                        className="block text-sm font-medium font-spartan mb-1.5"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        Email address
                      </label>
                      <input
                        id="reset-email-input"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError("");
                        }}
                        className="input w-full"
                        placeholder="you@example.com"
                        disabled={isLoading}
                        autoComplete="email"
                        autoFocus
                      />
                    </div>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn btn-primary w-full justify-center btn-md"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2 font-spartan">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending…
                        </span>
                      ) : (
                        <span className="font-spartan">Send reset link</span>
                      )}
                    </button>
                  </form>
                </div>

                {/* Bottom link */}
                <p
                  className="text-center mt-6 text-sm font-spartan"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Remember your password?{" "}
                  <button
                    onClick={() => navigate("/login")}
                    className="font-medium transition-colors"
                    style={{ color: "var(--color-brand-500)" }}
                    disabled={isLoading}
                  >
                    Sign in
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
