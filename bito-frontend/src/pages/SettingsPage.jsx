import React, { useState, useMemo } from "react";
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

const SettingsPage = () => {
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

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
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
        <div className="h-full glass-card-minimal p-6 rounded-2xl flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <PersonIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-dmSerif text-[var(--color-text-primary)]">Profile & Account</h3>
              <p className="text-sm text-[var(--color-text-secondary)] font-outfit">Manage your account information</p>
            </div>
          </div>
          
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[var(--color-brand-500)]/5 to-[var(--color-brand-600)]/5 rounded-xl border border-[var(--color-brand-400)]/20">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center text-white font-bold text-lg">
                A
              </div>
              <div>
                <h4 className="font-semibold text-[var(--color-text-primary)] font-outfit">Alex Johnson</h4>
                <p className="text-sm text-[var(--color-text-secondary)] font-outfit">alex@example.com</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600 font-outfit">Active account</span>
                </div>
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
                  { label: "GMT (UTC+0)", value: "GMT" }
                ]}
                onChange={(value) => handleSettingChange('timezone', value)}
                icon={<GlobeIcon className="w-4 h-4 text-[var(--color-text-tertiary)]" />}
              />
            </div>
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
              label="Push Notifications"
              description="Habit reminders and achievements"
              value={settings.notifications}
              type="toggle"
              onChange={(value) => handleSettingChange('notifications', value)}
              icon={<BellIcon className="w-4 h-4 text-emerald-500" />}
            />
            <SettingItem
              label="Email Updates"
              description="Weekly reports and summaries"
              value={settings.emailNotifications}
              type="toggle"
              onChange={(value) => handleSettingChange('emailNotifications', value)}
              icon={<InfoCircledIcon className="w-4 h-4 text-blue-500" />}
            />
            <SettingItem
              label="Weekly Reports"
              description="Detailed progress analytics"
              value={settings.weeklyReports}
              type="toggle"
              onChange={(value) => handleSettingChange('weeklyReports', value)}
              icon={<FileTextIcon className="w-4 h-4 text-purple-500" />}
            />
            <SettingItem
              label="Team Activity"
              description="Workspace collaboration updates"
              value={settings.workspaceNotifications}
              type="toggle"
              onChange={(value) => handleSettingChange('workspaceNotifications', value)}
              icon={<PersonIcon className="w-4 h-4 text-orange-500" />}
            />
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
            <SettingItem
              label="Progress Sharing"
              description="How others see your progress"
              value={settings.shareProgress}
              type="select"
              options={[
                { label: "🔒 Private", value: "private" },
                { label: "📊 Progress Only", value: "progress-only" },
                { label: "🔥 Streaks Only", value: "streaks-only" },
                { label: "📈 Full Details", value: "full" }
              ]}
              onChange={(value) => handleSettingChange('shareProgress', value)}
              icon={<EyeNoneIcon className="w-4 h-4 text-violet-500" />}
            />
            <SettingItem
              label="Workspace Privacy"
              description="Default privacy for new workspaces"
              value={settings.defaultWorkspacePrivacy}
              type="select"
              options={[
                { label: "🌐 Open", value: "open" },
                { label: "👥 Members Only", value: "members-only" },
                { label: "🔐 Invite Only", value: "invite-only" }
              ]}
              onChange={(value) => handleSettingChange('defaultWorkspacePrivacy', value)}
              icon={<LockClosedIcon className="w-4 h-4 text-indigo-500" />}
            />
            <SettingItem
              label="Auto Backup"
              description="Secure cloud data backup"
              value={settings.autoBackup}
              type="toggle"
              onChange={(value) => handleSettingChange('autoBackup', value)}
              icon={<ArchiveIcon className="w-4 h-4 text-green-500" />}
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
              label="Dark Mode"
              description="Switch between light and dark themes"
              value={settings.darkMode}
              type="toggle"
              onChange={(value) => handleSettingChange('darkMode', value)}
              icon={<MoonIcon className="w-4 h-4 text-indigo-500" />}
            />
            <SettingItem
              label="Accent Color"
              description="Your app's accent color"
              value={settings.theme}
              type="select"
              options={[
                { label: "🔵 Indigo", value: "indigo" },
                { label: "🟦 Blue", value: "blue" },
                { label: "🟣 Purple", value: "purple" },
                { label: "🟢 Green", value: "green" }
              ]}
              onChange={(value) => handleSettingChange('theme', value)}
              icon={<ColorWheelIcon className="w-4 h-4 text-pink-500" />}
            />
            <SettingItem
              label="Language"
              description="Interface language"
              value={settings.language}
              type="select"
              options={[
                { label: "🇺🇸 English", value: "en" },
                { label: "🇪🇸 Español", value: "es" },
                { label: "🇫🇷 Français", value: "fr" },
                { label: "🇩🇪 Deutsch", value: "de" }
              ]}
              onChange={(value) => handleSettingChange('language', value)}
              icon={<GlobeIcon className="w-4 h-4 text-blue-500" />}
            />
          </div>
        </div>
      )
    },

    'data-management-widget': {
      title: "Data Management",
      component: () => (
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
              <button className="flex items-center justify-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-400 to-green-500 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all duration-200 shadow-lg font-outfit font-medium">
                <DownloadIcon className="w-4 h-4" />
                Export Data
              </button>
              <button className="flex items-center justify-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 shadow-lg font-outfit font-medium">
                <UploadIcon className="w-4 h-4" />
                Import Data
              </button>
              <button className="flex items-center justify-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-400 to-red-500 hover:from-red-600 hover:to-red-700 text-white rounded-xl transition-all duration-200 shadow-lg font-outfit font-medium">
                <TrashIcon className="w-4 h-4" />
                Delete Data
              </button>
            </div>
          </div>
        </div>
      )
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
            <div className="grid grid-cols-3 gap-2 mb-6">
              <button className="flex items-center justify-center gap-2 h-12 px-3 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/30 rounded-lg transition-all duration-200" style={{ color: 'var(--color-text-primary)' }}>
                <FileTextIcon className="w-4 h-4" />
                <span className="font-outfit font-medium text-sm">Documentation</span>
              </button>
              <button className="flex items-center justify-center gap-2 h-12 px-3 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/30 rounded-lg transition-all duration-200" style={{ color: 'var(--color-text-primary)' }}>
                <ChatBubbleIcon className="w-4 h-4" />
                <span className="font-outfit font-medium text-sm">Contact Support</span>
              </button>
              <button className="flex items-center justify-center gap-2 h-12 px-3 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/30 rounded-lg transition-all duration-200" style={{ color: 'var(--color-text-primary)' }}>
                <ExclamationTriangleIcon className="w-4 h-4" />
                <span className="font-outfit font-medium text-sm">Report Bug</span>
              </button>
            </div>
            
            <div className="pt-4 border-t border-[var(--color-border-primary)]/30">
              <div className="flex items-center justify-between text-xs">
                <Text className="text-[var(--color-text-tertiary)] font-outfit">
                  v1.0.0 • June 29, 2025
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
const SettingItem = ({ label, description, value, type, options, onChange, icon }) => {
  const renderInput = () => {
    switch (type) {
      case "toggle":
        return (
          <Switch
            checked={value}
            onCheckedChange={onChange}
            className="data-[state=checked]:bg-[var(--color-brand-600)] scale-110"
          />
        );
      case "select":
        return (
          <Select.Root value={value} onValueChange={onChange}>
            <Select.Trigger className="w-48 h-10 px-3 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/30 rounded-lg font-outfit transition-all duration-200 shadow-sm" />
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
    <div className="flex justify-between items-center py-3 px-2 rounded-lg hover:bg-[var(--color-surface-hover)]/30 transition-all duration-200">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          {icon && <div className="opacity-70">{icon}</div>}
          <Text className="font-medium text-[var(--color-text-primary)] font-outfit">
            {label}
          </Text>
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

export default SettingsPage;
