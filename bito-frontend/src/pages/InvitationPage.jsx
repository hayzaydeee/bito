import { useState, useEffect } from 'react';
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
  ReloadIcon,
  EnvelopeClosedIcon,
  EyeOpenIcon,
  LockClosedIcon
} from '@radix-ui/react-icons';
import { groupsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import '../components/ui/ModalAnimation.css';

const InvitationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    try {
      setLoading(true);
      const data = await groupsAPI.getInvitationByToken(token);
      
      if (data.success) {
        setInvitation(data.invitation);
        if (!user) {
          // Redirect to login, preserving the invitation URL
          navigate(`/login`);
          return;
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
      // Redirect to login page
      navigate(`/login`);
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
      family: 'var(--color-blue-500), var(--color-blue-600)',
      team: 'var(--color-purple-500), var(--color-purple-600)',
      fitness: 'var(--color-red-500), var(--color-red-600)',
      study: 'var(--color-green-500), var(--color-green-600)',
      community: 'var(--color-orange-500), var(--color-orange-600)'
    };
    return colors[type] || 'var(--color-gray-500), var(--color-gray-600)';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" />
        
        {/* Loading Modal */}
        <div className="relative bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)] shadow-xl p-8 w-full max-w-md mx-auto z-10 animate-zoom-in">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center mx-auto mb-4">
              <ReloadIcon className="w-8 h-8 animate-spin text-white" />
            </div>
            <div className="text-xl font-dmSerif gradient-text mb-2">
              Loading Invitation
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
              Please wait while we verify your invitation...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" />
        
        {/* Error Modal */}
        <div className="relative bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)] shadow-xl p-8 w-full max-w-md mx-auto z-10 animate-zoom-in">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center mx-auto mb-4">
              <CrossCircledIcon className="w-8 h-8 text-white" />
            </div>
            <div className="text-xl font-dmSerif gradient-text mb-2">
              {error === 'This invitation has expired' ? 'Invitation Expired' : 'Invalid Invitation'}
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] font-outfit mb-6">
              {error || 'This invitation link is no longer valid.'}
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded-xl font-outfit font-semibold transition-all duration-200"
            >
              Go to Bito
            </button>
          </div>
        </div>
      </div>
    );
  }

  const WorkspaceIcon = getWorkspaceIcon(invitation.workspace.type);

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Main Invitation Modal */}
      <div className="relative bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)] shadow-xl w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto z-10 animate-zoom-in">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center p-6 pb-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center mx-auto mb-4">
              <EnvelopeClosedIcon className="w-8 h-8 text-white" />
            </div>
            <div className="text-2xl font-dmSerif gradient-text mb-2">
              You're Invited!
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
              Join {invitation.workspace.name} and start tracking habits together
            </p>
          </div>

          {/* Workspace Info Card */}
          <div className="mx-6">
            <div className="bg-[var(--color-surface-elevated)] rounded-xl p-4 border border-[var(--color-border-primary)]/50">
              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                  style={{ background: `linear-gradient(135deg, ${getWorkspaceColor(invitation.workspace.type)})` }}
                >
                  <WorkspaceIcon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--color-text-primary)] font-outfit">
                    {invitation.workspace.name}
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] font-outfit capitalize">
                    {invitation.workspace.type} • {invitation.role}
                  </p>
                </div>
              </div>
              
              {invitation.workspace.description && (
                <p className="text-sm text-[var(--color-text-secondary)] font-outfit mb-3">
                  {invitation.workspace.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[var(--color-text-tertiary)]">
                  <PersonIcon className="w-3 h-3" />
                  <span>Invited by {invitation.invitedBy.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {invitation.workspace.type === 'family' && <LockClosedIcon className="w-3 h-3 text-blue-500" />}
                  {invitation.workspace.type === 'team' && <EyeOpenIcon className="w-3 h-3 text-purple-500" />}
                  <span className="text-[var(--color-text-tertiary)] capitalize">{invitation.workspace.type}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Message */}
          {invitation.message && (
            <div className="mx-6">
              <div className="bg-[var(--color-surface-secondary)] rounded-xl p-4 border-l-4 border-[var(--color-brand-500)]">
                <p className="text-xs font-medium text-[var(--color-text-tertiary)] font-outfit mb-1">
                  Personal message from {invitation.invitedBy.name}:
                </p>
                <p className="text-sm text-[var(--color-text-primary)] font-outfit italic">
                  "{invitation.message}"
                </p>
              </div>
            </div>
          )}

          {/* Sign in prompt (if not authenticated) */}
          {!user && (
            <div className="mx-6">
              <div className="bg-[var(--color-surface-secondary)] rounded-xl p-4 space-y-4">
                <div className="text-center">
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] font-outfit mb-1">
                    Sign in to Accept
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] font-outfit mb-3">
                    Sign in to your Bito account to join the workspace
                  </p>
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full py-2 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] text-white rounded-lg font-outfit font-medium text-sm transition-all duration-200"
                  >
                    Sign in with email
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="p-6 pt-0">
            <div className="flex gap-3">
              <button
                onClick={handleDeclineInvitation}
                disabled={processing}
                className="flex-1 py-3 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-lg font-outfit font-medium text-sm transition-all duration-200"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptInvitation}
                disabled={processing}
                className="flex-1 py-3 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] disabled:opacity-50 text-white rounded-lg font-outfit font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
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
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 font-outfit text-xs">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitationPage;
