import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  TargetIcon,
  ExclamationTriangleIcon,
  CheckCircledIcon,
  CrossCircledIcon,
  ArrowRightIcon,
} from "@radix-ui/react-icons";
import { useAuth } from "../contexts/AuthContext";
import { userAPI } from "../services/api";
import AvatarPicker from "../components/ui/AvatarPicker";
import useMotionSafe from "../hooks/useMotionSafe";
import { buttonHover, buttonTap, springs } from "../utils/motion";

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const DEBOUNCE_MS = 400;

const ProfileSetupPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, updateUser } = useAuth();
  const { prefersReduced } = useMotionSafe();
  const shouldAnimate = typeof motion !== "undefined" && !prefersReduced;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");

  const [avatar, setAvatar] = useState("");

  const [errors, setErrors] = useState({});
  const [usernameStatus, setUsernameStatus] = useState("idle"); // 'idle' | 'typing' | 'checking' | 'available' | 'taken' | 'invalid'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [formShakeKey, setFormShakeKey] = useState(0);

  const usernameTimerRef = useRef(null);
  const firstNameRef = useRef(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Redirect if profile is already complete
  useEffect(() => {
    if (user?.profileComplete) {
      if (!user.onboardingComplete) {
        navigate("/onboarding");
      } else {
        navigate("/app");
      }
    }
  }, [user, navigate]);

  // Pre-fill from OAuth data if available
  useEffect(() => {
    if (user) {
      if (user.firstName && !firstName) setFirstName(user.firstName);
      if (user.lastName && !lastName) setLastName(user.lastName);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-focus first name field
  useEffect(() => {
    if (firstNameRef.current) firstNameRef.current.focus();
  }, []);

  // Username availability check with debounce
  const checkUsername = useCallback(async (value) => {
    if (!value || value.length < 3) {
      setUsernameStatus("idle");
      return;
    }
    if (!USERNAME_REGEX.test(value)) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");

    try {
      const response = await userAPI.checkUsername(value);
      if (response.data.available) {
        setUsernameStatus("available");
      } else {
        setUsernameStatus("taken");
      }
    } catch {
      setUsernameStatus("idle");
    }
  }, []);

  const handleUsernameChange = (e) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(val);
    setErrors((prev) => ({ ...prev, username: "" }));
    setSubmitError("");

    // Debounce availability check
    if (usernameTimerRef.current) clearTimeout(usernameTimerRef.current);
    if (val.length >= 3 && USERNAME_REGEX.test(val)) {
      setUsernameStatus("typing");
      usernameTimerRef.current = setTimeout(() => checkUsername(val), DEBOUNCE_MS);
    } else {
      setUsernameStatus(val.length > 0 && val.length < 3 ? "invalid" : "idle");
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!firstName.trim()) newErrors.firstName = "First name is required";
    if (firstName.trim().length > 30) newErrors.firstName = "Max 30 characters";
    if (!lastName.trim()) newErrors.lastName = "Last name is required";
    if (lastName.trim().length > 30) newErrors.lastName = "Max 30 characters";
    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (username.length < 3) {
      newErrors.username = "At least 3 characters";
    } else if (username.length > 20) {
      newErrors.username = "Max 20 characters";
    } else if (!USERNAME_REGEX.test(username)) {
      newErrors.username = "Letters, numbers, and underscores only";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      setFormShakeKey((k) => k + 1);
      return;
    }
    if (usernameStatus === "taken") {
      setFormShakeKey((k) => k + 1);
      setErrors((prev) => ({ ...prev, username: "Username is already taken" }));
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const profileData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim().toLowerCase(),
      };
      // If user picked an avatar during setup, save it alongside profile
      if (avatar) {
        profileData.avatar = avatar;
      }
      const response = await userAPI.completeProfile(profileData);

      // Update auth context with new user data
      updateUser(response.data.user);

      // Navigate to onboarding
      navigate("/onboarding");
    } catch (error) {
      const msg =
        error?.message?.includes("409") || error?.message?.includes("taken")
          ? "Username is already taken"
          : "Something went wrong. Please try again.";
      setFormShakeKey((k) => k + 1);
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-bg-primary)" }}
      >
        <div className="w-8 h-8 border-2 border-[var(--color-brand-500)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const usernameIcon =
    usernameStatus === "checking" ? (
      <div className="w-4 h-4 border-2 border-[var(--color-brand-500)] border-t-transparent rounded-full animate-spin" />
    ) : usernameStatus === "typing" ? (
      <motion.div
        className="w-4 h-4 rounded-full"
        style={{ backgroundColor: "var(--color-border-primary)" }}
        animate={shouldAnimate ? { opacity: [0.45, 0.85, 0.45] } : {}}
        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
      />
    ) : usernameStatus === "available" ? (
      <CheckCircledIcon
        className="w-4 h-4"
        style={{ color: "var(--color-success, #22c55e)" }}
      />
    ) : usernameStatus === "taken" ? (
      <CrossCircledIcon
        className="w-4 h-4"
        style={{ color: "var(--color-error, #ef4444)" }}
      />
    ) : usernameStatus === "invalid" ? (
      <CrossCircledIcon
        className="w-4 h-4"
        style={{ color: "var(--color-error, #ef4444)" }}
      />
    ) : null;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--color-bg-primary)" }}
    >
      <motion.div
        className="w-full max-w-md"
        animate={
          prefersReduced
            ? {}
            : {
                x:
                  formShakeKey > 0
                    ? [0, -8, 8, -6, 6, -4, 4, 0]
                    : 0,
              }
        }
        transition={{ duration: 0.42, ease: "easeOut" }}
      >
        {/* Logo */}
        <motion.div
          className="flex items-center justify-center gap-2.5 mb-10"
          initial={prefersReduced ? false : { opacity: 0, y: 14 }}
          animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
          transition={{ ...springs.soft, delay: 0.05 }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "var(--color-brand-500)" }}
          >
            <TargetIcon className="w-5 h-5 text-white" />
          </div>
          <span
            className="text-xl font-garamond font-semibold tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            Bito
          </span>
        </motion.div>

        {/* Card */}
        <motion.div
          className="rounded-2xl border p-8"
          style={{
            backgroundColor: "var(--color-surface-primary)",
            borderColor: "var(--color-border-primary)",
          }}
          initial={prefersReduced ? false : { opacity: 0, y: 16, scale: 0.98 }}
          animate={prefersReduced ? {} : { opacity: 1, y: 0, scale: 1 }}
          transition={{ ...springs.soft, delay: 0.1 }}
        >
          {/* Avatar picker */}
          <div className="flex justify-center mb-4">
            <AvatarPicker
              currentAvatar={avatar}
              userName={firstName || user?.email?.split("@")[0] || "User"}
              onAvatarChange={(url) => setAvatar(url)}
              size="lg"
            />
          </div>

          <div className="text-center mb-6">
            <h1
              className="heading-lg font-garamond mb-2"
              style={{ color: "var(--color-text-primary)" }}
            >
              Set up your profile
            </h1>
            <p
              className="text-sm font-spartan"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Tell us a little about yourself to get started.
            </p>
          </div>

          {/* Submit error */}
          <AnimatePresence>
          {submitError && (
            <motion.div
              className="mb-5 p-3 rounded-lg flex items-center gap-3"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                color: "#f87171",
              }}
              initial={prefersReduced ? false : { opacity: 0, y: 8 }}
              animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
              exit={prefersReduced ? {} : { opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-spartan">{submitError}</span>
            </motion.div>
          )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First & Last Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-xs font-spartan font-medium mb-1.5"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  First name
                </label>
                <input
                  ref={firstNameRef}
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    setErrors((prev) => ({ ...prev, firstName: "" }));
                  }}
                  className="input w-full"
                  placeholder="Jane"
                  style={
                    errors.firstName
                      ? { borderColor: "var(--color-error)" }
                      : {}
                  }
                />
                <AnimatePresence>
                {errors.firstName && (
                  <motion.p
                    className="mt-1 text-xs font-spartan"
                    style={{ color: "var(--color-error)" }}
                    initial={prefersReduced ? false : { opacity: 0, y: 4 }}
                    animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
                    exit={prefersReduced ? {} : { opacity: 0, y: -4 }}
                    transition={{ duration: 0.16 }}
                  >
                    {errors.firstName}
                  </motion.p>
                )}
                </AnimatePresence>
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-xs font-spartan font-medium mb-1.5"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Last name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    setErrors((prev) => ({ ...prev, lastName: "" }));
                  }}
                  className="input w-full"
                  placeholder="Doe"
                  style={
                    errors.lastName
                      ? { borderColor: "var(--color-error)" }
                      : {}
                  }
                />
                <AnimatePresence>
                {errors.lastName && (
                  <motion.p
                    className="mt-1 text-xs font-spartan"
                    style={{ color: "var(--color-error)" }}
                    initial={prefersReduced ? false : { opacity: 0, y: 4 }}
                    animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
                    exit={prefersReduced ? {} : { opacity: 0, y: -4 }}
                    transition={{ duration: 0.16 }}
                  >
                    {errors.lastName}
                  </motion.p>
                )}
                </AnimatePresence>
              </div>
            </div>

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-spartan font-medium mb-1.5"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Username
              </label>
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-spartan"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  @
                </span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  className="input w-full"
                  placeholder="janedoe"
                  maxLength={20}
                  style={{
                    paddingLeft: "1.75rem",
                    ...(errors.username || usernameStatus === "taken" || usernameStatus === "invalid"
                      ? { borderColor: "var(--color-error)" }
                      : usernameStatus === "available"
                        ? { borderColor: "var(--color-success, #22c55e)" }
                        : {}),
                  }}
                />
                <AnimatePresence mode="wait" initial={false}>
                  {usernameIcon && (
                    <motion.span
                      key={usernameStatus}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      initial={prefersReduced ? false : { opacity: 0, scale: 0.8 }}
                      animate={prefersReduced ? {} : { opacity: 1, scale: 1 }}
                      exit={prefersReduced ? {} : { opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.14 }}
                    >
                      {usernameIcon}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <AnimatePresence mode="wait" initial={false}>
              {errors.username && (
                <motion.p
                  key="username-error"
                  className="mt-1 text-xs font-spartan"
                  style={{ color: "var(--color-error)" }}
                  initial={prefersReduced ? false : { opacity: 0, y: 4 }}
                  animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
                  exit={prefersReduced ? {} : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.16 }}
                >
                  {errors.username}
                </motion.p>
              )}
              {!errors.username && usernameStatus === "taken" && (
                <motion.p
                  key="username-taken"
                  className="mt-1 text-xs font-spartan"
                  style={{ color: "var(--color-error)" }}
                  initial={prefersReduced ? false : { opacity: 0, y: 4 }}
                  animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
                  exit={prefersReduced ? {} : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.16 }}
                >
                  Username is already taken
                </motion.p>
              )}
              {!errors.username && usernameStatus === "available" && (
                <motion.p
                  key="username-available"
                  className="mt-1 text-xs font-spartan"
                  style={{ color: "var(--color-success, #22c55e)" }}
                  initial={prefersReduced ? false : { opacity: 0, y: 4 }}
                  animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
                  exit={prefersReduced ? {} : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.16 }}
                >
                  Username is available
                </motion.p>
              )}
              {!errors.username && usernameStatus === "invalid" && username.length > 0 && (
                <motion.p
                  key="username-invalid"
                  className="mt-1 text-xs font-spartan"
                  style={{ color: "var(--color-error)" }}
                  initial={prefersReduced ? false : { opacity: 0, y: 4 }}
                  animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
                  exit={prefersReduced ? {} : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.16 }}
                >
                  {username.length < 3
                    ? "At least 3 characters"
                    : "Letters, numbers, and underscores only"}
                </motion.p>
              )}
              {!errors.username && usernameStatus === "typing" && username.length > 0 && (
                <motion.p
                  key="username-typing"
                  className="mt-1 text-xs font-spartan"
                  style={{ color: "var(--color-text-tertiary)" }}
                  initial={prefersReduced ? false : { opacity: 0, y: 4 }}
                  animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
                  exit={prefersReduced ? {} : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.16 }}
                >
                  Checking availability...
                </motion.p>
              )}
              </AnimatePresence>
              <p
                className="mt-1.5 text-xs font-spartan"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                3–20 characters. Letters, numbers, and underscores.
              </p>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isSubmitting || usernameStatus === "checking"}
              className="btn btn-primary w-full justify-center btn-md mt-2"
              whileHover={isSubmitting || prefersReduced ? {} : buttonHover}
              whileTap={isSubmitting || prefersReduced ? {} : buttonTap}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2 font-spartan">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Setting up…
                </span>
              ) : (
                <span className="flex items-center gap-2 font-spartan">
                  Continue
                  <ArrowRightIcon className="w-4 h-4" />
                </span>
              )}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ProfileSetupPage;
