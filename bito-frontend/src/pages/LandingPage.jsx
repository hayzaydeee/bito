import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flex, Text, Button } from '@radix-ui/themes';
import { 
  PlayIcon, 
  ArrowRightIcon, 
  CheckCircledIcon,
  TargetIcon,
  CalendarIcon,
  BarChartIcon,
  LightningBoltIcon,
  StarIcon
} from '@radix-ui/react-icons';
import { useAuth } from '../contexts/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Redirect authenticated users to the app
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/app');
    }
  }, [isAuthenticated, isLoading, navigate]);

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
      icon: <TargetIcon className="w-6 h-6" />,
      title: "Smart Goal Tracking",
      description: "Set and track meaningful goals with intelligent progress insights and personalized recommendations."
    },
    {
      icon: <CalendarIcon className="w-6 h-6" />,
      title: "Visual Calendar",
      description: "Beautiful calendar view to visualize your consistency and spot patterns in your habit formation."
    },
    {
      icon: <BarChartIcon className="w-6 h-6" />,
      title: "Advanced Analytics",
      description: "Detailed analytics and reports to understand your progress and optimize your habits over time."
    },
    {
      icon: <LightningBoltIcon className="w-6 h-6" />,
      title: "Quick Actions",
      description: "Lightning-fast habit logging with shortcuts and automation to keep you in the flow."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Product Manager",
      content: "Bito has completely transformed how I approach personal development. The visual progress tracking keeps me motivated every day.",
      rating: 5
    },
    {
      name: "Michael Rodriguez",
      role: "Software Engineer",
      content: "The analytics dashboard is incredible. I can see exactly what's working and what isn't in my daily routines.",
      rating: 5
    },
    {
      name: "Emily Johnson",
      role: "Designer",
      content: "Beautiful design and incredibly intuitive. Building habits has never felt this engaging and rewarding.",
      rating: 5
    }
  ];
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-bg-primary)] via-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)] overflow-hidden">
      {/* Navigation Bar - Minimalist */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface-primary)]/80 backdrop-blur-sm border-b border-[var(--color-border-primary)]/10">
        <div className="max-w-5xl mx-auto px-4 py-2">
          <Flex justify="between" align="center">
            {/* Logo */}
            <Flex align="center" gap="1">
              <div className="w-6 h-6 rounded-md bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center">
                <TargetIcon className="w-3.5 h-3.5 text-white" />
              </div>
              <Text className="text-sm font-medium font-dmSerif gradient-text">
                Bito
              </Text>
            </Flex>

            {/* Navigation Links - More Compact */}
            <Flex align="center" gap="4" className="hidden md:flex">
              <Text className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer transition-colors font-outfit">
                Features
              </Text>
              <Text className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer transition-colors font-outfit">
                Pricing
              </Text>
              <Text className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer transition-colors font-outfit">
                About
              </Text>
            </Flex>

            {/* Auth Buttons - Simplified */}
            <Flex align="center" gap="2">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/login')}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors font-outfit text-xs px-2 py-1"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => navigate('/signup')}
                className="bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded text-xs px-3 py-1 transition-all font-outfit"
              >
                Sign Up
              </Button>
            </Flex>
          </Flex>
        </div>
      </nav>

      {/* Hero Section - Inspired by WelcomeCard */}
      <section className="relative min-h-[70vh] flex items-center justify-center px-6 pt-16">
        {/* Background Effects - Similar to Dashboard */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand-500)]/5 via-[var(--color-brand-400)]/3 to-transparent"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[var(--color-brand-400)]/10 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-[var(--color-brand-600)]/10 to-transparent rounded-full translate-y-16 -translate-x-16"></div>
        </div>

        <div className={`relative z-10 max-w-3xl mx-auto transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          {/* Hero Glass Card - Inspired by WelcomeCard */}
          <div className="glass-card p-6 rounded-2xl relative overflow-hidden mb-6 text-center">
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand-500)]/3 via-[var(--color-brand-400)]/2 to-transparent"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[var(--color-brand-400)]/8 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
            </div>

            <div className="relative z-10">
              {/* Badge - Dashboard Style */}
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--color-surface-elevated)]/70 border border-[var(--color-border-primary)]/20 mb-4">
                <StarIcon className="w-3 h-3 text-[var(--color-brand-400)]" />
                <Text className="text-xs font-medium text-[var(--color-text-secondary)] font-outfit">
                  Build lasting habits
                </Text>
              </div>

              {/* Main Headline - Using Dashboard Style */}
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-brand-400)] bg-clip-text text-transparent font-dmSerif mb-3 leading-tight">
                Build Better Habits With Bito
              </h1>

              {/* Subtitle */}
              <Text className="text-sm text-[var(--color-text-secondary)] mb-5 max-w-xl mx-auto leading-relaxed font-outfit">
                Track, analyze, and optimize your daily routines with beautiful insights.
              </Text>

              {/* CTA Buttons - Dashboard Style */}
              <Flex gap="2" justify="center" className="mb-6">
                <Button 
                  onClick={() => navigate('/signup')}
                  className="bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-600)] text-white rounded text-xs px-4 py-1.5 transition-all font-outfit flex items-center gap-1 group shadow-sm"
                >
                  <PlayIcon className="w-3 h-3 group-hover:scale-110 transition-transform" />
                  Get Started
                </Button>
                
                <Button 
                  variant="soft" 
                  className="bg-[var(--color-surface-elevated)]/50 hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/20 text-xs px-3 py-1.5 font-outfit rounded shadow-sm"
                >
                  Watch Demo
                </Button>
              </Flex>
            </div>
          </div>

          {/* Hero Stats - Card Style */}
          <div className="glass-card p-4 rounded-xl border border-[var(--color-border-primary)]/10">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold font-dmSerif bg-gradient-to-r from-[var(--color-brand-400)] to-[var(--color-brand-500)] bg-clip-text text-transparent mb-1">10K+</div>
                <Text className="text-xs text-[var(--color-text-tertiary)] font-outfit">Users</Text>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold font-dmSerif bg-gradient-to-r from-[var(--color-brand-400)] to-[var(--color-brand-500)] bg-clip-text text-transparent mb-1">500K+</div>
                <Text className="text-xs text-[var(--color-text-tertiary)] font-outfit">Habits</Text>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold font-dmSerif bg-gradient-to-r from-[var(--color-brand-400)] to-[var(--color-brand-500)] bg-clip-text text-transparent mb-1">98%</div>
                <Text className="text-xs text-[var(--color-text-tertiary)] font-outfit">Success</Text>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Dashboard Style */}
      <section className="py-8 px-6 relative">
        <div className="max-w-4xl mx-auto">
          {/* Section Header - Dashboard Style */}
          <div className="glass-card p-4 rounded-xl border border-[var(--color-border-primary)]/10 mb-6">
            <div className="text-center">
              <h2 className="text-xl font-bold font-dmSerif bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-brand-400)] bg-clip-text text-transparent mb-2">
                Everything You Need to Succeed
              </h2>
              <Text className="text-sm text-[var(--color-text-secondary)] max-w-xl mx-auto font-outfit">
                Powerful features designed for effective habit building
              </Text>
            </div>
          </div>
          
          {/* Features Grid - Dashboard Style Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="glass-card p-4 rounded-xl border border-[var(--color-border-primary)]/10 transition-all hover:border-[var(--color-brand-500)]/20 hover:shadow-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--color-brand-500)]/10 text-[var(--color-brand-500)] flex items-center justify-center mb-3">
                  {feature.icon}
                </div>
                <h3 className="text-sm font-bold font-dmSerif mb-1.5 text-[var(--color-text-primary)]">
                  {feature.title}
                </h3>
                <Text className="text-xs text-[var(--color-text-secondary)] leading-relaxed font-outfit">
                  {feature.description}
                </Text>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Dashboard Style */}
      <section className="py-8 px-6 relative">
        <div className="max-w-4xl mx-auto">
          {/* Section Header - Dashboard Style */}
          <div className="glass-card p-4 rounded-xl border border-[var(--color-border-primary)]/10 mb-6">
            <div className="text-center">
              <h2 className="text-xl font-bold font-dmSerif bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-brand-400)] bg-clip-text text-transparent mb-2">
                Loved by Our Community
              </h2>
              <Text className="text-sm text-[var(--color-text-secondary)] max-w-xl mx-auto font-outfit">
                Join people who transformed their habits with Bito
              </Text>
            </div>
          </div>

          {/* Testimonials Grid - Dashboard Style */}
          <div className="grid md:grid-cols-3 gap-4">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="glass-card p-4 rounded-xl border border-[var(--color-border-primary)]/10 transition-all hover:border-[var(--color-brand-500)]/20 hover:shadow-sm relative overflow-hidden"
              >
                {/* Subtle Background Pattern */}
                <div className="absolute inset-0">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[var(--color-brand-400)]/5 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
                </div>
                
                <div className="relative z-10">
                  <div className="flex gap-0.5 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <StarIcon key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <Text className="text-[var(--color-text-secondary)] mb-3 text-xs leading-relaxed">
                    "{testimonial.content}"
                  </Text>
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-[var(--color-brand-500)]/10 text-[var(--color-brand-500)] flex items-center justify-center mr-2">
                      <Text className="text-[10px] font-bold">{testimonial.name.charAt(0)}</Text>
                    </div>
                    <div>
                      <div className="font-medium text-sm text-[var(--color-text-primary)]">
                        {testimonial.name}
                      </div>
                      <Text className="text-xs text-[var(--color-text-tertiary)]">
                        {testimonial.role}
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Dashboard Style */}
      <section className="py-8 px-6 relative">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
            {/* Subtle Background Pattern - Like WelcomeCard */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand-500)]/5 via-[var(--color-brand-400)]/3 to-transparent"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[var(--color-brand-400)]/8 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[var(--color-brand-500)]/8 to-transparent rounded-full translate-y-16 -translate-x-16"></div>
            </div>
            
            <div className="relative z-10 text-center">
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-brand-400)] bg-clip-text text-transparent font-dmSerif mb-3">
                Ready to Transform Your Habits?
              </h2>
              
              <Text className="text-sm text-[var(--color-text-secondary)] mb-5 max-w-xl mx-auto">
                Start building better habits today with Bito
              </Text>

              <Flex gap="2" justify="center" className="mb-4">
                <Button 
                  className="bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-600)] text-white rounded text-xs px-6 py-2 transition-all font-outfit flex items-center gap-2 group shadow-sm"
                  onClick={() => navigate('/signup')}
                >
                  <PlayIcon className="w-3 h-3 group-hover:scale-110 transition-transform" />
                  Start Your Journey
                  <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Flex>

              <div className="flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 bg-[var(--color-success)] rounded-full"></div>
                <Text className="text-xs text-[var(--color-text-tertiary)]">
                  No credit card required • Free trial • Cancel anytime
                </Text>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Dashboard Style */}
      <footer className="py-6 px-6 border-t border-[var(--color-border-primary)]/10">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-4 rounded-xl border border-[var(--color-border-primary)]/10 mb-4">
            <Flex justify="between" align="center" wrap="wrap" gap="2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center">
                  <TargetIcon className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-medium font-dmSerif bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-brand-400)] bg-clip-text text-transparent">Bito</h3>
                  <Text className="text-xs text-[var(--color-text-secondary)]">
                    Build better habits, build a better life.
                  </Text>
                </div>
              </div>
              
              <Flex gap="4">
                <Text className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] cursor-pointer transition-colors">
                  Privacy
                </Text>
                <Text className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] cursor-pointer transition-colors">
                  Terms
                </Text>
                <Text className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] cursor-pointer transition-colors">
                  Support
                </Text>
              </Flex>
            </Flex>
          </div>
          
          <div className="text-center">
            <Text className="text-xs text-[var(--color-text-tertiary)]">
              © 2025 Bito. All rights reserved.
            </Text>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
