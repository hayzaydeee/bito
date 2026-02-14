import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  EyeOpenIcon,
  EyeNoneIcon,
  ArrowLeftIcon,
  TargetIcon,
  ExclamationTriangleIcon,
} from "@radix-ui/react-icons";
import { useAuth } from "../contexts/AuthContext";
import { oauthAPI } from "../services/api";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    login,
    isLoading,
    isAuthenticated,
    user,
    error: authError,
    clearError,
  } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Check for OAuth error in URL params
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      const errorMessages = {
        oauth_failed: "Social login failed. Please try again.",
        oauth_invalid: "Invalid OAuth response. Please try again.",
        oauth_error: "An error occurred during social login.",
      };
      setErrors({
        general: errorMessages[error] || "An error occurred. Please try again.",
      });
    }
  }, [searchParams]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Clear any previous errors
    clearError();

    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
      });

      if (result.success) {
        navigate("/app");
      } else {
        // Error will be set in AuthContext state
        console.error("Login failed:", result.error);
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };
  const handleSocialLogin = async (provider) => {
    try {
      if (provider === "Google") {
        window.location.href = oauthAPI.getGoogleLoginUrl();
      } else if (provider === "GitHub") {
        window.location.href = oauthAPI.getGithubLoginUrl();
      }
    } catch (error) {
      console.error(`Social login error for ${provider}:`, error);
      setErrors({
        general: `Failed to initiate ${provider} login. Please try again.`,
      });
    }
  };
  // Auto-focus email field on mount
  useEffect(() => {
    const emailInput = document.getElementById("email-input");
    if (emailInput) emailInput.focus();
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/app");
    }
  }, [isAuthenticated, navigate]);

  // Debug: log auth state and render tracking
  const renderRef = useRef(0);
  renderRef.current += 1;

  // Show loading spinner while auth state is being determined
  if (isLoading) {
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
            style={{ color: "var(--color-text-primary)", fontSize: "2.75rem", lineHeight: 1.15 }}
          >
            Welcome back.
          </h1>
          <p
            className="text-base font-spartan leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Your habits are waiting. Pick up right where you left off — streaks
            intact, progress saved.
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
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-secondary)")}
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
                Continue your habit-building journey
              </p>
            </div>

            {/* Error */}
            {(authError || errors.general) && (
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
                  {authError || errors.general}
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
              <form onSubmit={handleLogin} className="space-y-5">
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
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="input w-full"
                    placeholder="you@example.com"
                    disabled={isLoading}
                    autoComplete="email"
                    style={errors.email ? { borderColor: "var(--color-error)" } : {}}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs font-spartan" style={{ color: "var(--color-error)" }}>
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password-input"
                    className="block text-sm font-medium font-spartan mb-1.5"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password-input"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className="input w-full pr-10"
                      placeholder="Enter your password"
                      disabled={isLoading}
                      autoComplete="current-password"
                      style={errors.password ? { borderColor: "var(--color-error)" } : {}}
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
                  {errors.password && (
                    <p className="mt-1 text-xs font-spartan" style={{ color: "var(--color-error)" }}>
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Options row */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: "var(--color-brand-500)" }}
                      disabled={isLoading}
                    />
                    <span
                      className="text-xs font-spartan"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      Remember me
                    </span>
                  </label>
                  <button
                    type="button"
                    className="text-xs font-spartan font-medium transition-colors"
                    style={{ color: "var(--color-brand-500)" }}
                    disabled={isLoading}
                  >
                    Forgot password?
                  </button>
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
                      Signing in…
                    </span>
                  ) : (
                    <span className="font-spartan">Sign in</span>
                  )}
                </button>
              </form>
            </div>

            {/* Bottom link */}
            <p
              className="text-center mt-6 text-sm font-spartan"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/signup")}
                className="font-medium transition-colors"
                style={{ color: "var(--color-brand-500)" }}
                disabled={isLoading}
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
