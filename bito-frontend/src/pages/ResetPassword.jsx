import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  TargetIcon,
  LockClosedIcon,
  EyeOpenIcon,
  EyeNoneIcon,
  CheckCircledIcon,
  ExclamationTriangleIcon,
  CrossCircledIcon,
} from "@radix-ui/react-icons";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (!token) {
      navigate("/forgot-password");
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Password is required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      if (data.data?.token) {
        localStorage.setItem("token", data.data.token);
      }

      setIsSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStrength = () => {
    if (!password) return { label: "", color: "", width: "0%" };
    if (password.length < 6)
      return { label: "Too short", color: "var(--color-error)", width: "20%" };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { label: "Weak", color: "#f59e0b", width: "40%" };
    if (score === 2) return { label: "Fair", color: "#f59e0b", width: "60%" };
    if (score === 3) return { label: "Good", color: "#22c55e", width: "80%" };
    return { label: "Strong", color: "#22c55e", width: "100%" };
  };

  const strength = getStrength();

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--color-bg-primary)" }}
    >
      {/* Left branded panel (desktop only) */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative"
        style={{ backgroundColor: "var(--color-bg-secondary)" }}
      >
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

        <div className="max-w-md">
          <h1
            className="font-garamond font-bold mb-6"
            style={{
              color: "var(--color-text-primary)",
              fontSize: "2.75rem",
              lineHeight: 1.15,
            }}
          >
            Fresh start.
          </h1>
          <p
            className="text-base font-spartan leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Choose a new password and you'll be right back on track with your
            habits.
          </p>
        </div>

        <p
          className="text-xs font-spartan"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Build better habits, bit by bit.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col min-h-screen">
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

        <div className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">
            {isSuccess ? (
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
                  Password reset!
                </h2>
                <p
                  className="text-sm font-spartan mb-8"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Your password has been updated successfully. You're all set to
                  continue your habit-building journey.
                </p>
                <button
                  onClick={() => navigate("/app")}
                  className="btn btn-primary w-full justify-center btn-md"
                >
                  <span className="font-spartan">Go to dashboard</span>
                </button>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
                    style={{ backgroundColor: "rgba(99, 102, 241, 0.1)" }}
                  >
                    <LockClosedIcon
                      className="w-6 h-6"
                      style={{ color: "var(--color-brand-500)" }}
                    />
                  </div>
                  <h2
                    className="heading-lg font-garamond mb-2"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Set new password
                  </h2>
                  <p
                    className="text-sm font-spartan"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Choose a strong password that you haven't used before.
                  </p>
                </div>

                {error && (
                  <div
                    className="mb-6 p-3 rounded-lg flex items-center gap-3 animate-shake"
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.08)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      color: "#f87171",
                    }}
                  >
                    {error.includes("expired") || error.includes("invalid") ? (
                      <CrossCircledIcon className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span className="text-sm font-spartan">{error}</span>
                  </div>
                )}

                <div
                  className="rounded-xl border p-6"
                  style={{
                    backgroundColor: "var(--color-surface-primary)",
                    borderColor: "var(--color-border-primary)",
                  }}
                >
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label
                        htmlFor="new-password-input"
                        className="block text-sm font-medium font-spartan mb-1.5"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        New password
                      </label>
                      <div className="relative">
                        <input
                          id="new-password-input"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (error) setError("");
                          }}
                          className="input w-full pr-10"
                          placeholder="At least 6 characters"
                          disabled={isLoading}
                          autoComplete="new-password"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                          style={{ color: "var(--color-text-tertiary)" }}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeNoneIcon className="w-4 h-4" />
                          ) : (
                            <EyeOpenIcon className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {password && (
                        <div className="mt-2">
                          <div
                            className="h-1 rounded-full overflow-hidden"
                            style={{
                              backgroundColor: "var(--color-border-primary)",
                            }}
                          >
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: strength.width,
                                backgroundColor: strength.color,
                              }}
                            />
                          </div>
                          <p
                            className="text-xs font-spartan mt-1"
                            style={{ color: strength.color }}
                          >
                            {strength.label}
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="confirm-password-input"
                        className="block text-sm font-medium font-spartan mb-1.5"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        Confirm password
                      </label>
                      <div className="relative">
                        <input
                          id="confirm-password-input"
                          type={showConfirm ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (error) setError("");
                          }}
                          className="input w-full pr-10"
                          placeholder="Re-enter your password"
                          disabled={isLoading}
                          autoComplete="new-password"
                          style={
                            confirmPassword && confirmPassword !== password
                              ? { borderColor: "var(--color-error)" }
                              : {}
                          }
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                          style={{ color: "var(--color-text-tertiary)" }}
                          disabled={isLoading}
                        >
                          {showConfirm ? (
                            <EyeNoneIcon className="w-4 h-4" />
                          ) : (
                            <EyeOpenIcon className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {confirmPassword && confirmPassword !== password && (
                        <p
                          className="mt-1 text-xs font-spartan"
                          style={{ color: "var(--color-error)" }}
                        >
                          Passwords do not match
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn btn-primary w-full justify-center btn-md"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2 font-spartan">
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Resetting…
                        </span>
                      ) : (
                        <span className="font-spartan">Reset password</span>
                      )}
                    </button>
                  </form>
                </div>

                <p
                  className="text-center mt-6 text-sm font-spartan"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Need a new link?{" "}
                  <button
                    onClick={() => navigate("/forgot-password")}
                    className="font-medium transition-colors"
                    style={{ color: "var(--color-brand-500)" }}
                    disabled={isLoading}
                  >
                    Request again
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

export default ResetPassword;
