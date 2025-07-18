import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Text, Switch, Select } from "@radix-ui/themes";
import { 
  GearIcon, 
  PersonIcon, 
  BellIcon, 
  ColorWheelIcon,
  ArchiveIcon,
  LockClosedIcon,
  QuestionMarkCircledIcon,
  DownloadIcon,
  UploadIcon,
  TrashIcon,
  FileTextIcon,
  ChatBubbleIcon,
  ExclamationTriangleIcon,
  MixerHorizontalIcon,
  EyeNoneIcon,
  MoonIcon,
  GlobeIcon,
  BackpackIcon,
  InfoCircledIcon,
  Cross2Icon,
  CheckIcon,
  CheckCircledIcon
} from "@radix-ui/react-icons";
import BaseGridContainer from '../components/shared/BaseGridContainer';
import { WIDGET_TYPES, DEFAULT_WIDGETS, DEFAULT_LAYOUTS, STORAGE_KEYS } from '../components/shared/widgetRegistry';
import { userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeSwitcher from '../components/ui/ThemeSwitcher';

const SettingsPage = ({ section }) => {
  const { user } = useAuth();
  const { theme, changeTheme, themeOptions } = useTheme();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [habitId, setHabitId] = useState(null);
  const [habitData, setHabitData] = useState(null);
  const [habitPrivacySettings, setHabitPrivacySettings] = useState({
    shareProgress: "progress-only",
    allowInteraction: true,
    shareInActivity: true
  });
  
  // Notification state for SettingsPage
  const [notification, setNotification] = useState(null);
  
  // Show notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000); // Auto-hide after 4 seconds
  };
  
  // Extract habitId from URL if in habit-privacy section
  useEffect(() => {
    if (section === 'habit-privacy') {
      const path = window.location.pathname;
      const id = path.split('/').pop();
      setHabitId(id);
      
      // Fetch habit data
      const fetchHabitData = async () => {
        try {
          const token = localStorage.getItem('token');
          const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          
          const response = await fetch(`${API_BASE_URL}/api/habits/${id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          const data = await response.json();
          
          if (response.ok && data.success && data.data.habit) {
            setHabitData(data.data.habit);
            
            // Set initial privacy settings from the habit data
            if (data.data.habit.workspaceSettings) {
              setHabitPrivacySettings({
                shareProgress: data.data.habit.workspaceSettings.shareProgress || 'progress-only',
                allowInteraction: data.data.habit.workspaceSettings.allowInteraction !== undefined 
                  ? data.data.habit.workspaceSettings.allowInteraction 
                  : true,
                shareInActivity: data.data.habit.workspaceSettings.shareInActivity !== undefined 
                  ? data.data.habit.workspaceSettings.shareInActivity 
                  : true,
              });
            }
          } else {
            console.error('Failed to fetch habit data:', data);
          }
        } catch (error) {
          console.error('Error fetching habit data:', error);
        }
      };
      
      fetchHabitData();
    }
  }, [section]);
  
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: true,
    emailNotifications: true, // Default to true as per backend
    weeklyReports: true,
    autoBackup: true,
    language: "en",
    timezone: "UTC",
    theme: "auto", // Default to auto as per backend
    workspaceNotifications: true,
    shareProgress: "progress-only",
    defaultWorkspacePrivacy: "invite-only"
  });

  const [selectedCategory, setSelectedCategory] = useState('all');

  // Load user profile data on mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setIsLoading(true);
        const response = await userAPI.getProfile();
        const userData = response.data.user;
        setUserProfile(userData);
        
        // Update settings with real backend data
        setSettings(prev => ({
          ...prev,
          emailNotifications: userData.preferences?.emailNotifications ?? true,
          timezone: userData.preferences?.timezone ?? "UTC",
          theme: userData.preferences?.theme ?? "auto"
        }));
      } catch (error) {
        console.error('Failed to load user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const handleSettingChange = async (key, value) => {
    // Update local state immediately for better UX
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));

    // Handle theme changes specially through ThemeContext
    if (key === 'theme') {
      try {
        await changeTheme(value);
        showNotification('Theme updated successfully!', 'success');
      } catch (error) {
        console.error('Failed to change theme:', error);
        showNotification('Failed to update theme', 'error');
        // Revert local state on error
        setSettings(prev => ({
          ...prev,
          [key]: theme
        }));
      }
      return;
    }

    // Save supported settings to backend
    const supportedBackendSettings = ['emailNotifications', 'timezone'];
    
    if (supportedBackendSettings.includes(key)) {
      try {
        setIsSaving(true);
        await userAPI.updateProfile({
          preferences: {
            ...userProfile?.preferences,
            [key]: value
          }
        });
        
        // Update local user profile
        setUserProfile(prev => ({
          ...prev,
          preferences: {
            ...prev?.preferences,
            [key]: value
          }
        }));

        // Show success notification
        showNotification(`${key === 'emailNotifications' ? 'Email notifications' : 'Timezone'} updated successfully!`, 'success');
        
      } catch (error) {
        console.error('Failed to save setting:', error);
        // Revert local state on error
        setSettings(prev => ({
          ...prev,
          [key]: userProfile?.preferences?.[key] ?? prev[key]
        }));
        showNotification(`Failed to update ${key}. Please try again.`, 'error');
      } finally {
        setIsSaving(false);
      }
    }
    // For unsupported settings, just update local state (they're "coming soon")
  };

  // Category options for filtering
  const categoryOptions = [
    { value: 'all', label: 'All Settings', icon: MixerHorizontalIcon },
    { value: 'account', label: 'Account', icon: PersonIcon },
    { value: 'notifications', label: 'Notifications', icon: BellIcon },
    { value: 'privacy', label: 'Privacy', icon: LockClosedIcon },
    { value: 'appearance', label: 'Appearance', icon: ColorWheelIcon },
    { value: 'data', label: 'Data', icon: BackpackIcon },
  ];

  // Settings widget components
  const settingsWidgets = useMemo(() => ({
    ...(section === 'habit-privacy' && habitId && {
      'habit-privacy-widget': {
        title: "Habit Privacy Settings",
        component: () => {
          const navigate = useNavigate();
          
          const updatePrivacySettings = async () => {
            try {
              setIsSaving(true);
              
              // Use the proper API base URL and authentication
              const token = localStorage.getItem('token');
              const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
              
              const response = await fetch(`${API_BASE_URL}/api/habits/${habitId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  workspaceSettings: habitPrivacySettings
                })
              });
              
              const result = await response.json();
              
              if (response.ok && result.success) {
                // Show success notification using the existing notification system
                if (typeof showNotification === 'function') {
                  showNotification('Privacy settings updated successfully!', 'success');
                } else {
                  // Fallback to alert if notification system isn't available
                  alert('Privacy settings updated successfully!');
                }
                
                // Navigate back to groups page
                navigate(`/app/groups/${habitData.workspaceId}`);
              } else {
                console.error('Failed to update privacy settings:', result);
                const errorMessage = result.error || 'Failed to update privacy settings';
                
                if (typeof showNotification === 'function') {
                  showNotification(errorMessage, 'error');
                } else {
                  alert(errorMessage);
                }
              }
            } catch (error) {
              console.error('Error updating privacy settings:', error);
              const errorMessage = 'Network error. Please check your connection and try again.';
              
              if (typeof showNotification === 'function') {
                showNotification(errorMessage, 'error');
              } else {
                alert(errorMessage);
              }
            } finally {
              setIsSaving(false);
            }
          };
          
          return (
            <div className="h-full glass-card-minimal rounded-2xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0 border-b border-[var(--color-border-primary)]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <LockClosedIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-dmSerif text-[var(--color-text-primary)]">
                      Habit Privacy Settings
                    </h3>
                    <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                      {habitData?.name ? `Control privacy for "${habitData.name}"` : 'Control what you share with your group'}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => navigate(`/app/groups/${habitData?.workspaceId || 'all'}`)}
                  className="p-2 rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)]"
                >
                  <Cross2Icon className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {!habitData ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="spinner mb-4"></div>
                      <p className="text-[var(--color-text-secondary)] font-outfit">Loading habit data...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="bg-[var(--color-surface-primary)] p-4 rounded-xl border border-[var(--color-border-primary)]">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: habitData.color || '#4f46e5' }}>
                          <span className="text-lg">{habitData.icon || '🎯'}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-[var(--color-text-primary)] font-dmSerif">
                            {habitData.name}
                          </h4>
                          <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                            {habitData.description || 'No description'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs text-[var(--color-text-tertiary)] font-outfit">
                        <span className="px-2 py-1 bg-[var(--color-surface-hover)] rounded-lg">
                          {habitData.category || 'No category'}
                        </span>
                        <span>
                          Adopted from workspace
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-base font-dmSerif font-semibold text-[var(--color-text-primary)] mb-2">
                        Privacy Settings
                      </h4>
                      <p className="text-sm text-[var(--color-text-secondary)] font-outfit mb-6">
                        Control what information about this habit is visible to your group members. 
                        These settings only affect this specific habit in this workspace.
                      </p>
                      
                      <div className="space-y-5">
                        {/* Share Progress Setting */}
                        <div>
                          <h5 className="text-sm font-dmSerif font-semibold text-[var(--color-text-primary)] mb-3">
                            Share Progress Level
                          </h5>
                          <div className="grid grid-cols-2 gap-3">
                            <div 
                              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                habitPrivacySettings.shareProgress === 'full' 
                                  ? 'bg-[var(--color-brand-500)]/10 border-[var(--color-brand-500)]' 
                                  : 'border-[var(--color-border-primary)] hover:bg-[var(--color-surface-hover)]'
                              }`}
                              onClick={() => setHabitPrivacySettings({...habitPrivacySettings, shareProgress: 'full'})}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-sm font-dmSerif font-semibold text-[var(--color-text-primary)]">
                                  Full Details
                                </h5>
                                {habitPrivacySettings.shareProgress === 'full' && (
                                  <CheckCircledIcon className="w-4 h-4 text-[var(--color-brand-500)]" />
                                )}
                              </div>
                              <p className="text-xs text-[var(--color-text-secondary)] font-outfit">
                                Share your complete habit data including completion dates, notes, and detailed statistics with group members
                              </p>
                            </div>
                            <div 
                              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                habitPrivacySettings.shareProgress === 'progress-only' 
                                  ? 'bg-[var(--color-brand-500)]/10 border-[var(--color-brand-500)]' 
                                  : 'border-[var(--color-border-primary)] hover:bg-[var(--color-surface-hover)]'
                              }`}
                              onClick={() => setHabitPrivacySettings({...habitPrivacySettings, shareProgress: 'progress-only'})}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-sm font-dmSerif font-semibold text-[var(--color-text-primary)]">
                                  Progress Only
                                </h5>
                                {habitPrivacySettings.shareProgress === 'progress-only' && (
                                  <CheckCircledIcon className="w-4 h-4 text-[var(--color-brand-500)]" />
                                )}
                              </div>
                              <p className="text-xs text-[var(--color-text-secondary)] font-outfit">
                                Share basic completion rates and weekly progress summaries, but keep personal notes and detailed stats private
                              </p>
                            </div>
                            <div 
                              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                habitPrivacySettings.shareProgress === 'streaks-only' 
                                  ? 'bg-[var(--color-brand-500)]/10 border-[var(--color-brand-500)]' 
                                  : 'border-[var(--color-border-primary)] hover:bg-[var(--color-surface-hover)]'
                              }`}
                              onClick={() => setHabitPrivacySettings({...habitPrivacySettings, shareProgress: 'streaks-only'})}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-sm font-dmSerif font-semibold text-[var(--color-text-primary)]">
                                  Streaks Only
                                </h5>
                                {habitPrivacySettings.shareProgress === 'streaks-only' && (
                                  <CheckCircledIcon className="w-4 h-4 text-[var(--color-brand-500)]" />
                                )}
                              </div>
                              <p className="text-xs text-[var(--color-text-secondary)] font-outfit">
                                Only show your current streak count and best streak achieved - all other progress remains private
                              </p>
                            </div>
                            <div 
                              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                habitPrivacySettings.shareProgress === 'private' 
                                  ? 'bg-[var(--color-brand-500)]/10 border-[var(--color-brand-500)]' 
                                  : 'border-[var(--color-border-primary)] hover:bg-[var(--color-surface-hover)]'
                              }`}
                              onClick={() => setHabitPrivacySettings({...habitPrivacySettings, shareProgress: 'private'})}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-sm font-dmSerif font-semibold text-[var(--color-text-primary)]">
                                  Private
                                </h5>
                                {habitPrivacySettings.shareProgress === 'private' && (
                                  <CheckCircledIcon className="w-4 h-4 text-[var(--color-brand-500)]" />
                                )}
                              </div>
                              <p className="text-xs text-[var(--color-text-secondary)] font-outfit">
                                Keep all progress completely private - group members won't see any data about this habit
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Allow Interaction Toggle */}
                        <div className="flex items-center justify-between p-4 border border-[var(--color-border-primary)] rounded-lg">
                          <div>
                            <h4 className="text-sm font-dmSerif font-semibold text-[var(--color-text-primary)]">
                              Allow Encouragements
                            </h4>
                            <p className="text-xs text-[var(--color-text-secondary)] font-outfit">
                              Allow group members to send you motivational messages and celebrate your progress on this habit
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={habitPrivacySettings.allowInteraction}
                              onChange={(e) => setHabitPrivacySettings({...habitPrivacySettings, allowInteraction: e.target.checked})}
                              className="sr-only"
                            />
                            <div className={`w-11 h-6 rounded-full transition-colors ${
                              habitPrivacySettings.allowInteraction 
                                ? 'bg-[var(--color-brand-500)]' 
                                : 'bg-gray-300'
                            }`}>
                              <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                                habitPrivacySettings.allowInteraction ? 'translate-x-5' : 'translate-x-0'
                              } mt-0.5 ml-0.5`} />
                            </div>
                          </label>
                        </div>
                        
                        {/* Activity Feed Toggle */}
                        <div className="flex items-center justify-between p-4 border border-[var(--color-border-primary)] rounded-lg">
                          <div>
                            <h4 className="text-sm font-dmSerif font-semibold text-[var(--color-text-primary)]">
                              Show in Activity Feed
                            </h4>
                            <p className="text-xs text-[var(--color-text-secondary)] font-outfit">
                              When you complete this habit, it will appear in the group's activity feed for everyone to see
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={habitPrivacySettings.shareInActivity}
                              onChange={(e) => setHabitPrivacySettings({...habitPrivacySettings, shareInActivity: e.target.checked})}
                              className="sr-only"
                            />
                            <div className={`w-11 h-6 rounded-full transition-colors ${
                              habitPrivacySettings.shareInActivity 
                                ? 'bg-[var(--color-brand-500)]' 
                                : 'bg-gray-300'
                            }`}>
                              <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                                habitPrivacySettings.shareInActivity ? 'translate-x-5' : 'translate-x-0'
                              } mt-0.5 ml-0.5`} />
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 pt-4 border-t border-[var(--color-border-primary)]">
                      <button
                        onClick={() => navigate(`/app/groups/${habitData.workspaceId}`)}
                        className="flex-1 h-10 bg-[var(--color-surface-hover)] text-[var(--color-text-primary)] rounded-lg font-medium font-outfit"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={updatePrivacySettings}
                        disabled={isSaving}
                        className="flex-1 h-10 bg-[var(--color-brand-500)] hover:bg-[var(--color-brand-600)] disabled:bg-gray-400 text-white rounded-lg font-semibold font-outfit flex items-center justify-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <CheckIcon className="w-4 h-4" />
                            Save Settings
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        }
      }
    }),
    'profile-widget': {
      title: "Profile & Account",
      component: () => (
        <div className="h-full glass-card-minimal rounded-2xl flex flex-col overflow-hidden">
          <div className="flex items-center gap-4 p-6 pb-4 flex-shrink-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <PersonIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-dmSerif text-[var(--color-text-primary)]">Profile & Account</h3>
              <p className="text-sm text-[var(--color-text-secondary)] font-outfit">Manage your account information</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-[var(--color-brand-500)] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-[var(--color-text-secondary)] font-outfit">Loading profile...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[var(--color-brand-500)]/5 to-[var(--color-brand-600)]/5 rounded-xl border border-[var(--color-brand-400)]/20">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {userProfile?.avatar ? (
                      <img src={userProfile.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      userProfile?.name?.charAt(0)?.toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-[var(--color-text-primary)] font-outfit truncate">{userProfile?.name || 'Loading...'}</h4>
                    <p className="text-sm text-[var(--color-text-secondary)] font-outfit truncate">{userProfile?.email || 'Loading...'}</p> 
                    {(userProfile?.hasGoogleAuth || userProfile?.hasGithubAuth) && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-[var(--color-text-tertiary)] font-outfit truncate">
                          Connected: {userProfile.hasGoogleAuth ? 'Google ' : ''}{userProfile.hasGithubAuth ? 'GitHub' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <SettingItem
                    label="Timezone"
                    description="Your local timezone for accurate tracking"
                    value={settings.timezone}
                    type="select"
                    options={[
                      { label: "UTC", value: "UTC" },
                      { label: "EST (UTC-5)", value: "America/New_York" },
                      { label: "CST (UTC-6)", value: "America/Chicago" },
                      { label: "MST (UTC-7)", value: "America/Denver" },
                      { label: "PST (UTC-8)", value: "America/Los_Angeles" },
                      { label: "GMT (UTC+0)", value: "Europe/London" },
                      { label: "CET (UTC+1)", value: "Europe/Paris" },
                      { label: "JST (UTC+9)", value: "Asia/Tokyo" },
                      { label: "AEST (UTC+10)", value: "Australia/Sydney" }
                    ]}
                    onChange={(value) => handleSettingChange('timezone', value)}
                    icon={<GlobeIcon className="w-4 h-4 text-[var(--color-text-tertiary)]" />}
                    isDisabled={isSaving}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )
    },
    
    'notifications-widget': {
      title: "Notification Settings",
      component: () => (
        <div className="h-full glass-card-minimal p-6 rounded-2xl flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <BellIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-dmSerif text-[var(--color-text-primary)]">Notifications</h3>
              <p className="text-sm text-[var(--color-text-secondary)] font-outfit">Stay updated with your habits</p>
            </div>
          </div>
          
          <div className="flex-1 space-y-4">
            <SettingItem
              label="Email Updates"
              description="Weekly reports and summaries"
              value={settings.emailNotifications}
              type="toggle"
              onChange={(value) => handleSettingChange('emailNotifications', value)}
              icon={<InfoCircledIcon className="w-4 h-4 text-blue-500" />}
              isDisabled={isSaving}
            />
            
            {/* Coming Soon Items */}
            <div className="space-y-3 pt-4 border-t border-[var(--color-border-primary)]/30">
              <div className="flex items-center gap-2 mb-2">
                <Text className="text-xs font-semibold text-[var(--color-text-tertiary)] font-outfit uppercase tracking-wide">
                  Coming Soon
                </Text>
                <div className="flex-1 h-px bg-[var(--color-border-primary)]/30"></div>
              </div>
              
              <ComingSoonSettingItem
                label="Push Notifications"
                description="Habit reminders and achievements"
                icon={<BellIcon className="w-4 h-4 text-emerald-500" />}
              />
              <ComingSoonSettingItem
                label="Weekly Reports"
                description="Detailed progress analytics"
                icon={<FileTextIcon className="w-4 h-4 text-purple-500" />}
              />
              <ComingSoonSettingItem
                label="Team Activity"
                description="Workspace collaboration updates"
                icon={<PersonIcon className="w-4 h-4 text-orange-500" />}
              />
            </div>
          </div>
        </div>
      )
    },

    'privacy-widget': {
      title: "Privacy & Security",
      component: () => {
        const [dashboardPermissions, setDashboardPermissions] = useState({});
        const [workspaces, setWorkspaces] = useState([]);
        const [loading, setLoading] = useState(true);
        const [saving, setSaving] = useState(false);
        
        useEffect(() => {
          fetchUserWorkspaces();
        }, []);
        
        const fetchUserWorkspaces = async () => {
          try {
            setLoading(true);
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const token = localStorage.getItem('token');
            
            // Fetch user's workspaces
            const workspacesResponse = await fetch(`${API_BASE_URL}/api/workspaces`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (workspacesResponse.ok) {
              const workspacesData = await workspacesResponse.json();
              setWorkspaces(workspacesData.workspaces || []);
              
              // Fetch permissions for each workspace
              const permissions = {};
              for (const workspace of workspacesData.workspaces || []) {
                try {
                  const permResponse = await fetch(`${API_BASE_URL}/api/workspaces/${workspace._id}/dashboard-permissions`, {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  });
                  
                  if (permResponse.ok) {
                    const permData = await permResponse.json();
                    permissions[workspace._id] = permData.permissions || { isPublicToWorkspace: true };
                  } else {
                    // Set default permissions if endpoint doesn't exist yet
                    permissions[workspace._id] = { isPublicToWorkspace: true };
                  }
                } catch (error) {
                  console.error(`Error fetching permissions for workspace ${workspace._id}:`, error);
                }
              }
              
              setDashboardPermissions(permissions);
            }            } catch (error) {
              console.error('Error fetching workspaces:', error);
              showNotification('Failed to load workspace data. Please refresh the page.', 'error');
            } finally {
              setLoading(false);
            }
        };
        
        const updateWorkspacePermissions = async (workspaceId, newPermissions) => {
          try {
            setSaving(true);
            const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            const token = localStorage.getItem('token');
            
            const response = await fetch(`${API_BASE_URL}/api/workspaces/${workspaceId}/dashboard-permissions`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(newPermissions)
            });
            
            if (response.ok) {
              const result = await response.json();
              setDashboardPermissions(prev => ({
                ...prev,
                [workspaceId]: result.permissions
              }));
              
              showNotification('Dashboard sharing settings updated successfully!', 'success');
            } else {
              const error = await response.json();
              console.error('Failed to update permissions:', error);
              showNotification(error.error || 'Failed to update settings', 'error');
            }
          } catch (error) {
            console.error('Error updating permissions:', error);
            showNotification('Network error. Please try again.', 'error');
          } finally {
            setSaving(false);
          }
        };
        
        const togglePublicAccess = (workspaceId, isPublic) => {
          const currentPermissions = dashboardPermissions[workspaceId] || {};
          updateWorkspacePermissions(workspaceId, {
            ...currentPermissions,
            isPublicToWorkspace: isPublic
          });
        };
        
        return (
          <div className="h-full glass-card-minimal p-6 rounded-2xl flex flex-col">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg">
                <LockClosedIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-dmSerif text-[var(--color-text-primary)]">Privacy & Security</h3>
                <p className="text-sm text-[var(--color-text-secondary)] font-outfit">Control your dashboard sharing</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-[var(--color-brand-500)] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-[var(--color-surface-primary)] p-4 rounded-xl border border-[var(--color-border-primary)]">
                    <h4 className="text-sm font-dmSerif font-semibold text-[var(--color-text-primary)] mb-2">
                      Dashboard Sharing
                    </h4>
                    <p className="text-xs text-[var(--color-text-secondary)] font-outfit mb-4">
                      Control which group members can view your private dashboard and habit progress.
                    </p>
                    
                    {workspaces.length === 0 ? (
                      <p className="text-sm text-[var(--color-text-tertiary)] font-outfit text-center py-4">
                        You're not a member of any workspaces yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {workspaces.map((workspace) => {
                          const permissions = dashboardPermissions[workspace._id] || {};
                          const isPublic = permissions.isPublicToWorkspace || true;
                          
                          return (
                            <div 
                              key={workspace._id}
                              className="flex items-center justify-between p-3 bg-[var(--color-surface-elevated)] rounded-lg border border-[var(--color-border-primary)]"
                            >
                              <div className="flex-1">
                                <h5 className="text-sm font-semibold text-[var(--color-text-primary)] font-outfit">
                                  {workspace.name}
                                </h5>
                                <p className="text-xs text-[var(--color-text-secondary)] font-outfit">
                                  {isPublic 
                                    ? 'All group members can view your dashboard' 
                                    : 'Dashboard is private - only you can see it'
                                  }
                                </p>
                              </div>
                              
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isPublic}
                                  onChange={(e) => togglePublicAccess(workspace._id, e.target.checked)}
                                  disabled={saving}
                                  className="sr-only"
                                />
                                <div className={`w-11 h-6 rounded-full transition-colors ${
                                  isPublic 
                                    ? 'bg-[var(--color-brand-500)]' 
                                    : 'bg-gray-300'
                                }`}>
                                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                                    isPublic ? 'translate-x-5' : 'translate-x-0'
                                  } mt-0.5 ml-0.5`} />
                                </div>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <InfoCircledIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200 font-outfit text-sm mb-1">
                          How Dashboard Sharing Works
                        </h4>
                        <ul className="text-xs text-blue-700 dark:text-blue-300 font-outfit space-y-1">
                          <li>• When enabled, group members can view a read-only version of your private dashboard</li>
                          <li>• They can see your habit progress, streaks, and completion patterns</li>
                          <li>• Your personal notes and private data remain hidden</li>
                          <li>• You can change these settings anytime</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }
    },

    'appearance-widget': {
      title: "Appearance & Theme",
      component: () => (
        <div className="h-full glass-card-minimal p-6 rounded-2xl flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-lg">
              <ColorWheelIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-dmSerif text-[var(--color-text-primary)]">Appearance</h3>
              <p className="text-sm text-[var(--color-text-secondary)] font-outfit">Customize your experience</p>
            </div>
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="space-y-3">
              <SettingItem
                label="Theme"
                description="Switch between light, dark, and auto themes"
                icon={<MoonIcon className="w-4 h-4 text-indigo-500" />}
                type="component"
                component={<ThemeSwitcher />}
              />
            </div>
            
            {/* Coming Soon Items */}
            <div className="space-y-3 pt-4 border-t border-[var(--color-border-primary)]/30">
              <div className="flex items-center gap-2 mb-2">
                <Text className="text-xs font-semibold text-[var(--color-text-tertiary)] font-outfit uppercase tracking-wide">
                  Coming Soon
                </Text>
                <div className="flex-1 h-px bg-[var(--color-border-primary)]/30"></div>
              </div>
              
              <ComingSoonSettingItem
                label="Accent Color"
                description="Your app's accent color"
                icon={<ColorWheelIcon className="w-4 h-4 text-pink-500" />}
                currentValue="🔵 Indigo"
              />
              <ComingSoonSettingItem
                label="Language"
                description="Interface language"
                icon={<GlobeIcon className="w-4 h-4 text-blue-500" />}
                currentValue="🇺🇸 English"
              />
            </div>
          </div>
        </div>
      )
    },

    'data-management-widget': {
      title: "Data Management",
      component: () => {
        const [isExporting, setIsExporting] = useState(false);
        const [exportSuccess, setExportSuccess] = useState(false);
        
        const handleExportData = async () => {
          try {
            setIsExporting(true);
            const response = await userAPI.exportData();
            
            // Create and download the file
            const dataStr = JSON.stringify(response.data, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `bito-export-${new Date().toISOString().split('T')[0]}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            setExportSuccess(true);
            showNotification('Data exported successfully! Check your downloads folder.', 'success');
            setTimeout(() => setExportSuccess(false), 3000);
          } catch (error) {
            console.error('Export failed:', error);
            showNotification('Export failed. Please try again.', 'error');
          } finally {
            setIsExporting(false);
          }
        };

        const handleDeleteAccount = async () => {
          const confirmed = window.confirm(
            'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.'
          );
          
          if (confirmed) {
            const password = window.prompt('Please enter your password to confirm account deletion:');
            if (password) {
              try {
                await userAPI.deleteAccount({
                  password,
                  confirmDeletion: 'DELETE_MY_ACCOUNT'
                });
                showNotification('Account deleted successfully. You will be logged out.', 'success');
                // Wait a moment before redirect to show the notification
                setTimeout(() => {
                  window.location.href = '/';
                }, 2000);
              } catch (error) {
                console.error('Account deletion failed:', error);
                showNotification('Account deletion failed: ' + (error.message || 'Please try again.'), 'error');
              }
            }
          }
        };

        return (
          <div className="h-full glass-card-minimal p-6 rounded-2xl flex flex-col">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                <ArchiveIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-dmSerif text-[var(--color-text-primary)]">Data Management</h3>
                <p className="text-sm text-[var(--color-text-secondary)] font-outfit">Import, export & backup</p>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col justify-between">
              <div className="grid grid-cols-3 gap-3 mb-6">
                <button 
                  onClick={handleExportData}
                  disabled={isExporting}
                  className={`flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 shadow-lg font-outfit font-medium ${
                    exportSuccess 
                      ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-white'
                      : 'bg-gradient-to-r from-green-400 to-green-500 hover:from-green-600 hover:to-green-700 text-white'
                  } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isExporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Exporting...
                    </>
                  ) : exportSuccess ? (
                    <>
                      <DownloadIcon className="w-4 h-4" />
                      Exported!
                    </>
                  ) : (
                    <>
                      <DownloadIcon className="w-4 h-4" />
                      Export Data
                    </>
                  )}
                </button>
                
                <button 
                  disabled
                  className="flex items-center justify-center gap-2 px-3 py-1.5 bg-gray-400 cursor-not-allowed text-white rounded-xl transition-all duration-200 shadow-lg font-outfit font-medium relative"
                >
                  <UploadIcon className="w-4 h-4" />
                  <div className="text-center">
                    <div>Import Data</div>
                    <div className="text-xs opacity-75">Coming Soon</div>
                  </div>
                </button>
                
                <button 
                  onClick={handleDeleteAccount}
                  className="flex items-center justify-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-400 to-red-500 hover:from-red-600 hover:to-red-700 text-white rounded-xl transition-all duration-200 shadow-lg font-outfit font-medium"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete Account
                </button>
              </div>
              
              {exportSuccess && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300 font-outfit">
                    ✅ Data exported successfully! Your export file has been downloaded.
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      }
    },

    'help-support-widget': {
      title: "Help & Support",
      component: () => (
        <div className="h-full glass-card-minimal p-6 rounded-2xl flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg">
              <QuestionMarkCircledIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-dmSerif text-[var(--color-text-primary)]">Help & Support</h3>
              <p className="text-sm text-[var(--color-text-secondary)] font-outfit">Get help and resources</p>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-between">
            {/* Coming Soon Notice */}
            <div className="bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-950/20 dark:to-teal-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <InfoCircledIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 font-outfit text-sm">Support System Coming Soon</h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-outfit">Documentation and support features are in development</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mb-6">
              <button 
                disabled
                className="flex items-center justify-center gap-2 h-12 px-3 bg-gray-200 dark:bg-gray-700 cursor-not-allowed border border-gray-300 dark:border-gray-600 rounded-lg transition-all duration-200 opacity-50"
              >
                <FileTextIcon className="w-4 h-4" />
                <span className="font-outfit font-medium text-sm">Documentation</span>
              </button>
              <button 
                disabled
                className="flex items-center justify-center gap-2 h-12 px-3 bg-gray-200 dark:bg-gray-700 cursor-not-allowed border border-gray-300 dark:border-gray-600 rounded-lg transition-all duration-200 opacity-50"
              >
                <ChatBubbleIcon className="w-4 h-4" />
                <span className="font-outfit font-medium text-sm">Contact Support</span>
              </button>
              <button 
                disabled
                className="flex items-center justify-center gap-2 h-12 px-3 bg-gray-200 dark:bg-gray-700 cursor-not-allowed border border-gray-300 dark:border-gray-600 rounded-lg transition-all duration-200 opacity-50"
              >
                <ExclamationTriangleIcon className="w-4 h-4" />
                <span className="font-outfit font-medium text-sm">Report Bug</span>
              </button>
            </div>
            
            <div className="pt-4 border-t border-[var(--color-border-primary)]/30">
              <div className="flex items-center justify-between text-xs">
                <Text className="text-[var(--color-text-tertiary)] font-outfit">
                  v1.0.0 • July 2, 2025
                </Text>
                <div className="flex items-center gap-2 text-[var(--color-text-tertiary)]">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <Text className="font-outfit">All systems operational</Text>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  }), [settings, handleSettingChange]);

  // Default layouts for settings widgets
  const defaultLayouts = DEFAULT_LAYOUTS.settings;
  const defaultWidgets = DEFAULT_WIDGETS.settings;
  const storageKeys = STORAGE_KEYS.settings;

  return (
    <div className="min-h-screen page-container p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex items-center gap-4 mb-6 lg:mb-0">
            <div>
              <h1 className="text-3xl font-bold font-dmSerif gradient-text mb-2">
                Settings
              </h1>
              <p className="text-md text-[var(--color-text-secondary)] font-outfit">
                Customize your app preferences and manage your account.
              </p>
            </div>
          </div>
        </div>

        {/* Settings Grid Container */}
        <BaseGridContainer
          mode="settings"
          widgets={settingsWidgets}
          availableWidgets={WIDGET_TYPES}
          defaultWidgets={defaultWidgets}
          defaultLayouts={defaultLayouts}
          storageKeys={storageKeys}
          className="settings-grid"
        />

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[var(--color-text-tertiary)] font-outfit">
            💡 <strong>Pro tip:</strong> Use "Edit All" to customize your settings layout, or use the category filter to focus on specific areas.
          </p>
          {isSaving && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[var(--color-text-secondary)] font-outfit">
              <div className="w-4 h-4 border-2 border-[var(--color-brand-500)] border-t-transparent rounded-full animate-spin"></div>
              Saving settings...
            </div>
          )}
        </div>
      </div>
      
      {/* Notification */}
      {notification && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className={`px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
            notification.type === 'error' 
              ? 'bg-red-500 text-white' 
              : 'bg-[var(--color-success)] text-white'
          }`}>
            {notification.type === 'error' ? (
              <ExclamationTriangleIcon className="w-5 h-5" />
            ) : (
              <CheckCircledIcon className="w-5 h-5" />
            )}
            <span className="font-medium font-outfit">{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// SettingItem component for rendering individual settings
const SettingItem = ({ label, description, value, type, options, onChange, icon, isDisabled = false, component }) => {
  const renderInput = () => {
    switch (type) {
      case "toggle":
        return (
          <Switch
            checked={value}
            onCheckedChange={onChange}
            disabled={isDisabled}
            className="data-[state=checked]:bg-[var(--color-brand-600)] scale-110"
          />
        );
      case "select":
        return (
          <Select.Root value={value} onValueChange={onChange} disabled={isDisabled}>
            <Select.Trigger className={`w-48 h-10 px-3 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/30 rounded-lg font-outfit transition-all duration-200 shadow-sm ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`} />
            <Select.Content className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/30 rounded-lg shadow-xl z-50">
              {options?.map((option) => (
                <Select.Item 
                  key={option.value} 
                  value={option.value}
                  className="px-3 py-2 hover:bg-[var(--color-surface-hover)] font-outfit cursor-pointer text-sm"
                >
                  {option.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        );
      case "text":
        return (
          <div className="text-sm text-[var(--color-text-secondary)] font-outfit bg-[var(--color-surface-elevated)] px-3 py-2 rounded-lg border border-[var(--color-border-primary)]/30 min-w-32">
            {value}
          </div>
        );
      case "component":
        return component;
      default:
        return null;
    }
  };

  return (
    <div className={`flex justify-between items-center py-3 px-2 rounded-lg hover:bg-[var(--color-surface-hover)]/30 transition-all duration-200 ${isDisabled ? 'opacity-50' : ''}`}>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          {icon && <div className="opacity-70">{icon}</div>}
          <Text className="font-medium text-[var(--color-text-primary)] font-outfit">
            {label}
          </Text>
          {isDisabled && (
            <span className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded-full font-outfit">
              Saving...
            </span>
          )}
        </div>
        <Text className="text-xs text-[var(--color-text-secondary)] font-outfit leading-relaxed">
          {description}
        </Text>
      </div>
      <div className="ml-6 flex-shrink-0">
        {renderInput()}
      </div>
    </div>
  );
};

// ComingSoonSettingItem component for features not yet implemented
const ComingSoonSettingItem = ({ label, description, icon, currentValue }) => {
  return (
    <div className="flex justify-between items-center py-3 px-2 rounded-lg bg-gray-50 dark:bg-gray-900/30 opacity-60">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          {icon && <div className="opacity-70">{icon}</div>}
          <Text className="font-medium text-[var(--color-text-primary)] font-outfit">
            {label}
          </Text>
          <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full font-outfit">
            Coming Soon
          </span>
        </div>
        <Text className="text-xs text-[var(--color-text-secondary)] font-outfit leading-relaxed">
          {description}
        </Text>
      </div>
      {currentValue && (
        <div className="ml-6 flex-shrink-0">
          <div className="text-sm text-[var(--color-text-secondary)] font-outfit bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 min-w-32">
            {currentValue}
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
