import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
          try {
            const response = await authAPI.getMe();
            localStorage.setItem('user', JSON.stringify(response.data.user));
          } catch (fetchError) {
            console.error('Failed to fetch user after OAuth:', fetchError);
          }

          // Redirect to app
          window.location.href = '/app';
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
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand-500)] mx-auto mb-4"></div>
        <p className="text-[var(--color-text-secondary)]">Completing sign in...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
