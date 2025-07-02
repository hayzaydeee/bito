import React, { useState, useMemo, useEffect } from "react";
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
  InfoCircledIcon
} from "@radix-ui/react-icons";
import BaseGridContainer from '../components/shared/BaseGridContainer';
import { WIDGET_TYPES, DEFAULT_WIDGETS, DEFAULT_LAYOUTS, STORAGE_KEYS } from '../components/shared/widgetRegistry';
import { userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const SettingsPage = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: true,
    emailNotifications: false,
    weeklyReports: true,
    autoBackup: true,
    language: "en",
    timezone: "UTC",
    theme: "indigo",
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

    // Save supported settings to backend
    const supportedBackendSettings = ['emailNotifications', 'timezone', 'theme'];
    
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
      } catch (error) {
        console.error('Failed to save setting:', error);
        // Revert local state on error
        setSettings(prev => ({
          ...prev,
          [key]: userProfile?.preferences?.[key] ?? prev[key]
        }));
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
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${userProfile?.isVerified ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                      <span className={`text-xs font-outfit truncate ${userProfile?.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                        {userProfile?.isVerified ? 'Verified account' : 'Account pending verification'}
                      </span>
                    </div>
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
                      { label: "EST (UTC-5)", value: "EST" },
                      { label: "PST (UTC-8)", value: "PST" },
                      { label: "GMT (UTC+0)", value: "GMT" },
                      { label: "CET (UTC+1)", value: "CET" },
                      { label: "JST (UTC+9)", value: "JST" }
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
      component: () => (
        <div className="h-full glass-card-minimal p-6 rounded-2xl flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg">
              <LockClosedIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-dmSerif text-[var(--color-text-primary)]">Privacy & Security</h3>
              <p className="text-sm text-[var(--color-text-secondary)] font-outfit">Control your data sharing</p>
            </div>
          </div>
          
          <div className="flex-1 space-y-4">
            {/* Coming Soon Notice */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-amber-800 dark:text-amber-200 font-outfit text-sm">Coming Soon</h4>
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-outfit">Privacy controls are in development</p>
                </div>
              </div>
            </div>
            
            <ComingSoonSettingItem
              label="Progress Sharing"
              description="How others see your progress"
              icon={<EyeNoneIcon className="w-4 h-4 text-violet-500" />}
              currentValue="🔒 Private"
            />
            <ComingSoonSettingItem
              label="Workspace Privacy"
              description="Default privacy for new workspaces"
              icon={<LockClosedIcon className="w-4 h-4 text-indigo-500" />}
              currentValue="🔐 Invite Only"
            />
            <ComingSoonSettingItem
              label="Auto Backup"
              description="Secure cloud data backup"
              icon={<ArchiveIcon className="w-4 h-4 text-green-500" />}
              currentValue="Enabled"
            />
          </div>
        </div>
      )
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
            <SettingItem
              label="Theme"
              description="Switch between light, dark, and auto themes"
              value={settings.theme}
              type="select"
              options={[
                { label: "🌙 Dark", value: "dark" },
                { label: "☀️ Light", value: "light" },
                { label: "� Auto", value: "auto" }
              ]}
              onChange={(value) => handleSettingChange('theme', value)}
              icon={<MoonIcon className="w-4 h-4 text-indigo-500" />}
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
            setTimeout(() => setExportSuccess(false), 3000);
          } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
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
                alert('Account deleted successfully. You will be logged out.');
                // Handle logout/redirect
                window.location.href = '/';
              } catch (error) {
                console.error('Account deletion failed:', error);
                alert('Account deletion failed: ' + (error.message || 'Please try again.'));
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
                    ✅ Data exported successfully! Check your downloads folder.
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
              <h1 className="text-4xl font-bold font-dmSerif gradient-text mb-2">
                Settings
              </h1>
              <p className="text-lg text-[var(--color-text-secondary)] font-outfit">
                Customize your app preferences and manage your account.
              </p>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--color-text-secondary)] font-outfit mr-2">
              Filter:
            </span>
            <div className="flex items-center bg-[var(--color-surface-elevated)] rounded-xl p-1 shadow-sm border border-[var(--color-border-primary)]/20">
              {categoryOptions.slice(0, 4).map(option => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setSelectedCategory(option.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 font-outfit text-sm ${
                      selectedCategory === option.value
                        ? 'bg-[var(--color-brand-600)] text-white shadow-md'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {option.label}
                  </button>
                );
              })}
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
        </div>
      </div>
    </div>
  );
};

// SettingItem component for rendering individual settings
const SettingItem = ({ label, description, value, type, options, onChange, icon, isDisabled = false }) => {
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
