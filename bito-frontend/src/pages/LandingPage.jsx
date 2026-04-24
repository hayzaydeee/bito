import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRightIcon,
  CheckCircledIcon,
  TargetIcon,
  BarChartIcon,
  GitHubLogoIcon,
  Cross2Icon,
  HamburgerMenuIcon,
  CheckIcon,
  RocketIcon,
  LightningBoltIcon,
  PersonIcon,
} from "@radix-ui/react-icons";
import {
  Brain, ChatCircle, Ruler, PenNib, Lightning, MagnifyingGlass, Robot,
} from "@phosphor-icons/react";
import { useAuth } from "../contexts/AuthContext";
import ContactModal from "../components/ui/ContactModal";
import ScrollReveal from "../components/ui/ScrollReveal";
import { springs } from "../utils/motion";

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);
  const testimonialsRef = useRef(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate("/app");
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    const h = () => setHasScrolled(window.scrollY > 50);
    window.addEventListener("scroll", h, { passive: true });
    h();
    return () => window.removeEventListener("scroll", h);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-bg-primary)" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: "var(--color-brand-500)" }} />
          <p style={{ color: "var(--color-text-secondary)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  const scrollTo = (ref) => { ref.current?.scrollIntoView({ behavior: "smooth" }); setMobileMenuOpen(false); };

  /* ─── Data ─── */
  const features = [
    {
      tab: "Track",
      title: "Log in seconds. See progress in real time.",
      desc: "One tap to complete a habit. Your streaks, progress rings, and weekly view update instantly. No friction between the intention and the action.",
      bullets: ["One-click daily check-ins", "Streak tracking with milestone celebrations", "Flexible schedules — daily, weekly, or custom"],
      visual: "track",
    },
    {
      tab: "Understand",
      title: "See patterns you'd otherwise miss",
      desc: "Beautiful charts and heatmaps reveal the story behind your data. AI-powered insights surface correlations and trends.",
      bullets: ["Visual heatmaps and progress charts", "AI-generated insights and nudges", "Trend analysis across weeks and months"],
      visual: "understand",
    },
    {
      tab: "Together",
      title: "Accountability changes everything",
      desc: "Invite friends, family, or teammates into shared groups. Celebrate wins together, run challenges, and build habits as a group.",
      bullets: ["shared groups and team habits", "Group challenges and competitions", "Encouragement and activity feeds"],
      visual: "together",
    },
  ];

  const steps = [
    { num: "01", title: "Add your habits", desc: "Pick from smart templates or create your own. Set frequency, reminders, and goals in under a minute." },
    { num: "02", title: "Check in daily", desc: "Open bito, tap to complete. Streaks, progress rings, and weekly overview update in real time." },
    { num: "03", title: "Grow with insights", desc: "As data accumulates, bito surfaces patterns and suggestions. The longer you use bito, the more it understands you." },
  ];

  const testimonials = [
    { name: "Stephanie Ndubuisi", role: "Student", content: "Bito completely changed how I approach personal development. The visual progress tracking keeps me motivated every single day.", avatar: "SN" },
    { name: "Henry Nwokolo", role: "Software Engineer", content: "The analytics are incredible. I can finally see exactly which habits are driving real results in my routines.", avatar: "HN" },
    { name: "David Arochukwu", role: "Writer", content: "Beautiful design and incredibly intuitive. Building habits has never felt this engaging and rewarding.", avatar: "DA" },
  ];

  const comparisonRows = [
    { feature: "Habit tracking", bito: true, others: true },
    { feature: "Team groups", bito: true, others: false },
    { feature: "AI-powered insights", bito: true, others: false },
    { feature: "Beautiful analytics", bito: true, others: "Basic" },
    { feature: "Journal integration", bito: true, others: false },
    { feature: "Generous free tier", bito: true, others: "Limited" },
  ];

  const feat = features[activeFeature];

  /* ─── Feature Visual ─── */
  const FeatureVisual = ({ type }) => {
    const bg = "var(--color-surface-secondary)";
    const border = "var(--color-border-primary)";
    if (type === "track") {
      return (
        <div className="rounded-xl border p-6 space-y-3" style={{ backgroundColor: bg, borderColor: border }}>
          {["Morning meditation", "Read 20 pages", "Exercise", "Journal"].map((h, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg px-4 py-3 border" style={{ backgroundColor: "var(--color-surface-primary)", borderColor: border }}>
              <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: i < 2 ? "var(--color-success)" : "var(--color-surface-hover)" }}>
                {i < 2 && <CheckIcon className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm font-spartan" style={{ color: i < 2 ? "var(--color-text-tertiary)" : "var(--color-text-primary)", textDecoration: i < 2 ? "line-through" : "none" }}>{h}</span>
              {i === 0 && <span className="ml-auto text-xs font-spartan font-medium" style={{ color: "var(--color-warning)" }}>12-day streak</span>}
            </div>
          ))}
          <div className="flex items-center gap-2 pt-2">
            <div className="h-2 flex-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--color-surface-hover)" }}>
              <div className="h-full rounded-full" style={{ width: "50%", backgroundColor: "var(--color-brand-500)" }} />
            </div>
            <span className="text-xs font-spartan font-medium" style={{ color: "var(--color-text-tertiary)" }}>2 / 4 today</span>
          </div>
        </div>
      );
    }
    if (type === "understand") {
      return (
        <div className="rounded-xl border p-6" style={{ backgroundColor: bg, borderColor: border }}>
          <div className="flex items-end gap-1.5 h-28 mb-4">
            {[40, 65, 55, 80, 70, 90, 85, 60, 95, 75, 88, 92].map((h, i) => (
              <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, backgroundColor: "var(--color-brand-500)", opacity: 0.3 + (i / 12) * 0.7 }} />
            ))}
          </div>
          <div className="text-xs font-spartan mb-4" style={{ color: "var(--color-text-tertiary)" }}>Completion rate — last 12 weeks</div>
          <div className="rounded-lg px-4 py-3" style={{ backgroundColor: "var(--color-surface-primary)", borderLeft: "3px solid var(--color-secondary-400)" }}>
            <p className="text-xs font-spartan" style={{ color: "var(--color-text-secondary)" }}>Your morning habits have a 92% completion rate — 34% higher than evening ones.</p>
          </div>
        </div>
      );
    }
    if (type === "together") {
      return (
        <div className="rounded-xl border p-6 space-y-4" style={{ backgroundColor: bg, borderColor: border }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex -space-x-2">
              {["S", "M", "E", "J"].map((l, i) => (
                <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white border-2" style={{ backgroundColor: `var(--color-brand-${400 + i * 100})`, borderColor: bg }}>{l}</div>
              ))}
            </div>
            <span className="text-xs font-spartan font-medium" style={{ color: "var(--color-text-tertiary)" }}>Team Fitness</span>
          </div>
          {[{ user: "Sarah", action: "completed Morning Run", time: "2m ago" }, { user: "Michael", action: "started 30-Day Challenge", time: "1h ago" }, { user: "Emily", action: "hit a 7-day streak!", time: "3h ago" }].map((item, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5 border" style={{ backgroundColor: "var(--color-surface-primary)", borderColor: border }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ backgroundColor: "var(--color-brand-500)" }}>{item.user[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-spartan truncate" style={{ color: "var(--color-text-primary)" }}><span className="font-medium">{item.user}</span>{" "}<span style={{ color: "var(--color-text-secondary)" }}>{item.action}</span></p>
              </div>
              <span className="text-[10px] font-spartan flex-shrink-0" style={{ color: "var(--color-text-tertiary)" }}>{item.time}</span>
            </div>
          ))}
        </div>
      );
    }
    // transform
    return (
      <div className="rounded-xl border p-6 space-y-3" style={{ backgroundColor: bg, borderColor: border }}>
        <div className="rounded-lg px-4 py-3 border" style={{ backgroundColor: "var(--color-surface-primary)", borderColor: border }}>
          <p className="text-xs font-spartan mb-1" style={{ color: "var(--color-text-tertiary)" }}>Your goal</p>
          <p className="text-sm font-spartan font-medium" style={{ color: "var(--color-text-primary)" }}>"I want to become a morning person and exercise 5x a week"</p>
        </div>
        <div className="flex items-center gap-2 py-1">
          <LightningBoltIcon className="w-3.5 h-3.5" style={{ color: "var(--color-brand-400)" }} />
          <span className="text-xs font-spartan" style={{ color: "var(--color-brand-400)" }}>AI generating your plan...</span>
        </div>
        {["Phase 1: Wake-up Routine (Week 1–2)", "Phase 2: Movement (Week 3–4)", "Phase 3: Full Routine (Week 5+)"].map((p, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg px-4 py-2.5 border" style={{ backgroundColor: "var(--color-surface-primary)", borderColor: border }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: i === 0 ? "var(--color-success)" : "var(--color-surface-hover)", color: i === 0 ? "white" : "var(--color-text-tertiary)" }}>{i + 1}</div>
            <span className="text-xs font-spartan" style={{ color: "var(--color-text-primary)" }}>{p}</span>
          </div>
        ))}
      </div>
    );
  };



  return (
    <div className="min-h-screen overflow-hidden" style={{ backgroundColor: "var(--color-bg-primary)" }}>

      {/* ─── Navigation ─── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${hasScrolled ? "nav-glass" : ""}`}
        style={{ borderBottom: hasScrolled ? "1px solid var(--color-border-primary)" : "1px solid transparent" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <div className="flex-shrink-0 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--color-brand-600)" }}>
                <TargetIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold font-garamond" style={{ color: "var(--color-text-primary)" }}>bito</span>
            </div>
            <div className="hidden md:flex flex-1 justify-center items-center">
              <div className="flex items-center gap-8">
                {[{ label: "Features", ref: featuresRef }, { label: "How It Works", ref: howItWorksRef }, { label: "Testimonials", ref: testimonialsRef }].map((item) => (
                  <button key={item.label} onClick={() => scrollTo(item.ref)} className="text-sm font-medium font-spartan transition-colors hover:!text-[var(--color-text-primary)]" style={{ color: "var(--color-text-secondary)" }}>{item.label}</button>
                ))}
                <button onClick={() => setContactModalOpen(true)} className="text-sm font-medium font-spartan transition-colors hover:!text-[var(--color-text-primary)]" style={{ color: "var(--color-text-secondary)" }}>Contact</button>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <button onClick={() => navigate("/login")} className="px-4 py-2 text-sm font-medium font-spartan transition-colors hover:!text-[var(--color-text-primary)]" style={{ color: "var(--color-text-secondary)" }}>Sign In</button>
              <button onClick={() => navigate("/login")} className="btn btn-primary btn-sm">Get Started</button>
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden ml-auto p-2 rounded-lg" style={{ color: "var(--color-text-primary)" }}>
              {mobileMenuOpen ? <Cross2Icon className="w-5 h-5" /> : <HamburgerMenuIcon className="w-5 h-5" />}
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t" style={{ borderColor: "var(--color-border-primary)" }}>
              <div className="flex flex-col gap-4 font-spartan">
                <button onClick={() => scrollTo(featuresRef)} className="text-left text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>Features</button>
                <button onClick={() => scrollTo(howItWorksRef)} className="text-left text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>How It Works</button>
                <button onClick={() => { setContactModalOpen(true); setMobileMenuOpen(false); }} className="text-left text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>Contact</button>
                <div className="pt-4 border-t flex flex-col gap-3" style={{ borderColor: "var(--color-border-primary)" }}>
                  <button onClick={() => navigate("/login")} className="text-left text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>Sign In</button>
                  <button onClick={() => navigate("/login")} className="btn btn-primary btn-sm text-center">Get Started</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="hero-gradient-mesh" />
        <motion.div
          className="relative z-10 max-w-4xl mx-auto text-center"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.15 } } }}
        >
          <motion.div className="inline-flex items-center gap-2 trust-badge mb-8" variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }}>
            <RocketIcon className="w-3.5 h-3.5" style={{ color: "var(--color-brand-400)" }} />
            <span>v2.0 is live!</span>
          </motion.div>
          <motion.h1 className="font-garamond font-bold mb-6 px-2" style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", lineHeight: 1.08, letterSpacing: "-0.03em", color: "var(--color-text-primary)" }} variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }}>
            The habit app that builds<br />the plan <span className="gradient-text">with you.</span>
          </motion.h1>
          <motion.p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-spartan px-4" style={{ color: "var(--color-text-secondary)" }} variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }}>
            An AI-powered habit tracker that helps you build the life you want. Track your habits, see patterns in your behavior, and architect personalized plans for achieving specific goals.
          </motion.p>
          <motion.div className="flex flex-col sm:flex-row gap-3 justify-center mb-6 font-spartan px-4" variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }}>
            <button onClick={() => navigate("/login")} className="btn-gradient group inline-flex items-center justify-center">
              Start for free <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => scrollTo(howItWorksRef)} className="btn btn-secondary btn-lg">See how it works</button>
          </motion.div>
          <motion.p className="text-sm font-spartan flex items-center justify-center gap-2" style={{ color: "var(--color-text-tertiary)" }} variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }}>
            <CheckCircledIcon className="w-3.5 h-3.5" style={{ color: "var(--color-success)" }} /> No credit card required
          </motion.p>
        </motion.div>
      </section>

      {/* ─── Feature Showcase — Tabbed ─── */}
      <section ref={featuresRef} id="features" className="py-24 md:py-32 px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="heading-lg font-garamond mb-4" style={{ color: "var(--color-text-primary)" }}>A system that works like you do.</h2>
              <p className="text-base font-spartan max-w-xl mx-auto" style={{ color: "var(--color-text-secondary)" }}>Track your habits. Understand your patterns. Build alongside people who keep you accountable.</p>
            </div>
            <div className="flex justify-center gap-1 mb-12 flex-wrap" style={{ borderBottom: "1px solid var(--color-border-primary)" }}>
              {features.map((f, i) => (
                <button key={f.tab} onClick={() => setActiveFeature(i)} className={`feature-tab ${i === activeFeature ? "feature-tab-active" : ""}`}>{f.tab}</button>
              ))}
            </div>
            <motion.div key={activeFeature} className="grid md:grid-cols-2 gap-12 md:gap-16 items-center" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
              <div>
                <span className="text-xs font-spartan font-semibold uppercase tracking-widest mb-3 inline-block" style={{ color: "var(--color-brand-400)" }}>{feat.tab}</span>
                <h3 className="heading-lg font-garamond mb-4" style={{ color: "var(--color-text-primary)" }}>{feat.title}</h3>
                <p className="text-base leading-relaxed font-spartan mb-6" style={{ color: "var(--color-text-secondary)" }}>{feat.desc}</p>
                <ul className="space-y-3">
                  {feat.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircledIcon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--color-success)" }} />
                      <span className="text-sm font-spartan" style={{ color: "var(--color-text-secondary)" }}>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div><FeatureVisual type={feat.visual} /></div>
            </motion.div>
          </div>
        </ScrollReveal>
      </section>

      <hr className="section-divider" />

      {/* ─── Compass — Dedicated Section ─── */}
      <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-6">
              <span className="text-xs font-spartan font-semibold uppercase tracking-widest mb-3 inline-block" style={{ color: "var(--color-brand-400)" }}>Compass</span>
              <h2 className="font-garamond font-bold mb-4" style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>Tell us your goal.{" "}<span className="gradient-text">We'll build the plan.</span></h2>
              <p className="text-base md:text-lg font-spartan max-w-2xl mx-auto leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                Type what you want to become. Compass reads your existing habits, your streaks, your patterns — and builds a plan around how you actually live. Not a generic template. A plan that fits you.
              </p>
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center mt-12">
            <ScrollReveal direction="left">
              <div className="space-y-6">
                {[
                  { icon: Brain,      title: "Knows your routine", desc: "It looks at what you're already doing so the plan doesn't fight your life \u2014 it fits it." },
                  { icon: ChatCircle, title: "Refine with conversation", desc: "Not quite right? Tell it what to change. Swap a habit, shift the schedule, make it harder \u2014 it adjusts instantly." },
                  { icon: Ruler,      title: "Starts easy, builds up", desc: "Plans begin with simple wins and escalate when you're ready \u2014 not before." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="flex-shrink-0 mt-0.5 text-[var(--color-text-tertiary)]"><item.icon size={22} weight="duotone" /></span>
                    <div>
                      <h4 className="text-sm font-spartan font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>{item.title}</h4>
                      <p className="text-sm font-spartan leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right">
              <div className="rounded-xl border p-6 space-y-3" style={{ backgroundColor: "var(--color-surface-secondary)", borderColor: "var(--color-border-primary)" }}>
                <div className="rounded-lg px-4 py-3 border" style={{ backgroundColor: "var(--color-surface-primary)", borderColor: "var(--color-border-primary)" }}>
                  <p className="text-xs font-spartan mb-1" style={{ color: "var(--color-text-tertiary)" }}>Your goal</p>
                  <p className="text-sm font-spartan font-medium" style={{ color: "var(--color-text-primary)" }}>"I want to become a morning person and exercise 5x a week"</p>
                </div>
                <div className="flex items-center gap-2 py-1">
                  <LightningBoltIcon className="w-3.5 h-3.5" style={{ color: "var(--color-brand-400)" }} />
                  <span className="text-xs font-spartan" style={{ color: "var(--color-brand-400)" }}>AI analyzing your routines and generating plan...</span>
                </div>
                {[
                  { phase: "Foundation", label: "Week 1–2", habits: ["Wake up at 7:30 AM", "10-min morning stretch"], status: "active" },
                  { phase: "Building", label: "Week 3–4", habits: ["Wake up at 6:30 AM", "30-min jog (Mon/Wed/Fri)", "Evening meal prep (Sun)"], status: "upcoming" },
                  { phase: "Mastery", label: "Week 5+", habits: ["Wake up at 6 AM", "45-min gym session (5x/week)", "Morning journaling"], status: "upcoming" },
                ].map((p, i) => (
                  <div key={i} className="rounded-lg border px-4 py-3" style={{ backgroundColor: "var(--color-surface-primary)", borderColor: "var(--color-border-primary)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: p.status === "active" ? "var(--color-success)" : "var(--color-surface-hover)", color: p.status === "active" ? "white" : "var(--color-text-tertiary)" }}>{i + 1}</div>
                        <span className="text-xs font-spartan font-bold" style={{ color: "var(--color-text-primary)" }}>{p.phase}</span>
                      </div>
                      <span className="text-[10px] font-spartan" style={{ color: "var(--color-text-tertiary)" }}>{p.label}</span>
                    </div>
                    <div className="space-y-1 pl-7">
                      {p.habits.map((h, j) => (
                        <p key={j} className="text-[11px] font-spartan" style={{ color: "var(--color-text-secondary)" }}>• {h}</p>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="rounded-lg px-4 py-2.5" style={{ backgroundColor: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}>
                  <p className="text-[11px] font-spartan" style={{ color: "var(--color-brand-400)" }}>"Building on your existing evening reading habit and 79% weekly completion rate — this plan starts easy and escalates."</p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ─── Journal — Dedicated Section ─── */}
      <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-6">
              <span className="text-xs font-spartan font-semibold uppercase tracking-widest mb-3 inline-block" style={{ color: "var(--color-secondary-400)" }}>Rich Journaling</span>
              <h2 className="font-garamond font-bold mb-4" style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>Your habits tell part of the story.{" "}<span className="gradient-text">Your journal tells the rest.</span></h2>
              <p className="text-base md:text-lg font-spartan max-w-2xl mx-auto leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                A writing space that lives alongside your habits — and an AI that connects what you write to how you actually perform. Quick notes or deep reflections. Both in one place.
              </p>
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center mt-12">
            <ScrollReveal direction="left">
              <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--color-surface-secondary)", borderColor: "var(--color-border-primary)" }}>
                {/* Mini journal UI mockup */}
                <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "var(--color-border-primary)" }}>
                  <h4 className="text-sm font-garamond font-bold" style={{ color: "var(--color-text-primary)" }}>Journal</h4>
                  <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 rounded text-[9px] font-spartan font-semibold text-white" style={{ backgroundColor: "var(--color-brand-500)" }}>Intelligence</div>
                    <div className="flex rounded border p-0.5" style={{ borderColor: "var(--color-border-primary)" }}>
                      <div className="px-1.5 py-0.5 rounded text-[9px] font-spartan" style={{ backgroundColor: "var(--color-surface-elevated)", color: "var(--color-text-primary)" }}>Day</div>
                      <div className="px-1.5 py-0.5 rounded text-[9px] font-spartan" style={{ color: "var(--color-text-tertiary)" }}>List</div>
                    </div>
                  </div>
                </div>
                {/* Week strip */}
                <div className="flex gap-1 px-5 py-2 border-b overflow-hidden" style={{ borderColor: "var(--color-border-primary)" }}>
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
                    <div key={d} className="flex-1 text-center py-1 rounded" style={{ backgroundColor: i === 4 ? "var(--color-brand-600)" : "transparent" }}>
                      <p className="text-[8px] font-spartan" style={{ color: i === 4 ? "white" : "var(--color-text-tertiary)" }}>{d}</p>
                      <p className="text-[10px] font-spartan font-bold" style={{ color: i === 4 ? "white" : "var(--color-text-secondary)" }}>{i + 3}</p>
                      {(i === 1 || i === 2 || i === 4) && <div className="w-1 h-1 rounded-full mx-auto mt-0.5" style={{ backgroundColor: i === 4 ? "white" : "var(--color-brand-400)" }} />}
                    </div>
                  ))}
                </div>
                {/* Editor area */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-spartan px-2 py-0.5 rounded-full" style={{ backgroundColor: "rgba(99,102,241,0.1)", color: "var(--color-brand-500)" }}>longform</span>
                    <span className="text-[10px] font-spartan" style={{ color: "var(--color-text-tertiary)" }}>Friday, March 7</span>
                  </div>
                  <p className="text-sm font-garamond leading-relaxed" style={{ color: "var(--color-text-primary)" }}>Had a breakthrough today during the morning run — finally hit the 5K without stopping. The consistency is paying off.</p>
                  <p className="text-sm font-garamond leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>Noticed that I've been sleeping better on days I journal before bed. Want to explore that pattern more...</p>
                  <div className="flex gap-2 pt-2">
                    <span className="text-[10px] font-spartan px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--color-surface-hover)", color: "var(--color-text-tertiary)" }}>fitness</span>
                    <span className="text-[10px] font-spartan px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--color-surface-hover)", color: "var(--color-text-tertiary)" }}>good</span>
                    <span className="text-[10px] font-spartan px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--color-surface-hover)", color: "var(--color-text-tertiary)" }}>high energy</span>
                  </div>
                  <hr style={{ borderColor: "var(--color-border-primary)" }} />
                  <div className="space-y-2">
                    <p className="text-[10px] font-spartan font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>Quick entries</p>
                    {["Drank 2L water today", "Meditation felt deeper than usual"].map((m, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ backgroundColor: "var(--color-surface-primary)", borderColor: "var(--color-border-primary)" }}>
                        <span className="text-[10px] font-spartan px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--color-surface-hover)", color: "var(--color-text-tertiary)" }}>micro</span>
                        <p className="text-xs font-spartan" style={{ color: "var(--color-text-secondary)" }}>{m}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right">
              <div className="space-y-6">
                {[
                  { icon: PenNib,           title: "Rich editor", desc: "Headings, lists, images, callouts \u2014 write however you think. Everything auto-saves." },
                  { icon: Lightning,         title: "Quick notes & deep entries", desc: "Tap out a one-liner or write a full page. Both live on the same timeline." },
                  { icon: MagnifyingGlass,   title: "Search everything", desc: "Find any entry instantly. That insight from three weeks ago is one search away." },
                  { icon: Robot,             title: "AI that reads between the lines", desc: "Opt in to surface patterns between what you write and how your habits perform. Privacy-first \u2014 you choose what the AI sees." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <span className="flex-shrink-0 mt-0.5 text-[var(--color-text-tertiary)]"><item.icon size={22} weight="duotone" /></span>
                    <div>
                      <h4 className="text-sm font-spartan font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>{item.title}</h4>
                      <p className="text-sm font-spartan leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ─── How It Works ─── */}
      <section ref={howItWorksRef} id="howItWorks" className="py-24 md:py-32 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
        <ScrollReveal>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="heading-lg font-garamond mb-4" style={{ color: "var(--color-text-primary)" }}>Three steps. That's it.</h2>
              <p className="text-base font-spartan max-w-xl mx-auto" style={{ color: "var(--color-text-secondary)" }}>No complex setup, no learning curve. You'll be tracking habits in under two minutes.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((s, i) => (
                <ScrollReveal key={s.num} delay={i * 0.12}>
                  <div className="text-center md:text-left">
                    <span className="text-5xl font-garamond font-bold mb-4 inline-block" style={{ color: "var(--color-brand-500)", opacity: 0.3 }}>{s.num}</span>
                    <h3 className="heading-sm font-garamond mb-3" style={{ color: "var(--color-text-primary)" }}>{s.title}</h3>
                    <p className="text-sm font-spartan leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{s.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>

      <hr className="section-divider" />

      {/* ─── Testimonials ─── */}
      <section ref={testimonialsRef} id="testimonials" className="py-24 md:py-32 px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="heading-lg font-garamond mb-4" style={{ color: "var(--color-text-primary)" }}>From the people using it every day.</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <ScrollReveal key={i} delay={i * 0.1}>
                  <div className="testimonial-glass">
                    <p className="text-sm font-spartan leading-relaxed mb-6" style={{ color: "var(--color-text-secondary)" }}>{t.content}</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700))" }}>{t.avatar}</div>
                      <div>
                        <p className="text-sm font-spartan font-medium" style={{ color: "var(--color-text-primary)" }}>{t.name}</p>
                        <p className="text-xs font-spartan" style={{ color: "var(--color-text-tertiary)" }}>{t.role}</p>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>

      <hr className="section-divider" />

      {/* ─── Comparison Table ─── */}
      <section className="py-24 md:py-28 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
        <ScrollReveal>
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="heading-lg font-garamond mb-4" style={{ color: "var(--color-text-primary)" }}>Why bito?</h2>
            </div>
            <div className="rounded-xl border overflow-hidden" style={{ backgroundColor: "var(--color-surface-primary)", borderColor: "var(--color-border-primary)" }}>
              <div className="grid grid-cols-3 px-5 py-3 border-b" style={{ borderColor: "var(--color-border-primary)" }}>
                <span className="text-xs font-spartan font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-tertiary)" }}>Feature</span>
                <span className="text-xs font-spartan font-semibold uppercase tracking-wider text-center" style={{ color: "var(--color-brand-400)" }}>Bito</span>
                <span className="text-xs font-spartan font-semibold uppercase tracking-wider text-center" style={{ color: "var(--color-text-tertiary)" }}>Others</span>
              </div>
              {comparisonRows.map((row, i) => (
                <div key={i} className="comparison-row grid grid-cols-3 px-5 py-3 border-b last:border-b-0" style={{ borderColor: "var(--color-border-primary)" }}>
                  <span className="text-sm font-spartan" style={{ color: "var(--color-text-primary)" }}>{row.feature}</span>
                  <div className="flex justify-center">{row.bito === true ? <CheckCircledIcon className="w-4 h-4" style={{ color: "var(--color-success)" }} /> : <span className="text-sm font-spartan" style={{ color: "var(--color-text-secondary)" }}>{row.bito}</span>}</div>
                  <div className="flex justify-center">{row.others === true ? <CheckCircledIcon className="w-4 h-4" style={{ color: "var(--color-success)" }} /> : row.others === false ? <span className="text-sm font-spartan" style={{ color: "var(--color-text-tertiary)" }}>—</span> : <span className="text-sm font-spartan" style={{ color: "var(--color-text-tertiary)" }}>{row.others}</span>}</div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>

      <hr className="section-divider" />

      {/* ─── Final CTA ─── */}
      <section className="relative py-28 md:py-36 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, var(--color-brand-950) 0%, transparent 70%)", opacity: 0.4 }} />
        <ScrollReveal direction="scale">
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <h2 className="font-garamond font-bold mb-6" style={{ fontSize: "clamp(2rem, 5vw, 3.75rem)", lineHeight: 1.1, letterSpacing: "-0.02em", color: "var(--color-text-primary)" }}>Ready to actually stick to something?</h2>
            <p className="text-lg font-spartan mb-10 max-w-xl mx-auto" style={{ color: "var(--color-text-secondary)" }}>Free to start. No credit card. Two minutes to set up.</p>
            <button onClick={() => navigate("/login")} className="btn-gradient group inline-flex items-center justify-center">
              Get started free <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="mt-6 text-sm font-spartan flex items-center justify-center gap-2" style={{ color: "var(--color-text-tertiary)" }}>
              <CheckCircledIcon className="w-4 h-4" style={{ color: "var(--color-success)" }} /> No credit card required
            </p>
          </div>
        </ScrollReveal>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-10 px-4 sm:px-6 lg:px-8 border-t" style={{ borderColor: "var(--color-border-primary)" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: "var(--color-brand-600)" }}><TargetIcon className="w-4 h-4 text-white" /></div>
            <span className="text-base font-bold font-garamond" style={{ color: "var(--color-text-primary)" }}>bito</span>
          </div>
          <div className="flex items-center gap-6 font-spartan text-sm">
            <button onClick={() => scrollTo(featuresRef)} className="transition-colors hover:!text-[var(--color-text-primary)]" style={{ color: "var(--color-text-tertiary)" }}>Features</button>
            <button onClick={() => setContactModalOpen(true)} className="transition-colors hover:!text-[var(--color-text-primary)]" style={{ color: "var(--color-text-tertiary)" }}>Contact</button>
            <a href="https://github.com/hayzaydeee/bito" className="transition-colors hover:!text-[var(--color-text-primary)]" style={{ color: "var(--color-text-tertiary)" }}><GitHubLogoIcon className="w-4 h-4" /></a>
          </div>
          <p className="text-xs font-spartan" style={{ color: "var(--color-text-tertiary)" }}>&copy; 2025 hayzaydee</p>
        </div>
      </footer>

      <ContactModal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} />
    </div>
  );
};

export default LandingPage;
