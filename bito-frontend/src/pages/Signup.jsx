import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  EyeOpenIcon,
  EyeNoneIcon,
  ArrowLeftIcon,
  TargetIcon,
  CheckIcon,
  ExclamationTriangleIcon,
} from "@radix-ui/react-icons";
import { useAuth } from "../contexts/AuthContext";
import { oauthAPI } from "../services/api";

const Signup = () => {
  const navigate = useNavigate();
  const {
    register,
    isAuthenticated,
    isLoading,
    error: authError,
    clearError,
    user,
  } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Debug: log auth state and render tracking
  const renderRef = useRef(0);
  renderRef.current += 1;

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!acceptTerms) {
      newErrors.terms = "You must accept the terms and conditions";
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
  const handleSignup = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Clear any previous auth errors
    clearError();

    try {
      const result = await register(formData);

      if (result.success) {
        navigate("/onboarding");
      } else {
        setErrors({ general: result.error });
      }
    } catch (error) {
      console.error("Signup error:", error);
      setErrors({ general: "Failed to create account. Please try again." });
    }
  };

  const handleSocialSignup = async (provider) => {
    try {
      if (provider === "google") {
        window.location.href = oauthAPI.getGoogleLoginUrl();
      } else if (provider === "github") {
        window.location.href = oauthAPI.getGithubLoginUrl();
      }
    } catch (error) {
      setErrors({
        general: `Failed to sign up with ${provider}. Please try again.`,
      });
    }
  };
  // Auto-focus first name field on mount
  useEffect(() => {
    const firstNameInput = document.getElementById("firstName-input");
    if (firstNameInput) firstNameInput.focus();
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/app");
    }
  }, [isAuthenticated, navigate]);

  // Show loading spinner
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

  /* Password strength helpers */
  const getPasswordStrength = (pw) => {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    return score; // 0–4
  };

  const strength = getPasswordStrength(formData.password);
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = [
    "var(--color-border-primary)",
    "var(--color-error)",
    "var(--color-warning)",
    "var(--color-info)",
    "var(--color-success)",
  ][strength];

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
            Start building
            <br />
            better habits.
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
                Create account
              </h2>
              <p
                className="text-sm font-spartan"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Start your habit-building journey
              </p>
            </div>

            {/* Error */}
            {(errors.general || authError) && (
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
                  {errors.general || authError}
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
              <form onSubmit={handleSignup} className="space-y-5">
                {/* Name fields side-by-side */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="firstName-input"
                      className="block text-sm font-medium font-spartan mb-1.5"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      First name
                    </label>
                    <input
                      id="firstName-input"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className="input w-full"
                      placeholder="John"
                      disabled={isLoading}
                      autoComplete="given-name"
                      style={errors.firstName ? { borderColor: "var(--color-error)" } : {}}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-xs font-spartan" style={{ color: "var(--color-error)" }}>
                        {errors.firstName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="lastName-input"
                      className="block text-sm font-medium font-spartan mb-1.5"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      Last name
                    </label>
                    <input
                      id="lastName-input"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className="input w-full"
                      placeholder="Doe"
                      disabled={isLoading}
                      autoComplete="family-name"
                      style={errors.lastName ? { borderColor: "var(--color-error)" } : {}}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-xs font-spartan" style={{ color: "var(--color-error)" }}>
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

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
                      placeholder="Create a strong password"
                      disabled={isLoading}
                      autoComplete="new-password"
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
                  {/* Inline password strength bar */}
                  {formData.password && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 flex gap-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className="h-1 flex-1 rounded-full transition-colors"
                            style={{
                              backgroundColor:
                                level <= strength ? strengthColor : "var(--color-surface-hover)",
                            }}
                          />
                        ))}
                      </div>
                      <span
                        className="text-[10px] font-spartan font-medium"
                        style={{ color: strengthColor }}
                      >
                        {strengthLabel}
                      </span>
                    </div>
                  )}
                  {errors.password && (
                    <p className="mt-1 text-xs font-spartan" style={{ color: "var(--color-error)" }}>
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword-input"
                    className="block text-sm font-medium font-spartan mb-1.5"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword-input"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      className="input w-full pr-10"
                      placeholder="Confirm your password"
                      disabled={isLoading}
                      autoComplete="new-password"
                      style={errors.confirmPassword ? { borderColor: "var(--color-error)" } : {}}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: "var(--color-text-tertiary)" }}
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeNoneIcon className="w-4 h-4" />
                      ) : (
                        <EyeOpenIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs font-spartan" style={{ color: "var(--color-error)" }}>
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Terms */}
                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <div className="relative flex-shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => {
                          setAcceptTerms(e.target.checked);
                          if (errors.terms) setErrors((prev) => ({ ...prev, terms: "" }));
                        }}
                        className="sr-only"
                        disabled={isLoading}
                      />
                      <div
                        className="w-5 h-5 rounded border-2 transition-all flex items-center justify-center"
                        style={{
                          backgroundColor: acceptTerms ? "var(--color-brand-500)" : "transparent",
                          borderColor: acceptTerms
                            ? "var(--color-brand-500)"
                            : "var(--color-border-secondary)",
                        }}
                      >
                        {acceptTerms && <CheckIcon className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                    <span
                      className="text-xs font-spartan leading-relaxed"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      I agree to the{" "}
                      <button
                        type="button"
                        className="font-medium transition-colors"
                        style={{ color: "var(--color-brand-500)" }}
                        disabled={isLoading}
                      >
                        Terms of Service
                      </button>{" "}
                      and{" "}
                      <button
                        type="button"
                        className="font-medium transition-colors"
                        style={{ color: "var(--color-brand-500)" }}
                        disabled={isLoading}
                      >
                        Privacy Policy
                      </button>
                    </span>
                  </label>
                  {errors.terms && (
                    <p className="mt-1 text-xs font-spartan" style={{ color: "var(--color-error)" }}>
                      {errors.terms}
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
                      Creating account…
                    </span>
                  ) : (
                    <span className="font-spartan">Create account</span>
                  )}
                </button>
              </form>
            </div>

            {/* Bottom link */}
            <p
              className="text-center mt-6 text-sm font-spartan"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="font-medium transition-colors"
                style={{ color: "var(--color-brand-500)" }}
                disabled={isLoading}
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
