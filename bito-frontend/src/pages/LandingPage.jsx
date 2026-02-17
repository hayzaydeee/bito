import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRightIcon,
  CheckCircledIcon,
  TargetIcon,
  BarChartIcon,
  GitHubLogoIcon,
  Cross2Icon,
  HamburgerMenuIcon,
  CheckIcon,
} from "@radix-ui/react-icons";
import { useAuth } from "../contexts/AuthContext";
import ContactModal from "../components/ui/ContactModal";

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const testimonialsRef = useRef(null);

  // Redirect authenticated users
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/app");
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Navbar scroll effect
  useEffect(() => {
    const handleScroll = () => setHasScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--color-bg-primary)" }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
            style={{ borderColor: "var(--color-brand-500)" }}
          />
          <p style={{ color: "var(--color-text-secondary)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  /* ─── Data ─── */
  const featureShowcases = [
    {
      label: "Track",
      title: "Small actions, measured daily",
      description:
        "One-click habit logging, smart streaks, and a clean daily view that keeps you focused on what matters. No clutter, no friction — just the habits you care about.",
      bullets: [
        "One-click daily check-ins",
        "Streak tracking with milestone celebrations",
        "Flexible schedules — daily, weekly, or custom",
      ],
      visual: "track",
    },
    {
      label: "Understand",
      title: "See patterns you'd otherwise miss",
      description:
        "Beautiful charts and heatmaps reveal the story behind your data. AI-powered insights surface correlations and trends so you can double down on what works.",
      bullets: [
        "Visual heatmaps and progress charts",
        "AI-generated insights and nudges",
        "Trend analysis across weeks and months",
      ],
      visual: "understand",
    },
    {
      label: "Together",
      title: "Accountability changes everything",
      description:
        "Invite friends, family, or teammates into shared workspaces. Celebrate wins together, run challenges, and build habits as a group.",
      bullets: [
        "Shared workspaces and team habits",
        "Group challenges and competitions",
        "Encouragement and activity feeds",
      ],
      visual: "together",
    },
  ];

  const howItWorksSteps = [
    {
      step: "01",
      title: "Add your habits",
      description:
        "Pick from smart templates or create your own. Set your frequency, reminders, and goals in under a minute.",
    },
    {
      step: "02",
      title: "Check in daily",
      description:
        "Open bito, tap to complete. Your streaks, progress rings, and weekly overview update in real time.",
    },
    {
      step: "03",
      title: "Grow with insights",
      description:
        "As data accumulates, bito surfaces patterns and suggestions. The longer you use it, the smarter it gets.",
    },
  ];

  const testimonials = [
    {
      name: "Stephanie Ndubuisi",
      role: "Student",
      content:
        "Bito completely changed how I approach personal development. The visual progress tracking keeps me motivated every single day.",
      avatar: "SN",
    },
    {
      name: "Henry Nwokolo",
      role: "Software Engineer",
      content:
        "The analytics are incredible. I can finally see exactly which habits are driving real results in my routines.",
      avatar: "HN",
    },
    {
      name: "David Arochukwu",
      role: "Writer",
      content:
        "Beautiful design and incredibly intuitive. Building habits has never felt this engaging and rewarding.",
      avatar: "DA",
    },
  ];

  const comparisonRows = [
    { feature: "Habit tracking", bito: true, others: true },
    { feature: "Team workspaces", bito: true, others: false },
    { feature: "AI-powered insights", bito: true, others: false },
    { feature: "Beautiful analytics", bito: true, others: "Basic" },
    { feature: "Journal integration", bito: true, others: false },
    { feature: "Free to use", bito: true, others: "Freemium" },
  ];

  /* ─── Visual placeholders for feature showcases ─── */
  const FeatureVisual = ({ type }) => {
    const baseBg = "var(--color-surface-secondary)";
    const border = "var(--color-border-primary)";

    if (type === "track") {
      return (
        <div
          className="rounded-xl border p-6 space-y-3"
          style={{ backgroundColor: baseBg, borderColor: border }}
        >
          {["Morning meditation", "Read 20 pages", "Exercise", "Journal"].map(
            (habit, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg px-4 py-3 border"
                style={{
                  backgroundColor: "var(--color-surface-primary)",
                  borderColor: border,
                }}
              >
                <div
                  className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor:
                      i < 2 ? "var(--color-success)" : "var(--color-surface-hover)",
                  }}
                >
                  {i < 2 && <CheckIcon className="w-3 h-3 text-white" />}
                </div>
                <span
                  className="text-sm font-spartan"
                  style={{
                    color:
                      i < 2
                        ? "var(--color-text-tertiary)"
                        : "var(--color-text-primary)",
                    textDecoration: i < 2 ? "line-through" : "none",
                  }}
                >
                  {habit}
                </span>
                {i === 0 && (
                  <span
                    className="ml-auto text-xs font-spartan font-medium"
                    style={{ color: "var(--color-warning)" }}
                  >
                    12-day streak
                  </span>
                )}
              </div>
            )
          )}
          <div className="flex items-center gap-2 pt-2">
            <div
              className="h-2 flex-1 rounded-full overflow-hidden"
              style={{ backgroundColor: "var(--color-surface-hover)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: "50%",
                  backgroundColor: "var(--color-brand-500)",
                }}
              />
            </div>
            <span
              className="text-xs font-spartan font-medium"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              2 / 4 today
            </span>
          </div>
        </div>
      );
    }

    if (type === "understand") {
      return (
        <div
          className="rounded-xl border p-6"
          style={{ backgroundColor: baseBg, borderColor: border }}
        >
          {/* Mini chart */}
          <div className="flex items-end gap-1.5 h-28 mb-4">
            {[40, 65, 55, 80, 70, 90, 85, 60, 95, 75, 88, 92].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm transition-all"
                style={{
                  height: `${h}%`,
                  backgroundColor:
                    i >= 10
                      ? "var(--color-brand-500)"
                      : "var(--color-brand-500)",
                  opacity: 0.3 + (i / 12) * 0.7,
                }}
              />
            ))}
          </div>
          <div
            className="text-xs font-spartan mb-4"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Completion rate — last 12 weeks
          </div>
          {/* Insight nudge */}
          <div
            className="rounded-lg border-l-3 px-4 py-3"
            style={{
              backgroundColor: "var(--color-surface-primary)",
              borderLeft: "3px solid var(--color-secondary-400)",
            }}
          >
            <p
              className="text-xs font-spartan"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Your morning habits have a 92% completion rate — 34% higher than
              evening ones. Consider shifting "Read 20 pages" to the AM.
            </p>
          </div>
        </div>
      );
    }

    // together
    return (
      <div
        className="rounded-xl border p-6 space-y-4"
        style={{ backgroundColor: baseBg, borderColor: border }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="flex -space-x-2">
            {["S", "M", "E", "J"].map((l, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white border-2"
                style={{
                  backgroundColor: `var(--color-brand-${400 + i * 100})`,
                  borderColor: baseBg,
                }}
              >
                {l}
              </div>
            ))}
          </div>
          <span
            className="text-xs font-spartan font-medium"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Team Fitness
          </span>
        </div>
        {[
          { user: "Sarah", action: "completed Morning Run", time: "2m ago" },
          { user: "Michael", action: "started 30-Day Challenge", time: "1h ago" },
          { user: "Emily", action: "hit a 7-day streak!", time: "3h ago" },
        ].map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 border"
            style={{
              backgroundColor: "var(--color-surface-primary)",
              borderColor: border,
            }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
              style={{ backgroundColor: "var(--color-brand-500)" }}
            >
              {item.user[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-spartan truncate" style={{ color: "var(--color-text-primary)" }}>
                <span className="font-medium">{item.user}</span>{" "}
                <span style={{ color: "var(--color-text-secondary)" }}>
                  {item.action}
                </span>
              </p>
            </div>
            <span
              className="text-[10px] font-spartan flex-shrink-0"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {item.time}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className="min-h-screen overflow-hidden"
      style={{ backgroundColor: "var(--color-bg-primary)" }}
    >
      {/* ─── Navigation ─── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-200"
        style={{
          backgroundColor: hasScrolled
            ? "var(--color-surface-primary)"
            : "transparent",
          borderBottom: hasScrolled
            ? "1px solid var(--color-border-primary)"
            : "1px solid transparent",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-2.5">
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

            {/* Desktop nav links */}
            <div className="hidden md:flex flex-1 justify-center items-center">
              <div className="flex items-center gap-8">
                {[
                  { label: "Features", ref: featuresRef },
                  { label: "How It Works", ref: howItWorksRef },
                  { label: "Testimonials", ref: testimonialsRef },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => scrollToSection(item.ref)}
                    className="text-sm font-medium font-spartan transition-colors"
                    style={{ color: "var(--color-text-secondary)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "var(--color-text-primary)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "var(--color-text-secondary)")
                    }
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  onClick={() => setContactModalOpen(true)}
                  className="text-sm font-medium font-spartan transition-colors"
                  style={{ color: "var(--color-text-secondary)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--color-text-primary)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--color-text-secondary)")
                  }
                >
                  Contact
                </button>
              </div>
            </div>

            {/* Auth buttons */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => navigate("/login")}
                className="px-4 py-2 text-sm font-medium font-spartan transition-colors"
                style={{ color: "var(--color-text-secondary)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--color-text-primary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--color-text-secondary)")
                }
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/login")}
                className="btn btn-primary btn-sm"
              >
                Get Started
              </button>
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden ml-auto p-2 rounded-lg transition-colors"
              style={{ color: "var(--color-text-primary)" }}
            >
              {mobileMenuOpen ? (
                <Cross2Icon className="w-5 h-5" />
              ) : (
                <HamburgerMenuIcon className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div
              className="md:hidden py-4 border-t"
              style={{ borderColor: "var(--color-border-primary)" }}
            >
              <div className="flex flex-col gap-4 font-spartan">
                <button
                  onClick={() => scrollToSection(featuresRef)}
                  className="text-left text-sm font-medium"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Features
                </button>
                <button
                  onClick={() => scrollToSection(howItWorksRef)}
                  className="text-left text-sm font-medium"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  How It Works
                </button>
                <button
                  onClick={() => {
                    setContactModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-sm font-medium"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Contact
                </button>
                <div
                  className="pt-4 border-t flex flex-col gap-3"
                  style={{ borderColor: "var(--color-border-primary)" }}
                >
                  <button
                    onClick={() => navigate("/login")}
                    className="text-left text-sm font-medium"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate("/login")}
                    className="btn btn-primary btn-sm text-center"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ─── Hero Section — dark editorial ─── */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-4 sm:px-6 lg:px-8">
        {/* Subtle radial glow — no particles */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 30%, var(--color-brand-950) 0%, transparent 70%)",
            opacity: 0.5,
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1
            className="heading-display mb-6 px-2 font-garamond"
            style={{ color: "var(--color-text-primary)" }}
          >
            Build habits that
            <br />
            <span className="gradient-text">actually stick</span>
          </h1>

          <p
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-spartan px-4"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Track, understand, and grow — alone or with your team. Bito turns
            daily routines into lasting change with beautiful insights and
            gentle intelligence.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12 font-spartan px-4">
            <button
              onClick={() => navigate("/login")}
              className="btn btn-primary btn-lg group"
            >
              Start for free
              <ArrowRightIcon className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => scrollToSection(howItWorksRef)}
              className="btn btn-secondary btn-lg"
            >
              See how it works
            </button>
          </div>

          {/* Faux Dashboard — realistic, non-interactive product preview */}
          <div className="max-w-5xl mx-auto">
            <div
              className="rounded-xl border overflow-hidden text-left"
              style={{
                backgroundColor: "var(--color-bg-primary)",
                borderColor: "var(--color-border-primary)",
                boxShadow: "0 24px 48px rgba(0,0,0,0.25)",
              }}
            >
              {/* Browser chrome bar */}
              <div
                className="flex items-center gap-2 px-4 py-2 border-b"
                style={{ borderColor: "var(--color-border-primary)" }}
              >
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                </div>
                <div
                  className="flex-1 mx-8 h-5 rounded-md"
                  style={{ backgroundColor: "var(--color-surface-hover)" }}
                />
              </div>

              <div className="flex" style={{ minHeight: 380 }}>
                {/* ── Mini sidebar ── */}
                <div
                  className="hidden md:flex flex-col w-48 border-r py-4 px-3 flex-shrink-0"
                  style={{
                    backgroundColor: "var(--color-bg-secondary)",
                    borderColor: "var(--color-border-primary)",
                  }}
                >
                  {/* Logo */}
                  <div className="flex items-center gap-2 px-2 mb-5">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: "var(--color-brand-600)" }}
                    >
                      <TargetIcon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span
                      className="text-sm font-bold font-garamond"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      bito
                    </span>
                  </div>

                  {/* MAIN section */}
                  <p
                    className="text-[9px] font-spartan font-semibold uppercase tracking-wider px-2 mb-1.5"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    Main
                  </p>
                  <div
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md mb-0.5"
                    style={{
                      backgroundColor: "var(--color-brand-600)",
                    }}
                  >
                    <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 15 15" fill="none"><path d="M2.5 2h4v5h-4zM8.5 2h4v5h-4zM2.5 8.5h4V13h-4zM8.5 8.5h4V13h-4z" stroke="currentColor" strokeWidth="1" /></svg>
                    <span className="text-[11px] font-spartan font-medium text-white">Dashboard</span>
                  </div>
                  <div
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md mb-3"
                  >
                    <BarChartIcon className="w-3.5 h-3.5" style={{ color: "var(--color-text-tertiary)" }} />
                    <span className="text-[11px] font-spartan" style={{ color: "var(--color-text-secondary)" }}>Analytics</span>
                  </div>

                  {/* TEAMS */}
                  <p
                    className="text-[9px] font-spartan font-semibold uppercase tracking-wider px-2 mb-1.5"
                    style={{ color: "var(--color-text-tertiary)" }}
                  >
                    Teams
                  </p>
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <svg className="w-3.5 h-3.5" style={{ color: "var(--color-text-tertiary)" }} viewBox="0 0 15 15" fill="none"><path d="M7.5 0.875C5.49 0.875 3.875 2.49 3.875 4.5S5.49 8.125 7.5 8.125 11.125 6.51 11.125 4.5 9.51 0.875 7.5 0.875zM2.5 14.125c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.2" /></svg>
                    <span className="text-[11px] font-spartan" style={{ color: "var(--color-text-secondary)" }}>Groups</span>
                    <span
                      className="ml-auto text-[9px] px-1.5 py-0.5 rounded font-spartan"
                      style={{ backgroundColor: "var(--color-surface-hover)", color: "var(--color-text-tertiary)" }}
                    >
                      2
                    </span>
                  </div>
                  {["Team Alpha", "Wellness Club"].map((ws, i) => (
                    <div key={i} className="flex items-center gap-2 pl-6 pr-2 py-1">
                      <div
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: i === 0 ? "var(--color-success)" : "var(--color-brand-400)" }}
                      />
                      <span className="text-[10px] font-spartan truncate" style={{ color: "var(--color-text-tertiary)" }}>
                        {ws}
                      </span>
                    </div>
                  ))}

                  <div className="mt-auto">
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <svg className="w-3.5 h-3.5" style={{ color: "var(--color-text-tertiary)" }} viewBox="0 0 15 15" fill="none"><path d="M7.07 0.65c0.2-0.63 1.1-0.63 1.3 0l0.71 2.24a0.68 0.68 0 0 0 0.5 0.5l2.24 0.71c0.63 0.2 0.63 1.1 0 1.3l-2.24 0.71a0.68 0.68 0 0 0-0.5 0.5l-0.71 2.24c-0.2 0.63-1.1 0.63-1.3 0L6.36 6.61a0.68 0.68 0 0 0-0.5-0.5l-2.24-0.71c-0.63-0.2-0.63-1.1 0-1.3l2.24-0.71a0.68 0.68 0 0 0 0.5-0.5L7.07 0.65z" stroke="currentColor" strokeWidth="1" /></svg>
                      <span className="text-[11px] font-spartan" style={{ color: "var(--color-text-secondary)" }}>Settings</span>
                    </div>
                  </div>
                </div>

                {/* ── Main content area ── */}
                <div className="flex-1 min-w-0 p-3 md:p-4 overflow-hidden">
                  {/* Top bar */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-spartan" style={{ color: "var(--color-text-tertiary)" }}>Home</span>
                      <span className="text-[10px]" style={{ color: "var(--color-text-tertiary)" }}>›</span>
                      <span className="text-[10px] font-spartan font-medium" style={{ color: "var(--color-text-primary)" }}>Dashboard</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                        style={{ backgroundColor: "var(--color-brand-500)" }}
                      >
                        D
                      </div>
                    </div>
                  </div>

                  {/* Greeting card */}
                  <div
                    className="rounded-lg border p-3 mb-3"
                    style={{
                      backgroundColor: "var(--color-surface-primary)",
                      borderColor: "var(--color-border-primary)",
                    }}
                  >
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <h3
                          className="text-sm font-garamond font-bold"
                          style={{ color: "var(--color-text-primary)" }}
                        >
                          Good evening, Divine!
                        </h3>
                        <p className="text-[10px] font-spartan flex items-center gap-1 mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>
                          📅 Saturday, February 14 • 9:40 PM
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <span className="text-xs font-spartan font-bold" style={{ color: "var(--color-warning)" }}>🔥 13</span>
                          <p className="text-[9px] font-spartan" style={{ color: "var(--color-text-tertiary)" }}>day streak</p>
                        </div>
                        <div className="text-right hidden sm:block">
                          <span className="text-xs font-spartan font-bold" style={{ color: "var(--color-success)" }}>🎯 79%</span>
                          <p className="text-[9px] font-spartan" style={{ color: "var(--color-text-tertiary)" }}>weekly goal</p>
                        </div>
                      </div>
                    </div>
                    {/* Completion banner */}
                    <div className="flex items-center gap-2 mt-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "var(--color-success)" }}
                      >
                        <CheckIcon className="w-3 h-3 text-white" />
                      </div>
                      <div>
                        <span className="text-xs font-spartan font-bold" style={{ color: "var(--color-text-primary)" }}>8 of 8</span>
                        <span className="text-[10px] font-spartan ml-1.5" style={{ color: "var(--color-text-tertiary)" }}>All habits completed! 🎉</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-spartan font-medium" style={{ color: "var(--color-text-secondary)" }}>Daily Progress</span>
                        <span className="text-[10px] font-spartan font-bold" style={{ color: "var(--color-success)" }}>100%</span>
                      </div>
                      <div
                        className="h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: "var(--color-surface-hover)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{ width: "100%", backgroundColor: "var(--color-success)" }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Widget area */}
                  <div className="grid md:grid-cols-3 gap-3">
                    {/* Habits Overview widget — spans 2 cols */}
                    <div
                      className="md:col-span-2 rounded-lg border p-3"
                      style={{
                        backgroundColor: "var(--color-surface-primary)",
                        borderColor: "var(--color-border-primary)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-spartan font-bold" style={{ color: "var(--color-text-primary)" }}>Habits Overview</h4>
                        <svg className="w-3 h-3" style={{ color: "var(--color-text-tertiary)" }} viewBox="0 0 15 15" fill="none"><path d="M11.8 1.6a2.1 2.1 0 0 1 3 3L5.7 13.7l-4.2.8.8-4.2z" stroke="currentColor" strokeWidth="1.2" /></svg>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-spartan font-medium" style={{ color: "var(--color-text-secondary)" }}>Daily Habits Completion</p>
                        <div className="hidden sm:flex items-center gap-2">
                          <span className="text-[8px] font-spartan px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--color-surface-hover)", color: "var(--color-text-tertiary)" }}>Monthly View</span>
                          <span className="text-[8px] font-spartan px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--color-surface-hover)", color: "var(--color-text-tertiary)" }}>February</span>
                        </div>
                      </div>
                      {/* SVG Line chart */}
                      <svg viewBox="0 0 320 100" className="w-full" style={{ height: 100 }}>
                        {/* Grid lines */}
                        {[0, 25, 50, 75, 100].map((y) => (
                          <line key={y} x1="25" y1={y} x2="310" y2={y} stroke="var(--color-border-primary)" strokeWidth="0.5" strokeDasharray="3 3" />
                        ))}
                        {/* Y-axis labels */}
                        <text x="18" y="4" textAnchor="end" fill="var(--color-text-tertiary)" fontSize="6" fontFamily="League Spartan, sans-serif">8</text>
                        <text x="18" y="29" textAnchor="end" fill="var(--color-text-tertiary)" fontSize="6" fontFamily="League Spartan, sans-serif">6</text>
                        <text x="18" y="79" textAnchor="end" fill="var(--color-text-tertiary)" fontSize="6" fontFamily="League Spartan, sans-serif">2</text>
                        <text x="18" y="100" textAnchor="end" fill="var(--color-text-tertiary)" fontSize="6" fontFamily="League Spartan, sans-serif">0</text>
                        {/* Data line — Feb 1-14 */}
                        <polyline
                          fill="none"
                          stroke="var(--color-brand-500)"
                          strokeWidth="2"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                          points="30,95 50,30 70,25 90,30 110,25 130,0 150,0 170,30 190,0 210,0 230,12 250,12 270,0 290,0"
                        />
                        {/* Data dots */}
                        {[
                          [30,95],[50,30],[70,25],[90,30],[110,25],[130,0],[150,0],[170,30],[190,0],[210,0],[230,12],[250,12],[270,0],[290,0]
                        ].map(([cx, cy], i) => (
                          <circle key={i} cx={cx} cy={cy} r="2.5" fill="var(--color-brand-500)" />
                        ))}
                        {/* X-axis labels */}
                        {["1","2","3","4","5","6","7","8","9","10","11","12","13","14"].map((d, i) => (
                          <text key={i} x={30 + i * 20} y="100" textAnchor="middle" fill="var(--color-text-tertiary)" fontSize="5" fontFamily="League Spartan, sans-serif" dy="8">{d}</text>
                        ))}
                      </svg>
                    </div>

                    {/* Quick Actions widget */}
                    <div
                      className="rounded-lg border p-3"
                      style={{
                        backgroundColor: "var(--color-surface-primary)",
                        borderColor: "var(--color-border-primary)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-spartan font-bold" style={{ color: "var(--color-text-primary)" }}>Quick Actions</h4>
                        <svg className="w-3 h-3" style={{ color: "var(--color-text-tertiary)" }} viewBox="0 0 15 15" fill="none"><path d="M11.8 1.6a2.1 2.1 0 0 1 3 3L5.7 13.7l-4.2.8.8-4.2z" stroke="currentColor" strokeWidth="1.2" /></svg>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { label: "Add Habit", icon: "+", bg: "var(--color-success)" },
                          { label: "Complete All", icon: "✓", bg: "var(--color-success)" },
                          { label: "Import Data", icon: "↑", bg: "var(--color-success)", sub: "Coming Soon" },
                          { label: "Reset Day", icon: "↩", bg: "var(--color-warning)" },
                        ].map((action, i) => (
                          <div
                            key={i}
                            className="rounded-md flex flex-col items-center justify-center py-2.5 px-1"
                            style={{ backgroundColor: action.bg }}
                          >
                            <span className="text-white text-sm font-bold leading-none mb-0.5">{action.icon}</span>
                            <span className="text-[8px] font-spartan font-medium text-white/90 text-center leading-tight">{action.label}</span>
                            {action.sub && (
                              <span className="text-[6px] font-spartan text-white/60 mt-0.5">{action.sub}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Problem → Solution narrative ─── */}
      <section
        className="py-20 md:py-28 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: "var(--color-bg-secondary)" }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <p
            className="text-base md:text-lg leading-relaxed font-spartan mb-8"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Most habit apps overload you with streaks, badges, and gamification
            that feels hollow after a week. They track <em>everything</em> but
            help you understand <em>nothing</em>.
          </p>
          <h2
            className="heading-lg font-garamond mb-6"
            style={{ color: "var(--color-text-primary)" }}
          >
            Bito takes a quieter approach.
          </h2>
          <p
            className="text-base md:text-lg leading-relaxed font-spartan"
            style={{ color: "var(--color-text-secondary)" }}
          >
            We believe lasting change comes from clarity, not noise. A clean
            daily view, honest analytics, and just enough intelligence to help
            you see what's working — that's it.
          </p>
        </div>
      </section>

      {/* ─── Feature Showcases — alternating layout ─── */}
      <section ref={featuresRef} id="features" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-24 md:space-y-32">
          {featureShowcases.map((feat, idx) => (
            <div
              key={feat.label}
              className={`grid md:grid-cols-2 gap-12 md:gap-16 items-center ${
                idx % 2 === 1 ? "md:[direction:rtl]" : ""
              }`}
            >
              {/* Text side */}
              <div className={idx % 2 === 1 ? "md:[direction:ltr]" : ""}>
                <span
                  className="text-xs font-spartan font-semibold uppercase tracking-widest mb-3 inline-block"
                  style={{ color: "var(--color-brand-400)" }}
                >
                  {feat.label}
                </span>
                <h3
                  className="heading-lg font-garamond mb-4"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {feat.title}
                </h3>
                <p
                  className="text-base leading-relaxed font-spartan mb-6"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {feat.description}
                </p>
                <ul className="space-y-3">
                  {feat.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircledIcon
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        style={{ color: "var(--color-success)" }}
                      />
                      <span
                        className="text-sm font-spartan"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {b}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual side */}
              <div className={idx % 2 === 1 ? "md:[direction:ltr]" : ""}>
                <FeatureVisual type={feat.visual} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How It Works — 3 steps ─── */}
      <section
        ref={howItWorksRef}
        id="howItWorks"
        className="py-20 md:py-28 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: "var(--color-bg-secondary)" }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="heading-lg font-garamond mb-4"
              style={{ color: "var(--color-text-primary)" }}
            >
              Three steps. That's it.
            </h2>
            <p
              className="text-base font-spartan max-w-xl mx-auto"
              style={{ color: "var(--color-text-secondary)" }}
            >
              No complex setup, no learning curve. You'll be tracking habits in
              under two minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorksSteps.map((step) => (
              <div key={step.step} className="text-center md:text-left">
                <span
                  className="text-4xl font-garamond font-bold mb-4 inline-block"
                  style={{ color: "var(--color-brand-500)" }}
                >
                  {step.step}
                </span>
                <h3
                  className="heading-sm font-garamond mb-3"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-sm font-spartan leading-relaxed"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section ref={testimonialsRef} id="testimonials" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="heading-lg font-garamond mb-4"
              style={{ color: "var(--color-text-primary)" }}
            >
              Loved by people who ship
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="card p-6"
              >
                <p
                  className="text-sm font-spartan leading-relaxed mb-6"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  "{t.content}"
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: "var(--color-brand-500)" }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p
                      className="text-sm font-spartan font-medium"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {t.name}
                    </p>
                    <p
                      className="text-xs font-spartan"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      {t.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Comparison Table ─── */}
      <section
        className="py-20 md:py-28 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: "var(--color-bg-secondary)" }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="heading-lg font-garamond mb-4"
              style={{ color: "var(--color-text-primary)" }}
            >
              Why bito?
            </h2>
          </div>

          <div
            className="rounded-xl border overflow-hidden"
            style={{
              backgroundColor: "var(--color-surface-primary)",
              borderColor: "var(--color-border-primary)",
            }}
          >
            {/* Header */}
            <div
              className="grid grid-cols-3 px-5 py-3 border-b"
              style={{ borderColor: "var(--color-border-primary)" }}
            >
              <span
                className="text-xs font-spartan font-semibold uppercase tracking-wider"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                Feature
              </span>
              <span
                className="text-xs font-spartan font-semibold uppercase tracking-wider text-center"
                style={{ color: "var(--color-brand-400)" }}
              >
                Bito
              </span>
              <span
                className="text-xs font-spartan font-semibold uppercase tracking-wider text-center"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                Others
              </span>
            </div>
            {/* Rows */}
            {comparisonRows.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-3 px-5 py-3 border-b last:border-b-0"
                style={{ borderColor: "var(--color-border-primary)" }}
              >
                <span
                  className="text-sm font-spartan"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {row.feature}
                </span>
                <div className="flex justify-center">
                  {row.bito === true ? (
                    <CheckCircledIcon
                      className="w-4 h-4"
                      style={{ color: "var(--color-success)" }}
                    />
                  ) : (
                    <span
                      className="text-sm font-spartan"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {row.bito}
                    </span>
                  )}
                </div>
                <div className="flex justify-center">
                  {row.others === true ? (
                    <CheckCircledIcon
                      className="w-4 h-4"
                      style={{ color: "var(--color-success)" }}
                    />
                  ) : row.others === false ? (
                    <span
                      className="text-sm font-spartan"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      —
                    </span>
                  ) : (
                    <span
                      className="text-sm font-spartan"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      {row.others}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="heading-display font-garamond mb-6"
            style={{ color: "var(--color-text-primary)" }}
          >
            Ready to begin?
          </h2>
          <p
            className="text-lg font-spartan mb-10 max-w-xl mx-auto"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Start building the life you want — one small habit at a time.
          </p>

          <button
            onClick={() => navigate("/login")}
            className="btn btn-primary btn-lg group font-spartan"
          >
            Start for free
            <ArrowRightIcon className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
          </button>

          <p
            className="mt-6 text-sm font-spartan flex items-center justify-center gap-2"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            <CheckCircledIcon
              className="w-4 h-4"
              style={{ color: "var(--color-success)" }}
            />
            No credit card required — 2-minute setup
          </p>
        </div>
      </section>

      {/* ─── Footer — minimal ─── */}
      <footer
        className="py-10 px-4 sm:px-6 lg:px-8 border-t"
        style={{ borderColor: "var(--color-border-primary)" }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
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

          {/* Links */}
          <div className="flex items-center gap-6 font-spartan text-sm">
            <button
              onClick={() => scrollToSection(featuresRef)}
              className="transition-colors"
              style={{ color: "var(--color-text-tertiary)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--color-text-primary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--color-text-tertiary)")
              }
            >
              Features
            </button>
            <button
              onClick={() => setContactModalOpen(true)}
              className="transition-colors"
              style={{ color: "var(--color-text-tertiary)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--color-text-primary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--color-text-tertiary)")
              }
            >
              Contact
            </button>
            <a
              href="https://github.com/hayzaydeee/bito"
              className="transition-colors"
              style={{ color: "var(--color-text-tertiary)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--color-text-primary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--color-text-tertiary)")
              }
            >
              <GitHubLogoIcon className="w-4 h-4" />
            </a>
          </div>

          {/* Copyright */}
          <p
            className="text-xs font-spartan"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            &copy; 2025 hayzaydee
          </p>
        </div>
      </footer>

      {/* Contact Modal */}
      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />
    </div>
  );
};

export default LandingPage;
