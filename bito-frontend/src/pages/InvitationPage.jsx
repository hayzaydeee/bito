import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircledIcon,
  CrossCircledIcon,
  HomeIcon,
  BackpackIcon,
  HeartIcon,
  CalendarIcon,
  ActivityLogIcon,
  ReloadIcon,
  EnvelopeClosedIcon,
} from '@radix-ui/react-icons';
import { Users } from '@phosphor-icons/react';
import { groupsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// Detect whether token is a 6-char invite code vs a long email-invitation hex token
const isInviteCode = (tok) => /^[A-Z0-9]{6}$/.test(tok?.toUpperCase());

const REDIRECT_KEY = 'bito_invite_return_url';

const InvitationPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState(null); // group or invitation
  const [mode, setMode] = useState(null); // 'code' | 'email'
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    load();
  }, [token]);

  const redirectToLogin = () => {
    sessionStorage.setItem(REDIRECT_KEY, window.location.pathname);
    navigate('/login');
  };

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isInviteCode(token)) {
        // Permanent invite code path
        setMode('code');
        const res = await groupsAPI.getGroupByInviteCode(token.toUpperCase());
        if (res.success) {
          setData(res.group);
        } else {
          setError(res.error || 'Invalid invite code.');
        }
      } else {
        // Email invitation token path
        setMode('email');
        const res = await groupsAPI.getInvitationByToken(token);
        if (res.success) {
          setData(res.invitation);
        } else {
          setError(res.error || 'Invitation not found or has expired.');
        }
      }
    } catch (err) {
      console.error('Error loading invite:', err);
      setError('Failed to load invitation details.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinByCode = async () => {
    if (!user) { redirectToLogin(); return; }
    setProcessing(true);
    setError(null);
    try {
      const res = await groupsAPI.joinByCode(token.toUpperCase());
      if (res.success) {
        setJoined(true);
        setTimeout(() => navigate(`/app/groups/${res.group.id}`, {
          state: { notification: { message: res.message, type: 'success' } },
        }), 1200);
      } else {
        // Already a member — still navigate to the group
        if (res.group?.id) {
          navigate(`/app/groups/${res.group.id}`);
        } else {
          setError(res.error);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to join group.');
    } finally {
      setProcessing(false);
    }
  };

  const handleAcceptEmail = async () => {
    if (!user) { redirectToLogin(); return; }
    setProcessing(true);
    setError(null);
    try {
      const res = await groupsAPI.acceptInvitation(token);
      if (res.success) {
        navigate(`/app/groups/${res.group.id}`, {
          state: { notification: { message: `Welcome to ${res.group.name}!`, type: 'success' } },
        });
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError(err.message || 'Failed to accept invitation.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeclineEmail = async () => {
    setProcessing(true);
    try {
      await groupsAPI.declineInvitation(token);
      navigate('/');
    } catch {
      navigate('/');
    }
  };

  const getGroupIcon = (type) => {
    const icons = { family: HomeIcon, team: BackpackIcon, fitness: HeartIcon, study: CalendarIcon, community: ActivityLogIcon };
    return icons[type] || BackpackIcon;
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" />
        <div className="relative bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)] shadow-xl p-8 w-full max-w-md mx-auto z-10">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-brand-600)] flex items-center justify-center mx-auto mb-4">
              <ReloadIcon className="w-7 h-7 animate-spin text-white" />
            </div>
            <p className="text-lg font-garamond font-bold text-[var(--color-text-primary)] mb-1">Loading invite…</p>
            <p className="text-sm text-[var(--color-text-tertiary)] font-spartan">Verifying your invite link</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error && !data) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" />
        <div className="relative bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)] shadow-xl p-8 w-full max-w-md mx-auto z-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-500 flex items-center justify-center mx-auto mb-4">
            <CrossCircledIcon className="w-7 h-7 text-white" />
          </div>
          <p className="text-lg font-garamond font-bold text-[var(--color-text-primary)] mb-2">
            {error?.includes('expired') ? 'Invite Expired' : 'Invalid Invite'}
          </p>
          <p className="text-sm text-[var(--color-text-secondary)] font-spartan mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full h-11 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-xl text-sm font-spartan font-medium transition-colors"
          >
            Go to Bito
          </button>
        </div>
      </div>
    );
  }

  /* ── Success (joined) ── */
  if (joined) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" />
        <div className="relative bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)] shadow-xl p-8 w-full max-w-md mx-auto z-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center mx-auto mb-4">
            <CheckCircledIcon className="w-7 h-7 text-white" />
          </div>
          <p className="text-lg font-garamond font-bold text-[var(--color-text-primary)] mb-1">You're in!</p>
          <p className="text-sm text-[var(--color-text-tertiary)] font-spartan">Taking you to the group…</p>
        </div>
      </div>
    );
  }

  /* ── Invite Code landing page ── */
  if (mode === 'code' && data) {
    const GroupIcon = getGroupIcon(data.type);
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="relative bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)] shadow-xl w-full max-w-md mx-auto z-10 overflow-hidden">
          {/* Color band */}
          <div
            className="h-1.5 w-full"
            style={{ backgroundColor: data.color || 'var(--color-brand-600)' }}
          />
          <div className="p-7 space-y-5">
            {/* Group icon + name */}
            <div className="flex items-center gap-4">
              <span
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${data.color || '#4f46e5'}20` }}
              >
                <GroupIcon className="w-6 h-6" style={{ color: data.color || '#4f46e5' }} />
              </span>
              <div>
                <p className="text-xs font-spartan text-[var(--color-text-tertiary)] uppercase tracking-wide mb-0.5">
                  You've been invited to
                </p>
                <h1 className="text-xl font-garamond font-bold text-[var(--color-text-primary)] leading-tight">
                  {data.name}
                </h1>
                <p className="text-xs text-[var(--color-text-tertiary)] font-spartan capitalize mt-0.5">
                  {data.type} · {data.memberCount} member{data.memberCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {data.description && (
              <p className="text-sm text-[var(--color-text-secondary)] font-spartan leading-relaxed">
                {data.description}
              </p>
            )}

            <div className="flex items-center gap-2 text-xs font-spartan text-[var(--color-text-tertiary)] bg-[var(--color-surface-elevated)] rounded-xl px-3 py-2.5">
              <Users size={14} />
              <span>Shared by {data.ownedBy}</span>
              <span className="ml-auto font-mono tracking-widest text-[var(--color-text-secondary)]">{data.inviteCode}</span>
            </div>

            {/* Auth prompt or Join button */}
            {!user ? (
              <div className="space-y-3">
                <p className="text-xs text-center text-[var(--color-text-tertiary)] font-spartan">
                  Sign in to join this group
                </p>
                <button
                  onClick={redirectToLogin}
                  className="w-full h-12 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-xl text-sm font-spartan font-medium transition-colors"
                >
                  Sign in to Join
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleJoinByCode}
                  disabled={processing}
                  className="w-full h-12 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-xl text-sm font-spartan font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? <ReloadIcon className="w-4 h-4 animate-spin" /> : <CheckCircledIcon className="w-4 h-4" />}
                  {processing ? 'Joining…' : 'Join Group'}
                </button>
                {error && <p className="text-xs text-red-500 font-spartan text-center">{error}</p>}
                <button
                  onClick={() => navigate('/app/groups')}
                  className="w-full h-10 text-xs font-spartan text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  Maybe later
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Email invitation landing page ── */
  if (mode === 'email' && data) {
    const GroupIcon = getGroupIcon(data.group?.type);
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)] shadow-xl w-full max-w-md mx-auto z-10 overflow-hidden">
          {/* Header */}
          <div className="text-center p-6 pb-0">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-brand-600)] flex items-center justify-center mx-auto mb-4">
              <EnvelopeClosedIcon className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-xl font-garamond font-bold text-[var(--color-text-primary)] mb-1">
              You're Invited
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] font-spartan">
              {data.invitedBy?.name} invited you to join <strong>{data.group?.name}</strong>
            </p>
          </div>

          {/* Group card */}
          <div className="mx-6 mt-5">
            <div className="bg-[var(--color-surface-elevated)] rounded-xl p-4 border border-[var(--color-border-primary)]/30 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[var(--color-brand-600)]/15">
                <GroupIcon className="w-5 h-5 text-[var(--color-brand-600)]" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-spartan font-semibold text-[var(--color-text-primary)] truncate">{data.group?.name}</p>
                <p className="text-xs text-[var(--color-text-tertiary)] font-spartan capitalize">{data.group?.type} · {data.role}</p>
              </div>
            </div>
          </div>

          {data.message && (
            <div className="mx-6 mt-3">
              <div className="bg-[var(--color-surface-elevated)] rounded-xl p-3 border-l-2 border-[var(--color-brand-500)]">
                <p className="text-xs text-[var(--color-text-tertiary)] font-spartan mb-1">Message</p>
                <p className="text-sm text-[var(--color-text-secondary)] font-spartan italic">"{data.message}"</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-6 space-y-2">
            {!user && (
              <p className="text-xs text-center text-[var(--color-text-tertiary)] font-spartan mb-3">
                Sign in first to accept this invitation
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleDeclineEmail}
                disabled={processing}
                className="flex-1 h-11 border border-[var(--color-border-primary)]/30 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-xl text-sm font-spartan font-medium transition-colors"
              >
                Decline
              </button>
              <button
                onClick={handleAcceptEmail}
                disabled={processing}
                className="flex-1 h-11 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white rounded-xl text-sm font-spartan font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? <ReloadIcon className="w-4 h-4 animate-spin" /> : <CheckCircledIcon className="w-4 h-4" />}
                {user ? (processing ? 'Joining…' : 'Accept & Join') : 'Sign in to Join'}
              </button>
            </div>
            {error && <p className="text-xs text-red-500 font-spartan text-center pt-1">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default InvitationPage;

