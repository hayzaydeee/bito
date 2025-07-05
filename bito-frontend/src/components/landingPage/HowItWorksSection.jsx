import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { 
  PlayIcon,
  PlusIcon,
  TargetIcon,
  BarChartIcon,
  PersonIcon,
  CheckCircledIcon,
  ArrowRightIcon,
  LightningBoltIcon,
  CalendarIcon,
  MobileIcon,
  DesktopIcon
} from '@radix-ui/react-icons';

const HowItWorksSection = forwardRef((props, ref) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true); // Start visible for debugging
  const internalRef = useRef(null);

  // Intersection Observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.2 }
    );

    // Use the combined ref (either external ref passed from parent or internal ref)
    const currentRef = ref || internalRef;
    
    if (currentRef && currentRef.current) {
      observer.observe(currentRef.current);
    }

    return () => observer.disconnect();
  }, [ref]);

  // Auto-advance steps every 4 seconds when visible
  useEffect(() => {
    if (!isVisible) return;
    
    console.log("HowItWorksSection is visible, setting up auto-advance");
    
    const interval = setInterval(() => {
      console.log("Auto-advancing to next step");
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const steps = [
    {
      id: 'create',
      title: 'Create Your Habits',
      description: 'Start by adding the habits you want to build. Set goals, frequencies, and reminders that fit your lifestyle.',
      features: [
        'Smart habit suggestions based on your goals',
        'Flexible scheduling (daily, weekly, custom)',
        'Goal setting with progress tracking',
        'Personalized reminders and notifications'
      ],
      icon: <PlusIcon className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
      screenshot: {
        type: 'dashboard',
        description: 'Dashboard showing the habit creation flow with smart suggestions',
        placeholder: 'habit-creation-flow'
      }
    },
    {
      id: 'track',
      title: 'Track Daily Progress',
      description: 'Log your habits with lightning-fast interactions. One-click completions, bulk logging, and smart automation.',
      features: [
        'One-click habit completion',
        'Bulk logging for multiple habits',
        'Smart streak tracking and rewards',
        'Offline support with sync when online'
      ],
      icon: <CheckCircledIcon className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
      screenshot: {
        type: 'mobile',
        description: 'Mobile interface showing quick habit logging with streak indicators',
        placeholder: 'daily-tracking-mobile'
      }
    },
    {
      id: 'analyze',
      title: 'Discover Insights',
      description: 'Understand your patterns with beautiful analytics. AI-powered insights help you optimize your habits for better results.',
      features: [
        'Visual progress charts and heatmaps',
        'AI-powered pattern recognition',
        'Correlation analysis between habits',
        'Personalized improvement suggestions'
      ],
      icon: <BarChartIcon className="w-6 h-6" />,
      color: 'from-purple-500 to-violet-500',
      screenshot: {
        type: 'analytics',
        description: 'Analytics dashboard showing habit trends, correlations, and AI insights',
        placeholder: 'analytics-insights-dashboard'
      }
    },
    {
      id: 'collaborate',
      title: 'Build Together',
      description: 'Share your journey with friends, family, or teammates. Collaborative habits create accountability and motivation.',
      features: [
        'Shared workspaces for teams and groups',
        'Friendly accountability and encouragement',
        'Group challenges and competitions',
        'Privacy controls for personal habits'
      ],
      icon: <PersonIcon className="w-6 h-6" />,
      color: 'from-orange-500 to-red-500',
      screenshot: {
        type: 'workspace',
        description: 'Collaborative workspace showing team habit tracking and group activities',
        placeholder: 'collaborative-workspace'
      }
    }
  ];

  const userJourneys = [
    {
      persona: 'New User',
      journey: 'Onboarding → First Habit → Week 1 → Insights',
      timeToValue: '< 2 minutes'
    },
    {
      persona: 'Daily User', 
      journey: 'Morning Check-in → Log Progress → Review Streaks',
      timeToValue: '< 30 seconds'
    },
    {
      persona: 'Team Leader',
      journey: 'Create Workspace → Invite Team → Set Goals → Track Together',
      timeToValue: '< 5 minutes'
    }
  ];

  // Setup combined ref
  const setRefs = (element) => {
    // Assign to internal ref
    internalRef.current = element;
    
    // Assign to external ref if it exists
    if (typeof ref === 'function') {
      ref(element);
    } else if (ref) {
      ref.current = element;
    }
    
    console.log("HowItWorksSection ref set", { element });
  };

  return (
    <section 
      ref={setRefs}
      id="howItWorks"
      className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-surface-elevated)]/80 backdrop-blur-sm border border-[var(--color-border-primary)]/30 mb-6">
            <PlayIcon className="w-4 h-4 text-[var(--color-brand-400)]" />
            <span className="text-sm font-medium text-[var(--color-text-primary)]">How it works</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-brand-400)] bg-clip-text text-transparent font-dmSerif mb-6">
            From zero to habit hero
            <br />
            in four simple steps
          </h2>
          
          <p className="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            Discover how Bito transforms your daily routines into lasting habits with intelligent tracking, 
            beautiful insights, and collaborative accountability.
          </p>
        </div>

        {/* User Journey Preview */}
        <div className={`mb-16 font-outfit transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {userJourneys.map((journey, index) => (
              <div key={index} className="text-center p-4 glass-card rounded-xl border border-[var(--color-border-primary)]/20">
                <div className="text-sm font-semibold text-[var(--color-brand-400)] mb-2">
                  {journey.persona}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] mb-2">
                  {journey.journey}
                </div>
                <div className="text-xs text-[var(--color-success)] font-medium">
                  {journey.timeToValue}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Steps Navigation */}
        <div className={`flex justify-center mb-12 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-center gap-2 p-2 glass-card rounded-xl border border-[var(--color-border-primary)]/20">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(index)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 text-sm font-medium ${
                  activeStep === index
                    ? 'bg-[var(--color-brand-500)] text-white shadow-lg'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                }`}
              >
                <span className={`w-5 h-5 flex items-center justify-center ${activeStep === index ? 'text-white' : ''}`}>
                  {step.icon}
                </span>
                <span className="hidden sm:inline font-outfit">{step.title}</span>
                {/* {activeStep === index && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"></div>
                )} */}
              </button>
            ))}
          </div>
        </div>

        {/* Active Step Content */}
        <div className={`font-outfit transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`transition-all duration-500 ${
                activeStep === index ? 'opacity-100 scale-100 relative z-10' : 'opacity-0 scale-95 hidden'
              }`}
            >
              {console.log(`Step ${index} - Active: ${activeStep === index}`)}
              {activeStep === index && (
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  {/* Content Side */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-lg`}>
                        {step.icon}
                      </div>
                      <div>
                        <div className="text-sm text-[var(--color-text-tertiary)] font-medium">
                          Step {index + 1}
                        </div>
                        <h3 className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif">
                          {step.title}
                        </h3>
                      </div>
                    </div>

                    <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed">
                      {step.description}
                    </p>

                    <div className="space-y-3">
                      {step.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-start gap-3">
                          <CheckCircledIcon className="w-5 h-5 text-[var(--color-success)] mt-0.5 flex-shrink-0" />
                          <span className="text-[var(--color-text-secondary)]">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA for active step */}
                    <div className="pt-4">
                      <button className="group flex items-center gap-2 px-6 py-3 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-lg">
                        Try this step
                        <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>

                  {/* Screenshot/Visual Side */}
                  <div className="relative">
                    {/* Screenshot Placeholder */}
                    <div className="relative aspect-[4/3] glass-card rounded-2xl border border-[var(--color-border-primary)]/20 overflow-hidden group">
                      {/* Background Pattern */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-surface-elevated)] to-[var(--color-surface-primary)]"></div>
                      
                      {/* Screenshot Placeholder Content */}
                      <div className="absolute inset-0 flex items-center justify-center p-8">
                        <div className="text-center space-y-4">
                          {/* Device Type Indicator */}
                          <div className="flex justify-center">
                            {step.screenshot.type === 'mobile' ? (
                              <MobileIcon className="w-12 h-12 text-[var(--color-brand-400)]" />
                            ) : (
                              <DesktopIcon className="w-12 h-12 text-[var(--color-brand-400)]" />
                            )}
                          </div>
                          
                          {/* Placeholder Title */}
                          <h4 className="text-lg font-semibold text-[var(--color-text-primary)] font-dmSerif">
                            {step.title} Interface
                          </h4>
                          
                          {/* Description */}
                          <p className="text-sm text-[var(--color-text-secondary)] max-w-xs mx-auto">
                            {step.screenshot.description}
                          </p>
                          
                          {/* Placeholder Visual Elements */}
                          <div className="space-y-3 mt-6">
                            {step.id === 'create' && (
                              <div className="space-y-2">
                                <div className="h-3 bg-[var(--color-brand-500)]/20 rounded w-3/4 mx-auto"></div>
                                <div className="h-3 bg-[var(--color-brand-500)]/20 rounded w-1/2 mx-auto"></div>
                                <div className="flex justify-center gap-2 mt-3">
                                  <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-500)]/30 flex items-center justify-center">
                                    <PlusIcon className="w-4 h-4 text-[var(--color-brand-500)]" />
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {step.id === 'track' && (
                              <div className="grid grid-cols-3 gap-2">
                                {[...Array(6)].map((_, i) => (
                                  <div key={i} className={`h-8 rounded ${i < 4 ? 'bg-[var(--color-success)]/30' : 'bg-[var(--color-surface-elevated)]'} flex items-center justify-center`}>
                                    {i < 4 && <CheckCircledIcon className="w-4 h-4 text-[var(--color-success)]" />}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {step.id === 'analyze' && (
                              <div className="space-y-2">
                                <div className="h-16 bg-gradient-to-r from-[var(--color-brand-500)]/20 to-[var(--color-brand-400)]/10 rounded flex items-end justify-around p-2">
                                  {[...Array(7)].map((_, i) => (
                                    <div key={i} className="bg-[var(--color-brand-500)] rounded-sm" style={{height: `${20 + (i * 5)}px`, width: '8px'}}></div>
                                  ))}
                                </div>
                                <div className="text-xs text-[var(--color-text-tertiary)]">Weekly Progress</div>
                              </div>
                            )}
                            
                            {step.id === 'collaborate' && (
                              <div className="space-y-3">
                                <div className="flex justify-center gap-1">
                                  {[...Array(4)].map((_, i) => (
                                    <div key={i} className="w-6 h-6 rounded-full bg-[var(--color-brand-500)]/30 flex items-center justify-center text-xs text-[var(--color-brand-500)] font-semibold">
                                      {String.fromCharCode(65 + i)}
                                    </div>
                                  ))}
                                </div>
                                <div className="text-xs text-[var(--color-text-tertiary)]">Team Workspace</div>
                              </div>
                            )}
                          </div>
                          
                          {/* Placeholder Badge */}
                          <div className="absolute top-4 right-4">
                            <div className="px-2 py-1 bg-[var(--color-brand-500)]/10 text-[var(--color-brand-400)] text-xs font-medium rounded-full border border-[var(--color-brand-500)]/20">
                              {step.screenshot.placeholder}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Hover Effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand-500)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>

                    {/* Floating Elements */}
                    <div className="absolute -top-6 -right-6 w-12 h-12 bg-gradient-to-br from-[var(--color-brand-400)] to-[var(--color-brand-500)] rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      {index + 1}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mt-12">
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveStep(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  activeStep === index 
                    ? 'bg-[var(--color-brand-500)] w-8' 
                    : 'bg-[var(--color-border-primary)] hover:bg-[var(--color-brand-400)]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

export default HowItWorksSection;