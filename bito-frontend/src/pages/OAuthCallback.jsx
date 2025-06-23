import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token');
        const user = searchParams.get('user');
        const error = searchParams.get('error');

        if (error) {
          console.error('OAuth error:', error);
          navigate('/login?error=oauth_failed');
          return;
        }

        if (token && user) {
          // Parse user data
          const userData = JSON.parse(decodeURIComponent(user));
          
          // Save to localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(userData));

          // Update auth context
          // We dispatch directly to avoid making another API call
          // since we already have valid token and user data
          window.location.href = '/app';
        } else {
          console.error('Missing token or user data');
          navigate('/login?error=oauth_invalid');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/login?error=oauth_error');
      }
    };

    handleCallback();
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-bg-primary)] via-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand-500)] mx-auto mb-4"></div>
        <p className="text-[var(--color-text-secondary)]">Completing sign in...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
