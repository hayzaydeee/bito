import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignOut, WarningCircle, X } from '@phosphor-icons/react';
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
      
      // Redirect to dashboard after successfully leaving
      navigate('/app');
    } catch (err) {
      console.error('Error leaving group:', err);
      setError(err.message || 'Failed to Leave Group. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show leave button if user is the only owner
  if (isOwner && group?.members?.filter(m => m.role === 'owner').length <= 1) {
    return (
      <div className="mt-8 grp-card bg-[var(--ember-bg)] border border-[var(--ember-border)] p-4 flex gap-3">
        <WarningCircle size={20} weight="fill" className="text-[var(--ember)] flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="grp-display font-bold text-[14px] text-[var(--ember)] mb-1">Cannot Leave Group</h4>
          <p className="text-[13px] text-[var(--ember)] opacity-90">
            As the only owner of this group, you cannot leave. You must either transfer ownership to another member
            or delete the group.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 grp-card bg-[var(--rose-bg)] border border-[var(--rose-border)] p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="grp-display text-[15px] font-bold text-[var(--rose)] mb-0.5">
              Leave Group
            </p>
            <p className="text-[13px] text-[var(--rose)] opacity-80">
              You will lose access to all group data
            </p>
          </div>
          <button
            onClick={openConfirmDialog}
            className="grp-btn flex items-center gap-2 flex-shrink-0 !bg-[var(--rose)] !text-[var(--bg)] !border-transparent hover:opacity-90"
            disabled={isLoading}
          >
            <SignOut size={16} weight="bold" />
            {isLoading ? 'Processing...' : 'Leave Group'}
          </button>
        </div>
      </div>

      <AnimatedModal isOpen={isConfirmDialogOpen} onClose={closeConfirmDialog} maxWidth="max-w-md">
        <div className="p-6 relative">
          <button 
            className="absolute top-4 right-4 text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors p-1"
            onClick={closeConfirmDialog}
          >
            <X size={20} weight="bold" />
          </button>
          
          <div className="text-center mb-6 mt-2">
            <div className="w-14 h-14 rounded-2xl bg-[var(--rose-bg)] flex items-center justify-center mx-auto mb-5 border border-[var(--rose-border)]">
              <SignOut size={28} weight="fill" className="text-[var(--rose)]" />
            </div>
            <h2 className="grp-display text-2xl font-bold text-[var(--ink)] mb-2">
              Leave Group
            </h2>
            <p className="text-[14px] text-[var(--ink-2)]">
              You are about to leave <strong className="text-[var(--ink)] font-bold">{group?.name}</strong>
            </p>
          </div>
          
          <div className="space-y-5">
            <div>
              <p className="text-[13px] text-[var(--ink)] font-bold mb-3 uppercase tracking-wider grp-mono">
                You'll lose access to:
              </p>
              <ul className="space-y-2">
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
            </div>
            
            <div className="p-3.5 bg-[var(--ember-bg)] border border-[var(--ember-border)] rounded-[10px] flex items-start gap-2.5">
              <WarningCircle size={18} weight="fill" className="text-[var(--ember)] flex-shrink-0 mt-0.5" />
              <p className="text-[13px] text-[var(--ember)] leading-relaxed">
                This action cannot be undone. You will need a new invitation to rejoin.
              </p>
            </div>
            
            {error && (
              <div className="p-3.5 bg-[var(--rose-bg)] border border-[var(--rose-border)] rounded-[10px]">
                <p className="text-[13px] text-[var(--rose)] font-medium">
                  {error}
                </p>
              </div>
            )}
            
            <div className="flex gap-3 pt-2">
              <button
                onClick={closeConfirmDialog}
                className="grp-btn flex-1 !bg-transparent !border-[var(--line-2)] hover:!bg-[var(--surface-2)]"
                disabled={isLoading}
              >
                Cancel
              </button>
              
              <button
                onClick={handleleaveGroup}
                disabled={isLoading}
                className="grp-btn flex-1 !bg-[var(--rose)] !text-[var(--bg)] !border-transparent hover:opacity-90 disabled:opacity-50"
              >
                {isLoading ? 'Leaving...' : 'Confirm & Leave'}
              </button>
            </div>
          </div>
        </div>
      </AnimatedModal>
    </>
  );
};

export default LeaveGroupButton;
