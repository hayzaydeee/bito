import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignOut, X } from '@phosphor-icons/react';
import { groupsAPI } from '../../services/api';
import AnimatedModal from '../ui/AnimatedModal';

const LeaveGroupButton = ({ group, isOwner }) => {
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const openConfirmDialog = () => {
    setIsConfirmDialogOpen(true);
    setError(null);
  };

  const closeConfirmDialog = () => {
    setIsConfirmDialogOpen(false);
  };

  const handleleaveGroup = async () => {
    if (!group || !group._id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      await groupsAPI.leaveGroup(group._id);
      
      navigate('/app');
    } catch (err) {
      console.error('Error leaving group:', err);
      setError(err.message || 'Failed to leave group. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isOwner && group?.members?.filter(m => m.role === 'owner').length <= 1) {
    return (
      <div className="flex items-center justify-between gap-4 px-5 py-4 opacity-70">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--ink)] flex items-center gap-2">
            Leave Group
          </p>
          <p className="text-sm text-[var(--ink-2)] mt-0.5">
            As the only owner, you must transfer ownership or delete the group instead.
          </p>
        </div>
        <div className="flex-shrink-0">
          <button className="grp-btn grp-btn--sm" disabled>
            Leave
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--ink)]">Leave Group</p>
          <p className="text-sm text-[var(--ink-2)] mt-0.5">You will lose access to all group data</p>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={openConfirmDialog}
            className="grp-btn grp-btn--sm bg-[var(--rose)] border-[var(--rose)] text-[#1a0509] hover:brightness-110"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Leave'}
          </button>
        </div>
      </div>

      <AnimatedModal isOpen={isConfirmDialogOpen} onClose={closeConfirmDialog} maxWidth="max-w-sm">
        <div className="grp bg-[var(--surface)] rounded-[16px] border border-[var(--line-2)] p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-[9px] bg-[var(--rose)]/15 flex items-center justify-center">
                <SignOut size={16} className="text-[var(--rose)]" />
              </span>
              <h2 className="grp-display text-xl font-bold text-[var(--ink)]">
                Leave Group
              </h2>
            </div>
            <button
              onClick={closeConfirmDialog}
              className="w-8 h-8 flex items-center justify-center rounded-[9px] text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <X size={14} weight="bold" />
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-[14px] text-[var(--ink)]">
              You are about to leave <strong className="font-bold text-[var(--ink)]">{group?.name}</strong>. You'll lose access to:
            </p>
            
            <ul className="space-y-2 mb-6">
              {[
                "All group habits and trackers",
                "Your progress history in this group",
                "Team analytics and insights"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-[14px] text-[var(--ink-2)]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--rose)] opacity-50" />
                  {item}
                </li>
              ))}
            </ul>
            
            <div className="p-3 bg-[var(--rose)]/10 border border-[var(--rose)]/20 rounded-[10px] flex items-start gap-2.5">
              <p className="text-[13px] text-[var(--rose)] leading-relaxed font-medium">
                This action cannot be undone. You will need a new invitation to rejoin.
              </p>
            </div>
            
            {error && (
              <p className="mt-1.5 grp-mono text-[11px] text-[var(--rose)]">{error}</p>
            )}
            
            <button
              onClick={handleleaveGroup}
              disabled={isLoading}
              className="grp-btn w-full bg-[var(--rose)] border-[var(--rose)] text-[#1a0509] hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none mt-2"
            >
              {isLoading ? "Leaving…" : "Confirm & Leave"}
            </button>
          </div>
        </div>
      </AnimatedModal>
    </>
  );
};

export default LeaveGroupButton;
