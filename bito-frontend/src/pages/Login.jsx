import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Flex, Text, Button } from '@radix-ui/themes';
import { 
  EnvelopeClosedIcon, 
  LockClosedIcon, 
  EyeOpenIcon,
  EyeNoneIcon,
  ArrowLeftIcon,
  TargetIcon,
  GitHubLogoIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@radix-ui/react-icons';
import { useAuth } from '../contexts/AuthContext';
import { oauthAPI } from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isLoading, isAuthenticated, user, error: authError, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Check for OAuth error in URL params
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      const errorMessages = {
        oauth_failed: 'Social login failed. Please try again.',
        oauth_invalid: 'Invalid OAuth response. Please try again.',
        oauth_error: 'An error occurred during social login.'
      };
      setErrors({ general: errorMessages[error] || 'An error occurred. Please try again.' });
    }
  }, [searchParams]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Clear any previous errors
    clearError();
    
    try {
      const result = await login({
        email: formData.email,
        password: formData.password
      });
      
      if (result.success) {
        navigate('/app');
      } else {
        // Error will be set in AuthContext state
        console.error('Login failed:', result.error);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };
  const handleSocialLogin = async (provider) => {
    try {
      if (provider === 'Google') {
        window.location.href = oauthAPI.getGoogleLoginUrl();
      } else if (provider === 'GitHub') {
        window.location.href = oauthAPI.getGithubLoginUrl();
      }
    } catch (error) {
      console.error(`Social login error for ${provider}:`, error);
      setErrors({ general: `Failed to initiate ${provider} login. Please try again.` });
    }
  };
  // Auto-focus email field on mount
  useEffect(() => {
    const emailInput = document.getElementById('email-input');
    if (emailInput) emailInput.focus();
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app');
    }
  }, [isAuthenticated, navigate]);
  
  
  // Debug: log auth state and render tracking
  const renderRef = useRef(0);
  renderRef.current += 1;
  console.log(`🔄 Login.jsx render #${renderRef.current}:`, { isLoading, isAuthenticated, user, hasAuthError: !!authError });
  
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
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/15 to-pink-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
        
        {/* Floating particles */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-[var(--color-brand-400)]/30 rounded-full animate-float" />
        <div className="absolute top-40 right-32 w-3 h-3 bg-purple-400/20 rounded-full animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-32 left-32 w-2 h-2 bg-blue-400/25 rounded-full animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute bottom-20 right-20 w-1 h-1 bg-cyan-400/30 rounded-full animate-float" style={{ animationDelay: '5s' }} />
      </div>      {/* Enhanced Navigation */}
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
          
          <Flex align="center" gap="3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center shadow-lg">
              <TargetIcon className="w-5 h-5 text-white" />
            </div>
            <Text className="text-xl font-bold font-dmSerif gradient-text">Bito</Text>
          </Flex>
        </Flex>
      </nav>      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-6">
        <div className="w-full max-w-md">
          {/* Enhanced Header */}
          <div className="text-center mb-8">
            <Text className="text-4xl font-bold font-dmSerif gradient-text mb-3">
              Welcome Back
            </Text>
            <Text className="text-lg text-[var(--color-text-secondary)]">
              Continue your habit-building journey
            </Text>
          </div>          {/* Error Message */}
          {(authError || errors.general) && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 animate-shake">
              <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
              <Text className="text-sm">{authError || errors.general}</Text>
            </div>
          )}{/* Enhanced Login Card with Minimal Design */}
          <div className="glass-card-minimal p-10 rounded-2xl space-y-8 max-w-sm mx-auto">
            {/* Minimal Header */}
            <div className="text-center space-y-2">
              <Text className="text-2xl font-bold text-[var(--color-text-primary)]">
                welcome back
              </Text>
              <Text className="text-sm text-[var(--color-text-secondary)]">
                log in to access your habit tracking dashboard
              </Text>
            </div>

            {/* Enhanced Social Login */}
            <div className="space-y-3">              <Button
                onClick={() => handleSocialLogin('GitHub')}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)] rounded-lg transition-all duration-200 hover:scale-[1.01] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                variant="soft"
              >
                <GitHubLogoIcon className="w-4 h-4" />
                <Text className="text-sm font-medium">Continue with GitHub</Text>
              </Button>
              <Button
                onClick={() => handleSocialLogin('Google')}
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
                <span className="px-4 bg-[var(--color-surface-primary)] text-xs text-[var(--color-text-tertiary] uppercase tracking-wide">
                  or
                </span>
              </div>            </div>

            {/* Minimal Email/Password Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                  email address
                </label>                  <input
                    id="email-input"
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
                <div className="relative">                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`w-full px-4 py-3 pr-10 bg-[var(--color-surface-secondary)]/50 border-0 border-b-2 rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-0 focus:border-[var(--color-brand-500)] transition-all duration-200 ${
                        errors.password ? 'border-red-500' : 'border-[var(--color-border-primary)]/30'
                      }`}
                      placeholder="••••••••"
                      disabled={isLoading}
                      autoComplete="current-password"
                    />                    <button
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

              {/* Forgot Password Link */}
              <div className="text-right">                <button
                  type="button"
                  className="text-xs text-[var(--color-brand-400)] hover:text-[var(--color-brand-300)] transition-colors duration-200"
                  disabled={isLoading}
                >
                  forgot password?
                </button>
              </div>

              {/* Sign In Button */}              <Button
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
                    <Text className="text-sm">signing in...</Text>
                  </div>
                ) : (
                  <Text className="text-sm font-medium">log in</Text>
                )}
              </Button>
            </form>
          </div>

          {/* Bottom Link */}
          <div className="text-center mt-6">            <Text className="text-sm text-[var(--color-text-secondary)]">
              don't have an account?{' '}
              <button
                onClick={() => navigate('/signup')}
                className="text-[var(--color-brand-400)] hover:text-[var(--color-brand-300)] font-medium transition-colors duration-200"
                disabled={isLoading}
              >
                sign up now
              </button>
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
