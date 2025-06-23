import React, { useState } from "react";
import { Flex, Text, Button, Switch, Select, Card } from "@radix-ui/themes";
import { 
  GearIcon, 
  PersonIcon, 
  BellIcon, 
  ColorWheelIcon,
  ArchiveIcon,
  LockClosedIcon,
  QuestionMarkCircledIcon
} from "@radix-ui/react-icons";

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: true,
    emailNotifications: false,
    weeklyReports: true,
    autoBackup: true,
    language: "en",
    timezone: "UTC",
    theme: "indigo"
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const settingSections = [
    {
      title: "Profile & Account",
      icon: <PersonIcon className="w-5 h-5" />,
      settings: [
        {
          key: "displayName",
          label: "Display Name",
          description: "Your name as it appears in the app",
          type: "text",
          value: "Alex",
        },
        {
          key: "email",
          label: "Email Address",
          description: "Your account email address",
          type: "text",
          value: "alex@example.com",
        },
        {
          key: "timezone",
          label: "Timezone",
          description: "Your local timezone for accurate tracking",
          type: "select",
          value: settings.timezone,
          options: [
            { label: "UTC", value: "UTC" },
            { label: "EST (UTC-5)", value: "EST" },
            { label: "PST (UTC-8)", value: "PST" },
            { label: "GMT (UTC+0)", value: "GMT" }
          ]
        }
      ]
    },
    {
      title: "Notifications",
      icon: <BellIcon className="w-5 h-5" />,
      settings: [
        {
          key: "notifications",
          label: "Push Notifications",
          description: "Receive notifications for habit reminders",
          type: "toggle",
          value: settings.notifications,
        },
        {
          key: "emailNotifications",
          label: "Email Notifications",
          description: "Receive email reminders and updates",
          type: "toggle",
          value: settings.emailNotifications,
        },
        {
          key: "weeklyReports",
          label: "Weekly Reports",
          description: "Get weekly progress reports via email",
          type: "toggle",
          value: settings.weeklyReports,
        }
      ]
    },    {
      title: "Appearance",
      icon: <ColorWheelIcon className="w-5 h-5" />,
      settings: [
        {
          key: "darkMode",
          label: "Dark Mode",
          description: "Use dark theme throughout the app",
          type: "toggle",
          value: settings.darkMode,
        },
        {
          key: "theme",
          label: "Accent Color",
          description: "Choose your preferred accent color",
          type: "select",
          value: settings.theme,
          options: [
            { label: "Indigo", value: "indigo" },
            { label: "Blue", value: "blue" },
            { label: "Purple", value: "purple" },
            { label: "Green", value: "green" }
          ]
        },
        {
          key: "language",
          label: "Language",
          description: "App interface language",
          type: "select",
          value: settings.language,
          options: [
            { label: "English", value: "en" },
            { label: "Spanish", value: "es" },
            { label: "French", value: "fr" },
            { label: "German", value: "de" }
          ]
        }
      ]
    },    {
      title: "Data & Privacy",
      icon: <LockClosedIcon className="w-5 h-5" />,
      settings: [
        {
          key: "autoBackup",
          label: "Automatic Backup",
          description: "Automatically backup your data to the cloud",
          type: "toggle",
          value: settings.autoBackup,
        }
      ]
    }
  ];

  const renderSettingItem = (setting) => {
    switch (setting.type) {
      case "toggle":
        return (
          <Switch
            checked={setting.value}
            onCheckedChange={(checked) => handleSettingChange(setting.key, checked)}
          />
        );
      case "select":
        return (
          <Select.Root
            value={setting.value}
            onValueChange={(value) => handleSettingChange(setting.key, value)}
          >
            <Select.Trigger className="w-32" />
            <Select.Content>
              {setting.options.map((option) => (
                <Select.Item key={option.value} value={option.value}>
                  {option.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        );
      case "text":
        return (
          <div className="text-sm text-[var(--color-text-secondary)]">
            {setting.value}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-8 page-container">
      {/* Header */}
      <div className="mb-8">
        <Flex align="center" gap="3" className="mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[var(--color-brand-500)] to-[var(--color-brand-600)] flex items-center justify-center">
            <GearIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <Text className="text-3xl font-bold gradient-text font-dmSerif">
              Settings
            </Text>
            <Text className="text-[var(--color-text-secondary)] font-outfit">
              Customize your app preferences and account settings
            </Text>
          </div>
        </Flex>
      </div>

      {/* Settings Sections */}
      <div className="space-y-8">
        {settingSections.map((section) => (
          <Card key={section.title} className="glass-card p-6 rounded-2xl">
            <Flex align="center" gap="3" className="mb-6">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-elevated)] flex items-center justify-center">
                {section.icon}
              </div>
              <Text className="text-xl font-semibold font-dmSerif text-[var(--color-text-primary)]">
                {section.title}
              </Text>
            </Flex>

            <div className="space-y-6">
              {section.settings.map((setting) => (
                <Flex key={setting.key} justify="between" align="center" className="py-3">
                  <div className="flex-1">
                    <Text className="font-medium text-[var(--color-text-primary)] mb-1">
                      {setting.label}
                    </Text>
                    <Text className="text-sm text-[var(--color-text-secondary)]">
                      {setting.description}
                    </Text>
                  </div>
                  <div className="ml-6">
                    {renderSettingItem(setting)}
                  </div>
                </Flex>
              ))}
            </div>
          </Card>
        ))}

        {/* Action Buttons */}
        <Card className="glass-card p-6 rounded-2xl">          <Flex align="center" gap="3" className="mb-6">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-elevated)] flex items-center justify-center">
              <ArchiveIcon className="w-5 h-5" />
            </div>
            <Text className="text-xl font-semibold font-dmSerif text-[var(--color-text-primary)]">
              Data Management
            </Text>
          </Flex>

          <div className="space-y-4">
            <Flex gap="4">
              <Button 
                className="btn btn-secondary btn-md"
                style={{
                  background: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border-primary)'
                }}
              >
                Export Data
              </Button>
              <Button 
                className="btn btn-secondary btn-md"
                style={{
                  background: 'var(--color-surface-elevated)',
                  border: '1px solid var(--color-border-primary)'
                }}
              >
                Import Data
              </Button>
            </Flex>
            
            <div className="pt-4 border-t border-[var(--color-border-primary)]/30">
              <Button 
                className="btn btn-md"
                style={{
                  background: 'linear-gradient(135deg, var(--color-error) 0%, #dc2626 100%)',
                  color: 'white'
                }}
              >
                Delete All Data
              </Button>
              <Text className="text-xs text-[var(--color-text-tertiary)] mt-2">
                Warning: This action cannot be undone
              </Text>
            </div>
          </div>
        </Card>

        {/* Help Section */}
        <Card className="glass-card p-6 rounded-2xl">
          <Flex align="center" gap="3" className="mb-6">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-elevated)] flex items-center justify-center">
              <QuestionMarkCircledIcon className="w-5 h-5" />
            </div>
            <Text className="text-xl font-semibold font-dmSerif text-[var(--color-text-primary)]">
              Help & Support
            </Text>
          </Flex>

          <div className="space-y-4">
            <Flex gap="4">
              <Button 
                className="btn btn-ghost btn-md"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Documentation
              </Button>
              <Button 
                className="btn btn-ghost btn-md"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Contact Support
              </Button>
              <Button 
                className="btn btn-ghost btn-md"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Report Bug
              </Button>
            </Flex>
            
            <div className="pt-4 border-t border-[var(--color-border-primary)]/30">
              <Text className="text-sm text-[var(--color-text-tertiary)]">
                Version 1.0.0 • Last updated: June 19, 2025
              </Text>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
