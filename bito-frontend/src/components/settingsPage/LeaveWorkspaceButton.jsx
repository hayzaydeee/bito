import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  ExitIcon, 
  Cross2Icon, 
  ExclamationTriangleIcon 
} from '@radix-ui/react-icons';
import { workspacesAPI } from '../../services/api';
import '../ui/ModalAnimation.css';

const LeaveWorkspaceButton = ({ workspace, isOwner }) => {
  const modalRef = useRef(null);
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
      </div>

      {/* Confirmation Dialog */}
      {isConfirmDialogOpen && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 animate-fade-in" 
            onClick={closeConfirmDialog}
          />
          
          {/* Modal */}
          <div 
            ref={modalRef}
            className="relative bg-[var(--color-surface-primary)] rounded-2xl border border-[var(--color-border-primary)] shadow-xl p-6 w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto z-10 transform transition-all duration-200 animate-zoom-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button 
              className="absolute top-4 right-4 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
              onClick={closeConfirmDialog}
            >
              <Cross2Icon className="w-5 h-5" />
            </button>
            
            {/* Header */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center mx-auto mb-4">
                <ExitIcon className="w-8 h-8 text-white" />
              </div>
              <div className="text-2xl font-dmSerif gradient-text mb-2">
                Leave Workspace
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] font-outfit mb-5">
                You are about to leave <strong>{workspace?.name}</strong>
              </p>
            </div>
            
            {/* Content */}
            <div className="space-y-4">
              <p className="text-sm text-[var(--color-text-secondary)]">
                You'll lose access to:
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
              
              {/* Action buttons */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">
                    {error}
                  </p>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={closeConfirmDialog}
                  className="flex-1 px-4 py-2 rounded-lg border border-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-all duration-200 font-outfit text-sm"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleLeaveWorkspace}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all duration-200 font-outfit text-sm disabled:opacity-50"
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
        </div>,
        document.body
      )}
    </>
  );
};

export default LeaveWorkspaceButton;
