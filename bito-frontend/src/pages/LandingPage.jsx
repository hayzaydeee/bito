import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  AnimatePresence,
} from "framer-motion";
import {
  TargetIcon,
  GitHubLogoIcon,
  Cross2Icon,
  HamburgerMenuIcon,
} from "@radix-ui/react-icons";
import { useAuth } from "../contexts/AuthContext";
import ContactModal from "../components/ui/ContactModal";
import ScrollReveal from "../components/ui/ScrollReveal";
import SplitText from "../components/ui/SplitText";
import CountUp from "../components/ui/CountUp";
import useLenis from "../hooks/useLenis";

/* ─── Feature Triad data ─── */
const features = [
  {
    num: "01",
    label: "Track",
    title: "Log in seconds. See progress instantly.",
    desc: "One tap to complete a habit. Your streaks, rings, and weekly view update in real time. No friction between intention and action.",
  },
  {
    num: "02",
    label: "Understand",
    title: "See patterns you'd otherwise miss.",
    desc: "Heatmaps and charts reveal the story behind your data. AI-powered insights surface correlations you wouldn't find yourself.",
  },
  {
    num: "03",
    label: "Together",
    title: "Accountability changes everything.",
    desc: "Invite people into shared groups. Celebrate wins, run challenges, and build habits alongside people who keep you honest.",
  },
];

/* ─── Redesigned cinematic feature panels ─── */
const TrackPanel = () => (
  <div className="liquid-glass rounded-2xl p-10 flex flex-col gap-8">
    <div>
      <span
        className="font-garamond leading-none"
        style={{
          fontSize: "clamp(5rem, 12vw, 9rem)",
          color: "var(--color-text-primary)",
          fontWeight: 400,
          letterSpacing: "-0.03em",
          display: "block",
        }}
      >
        12
      </span>
      <span
        className="font-spartan text-sm uppercase tracking-widest"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        day streak
      </span>
    </div>
    <div className="flex flex-col gap-3">
      {[
        { name: "Morning meditation", done: true },
        { name: "Read 20 pages", done: true },
        { name: "Evening run", done: false },
        { name: "Journal", done: false },
      ].map((h, i) => (
        <div key={i} className="flex items-center gap-3">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{
              backgroundColor: h.done
                ? "var(--color-success)"
                : "var(--color-text-tertiary)",
              opacity: h.done ? 1 : 0.35,
            }}
          />
          <span
            className="font-spartan text-sm"
            style={{
              color: h.done
                ? "var(--color-text-tertiary)"
                : "var(--color-text-primary)",
              textDecoration: h.done ? "line-through" : "none",
            }}
          >
            {h.name}
          </span>
        </div>
      ))}
    </div>
    <div className="space-y-1.5">
      <div
        className="h-[3px] rounded-full overflow-hidden"
        style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: "50%", backgroundColor: "var(--color-brand-500)" }}
        />
      </div>
      <span
        className="font-spartan text-xs"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        2 of 4 today
      </span>
    </div>
  </div>
);

const UnderstandPanel = () => {
  const opacities = [0.08,0.12,0.2,0.08,0.35,0.5,0.2,0.6,0.15,0.3,0.7,0.4,0.1,0.55,0.8,0.25,0.45,0.9,0.6,0.3,0.15,0.7,0.5,0.35,1,0.8,0.6,0.45,0.9,0.7,0.4,0.55,0.85,0.65,0.3,0.5,0.75,0.9,0.6,0.4,0.7,0.85,0.5,0.65,0.9,0.75,0.55,0.8,0.95];
  return (
    <div className="liquid-glass rounded-2xl p-10 flex flex-col gap-8">
      <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
        {opacities.map((op, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: `rgba(99, 102, 241, ${op})` }}
          />
        ))}
      </div>
      <span
        className="font-spartan text-xs uppercase tracking-widest"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        Last 49 days
      </span>
      <div>
        <span
          className="font-garamond leading-none block"
          style={{
            fontSize: "clamp(2.5rem, 6vw, 4rem)",
            color: "var(--color-text-primary)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
          }}
        >
          ↑ 34%
        </span>
        <span className="font-spartan text-sm" style={{ color: "var(--color-text-tertiary)" }}>
          vs last month
        </span>
      </div>
    </div>
  );
};

const TogetherPanel = () => (
  <div className="liquid-glass rounded-2xl p-10 flex flex-col gap-8">
    <div className="relative h-20">
      {[
        { initials: "SN", x: "0%",  y: "0%",  from: "#6366f1", to: "#8b5cf6" },
        { initials: "HN", x: "28%", y: "30%", from: "#4f46e5", to: "#6366f1" },
        { initials: "DA", x: "14%", y: "55%", from: "#818cf8", to: "#a78bfa" },
        { initials: "EM", x: "48%", y: "10%", from: "#7c3aed", to: "#6366f1" },
      ].map((av, i) => (
        <div
          key={i}
          className="absolute w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{
            left: av.x, top: av.y,
            background: `linear-gradient(135deg, ${av.from}, ${av.to})`,
            border: "2px solid var(--color-bg-primary)",
          }}
        >
          {av.initials}
        </div>
      ))}
    </div>
    <div className="flex flex-col gap-2.5">
      {[
        { text: "Sarah hit a 7-day streak",            initials: "SN" },
        { text: "Michael started a 30-day challenge",  initials: "HN" },
      ].map((msg, i) => (
        <div key={i} className="liquid-glass rounded-full flex items-center gap-3 px-4 py-2.5">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
            style={{ background: "var(--color-brand-500)" }}
          >
            {msg.initials[0]}
          </div>
          <span className="font-spartan text-xs" style={{ color: "var(--color-text-secondary)" }}>
            {msg.text}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const panelComponents = [TrackPanel, UnderstandPanel, TogetherPanel];

/* ─── SVG connecting line ─── */
const SystemConnectorLine = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20% 0px" });
  return (
    <svg ref={ref} width="100%" height="12" viewBox="0 0 800 12" preserveAspectRatio="none" fill="none">
      <motion.line
        x1="150" y1="6" x2="650" y2="6"
        stroke="var(--color-border-secondary)"
        strokeWidth="1"
        strokeDasharray="4 4"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={isInView ? { pathLength: 1, opacity: 1 } : {}}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      />
    </svg>
  );
};

/* ─── Page component ─── */
const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useLenis();

  const heroRef = useRef(null);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
  const heroScale  = useTransform(scrollY, [0, 500], [1, 0.97]);

  const triadContainerRef = useRef(null);
  useEffect(() => {
    function updateFeature() {
      if (!triadContainerRef.current) return;
      const rect = triadContainerRef.current.getBoundingClientRect();
      const scrolled = -rect.top;
      const scrollable = rect.height - window.innerHeight;
      const progress = scrollable > 0 ? Math.max(0, Math.min(1, scrolled / scrollable)) : 0;
      if (progress < 0.33)      setActiveFeature(0);
      else if (progress < 0.66) setActiveFeature(1);
      else                      setActiveFeature(2);
    }
    window.addEventListener("scroll", updateFeature, { passive: true });
    return () => window.removeEventListener("scroll", updateFeature);
  }, []);

  useEffect(() => {
    const h = () => setHasScrolled(window.scrollY > 60);
    window.addEventListener("scroll", h, { passive: true });
    h();
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate("/app");
  }, [isAuthenticated, isLoading, navigate]);

  const ctaRef    = useRef(null);
  const ctaInView = useInView(ctaRef, { once: true, margin: "-10% 0px" });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-bg-primary)" }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: "var(--color-brand-500)" }} />
      </div>
    );
  }

  const ActivePanel = panelComponents[activeFeature];

  return (
    <div data-theme="dark" className="min-h-screen" style={{ backgroundColor: "#0D0A1A", overflowX: "clip" }}>

      {/* ─── Navigation ─── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${(hasScrolled || mobileMenuOpen) ? "nav-glass" : ""}`}
        style={{ borderBottom: (hasScrolled || mobileMenuOpen) ? "1px solid var(--color-border-primary)" : "none" }}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex items-center h-16">
            <div className="flex-shrink-0 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--color-brand-600)" }}>
                <TargetIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold font-garamond" style={{ color: "var(--color-text-primary)" }}>bito</span>
            </div>

            <div className="hidden md:flex flex-1 justify-center">
              <div className="flex items-center gap-8">
                {[["Features", "features"], ["How It Works", "how-it-works"], ["Testimonials", "testimonials"]].map(([label, id]) => (
                  <button key={id} onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
                    className="text-sm font-spartan font-medium transition-colors hover:text-white" style={{ color: "var(--color-text-secondary)" }}>
                    {label}
                  </button>
                ))}
                <button onClick={() => setContactModalOpen(true)}
                  className="text-sm font-spartan font-medium transition-colors hover:text-white" style={{ color: "var(--color-text-secondary)" }}>
                  Contact
                </button>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button onClick={() => navigate("/login")} className="px-4 py-2 text-sm font-spartan font-medium transition-colors hover:text-white" style={{ color: "var(--color-text-secondary)" }}>
                Sign In
              </button>
              <button onClick={() => navigate("/login")} className="liquid-glass rounded-full px-5 py-2 text-sm font-spartan font-medium transition-transform hover:scale-[1.03]" style={{ color: "var(--color-text-primary)" }}>
                Get Started
              </button>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden ml-auto p-2 rounded-lg" style={{ color: "var(--color-text-primary)" }}>
              {mobileMenuOpen ? <Cross2Icon className="w-5 h-5" /> : <HamburgerMenuIcon className="w-5 h-5" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t" style={{ borderColor: "var(--color-border-primary)" }}>
              <div className="flex flex-col gap-4 font-spartan">
                {[["features", "Features"], ["how-it-works", "How It Works"], ["testimonials", "Testimonials"]].map(([id, label]) => (
                  <button key={id} onClick={() => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); setMobileMenuOpen(false); }}
                    className="text-left text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>{label}</button>
                ))}
                <button onClick={() => { setContactModalOpen(true); setMobileMenuOpen(false); }} className="text-left text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>Contact</button>
                <div className="pt-4 border-t flex flex-col gap-3" style={{ borderColor: "var(--color-border-primary)" }}>
                  <button onClick={() => navigate("/login")} className="text-left text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>Sign In</button>
                  <button onClick={() => navigate("/login")} className="liquid-glass rounded-full px-5 py-2.5 text-sm font-medium text-center" style={{ color: "var(--color-text-primary)" }}>Get Started</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ══════════════════════════════════════
          1. HERO
      ══════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
          <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 z-[1]" style={{ background: "rgba(13, 10, 26, 0.3)" }} />

        <motion.div
          className="relative z-10 flex flex-col items-center text-center px-6 pt-24 pb-40"
          style={{ opacity: heroOpacity, scale: heroScale }}
        >
          <h1
            className="animate-fade-rise font-normal max-w-5xl"
            style={{
              fontFamily: "'EB Garamond', serif",
              fontSize: "clamp(3rem, 8vw, 6rem)",
              lineHeight: 0.95,
              letterSpacing: "-2.46px",
              color: "var(--color-text-primary)",
            }}
          >
            Build the habits that{" "}
            <em className="not-italic" style={{ color: "var(--color-text-secondary)" }}>shape who you</em>{" "}
            become.
          </h1>
          <p className="animate-fade-rise-delay max-w-2xl mt-8 leading-relaxed text-base sm:text-lg font-spartan" style={{ color: "var(--color-text-secondary)" }}>
            bito is your AI-powered companion for building lasting habits. Track daily, understand your patterns, and get a personalized plan designed around how you actually live.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="animate-fade-rise-delay-2 liquid-glass rounded-full px-14 py-5 text-base mt-12 font-spartan font-medium transition-transform hover:scale-[1.03] cursor-pointer"
            style={{ color: "var(--color-text-primary)" }}
          >
            Start for free
          </button>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════
          2. STATEMENT BRIDGE
      ══════════════════════════════════════ */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 py-32">
        <div className="w-24 h-px mb-16 mx-auto" style={{ background: "linear-gradient(to right, transparent, var(--color-border-primary), transparent)" }} />
        <div className="max-w-4xl mx-auto text-center">
          <SplitText
            text="Your habits are the infrastructure of who you're becoming."
            style={{
              fontFamily: "'EB Garamond', serif",
              fontSize: "clamp(2rem, 5vw, 3.75rem)",
              lineHeight: 1.15,
              letterSpacing: "-0.025em",
              color: "var(--color-text-primary)",
              fontWeight: 400,
            }}
            stagger={0.065}
          />
          <ScrollReveal delay={0.8}>
            <p className="font-spartan text-sm uppercase tracking-widest mt-10" style={{ color: "var(--color-text-tertiary)" }}>
              Built for people serious about the long game.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════
          3. FEATURE TRIAD — pinned walkthrough
      ══════════════════════════════════════ */}
      <section id="features" ref={triadContainerRef} style={{ minHeight: "300vh", position: "relative" }}>
        <div className="sticky top-0 h-screen flex items-center overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 w-full grid md:grid-cols-2 gap-16 items-center">

            {/* Left: label + headline + desc */}
            <div>
              <div className="flex gap-2 mb-8">
                {features.map((_, i) => (
                  <div key={i} className="transition-all duration-500 rounded-full"
                    style={{
                      width: i === activeFeature ? "24px" : "6px",
                      height: "6px",
                      backgroundColor: i === activeFeature ? "var(--color-brand-400)" : "var(--color-text-tertiary)",
                      opacity: i === activeFeature ? 1 : 0.3,
                    }}
                  />
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                  <span className="font-spartan text-xs uppercase tracking-widest mb-4 inline-block" style={{ color: "var(--color-brand-400)" }}>
                    {features[activeFeature].num} — {features[activeFeature].label}
                  </span>
                  <h2 className="font-garamond font-normal mb-5"
                    style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)", lineHeight: 1.1, letterSpacing: "-0.025em", color: "var(--color-text-primary)" }}>
                    {features[activeFeature].title}
                  </h2>
                  <p className="font-spartan text-base leading-relaxed max-w-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {features[activeFeature].desc}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Mobile feature tabs */}
              <div className="flex gap-3 mt-10 md:hidden">
                {features.map((f, i) => (
                  <button key={i} onClick={() => setActiveFeature(i)}
                    className="text-xs font-spartan uppercase tracking-wider transition-colors"
                    style={{ color: i === activeFeature ? "var(--color-text-primary)" : "var(--color-text-tertiary)" }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: panel crossfade */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeature}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <ActivePanel />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          4. THE SYSTEM
      ══════════════════════════════════════ */}
      <section id="how-it-works" className="py-32 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-20">
              <h2 className="font-garamond font-normal"
                style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)", lineHeight: 1.05, letterSpacing: "-0.025em", color: "var(--color-text-primary)" }}>
                The system behind the streak.
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-0 relative">
            <div className="absolute top-6 left-0 right-0 hidden md:block pointer-events-none" style={{ zIndex: 0 }}>
              <SystemConnectorLine />
            </div>

            {[
              { num: "01", title: "Set your goal", desc: "Tell bito what you want to achieve. It reads your existing patterns and builds a plan around your real life — not a generic template." },
              { num: "02", title: "Check in daily",  desc: "One tap. Your streak, progress, and weekly view update instantly. No friction between intention and action." },
              { num: "03", title: "Grow with it",    desc: "As data builds, bito surfaces patterns and insights. The longer you use it, the sharper it gets." },
            ].map((step, i) => (
              <ScrollReveal key={step.num} delay={i * 0.15}>
                <div className="relative z-10 flex flex-col items-start md:items-center text-left md:text-center px-6 md:px-10 py-8">
                  <span className="font-garamond mb-4 block"
                    style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)", color: "var(--color-brand-500)", opacity: 0.25, lineHeight: 1, fontWeight: 400 }}>
                    {step.num}
                  </span>
                  <h3 className="font-garamond font-normal mb-3" style={{ fontSize: "1.375rem", color: "var(--color-text-primary)" }}>
                    {step.title}
                  </h3>
                  <p className="font-spartan text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                    {step.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ══════════════════════════════════════
          5. SOCIAL PROOF
      ══════════════════════════════════════ */}
      <section id="testimonials" className="py-32 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto">

          {/* Stat counters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-24">
            {[
              { target: 2847, suffix: "",  label: "habits tracked today" },
              { target: 91,   suffix: "%", label: "average weekly completion" },
              { target: 14,   suffix: "",  label: "day average streak" },
            ].map((stat, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <div className="liquid-glass rounded-2xl p-8 text-center">
                  <div className="font-garamond font-normal mb-1"
                    style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)", color: "var(--color-text-primary)", lineHeight: 1.1, letterSpacing: "-0.025em" }}>
                    <CountUp target={stat.target} suffix={stat.suffix} duration={1600} />
                  </div>
                  <span className="font-spartan text-sm uppercase tracking-widest" style={{ color: "var(--color-text-tertiary)" }}>
                    {stat.label}
                  </span>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Testimonials */}
          <ScrollReveal>
            <h2 className="font-garamond font-normal text-center mb-16"
              style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", letterSpacing: "-0.02em", color: "var(--color-text-primary)" }}>
              From the people using it every day.
            </h2>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { name: "Stephanie Ndubuisi", role: "Student",           avatar: "SN", content: "Bito completely changed how I approach personal development. The visual progress tracking keeps me motivated every single day." },
              { name: "Henry Nwokolo",      role: "Software Engineer", avatar: "HN", content: "The analytics are incredible. I can finally see exactly which habits are driving real results in my routines." },
              { name: "David Arochukwu",    role: "Writer",            avatar: "DA", content: "Beautiful design and incredibly intuitive. Building habits has never felt this engaging and rewarding." },
            ].map((t, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <div className="liquid-glass rounded-2xl p-8">
                  <p className="font-spartan text-sm leading-relaxed mb-8" style={{ color: "var(--color-text-secondary)" }}>{t.content}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700))" }}>
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-spartan text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{t.name}</p>
                      <p className="font-spartan text-xs" style={{ color: "var(--color-text-tertiary)" }}>{t.role}</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ══════════════════════════════════════
          6. FINAL CTA — clip-path curtain reveal
      ══════════════════════════════════════ */}
      <section className="py-36 px-6 sm:px-8">
        <div ref={ctaRef} className="max-w-3xl mx-auto text-center">
          <motion.div
            animate={{ clipPath: ctaInView ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)" }}
            transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          >
            <h2 className="font-garamond font-normal mb-6"
              style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", lineHeight: 1.0, letterSpacing: "-0.03em", color: "var(--color-text-primary)" }}>
              Ready to build the life you keep putting off?
            </h2>
            <p className="font-spartan text-lg mb-12 max-w-xl mx-auto" style={{ color: "var(--color-text-secondary)" }}>
              Free to start. No credit card. Two minutes to set up.
            </p>
            <button onClick={() => navigate("/login")}
              className="liquid-glass rounded-full px-14 py-5 text-base font-spartan font-medium transition-transform hover:scale-[1.03] cursor-pointer"
              style={{ color: "var(--color-text-primary)" }}>
              Get started free
            </button>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-10 px-6 sm:px-8 border-t" style={{ borderColor: "var(--color-border-primary)" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: "var(--color-brand-600)" }}>
              <TargetIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold font-garamond" style={{ color: "var(--color-text-primary)" }}>bito</span>
          </div>
          <div className="flex items-center gap-6 font-spartan text-sm">
            <button onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              className="transition-colors hover:text-white" style={{ color: "var(--color-text-tertiary)" }}>Features</button>
            <button onClick={() => setContactModalOpen(true)}
              className="transition-colors hover:text-white" style={{ color: "var(--color-text-tertiary)" }}>Contact</button>
            <a href="https://github.com/hayzaydeee/bito" className="transition-colors hover:text-white" style={{ color: "var(--color-text-tertiary)" }}>
              <GitHubLogoIcon className="w-4 h-4" />
            </a>
          </div>
          <p className="text-xs font-spartan" style={{ color: "var(--color-text-tertiary)" }}>&copy; 2025 hayzaydee</p>
        </div>
      </footer>

      <ContactModal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} />
    </div>
  );
};

export default LandingPage;
