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
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface-primary)]/80 backdrop-blur-xl border-b border-[var(--color-border-primary)]/30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Flex justify="between" align="center">
            {/* Logo */}
            <Flex align="center" gap="3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center">
                <TargetIcon className="w-6 h-6 text-white" />
              </div>
              <Text className="text-2xl font-bold font-dmSerif gradient-text">
                Bito
              </Text>
            </Flex>

            {/* Navigation Links */}
            <Flex align="center" gap="8" className="hidden md:flex">
              <Text className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer transition-colors font-outfit">
                Features
              </Text>
              <Text className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer transition-colors font-outfit">
                Pricing
              </Text>
              <Text className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer transition-colors font-outfit">
                About
              </Text>
              <Text className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer transition-colors font-outfit">
                Support
              </Text>
            </Flex>

            {/* Auth Buttons */}
            <Flex align="center" gap="3">
              <Button 
                variant="ghost" 
                className="btn btn-ghost btn-md hover-lift"
                style={{ 
                  color: 'var(--color-text-secondary)',
                  padding: '0.5rem 1rem'
                }}
                onClick={() => navigate('/login')}
              >
                Log In
              </Button>
              <Button 
                className="btn btn-primary btn-md hover-lift"
                style={{ 
                  background: 'linear-gradient(135deg, var(--color-brand-600) 0%, var(--color-brand-700) 100%)',
                  padding: '0.5rem 1.5rem'
                }}
                onClick={() => navigate('/signup')}
              >
                Sign Up
              </Button>
            </Flex>
          </Flex>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-24">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-r from-indigo-500/10 to-pink-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-[var(--color-brand-500)]/5 to-[var(--color-brand-700)]/5 rounded-full blur-3xl" />
        </div>

        <div className={`relative z-10 text-center max-w-6xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8 animate-glow">
            <StarIcon className="w-4 h-4 text-[var(--color-brand-400)]" />
            <Text className="text-sm font-medium text-[var(--color-text-secondary)]">
              Transform Your Life, One Habit at a Time
            </Text>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold font-dmSerif mb-6 leading-tight">
            Build Better
            <span className="block gradient-text">Habits</span>
            <span className="block">With Bito</span>
          </h1>

          {/* Subtitle */}
          <Text className="text-xl md:text-2xl text-[var(--color-text-secondary)] mb-12 max-w-3xl mx-auto leading-relaxed font-outfit">
            The intelligent habit tracking platform that helps you build lasting positive changes. 
            Track, analyze, and optimize your daily routines with beautiful insights and powerful automation.
          </Text>

          {/* CTA Buttons */}
          <Flex gap="4" justify="center" className="mb-16">            <Button 
              size="4" 
              className="btn btn-primary btn-lg hover-lift group landing-cta-button"
              style={{ 
                background: 'linear-gradient(135deg, var(--color-brand-600) 0%, var(--color-brand-700) 100%)',
                padding: '1rem 2.5rem',
                fontSize: '1.125rem'
              }}
              onClick={() => navigate('/app')}
            >
              <PlayIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Get Started Free
              <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button 
              size="4" 
              variant="soft" 
              className="btn btn-secondary btn-lg hover-lift"
              style={{
                background: 'var(--color-surface-elevated)',
                border: '1px solid var(--color-border-primary)',
                padding: '1rem 2.5rem',
                fontSize: '1.125rem'
              }}
            >
              Watch Demo
            </Button>
          </Flex>

          {/* Hero Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold font-dmSerif gradient-text mb-2">10K+</div>
              <Text className="text-sm text-[var(--color-text-tertiary)]">Active Users</Text>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold font-dmSerif gradient-text mb-2">500K+</div>
              <Text className="text-sm text-[var(--color-text-tertiary)]">Habits Tracked</Text>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold font-dmSerif gradient-text mb-2">98%</div>
              <Text className="text-sm text-[var(--color-text-tertiary)]">Success Rate</Text>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold font-dmSerif mb-6">
              Everything You Need to
              <span className="block gradient-text">Succeed</span>
            </h2>
            <Text className="text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto">
              Powerful features designed to make habit building effortless, engaging, and effective.
            </Text>
          </div>          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="glass-card p-8 rounded-2xl hover-lift group landing-feature-card"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold font-dmSerif mb-4 text-[var(--color-text-primary)]">
                  {feature.title}
                </h3>
                <Text className="text-[var(--color-text-secondary)] leading-relaxed">
                  {feature.description}
                </Text>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-6 bg-gradient-to-r from-[var(--color-surface-primary)]/30 to-[var(--color-surface-secondary)]/30">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold font-dmSerif mb-6">
              Loved by
              <span className="gradient-text"> Thousands</span>
            </h2>
            <Text className="text-xl text-[var(--color-text-secondary)] max-w-3xl mx-auto">
              Join the community of people who have transformed their lives with Bito.
            </Text>
          </div>

          {/* Testimonials Grid */}
          <div className="grid md:grid-cols-3 gap-8">            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="glass-card p-8 rounded-2xl hover-lift testimonial-card"
              >
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <Text className="text-[var(--color-text-secondary)] mb-6 leading-relaxed text-lg">
                  "{testimonial.content}"
                </Text>
                <div>
                  <div className="font-semibold text-[var(--color-text-primary)] mb-1">
                    {testimonial.name}
                  </div>
                  <Text className="text-sm text-[var(--color-text-tertiary)]">
                    {testimonial.role}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        {/* Background Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-brand-600)]/10 to-[var(--color-brand-800)]/10" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold font-dmSerif mb-6">
            Ready to
            <span className="gradient-text"> Transform</span>
            <span className="block">Your Life?</span>
          </h2>
          
          <Text className="text-xl text-[var(--color-text-secondary)] mb-12 max-w-2xl mx-auto">
            Start building better habits today. Join thousands of users who have already transformed their lives with Bito.
          </Text>

          <Flex gap="4" justify="center" className="mb-8">            <Button 
              size="4" 
              className="btn btn-primary btn-lg hover-lift group landing-cta-button"
              style={{ 
                background: 'linear-gradient(135deg, var(--color-brand-600) 0%, var(--color-brand-700) 100%)',
                padding: '1.25rem 3rem',
                fontSize: '1.25rem'
              }}
              onClick={() => navigate('/app')}
            >
              <PlayIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Start Your Journey
              <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Flex>

          <Text className="text-sm text-[var(--color-text-tertiary)]">
            No credit card required • Free 14-day trial • Cancel anytime
          </Text>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[var(--color-border-primary)]/30">
        <div className="max-w-7xl mx-auto">
          <Flex justify="between" align="center" className="mb-8">
            <div>
              <h3 className="text-2xl font-bold font-dmSerif gradient-text mb-2">Bito</h3>
              <Text className="text-[var(--color-text-secondary)]">
                Build better habits, build a better life.
              </Text>
            </div>
            
            <Flex gap="6">
              <Text className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] cursor-pointer transition-colors">
                Privacy
              </Text>
              <Text className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] cursor-pointer transition-colors">
                Terms
              </Text>
              <Text className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] cursor-pointer transition-colors">
                Support
              </Text>
            </Flex>
          </Flex>
          
          <div className="pt-8 border-t border-[var(--color-border-primary)]/30">
            <Text className="text-center text-[var(--color-text-tertiary)]">
              © 2025 Bito. All rights reserved.
            </Text>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
