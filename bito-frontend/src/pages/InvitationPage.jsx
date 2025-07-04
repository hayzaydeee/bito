import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CheckCircledIcon,
  CrossCircledIcon,
  PersonIcon,
  HomeIcon,
  BackpackIcon,
  HeartIcon,
  CalendarIcon,
  ActivityLogIcon,
  ReloadIcon
} from '@radix-ui/react-icons';
import { groupsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const InvitationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, login } = useAuth();
  
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/workspaces/invitations/${token}`);
      const data = await response.json();
      
      if (data.success) {
        setInvitation(data.invitation);
        // Pre-fill email if user not logged in
        if (!user) {
          setLoginData(prev => ({ ...prev, email: data.invitation.email }));
        }
      } else {
        setError(data.error);
      }
    } catch (error) {
      console.error('Error fetching invitation:', error);
      setError('Failed to load invitation details');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!user) {
      setShowLoginForm(true);
      return;
    }

    try {
      setProcessing(true);
      const response = await groupsAPI.acceptInvitation(token);
      
      if (response.success) {
        // Redirect to the workspace
        navigate(`/app/groups/${response.workspace.id}`, {
          state: { message: `Welcome to ${response.workspace.name}!` }
        });
      } else {
        setError(response.error);
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setError('Failed to accept invitation');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeclineInvitation = async () => {
    try {
      setProcessing(true);
      const response = await groupsAPI.declineInvitation(token);
      
      if (response.success) {
        navigate('/', {
          state: { message: 'Invitation declined' }
        });
      } else {
        setError(response.error);
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
      setError('Failed to decline invitation');
    } finally {
      setProcessing(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setProcessing(true);
      const response = await login(loginData.email, loginData.password);
      if (response.success) {
        // After successful login, automatically accept the invitation
        await handleAcceptInvitation();
      } else {
        setError(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed');
    } finally {
      setProcessing(false);
    }
  };

  const getWorkspaceIcon = (type) => {
    const icons = {
      family: HomeIcon,
      team: BackpackIcon,
      fitness: HeartIcon,
      study: CalendarIcon,
      community: ActivityLogIcon
    };
    return icons[type] || BackpackIcon;
  };

  const getWorkspaceColor = (type) => {
    const colors = {
      family: 'from-blue-500 to-blue-600',
      team: 'from-purple-500 to-purple-600',
      fitness: 'from-red-500 to-red-600',
      study: 'from-green-500 to-green-600',
      community: 'from-orange-500 to-orange-600'
    };
    return colors[type] || 'from-gray-500 to-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="text-center">
          <ReloadIcon className="w-8 h-8 animate-spin text-[var(--color-brand-600)] mx-auto mb-4" />
          <p className="text-[var(--color-text-secondary)] font-outfit">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-6">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CrossCircledIcon className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif mb-4">
            {error === 'This invitation has expired' ? 'Invitation Expired' : 'Invalid Invitation'}
          </h1>
          <p className="text-[var(--color-text-secondary)] font-outfit mb-8">
            {error || 'This invitation link is no longer valid.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-xl font-outfit font-semibold transition-all duration-200"
          >
            Go to Bito
          </button>
        </div>
      </div>
    );
  }

  const WorkspaceIcon = getWorkspaceIcon(invitation.workspace.type);
  const colorClass = getWorkspaceColor(invitation.workspace.type);

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-[var(--color-surface-primary)] rounded-3xl shadow-2xl border border-[var(--color-border-primary)]/20 overflow-hidden">
          {/* Header */}
          <div className={`bg-gradient-to-r ${colorClass} px-8 py-12 text-center text-white`}>
            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <WorkspaceIcon className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold font-dmSerif mb-3">
              You're invited to join
            </h1>
            <h2 className="text-2xl font-semibold font-outfit mb-2">
              {invitation.workspace.name}
            </h2>
            <p className="text-white/80 font-outfit">
              {invitation.workspace.description}
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[var(--color-brand-100)] rounded-full flex items-center justify-center">
                  <PersonIcon className="w-6 h-6 text-[var(--color-brand-600)]" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-[var(--color-text-primary)] font-outfit">
                    Invited by {invitation.invitedBy.name}
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                    as {invitation.role}
                  </p>
                </div>
              </div>

              {invitation.message && (
                <div className="bg-[var(--color-surface-secondary)] rounded-2xl p-6 mb-6">
                  <p className="text-[var(--color-text-primary)] font-outfit italic">
                    "{invitation.message}"
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif">
                    {invitation.workspace.type}
                  </div>
                  <div className="text-sm text-[var(--color-text-secondary)] font-outfit">
                    Workspace Type
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--color-text-primary)] font-dmSerif">
                    {invitation.role}
                  </div>
                  <div className="text-sm text-[var(--color-text-secondary)] font-outfit">
                    Your Role
                  </div>
                </div>
              </div>
            </div>

            {/* Login Form (if not authenticated) */}
            {!user && showLoginForm && (
              <div className="mb-8 p-6 bg-[var(--color-surface-secondary)] rounded-2xl">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] font-outfit mb-4">
                  Login to accept invitation
                </h3>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <input
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Email"
                      className="w-full px-4 py-3 bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)]/40 rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Password"
                      className="w-full px-4 py-3 bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)]/40 rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)] focus:border-transparent"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={processing}
                    className="w-full py-3 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] disabled:opacity-50 text-white rounded-xl font-outfit font-semibold transition-all duration-200"
                  >
                    {processing ? 'Logging in...' : 'Login & Join Workspace'}
                  </button>
                </form>
                <p className="text-center text-sm text-[var(--color-text-secondary)] font-outfit mt-4">
                  Don't have an account? <a href="/signup" className="text-[var(--color-brand-600)] hover:underline">Sign up here</a>
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleDeclineInvitation}
                disabled={processing}
                className="flex-1 py-3 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/40 text-[var(--color-text-primary)] rounded-xl font-outfit font-medium transition-all duration-200"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptInvitation}
                disabled={processing}
                className="flex-1 py-3 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] disabled:opacity-50 text-white rounded-xl font-outfit font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <ReloadIcon className="w-4 h-4 animate-spin" />
                    {user ? 'Joining...' : 'Login Required'}
                  </>
                ) : (
                  <>
                    <CheckCircledIcon className="w-4 h-4" />
                    {user ? 'Accept & Join' : 'Login to Join'}
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-600 font-outfit text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitationPage;
