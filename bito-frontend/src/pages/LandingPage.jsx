import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlayIcon,
  ArrowRightIcon,
  CheckCircledIcon,
  TargetIcon,
  CalendarIcon,
  BarChartIcon,
  LightningBoltIcon,
  ChevronRightIcon,
  GitHubLogoIcon,
  TwitterLogoIcon,
  Cross2Icon,
  HamburgerMenuIcon,
} from "@radix-ui/react-icons";
import { useAuth } from "../contexts/AuthContext";
import ContactModal from "../components/ui/ContactModal";
import HowItWorksSection from "../components/landingPage/HowItWorksSection";

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const testimonialsRef = useRef(null);
  const howItWorksRef = useRef(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Redirect authenticated users to the app
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/app");
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Intersection Observer for active section tracking
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3 }
    );

    [heroRef, featuresRef, testimonialsRef, howItWorksRef].forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, []);

  // Handle scroll event to change navbar background
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      if (scrollPosition > 50) {
        setHasScrolled(true);
      } else {
        setHasScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Initial check
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-bg-primary)] via-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand-500)] mx-auto mb-4"></div>
          <p className="text-[var(--color-text-secondary)]">Loading...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: <TargetIcon className="w-5 h-5" />,
      title: "Smart Goal Tracking",
      description:
        "Set meaningful goals with AI-powered insights and personalized recommendations that adapt to your progress.",
      badge: "AI-Powered",
    },
    {
      icon: <CalendarIcon className="w-5 h-5" />,
      title: "Visual Progress",
      description:
        "Beautiful calendar and chart views help you visualize consistency patterns and celebrate your wins.",
      badge: "Visual",
    },
    {
      icon: <BarChartIcon className="w-5 h-5" />,
      title: "Deep Analytics",
      description:
        "Understand your habits with detailed analytics, trend analysis, and correlation insights.",
      badge: "Analytics",
    },
    {
      icon: <LightningBoltIcon className="w-5 h-5" />,
      title: "Quick Actions",
      description:
        "Lightning-fast habit logging with shortcuts, automation, and seamless integrations.",
      badge: "Fast",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Product Manager at Stripe",
      content:
        "Bito has completely transformed how I approach personal development. The visual progress tracking keeps me motivated every single day.",
      rating: 5,
      avatar: "SC",
    },
    {
      name: "Michael Rodriguez",
      role: "Software Engineer at Vercel",
      content:
        "The analytics dashboard is incredible. I can see exactly what's working and what isn't in my daily routines.",
      rating: 5,
      avatar: "MR",
    },
    {
      name: "Emily Johnson",
      role: "Designer at Figma",
      content:
        "Beautiful design and incredibly intuitive. Building habits has never felt this engaging and rewarding.",
      rating: 5,
      avatar: "EJ",
    },
  ];

  const stats = [
    { value: "10K+", label: "Active Users" },
    { value: "500K+", label: "Habits Tracked" },
    { value: "98%", label: "Success Rate" },
    { value: "4.9/5", label: "User Rating" },
  ];

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-bg-primary)] via-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)] overflow-hidden">
      {/* Navigation Bar - Cal.com Inspired */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          hasScrolled
            ? "bg-[var(--color-surface-primary)]/95 backdrop-blur-md border-b border-[var(--color-border-primary)]/20"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-2 w-48">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-700)] flex items-center justify-center shadow-lg">
                <TargetIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold gradient-text font-outfit">
                  bito
                </p>
              </div>
            </div>

            {/* Desktop Navigation - Centered */}
            <div className="hidden md:flex flex-1 justify-center items-center font-outfit">
              <div className="flex items-center gap-8">
                <button
                  onClick={() => scrollToSection(featuresRef)}
                  className={`text-sm font-medium transition-colors hover:text-[var(--color-text-primary)] ${
                    activeSection === "features"
                      ? "text-[var(--color-brand-500)]"
                      : "text-[var(--color-text-secondary)]"
                  }`}
                >
                  Features
                </button>
                <button
                  onClick={() => scrollToSection(howItWorksRef)}
                  className={`text-sm font-medium transition-colors hover:text-[var(--color-text-primary)] ${
                    activeSection === "howItWorks"
                      ? "text-[var(--color-brand-500)]"
                      : "text-[var(--color-text-secondary)]"
                  }`}
                >
                  How It Works
                </button>
                <button
                  onClick={() => setContactModalOpen(true)}
                  className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  Contact Us
                </button>
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-4 font-outfit w-48 justify-end">
              <button
                onClick={() => navigate("/login")}
                className="whitespace-nowrap px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="whitespace-nowrap px-5 py-2 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              {mobileMenuOpen ? (
                <Cross2Icon className="w-5 h-5 text-[var(--color-text-primary)]" />
              ) : (
                <HamburgerMenuIcon className="w-5 h-5 text-[var(--color-text-primary)]" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div
              className={`md:hidden py-4 ${
                hasScrolled
                  ? "border-t border-[var(--color-border-primary)]/20"
                  : "bg-[var(--color-surface-primary)]/95 backdrop-blur-md rounded-b-lg"
              }`}
            >
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => scrollToSection(featuresRef)}
                  className="text-left text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  Features
                </button>
                <button
                  onClick={() => scrollToSection(howItWorksRef)}
                  className="text-left text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  How It Works
                </button>
                <button
                  onClick={() => {
                    setContactModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  Contact Us
                </button>
                <div className="pt-4 border-t border-[var(--color-border-primary)]/20 flex flex-col gap-3">
                  <button
                    onClick={() => navigate("/login")}
                    className="text-left text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors px-2 py-1"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate("/signup")}
                    className="px-5 py-2 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded-lg text-sm font-medium transition-all duration-200 text-center shadow-md"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section - Cal.com Style */}
      <section
        ref={heroRef}
        id="hero"
        className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-16 md:pt-20"
      >
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand-500)]/5 via-transparent to-[var(--color-brand-400)]/3"></div>
          {/* Floating Elements */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[var(--color-brand-400)]/40 rounded-full animate-float"></div>
          <div
            className="absolute top-1/3 right-1/3 w-1 h-1 bg-[var(--color-brand-500)]/60 rounded-full animate-float"
            style={{ animationDelay: "1s" }}
          ></div>
          <div
            className="absolute bottom-1/3 left-1/5 w-1.5 h-1.5 bg-[var(--color-brand-300)]/50 rounded-full animate-float"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div
          className={`relative z-10 max-w-4xl mx-auto text-center transition-all duration-1000 hero-mobile ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Badge */}
          <div
            onClick={() => navigate("/signup")}
            className="inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-full bg-[var(--color-surface-elevated)]/80 backdrop-blur-sm border border-[var(--color-border-primary)]/30 mb-6 md:mb-8 hover:scale-105 transition-transform duration-300 touch-target"
          >
            <div className="w-2 h-2 bg-[var(--color-success)] rounded-full animate-pulse"></div>
            <span className="text-xs md:text-sm font-medium text-[var(--color-text-primary)]">
              bito v1 is live!
            </span>
            <ChevronRightIcon className="w-3 md:w-4 h-3 md:h-4 text-[var(--color-text-tertiary)]" />
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-[var(--color-text-primary)] via-[var(--color-brand-400)] to-[var(--color-brand-500)] bg-clip-text text-transparent font-dmSerif mb-4 md:mb-6 leading-tight px-2">
            Build habits that
            <br />
            actually stick
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg lg:text-xl text-[var(--color-text-secondary)] mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed font-outfit px-4">
            The most effective way to track, analyze, and optimize your daily
            routines with beautiful insights and AI-powered recommendations.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-8 md:mb-12 font-outfit button-group-mobile px-4">
            <button
              onClick={() => navigate("/signup")}
              className="group px-6 md:px-8 py-3 md:py-4 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded-xl text-base font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 touch-target"
            >
              Start for free
              <ArrowRightIcon className="w-4 md:w-5 h-4 md:h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => scrollToSection(howItWorksRef)}
              className="px-6 md:px-8 py-3 md:py-4 bg-[var(--color-surface-elevated)]/80 hover:bg-[var(--color-surface-hover)] backdrop-blur-sm border border-[var(--color-border-primary)]/30 text-[var(--color-text-primary)] rounded-xl text-base font-semibold transition-all duration-300 hover:scale-105 shadow-lg touch-target"
            >
              How it works
            </button>
          </div>
        </div>
      </section>

      {/* Features Section - Modern Grid */}
      <section
        ref={featuresRef}
        id="features"
        className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 relative"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-brand-400)] bg-clip-text text-transparent font-dmSerif mb-3 md:mb-4 px-4">
              Everything you need to succeed
            </h2>
            <p className="text-base md:text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto font-outfit px-4">
              Powerful features designed for effective habit building, from
              tracking to insights
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 font-outfit features-mobile">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative p-6 glass-card rounded-2xl border border-[var(--color-border-primary)]/20 transition-all duration-500 hover:border-[var(--color-brand-500)]/30 hover:transform hover:scale-105"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Badge */}
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-1 bg-[var(--color-brand-500)]/10 text-[var(--color-brand-400)] text-xs font-medium rounded-full border border-[var(--color-brand-500)]/20">
                    {feature.badge}
                  </span>
                </div>

                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-brand-500)]/20 to-[var(--color-brand-400)]/10 border border-[var(--color-brand-500)]/20 text-[var(--color-brand-400)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold font-dmSerif mb-3 text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-400)] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--color-brand-500)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorksSection ref={howItWorksRef} />

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto">
          <div className="relative p-12 glass-card rounded-3xl border border-[var(--color-border-primary)]/20 text-center overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand-500)]/5 via-[var(--color-brand-400)]/3 to-transparent"></div>
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[var(--color-brand-400)]/10 to-transparent rounded-full -translate-y-20 translate-x-20"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-[var(--color-brand-500)]/10 to-transparent rounded-full translate-y-20 -translate-x-20"></div>
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-brand-400)] bg-clip-text text-transparent font-dmSerif mb-4">
                Ready to build better habits?
              </h2>

              <p className="text-lg text-[var(--color-text-secondary)] mb-8 max-w-2xl mx-auto font-outfit">
                Let's help set the building blocks for the life you want.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <button
                  className="font-outfit group px-8 py-4 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded-xl text-base font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  onClick={() => navigate("/signup")}
                >
                  Start Your Journey
                  <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-[var(--color-text-tertiary)] font-outfit">
                <CheckCircledIcon className="w-4 h-4 text-[var(--color-success)]" />
                <span>No credit card required • 2-minute setup</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-[var(--color-border-primary)]/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            {/* Logo & Description */}
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center">
                  <TargetIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold font-outfit gradient-text">
                  bito
                </span>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] max-w-xs text-center md:text-left font-outfit">
                Build better habits, bit by bit.
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap font-outfit justify-center md:justify-end gap-8">
              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Product
                </h4>
                <a
                  onClick={() => scrollToSection(featuresRef)}
                  className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  Features
                </a>
                {/* <a
                  href="#"
                  className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  Pricing
                </a>
                <a
                  href="#"
                  className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  Changelog
                </a> */}
              </div>
              {/* <div className="flex flex-col gap-3">
                <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Company
                </h4>
                <a
                  href="#"
                  className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  About
                </a>
                <a
                  href="#"
                  className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  Blog
                </a>
                <a
                  href="#"
                  className="text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  Careers
                </a>
              </div> */}
              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Support
                </h4>
                <button
                  onClick={() => setContactModalOpen(true)}
                  className="text-sm text-left text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  Contact
                </button>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-[var(--color-border-primary)]/20 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm font-outfit text-[var(--color-text-tertiary)]">
              © 2025 hayzaydee. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/hayzaydeee/bito"
                className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <GitHubLogoIcon className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Contact Modal - Initial State Hidden */}
      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />
    </div>
  );
};

export default LandingPage;
