import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  TargetIcon,
  ExclamationTriangleIcon,
  EnvelopeClosedIcon,
  ArrowRightIcon,
} from "@radix-ui/react-icons";
import { useAuth } from "../contexts/AuthContext";
import { oauthAPI } from "../services/api";

const RESEND_COOLDOWN = 60; // seconds

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    requestMagicLink,
    isLoading,
    isAuthenticated,
    error: authError,
    clearError,
  } = useAuth();

  const [step, setStep] = useState("email"); // 'email' | 'check-inbox'
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef(null);

  // Check for OAuth error in URL params
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      const errorMessages = {
        oauth_failed: "Social login failed. Please try again.",
        oauth_invalid: "Invalid OAuth response. Please try again.",
        oauth_error: "An error occurred during social login.",
      };
      setGeneralError(
        errorMessages[error] || "An error occurred. Please try again."
      );
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/app");
    }
  }, [isAuthenticated, navigate]);

  // Auto-focus email field on mount
  useEffect(() => {
    const emailInput = document.getElementById("email-input");
    if (emailInput && step === "email") emailInput.focus();
  }, [step]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      cooldownRef.current = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(cooldownRef.current);
    }
  }, [cooldown]);

  const validateEmail = (value) => {
    if (!value) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(value)) return "Please enter a valid email address";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const error = validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }

    clearError();
    setGeneralError("");

    const result = await requestMagicLink(email);

    if (result.success) {
      setStep("check-inbox");
      setCooldown(RESEND_COOLDOWN);
    } else {
      setGeneralError(result.error);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;

    clearError();
    setGeneralError("");

    const result = await requestMagicLink(email);

    if (result.success) {
      setCooldown(RESEND_COOLDOWN);
    } else {
      setGeneralError(result.error);
    }
  };

  const handleSocialLogin = (provider) => {
    try {
      if (provider === "google") {
        window.location.href = oauthAPI.getGoogleLoginUrl();
      } else if (provider === "github") {
        window.location.href = oauthAPI.getGithubLoginUrl();
      }
    } catch (error) {
      console.error(`Social login error for ${provider}:`, error);
      setGeneralError(`Failed to initiate ${provider} login. Please try again.`);
    }
  };

  // Show loading spinner while auth state is being determined
  if (isLoading && !email) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-bg-primary)" }}
      >
        <div
          className="w-10 h-10 border-3 rounded-full animate-spin"
          style={{
            borderColor: "var(--color-border-primary)",
            borderTopColor: "var(--color-brand-500)",
          }}
        />
      </div>
    );
  }

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
            Build better
            <br />
            habits, together.
          </h1>
          <p
            className="text-base font-spartan leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Track what matters. See patterns you'd miss. Grow with your team —
            one small action at a time.
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
            onClick={() => navigate("/")}
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
            Back
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
            {step === "email" ? (
              <>
                {/* Header */}
                <div className="mb-8">
                  <h2
                    className="heading-lg font-garamond mb-2"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Sign in
                  </h2>
                  <p
                    className="text-sm font-spartan"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Enter your email — we'll send you a login link, or sign up if you're new here. No passwords needed.
                  </p>
                </div>

                {/* Error */}
                {(authError || generalError) && (
                  <div
                    className="mb-6 p-3 rounded-lg flex items-center gap-3 animate-shake"
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.08)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      color: "#f87171",
                    }}
                  >
                    <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-spartan">
                      {authError || generalError}
                    </span>
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
                        htmlFor="email-input"
                        className="block text-sm font-medium font-spartan mb-1.5"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        Email
                      </label>
                      <input
                        id="email-input"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (emailError) setEmailError("");
                        }}
                        className="input w-full"
                        placeholder="you@example.com"
                        disabled={isLoading}
                        autoComplete="email"
                        style={
                          emailError
                            ? { borderColor: "var(--color-error)" }
                            : {}
                        }
                      />
                      {emailError && (
                        <p
                          className="mt-1 text-xs font-spartan"
                          style={{ color: "var(--color-error)" }}
                        >
                          {emailError}
                        </p>
                      )}
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
                          Sending link…
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 font-spartan">
                          Continue
                          <ArrowRightIcon className="w-4 h-4" />
                        </span>
                      )}
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="flex items-center gap-3 my-5">
                    <div
                      className="flex-1 h-px"
                      style={{ backgroundColor: "var(--color-border-primary)" }}
                    />
                    <span
                      className="text-xs font-spartan"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      or continue with
                    </span>
                    <div
                      className="flex-1 h-px"
                      style={{ backgroundColor: "var(--color-border-primary)" }}
                    />
                  </div>

                  {/* OAuth buttons */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleSocialLogin("google")}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-spartan font-medium transition-colors"
                      style={{
                        borderColor: "var(--color-border-primary)",
                        color: "var(--color-text-primary)",
                        backgroundColor: "var(--color-surface-primary)",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "var(--color-bg-secondary)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "var(--color-surface-primary)")
                      }
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Google
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSocialLogin("github")}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-spartan font-medium transition-colors"
                      style={{
                        borderColor: "var(--color-border-primary)",
                        color: "var(--color-text-primary)",
                        backgroundColor: "var(--color-surface-primary)",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "var(--color-bg-secondary)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "var(--color-surface-primary)")
                      }
                    >
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                      GitHub
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* ─── Step 2: Check your inbox ─── */
              <>
                <div className="text-center">
                  {/* Email icon */}
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                    style={{
                      backgroundColor: "var(--color-brand-100, rgba(99, 102, 241, 0.1))",
                    }}
                  >
                    <EnvelopeClosedIcon
                      className="w-7 h-7"
                      style={{ color: "var(--color-brand-500)" }}
                    />
                  </div>

                  <h2
                    className="heading-lg font-garamond mb-2"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Check your email
                  </h2>
                  <p
                    className="text-sm font-spartan mb-2"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    We sent a sign-in link to
                  </p>
                  <p
                    className="text-sm font-spartan font-semibold mb-6"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {email}
                  </p>

                  {/* Error */}
                  {(authError || generalError) && (
                    <div
                      className="mb-6 p-3 rounded-lg flex items-center gap-3 text-left"
                      style={{
                        backgroundColor: "rgba(239, 68, 68, 0.08)",
                        border: "1px solid rgba(239, 68, 68, 0.2)",
                        color: "#f87171",
                      }}
                    >
                      <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-spartan">
                        {authError || generalError}
                      </span>
                    </div>
                  )}

                  {/* Info card */}
                  <div
                    className="rounded-xl border p-5 mb-6 text-left"
                    style={{
                      backgroundColor: "var(--color-surface-primary)",
                      borderColor: "var(--color-border-primary)",
                    }}
                  >
                    <p
                      className="text-sm font-spartan leading-relaxed"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Click the link in your email to sign in. The link expires
                      in 15 minutes. Check your spam folder if you don't see it.
                    </p>
                  </div>

                  {/* Resend button */}
                  <button
                    onClick={handleResend}
                    disabled={cooldown > 0 || isLoading}
                    className="text-sm font-spartan font-medium transition-colors"
                    style={{
                      color:
                        cooldown > 0
                          ? "var(--color-text-tertiary)"
                          : "var(--color-brand-500)",
                    }}
                  >
                    {isLoading
                      ? "Sending…"
                      : cooldown > 0
                        ? `Resend link (${cooldown}s)`
                        : "Resend link"}
                  </button>

                  {/* Different email */}
                  <div className="mt-4">
                    <button
                      onClick={() => {
                        setStep("email");
                        setGeneralError("");
                        clearError();
                      }}
                      className="text-sm font-spartan transition-colors"
                      style={{ color: "var(--color-text-secondary)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color =
                          "var(--color-text-primary)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color =
                          "var(--color-text-secondary)")
                      }
                    >
                      Use a different email
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
