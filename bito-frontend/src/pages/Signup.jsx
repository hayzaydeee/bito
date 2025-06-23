import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flex, Text, Button } from '@radix-ui/themes';
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
  ExclamationTriangleIcon
} from '@radix-ui/react-icons';

const Signup = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!acceptTerms) {
      newErrors.terms = 'You must accept the terms and conditions';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Signup attempt:', {
        ...formData,
        password: '[REDACTED]',
        confirmPassword: '[REDACTED]'
      });
      navigate('/app');
    } catch (error) {
      setErrors({ general: 'Failed to create account. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignup = async (provider) => {
    setIsLoading(true);
    try {
      // Simulate social signup
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`${provider} signup`);
      navigate('/app');
    } catch (error) {
      setErrors({ general: `Failed to sign up with ${provider}. Please try again.` });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-focus first name field on mount
  useEffect(() => {
    const firstNameInput = document.getElementById('firstName-input');
    if (firstNameInput) firstNameInput.focus();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-bg-primary)] via-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)] relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-[var(--color-brand-500)]/20 to-[var(--color-brand-600)]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/15 to-pink-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
        
        {/* Floating particles */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-[var(--color-brand-400)]/30 rounded-full animate-float" />
        <div className="absolute top-40 right-32 w-3 h-3 bg-purple-400/20 rounded-full animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-32 left-32 w-2 h-2 bg-blue-400/25 rounded-full animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute bottom-20 right-20 w-1 h-1 bg-cyan-400/30 rounded-full animate-float" style={{ animationDelay: '5s' }} />
      </div>

      {/* Enhanced Navigation */}
      <nav className="relative z-10 p-6">
        <Flex justify="between" align="center">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all duration-200 hover:scale-105"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Home
          </Button>
          
          <Flex align="center" gap="3" className="animate-fade-in">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center shadow-lg">
              <TargetIcon className="w-5 h-5 text-white" />
            </div>
            <Text className="text-xl font-bold font-dmSerif gradient-text">Bito</Text>
          </Flex>
        </Flex>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-6">
        <div className="w-full max-w-md animate-slide-up">
          {/* Enhanced Header */}
          <div className="text-center mb-8">
            <Text className="text-4xl font-bold font-dmSerif gradient-text mb-3 animate-fade-in">
              Join Bito
            </Text>
            <Text className="text-lg text-[var(--color-text-secondary)] animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Start building better habits today
            </Text>
          </div>

          {/* Error Message */}
          {errors.general && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 animate-shake">
              <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
              <Text className="text-sm">{errors.general}</Text>
            </div>
          )}

          {/* Enhanced Signup Card with Minimal Design */}
          <div className="glass-card-minimal p-10 rounded-2xl space-y-8 animate-fade-in max-w-sm mx-auto" style={{ animationDelay: '0.4s' }}>
            {/* Minimal Header */}
            <div className="text-center space-y-2">
              <Text className="text-2xl font-bold text-[var(--color-text-primary)]">
                create account
              </Text>
              <Text className="text-sm text-[var(--color-text-secondary)]">
                join thousands building better habits
              </Text>
            </div>

            {/* Enhanced Social Signup */}
            <div className="space-y-3">
              <Button
                onClick={() => handleSocialSignup('GitHub')}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)] rounded-lg transition-all duration-200 hover:scale-[1.01] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                variant="soft"
              >
                <GitHubLogoIcon className="w-4 h-4" />
                <Text className="text-sm font-medium">Continue with GitHub</Text>
              </Button>
              <Button
                onClick={() => handleSocialSignup('Google')}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)] rounded-lg transition-all duration-200 hover:scale-[1.01] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                variant="soft"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <Text className="text-sm font-medium">Continue with Google</Text>
              </Button>
            </div>

            {/* Minimal Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--color-border-primary)]/30"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-[var(--color-surface-primary)] text-xs text-[var(--color-text-tertiary)] uppercase tracking-wide">
                  or
                </span>
              </div>
            </div>

            {/* Minimal Signup Form */}
            <form onSubmit={handleSignup} className="space-y-5">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-3">
                {/* First Name Field */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                    first name
                  </label>
                  <input
                    id="firstName-input"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`w-full px-3 py-3 bg-[var(--color-surface-secondary)]/50 border-0 border-b-2 rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-0 focus:border-[var(--color-brand-500)] transition-all duration-200 ${
                      errors.firstName ? 'border-red-500' : 'border-[var(--color-border-primary)]/30'
                    }`}
                    placeholder="john"
                    disabled={isLoading}
                    autoComplete="given-name"
                  />
                  {errors.firstName && (
                    <Text className="text-red-400 text-xs mt-1 animate-fade-in">
                      {errors.firstName}
                    </Text>
                  )}
                </div>

                {/* Last Name Field */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                    last name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`w-full px-3 py-3 bg-[var(--color-surface-secondary)]/50 border-0 border-b-2 rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-0 focus:border-[var(--color-brand-500)] transition-all duration-200 ${
                      errors.lastName ? 'border-red-500' : 'border-[var(--color-border-primary)]/30'
                    }`}
                    placeholder="doe"
                    disabled={isLoading}
                    autoComplete="family-name"
                  />
                  {errors.lastName && (
                    <Text className="text-red-400 text-xs mt-1 animate-fade-in">
                      {errors.lastName}
                    </Text>
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                  email address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-4 py-3 bg-[var(--color-surface-secondary)]/50 border-0 border-b-2 rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-0 focus:border-[var(--color-brand-500)] transition-all duration-200 ${
                    errors.email ? 'border-red-500' : 'border-[var(--color-border-primary)]/30'
                  }`}
                  placeholder="your@email.com"
                  disabled={isLoading}
                  autoComplete="email"
                />
                {errors.email && (
                  <Text className="text-red-400 text-xs mt-1 animate-fade-in">
                    {errors.email}
                  </Text>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                  password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full px-4 py-3 pr-10 bg-[var(--color-surface-secondary)]/50 border-0 border-b-2 rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-0 focus:border-[var(--color-brand-500)] transition-all duration-200 ${
                      errors.password ? 'border-red-500' : 'border-[var(--color-border-primary)]/30'
                    }`}
                    placeholder="••••••••"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors duration-200"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeNoneIcon className="w-4 h-4" /> : <EyeOpenIcon className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <Text className="text-red-400 text-xs mt-1 animate-fade-in">
                    {errors.password}
                  </Text>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                  confirm password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className={`w-full px-4 py-3 pr-10 bg-[var(--color-surface-secondary)]/50 border-0 border-b-2 rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-0 focus:border-[var(--color-brand-500)] transition-all duration-200 ${
                      errors.confirmPassword ? 'border-red-500' : 'border-[var(--color-border-primary)]/30'
                    }`}
                    placeholder="••••••••"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors duration-200"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeNoneIcon className="w-4 h-4" /> : <EyeOpenIcon className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <Text className="text-red-400 text-xs mt-1 animate-fade-in">
                    {errors.confirmPassword}
                  </Text>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className="relative flex-shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => {
                        setAcceptTerms(e.target.checked);
                        if (errors.terms) {
                          setErrors(prev => ({
                            ...prev,
                            terms: ''
                          }));
                        }
                      }}
                      className="sr-only"
                      disabled={isLoading}
                    />
                    <div className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                      acceptTerms 
                        ? 'bg-[var(--color-brand-600)] border-[var(--color-brand-600)]' 
                        : 'border-[var(--color-border-primary)]'
                    }`}>
                      {acceptTerms && <CheckIcon className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <Text className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    I agree to the{' '}
                    <button
                      type="button"
                      className="text-[var(--color-brand-400)] hover:text-[var(--color-brand-300)] transition-colors duration-200"
                      disabled={isLoading}
                    >
                      Terms of Service
                    </button>
                    {' '}and{' '}
                    <button
                      type="button"
                      className="text-[var(--color-brand-400)] hover:text-[var(--color-brand-300)] transition-colors duration-200"
                      disabled={isLoading}
                    >
                      Privacy Policy
                    </button>
                  </Text>
                </label>
                {errors.terms && (
                  <Text className="text-red-400 text-xs animate-fade-in">
                    {errors.terms}
                  </Text>
                )}
              </div>

              {/* Sign Up Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 mt-8 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] ${
                  isLoading 
                    ? 'bg-[var(--color-surface-elevated)] text-[var(--color-text-tertiary)] cursor-not-allowed' 
                    : 'bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white shadow-md hover:shadow-lg'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-[var(--color-text-tertiary)] border-t-transparent rounded-full animate-spin" />
                    <Text className="text-sm">creating account...</Text>
                  </div>
                ) : (
                  <Text className="text-sm font-medium">create account</Text>
                )}
              </Button>
            </form>
          </div>

          {/* Bottom Link */}
          <div className="text-center mt-6 animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <Text className="text-sm text-[var(--color-text-secondary)]">
              already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-[var(--color-brand-400)] hover:text-[var(--color-brand-300)] font-medium transition-colors duration-200"
                disabled={isLoading}
              >
                sign in
              </button>
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;