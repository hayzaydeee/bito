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
    error: (action, error) => showError(`Failed to ${action} habit: ${error}`),
  };

  // Group-related notifications
  const group = {
    created: (groupName) => showSuccess(`🏢 "${groupName}" group created!`),
    updated: (groupName) => showSuccess(`📝 "${groupName}" group updated!`),
    deleted: (groupName) => showSuccess(`🗑️ "${groupName}" group deleted`),
    joined: (groupName) => showSuccess(`🎉 Welcome to "${groupName}"!`),
    left: (groupName) => showInfo(`👋 Left "${groupName}" group`),
    inviteSent: (email) => showSuccess(`📧 Invitation sent to ${email}`),
    inviteAccepted: (memberName) => showSuccess(`🎉 ${memberName} joined your group!`),
    error: (action, error) => showError(`Failed to ${action} group: ${error}`),
  };

  // Member-related notifications
  const member = {
    roleUpdated: (memberName, newRole) => showSuccess(`👤 ${memberName} is now a ${newRole}`),
    removed: (memberName) => showInfo(`👋 ${memberName} removed from group`),
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
    group,
    member,
    auth,
    app,
  };
};

export default useAppNotifications;
