import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Flex, Text, Button } from "@radix-ui/themes";
import {
  EnvelopeClosedIcon,
  LockClosedIcon,
  EyeOpenIcon,
  EyeNoneIcon,
  ArrowLeftIcon,
  TargetIcon,
  GitHubLogoIcon,
  PersonIcon,
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
        navigate("/app/dashboard");
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

  // Show loading spinner while auth state is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-bg-primary)] via-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)]">
        <div className="w-12 h-12 border-4 border-[var(--color-brand-500)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-bg-primary)] via-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)] relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-[var(--color-brand-500)]/20 to-[var(--color-brand-600)]/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/15 to-pink-500/15 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-3/4 left-1/2 w-64 h-64 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "4s" }}
        />

        {/* Floating particles */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-[var(--color-brand-400)]/30 rounded-full animate-float" />
        <div
          className="absolute top-40 right-32 w-3 h-3 bg-purple-400/20 rounded-full animate-float"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-32 left-32 w-2 h-2 bg-blue-400/25 rounded-full animate-float"
          style={{ animationDelay: "3s" }}
        />
        <div
          className="absolute bottom-20 right-20 w-1 h-1 bg-cyan-400/30 rounded-full animate-float"
          style={{ animationDelay: "5s" }}
        />
      </div>

      {/* Enhanced Navigation */}
      <nav className="relative z-10 p-6">
        <Flex justify="between" align="center">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all duration-200 hover:scale-105"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Home
          </Button>

          <Flex align="center" gap="3" className="animate-fade-in">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center shadow-lg">
              <TargetIcon className="w-5 h-5 text-white" />
            </div>
            <Text className="text-xl font-bold font-dmSerif gradient-text">
              Bito
            </Text>
          </Flex>
        </Flex>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-6">
        <div className="w-full max-w-md">
          {/* Enhanced Header */}
          <div className="text-center mb-2">
            <Text className="text-3xl font-bold font-dmSerif gradient-text mb-3">
              Welcome!
            </Text>
          </div>
          <div className="text-center mb-6">
            <Text className="text-md text-[var(--color-text-secondary)] font-outfit">
              Start your habit-building journey
            </Text>
          </div>{" "}
          {/* Error Message */}
          {(errors.general || authError) && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 animate-shake">
              <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
              <Text className="text-sm">{errors.general || authError}</Text>
            </div>
          )}
          {/* Enhanced Signup Card */}
          <div className="bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)]/20 rounded-2xl p-8 shadow-xl backdrop-blur-sm max-w-md mx-auto">
            <Flex direction="column" gap="6">
              {/* Social Signup */}
              {/* <Flex direction="column" gap="3">
                <Button
                  onClick={() => handleSocialSignup('Google')}
                  disabled={isLoading}
                  variant="soft"
                  className="w-full justify-center gap-3 py-3 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)] rounded-xl transition-all duration-200 hover:scale-[1.01] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <Text className="text-sm font-medium font-outfit">Continue with Google</Text>
                </Button>
              </Flex> */}

              {/* Divider */}
              {/* <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--color-border-primary)]/30"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-[var(--color-surface-primary)] text-xs text-[var(--color-text-tertiary)] uppercase tracking-wide font-outfit">
                    or
                  </span>
                </div>
              </div> */}

              {/* Signup Form */}
              <form onSubmit={handleSignup}>
                <Flex direction="column" gap="4">
                  {/* Name Fields */}
                  <Flex gap="3">
                    <div className="flex-1">
                      <Text
                        as="label"
                        size="2"
                        weight="bold"
                        htmlFor="firstName"
                        className="font-outfit"
                      >
                        First Name
                      </Text>
                      <input
                        id="firstName-input"
                        type="text"
                        value={formData.firstName}
                        onChange={(e) =>
                          handleInputChange("firstName", e.target.value)
                        }
                        className={`w-full px-3 py-2 mt-1 border border-[var(--color-border-primary)] rounded-md bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent font-outfit transition-all duration-200 ${
                          errors.firstName ? "border-red-500" : ""
                        }`}
                        placeholder="John"
                        disabled={isLoading}
                        autoComplete="given-name"
                      />
                      {errors.firstName && (
                        <Text color="red" size="1" className="mt-1">
                          {errors.firstName}
                        </Text>
                      )}
                    </div>
                    <div className="flex-1">
                      <Text
                        as="label"
                        size="2"
                        weight="bold"
                        htmlFor="lastName"
                        className="font-outfit"
                      >
                        Last Name
                      </Text>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) =>
                          handleInputChange("lastName", e.target.value)
                        }
                        className={`w-full px-3 py-2 mt-1 border border-[var(--color-border-primary)] rounded-md bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent font-outfit transition-all duration-200 ${
                          errors.lastName ? "border-red-500" : ""
                        }`}
                        placeholder="Doe"
                        disabled={isLoading}
                        autoComplete="family-name"
                      />
                      {errors.lastName && (
                        <Text color="red" size="1" className="mt-1">
                          {errors.lastName}
                        </Text>
                      )}
                    </div>
                  </Flex>

                  {/* Email Field */}
                  <div>
                    <Text
                      as="label"
                      size="2"
                      weight="bold"
                      htmlFor="email"
                      className="font-outfit"
                    >
                      Email Address
                    </Text>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className={`w-full px-3 py-2 mt-1 border border-[var(--color-border-primary)] rounded-md bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent font-outfit transition-all duration-200 ${
                        errors.email ? "border-red-500" : ""
                      }`}
                      placeholder="Enter your email address"
                      disabled={isLoading}
                      autoComplete="email"
                    />
                    {errors.email && (
                      <Text color="red" size="1" className="mt-1">
                        {errors.email}
                      </Text>
                    )}
                  </div>

                  {/* Password Field */}
                  <div>
                    <Text
                      as="label"
                      size="2"
                      weight="bold"
                      htmlFor="password"
                      className="font-outfit"
                    >
                      Password
                    </Text>
                    <div className="relative mt-1">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
                        className={`w-full px-3 py-2 pr-10 border border-[var(--color-border-primary)] rounded-md bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent font-outfit transition-all duration-200 ${
                          errors.password ? "border-red-500" : ""
                        }`}
                        placeholder="Create a strong password"
                        disabled={isLoading}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors duration-200"
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
                      <Text color="red" size="1" className="mt-1">
                        {errors.password}
                      </Text>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <Text
                      as="label"
                      size="2"
                      weight="bold"
                      htmlFor="confirmPassword"
                      className="font-outfit"
                    >
                      Confirm Password
                    </Text>
                    <div className="relative mt-1">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          handleInputChange("confirmPassword", e.target.value)
                        }
                        className={`w-full px-3 py-2 pr-10 border border-[var(--color-border-primary)] rounded-md bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent font-outfit transition-all duration-200 ${
                          errors.confirmPassword ? "border-red-500" : ""
                        }`}
                        placeholder="Confirm your password"
                        disabled={isLoading}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors duration-200"
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
                      <Text color="red" size="1" className="mt-1">
                        {errors.confirmPassword}
                      </Text>
                    )}
                  </div>

                  {/* Terms and Conditions */}
                  <div>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <div className="relative flex-shrink-0 mt-0.5">
                        <input
                          type="checkbox"
                          checked={acceptTerms}
                          onChange={(e) => {
                            setAcceptTerms(e.target.checked);
                            if (errors.terms) {
                              setErrors((prev) => ({ ...prev, terms: "" }));
                            }
                          }}
                          className="sr-only"
                          disabled={isLoading}
                        />
                        <div
                          className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                            acceptTerms
                              ? "bg-[var(--color-brand-500)] border-[var(--color-brand-500)]"
                              : "border-[var(--color-border-primary)]"
                          }`}
                        >
                          {acceptTerms && (
                            <CheckIcon className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                      <Text className="text-sm text-[var(--color-text-secondary)] leading-relaxed font-outfit">
                        I agree to the{" "}
                        <button
                          type="button"
                          className="text-[var(--color-brand-500)] hover:text-[var(--color-brand-600)] transition-colors duration-200"
                          disabled={isLoading}
                        >
                          Terms of Service
                        </button>{" "}
                        and{" "}
                        <button
                          type="button"
                          className="text-[var(--color-brand-500)] hover:text-[var(--color-brand-600)] transition-colors duration-200"
                          disabled={isLoading}
                        >
                          Privacy Policy
                        </button>
                      </Text>
                    </label>
                    {errors.terms && (
                      <Text color="red" size="1" className="mt-1">
                        {errors.terms}
                      </Text>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full justify-center py-2 mt-4"
                  >
                    {isLoading ? (
                      <Flex align="center" gap="2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <Text className="font-outfit">Creating account...</Text>
                      </Flex>
                    ) : (
                      <Text className="font-outfit">Create Account</Text>
                    )}
                  </Button>
                </Flex>
              </form>
            </Flex>
          </div>
          {/* Bottom Link */}
          <div className="text-center mt-8">
            <Text className="text-sm text-[var(--color-text-secondary)] font-outfit">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-[var(--color-brand-500)] hover:text-[var(--color-brand-600)] font-medium transition-colors duration-200"
                disabled={isLoading}
              >
                Sign in here
              </button>
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
