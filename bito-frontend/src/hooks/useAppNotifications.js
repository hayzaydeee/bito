import { useNotifications } from '../contexts/NotificationContext';

/**
 * Custom hook for common notification patterns
 * Provides convenience methods for typical app notifications
 */
export const useAppNotifications = () => {
  const { showSuccess, showError, showWarning, showInfo } = useNotifications();

  // Habit-related notifications
  const habit = {
    created: (habitName) => showSuccess(`✅ "${habitName}" habit created successfully!`),
    updated: (habitName) => showSuccess(`📝 "${habitName}" habit updated!`),
    deleted: (habitName) => showSuccess(`🗑️ "${habitName}" habit deleted`),
    completed: (habitName) => showSuccess(`🎉 "${habitName}" completed!`),
    uncompleted: (habitName) => showInfo(`↩️ "${habitName}" marked as incomplete`),
    archived: (habitName) => showInfo(`📦 "${habitName}" archived`),
    restored: (habitName) => showSuccess(`🔄 "${habitName}" restored`),
    adopted: (habitName) => showSuccess(`🎯 Successfully adopted "${habitName}"!`),
    csvImported: (count) => showSuccess(`📊 Successfully imported ${count} habits from CSV`),
    error: (action, error) => showError(`Failed to ${action} habit: ${error}`),
  };

  // Workspace-related notifications
  const workspace = {
    created: (workspaceName) => showSuccess(`🏢 "${workspaceName}" workspace created!`),
    updated: (workspaceName) => showSuccess(`📝 "${workspaceName}" workspace updated!`),
    deleted: (workspaceName) => showSuccess(`🗑️ "${workspaceName}" workspace deleted`),
    joined: (workspaceName) => showSuccess(`🎉 Welcome to "${workspaceName}"!`),
    left: (workspaceName) => showInfo(`👋 Left "${workspaceName}" workspace`),
    inviteSent: (email) => showSuccess(`📧 Invitation sent to ${email}`),
    inviteAccepted: (memberName) => showSuccess(`🎉 ${memberName} joined your workspace!`),
    error: (action, error) => showError(`Failed to ${action} workspace: ${error}`),
  };

  // Member-related notifications
  const member = {
    roleUpdated: (memberName, newRole) => showSuccess(`👤 ${memberName} is now a ${newRole}`),
    removed: (memberName) => showInfo(`👋 ${memberName} removed from workspace`),
    encouraged: (memberName) => showSuccess(`💪 Encouragement sent to ${memberName}!`),
    error: (action, error) => showError(`Failed to ${action}: ${error}`),
  };

  // Authentication notifications
  const auth = {
    loginSuccess: () => showSuccess(`🎉 Welcome back!`),
    loginError: (error) => showError(`Login failed: ${error}`),
    signupSuccess: () => showSuccess(`🎉 Account created successfully!`),
    signupError: (error) => showError(`Signup failed: ${error}`),
    logoutSuccess: () => showInfo(`👋 Logged out successfully`),
    passwordChanged: () => showSuccess(`🔒 Password changed successfully`),
    profileUpdated: () => showSuccess(`👤 Profile updated successfully`),
  };

  // General app notifications
  const app = {
    saved: () => showSuccess(`💾 Changes saved`),
    copied: () => showSuccess(`📋 Copied to clipboard`),
    networkError: () => showError(`🌐 Network error. Please check your connection.`),
    permissionDenied: () => showError(`🔒 Permission denied`),
    featureDisabled: (feature) => showWarning(`⚠️ ${feature} is currently disabled`),
    maintenanceMode: () => showWarning(`🔧 App is in maintenance mode. Some features may be limited.`),
  };

  return {
    // Direct access to notification methods
    showSuccess,
    showError,
    showWarning,
    showInfo,
    
    // Categorized convenience methods
    habit,
    workspace,
    member,
    auth,
    app,
  };
};

export default useAppNotifications;
