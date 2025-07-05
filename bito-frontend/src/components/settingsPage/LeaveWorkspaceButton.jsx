import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ExitIcon, 
  Cross2Icon, 
  ExclamationTriangleIcon 
} from '@radix-ui/react-icons';
import { workspacesAPI } from '../../services/api';

const LeaveWorkspaceButton = ({ workspace, isOwner }) => {
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

  const handleLeaveWorkspace = async () => {
    if (!workspace || !workspace._id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      await workspacesAPI.leaveWorkspace(workspace._id);
      
      // Redirect to dashboard after successfully leaving
      navigate('/app');
    } catch (err) {
      console.error('Error leaving workspace:', err);
      setError(err.message || 'Failed to leave workspace. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show leave button if user is the only owner
  if (isOwner && workspace?.members?.filter(m => m.role === 'owner').length <= 1) {
    return (
      <div className="mt-8 p-4 border border-amber-300 bg-amber-50 rounded-lg">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800 mb-1">Cannot Leave Workspace</h4>
            <p className="text-sm text-amber-700">
              As the only owner of this workspace, you cannot leave. You must either transfer ownership to another member
              or delete the workspace.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/30">
        <div>
          <p className="font-medium text-red-800 dark:text-red-200 font-outfit">
            Leave Workspace
          </p>
          <p className="text-sm text-red-600 dark:text-red-300 font-outfit">
            You will lose access to all workspace data
          </p>
        </div>
        <button
          onClick={openConfirmDialog}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-outfit"
          disabled={isLoading}
        >
          <ExitIcon className="w-4 h-4" />
          {isLoading ? 'Processing...' : 'Leave Workspace'}
        </button>
        
        {error && (
          <p className="mt-2 text-sm text-red-500">
            {error}
          </p>
        )}
      </div>

      {/* Confirmation Dialog */}
      {isConfirmDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md p-6 bg-[var(--color-surface-primary)] rounded-xl shadow-xl border border-[var(--color-border-primary)]">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <ExitIcon className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-[var(--color-text-primary)]">
                  Leave Workspace
                </h3>
              </div>
              
              <button 
                onClick={closeConfirmDialog}
                className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <Cross2Icon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-[var(--color-text-secondary)]">
                Are you sure you want to leave <strong>{workspace?.name}</strong>? You'll lose access to:
              </p>
              
              <ul className="list-disc pl-5 text-sm text-[var(--color-text-secondary)] space-y-1">
                <li>All workspace habits and trackers</li>
                <li>Your progress history in this workspace</li>
                <li>Team analytics and insights</li>
              </ul>
              
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    This action cannot be undone. You will need a new invitation to rejoin.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 pt-3">
                <button
                  onClick={closeConfirmDialog}
                  className="flex-1 px-4 py-2 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] rounded-lg border border-[var(--color-border-primary)] transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleLeaveWorkspace}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                      Leaving...
                    </span>
                  ) : (
                    'Confirm & Leave'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LeaveWorkspaceButton;
