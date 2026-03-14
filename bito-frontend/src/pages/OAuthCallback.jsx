import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authAPI } from '../services/api';
import useMotionSafe from '../hooks/useMotionSafe';
import { springs } from '../utils/motion';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { prefersReduced } = useMotionSafe();
  const shouldAnimate = typeof motion !== "undefined" && !prefersReduced;

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
          console.error('OAuth error:', error);
          navigate('/login?error=oauth_failed');
          return;
        }

        if (token) {
          // Save token to localStorage
          localStorage.setItem('token', token);

          // Fetch user data using the token
          let userData = null;
          try {
            const response = await authAPI.getMe();
            userData = response.data.user;
            localStorage.setItem('user', JSON.stringify(userData));
          } catch (fetchError) {
            console.error('Failed to fetch user after OAuth:', fetchError);
          }

          // Route based on profile/onboarding completeness
          if (userData && !userData.profileComplete) {
            window.location.href = '/profile-setup';
          } else if (userData && !userData.onboardingComplete) {
            window.location.href = '/onboarding';
          } else {
            window.location.href = '/app';
          }
        } else {
          console.error('Missing token');
          navigate('/login?error=oauth_invalid');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/login?error=oauth_error');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-bg-primary)] via-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)]">
      <motion.div
        className="text-center"
        initial={shouldAnimate ? { opacity: 0, y: 14 } : false}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : {}}
        transition={springs.soft}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand-500)] mx-auto mb-4"></div>
        <p className="text-[var(--color-text-secondary)]">Completing sign in...</p>
      </motion.div>
    </div>
  );
};

export default OAuthCallback;
