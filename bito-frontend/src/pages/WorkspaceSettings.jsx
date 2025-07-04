import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Text, Switch, Select, Button } from "@radix-ui/themes";
import { 
  GearIcon, 
  PersonIcon, 
  BellIcon, 
  LockClosedIcon,
  GroupIcon,
  TrashIcon,
  ExitIcon,
  UpdateIcon,
  InfoCircledIcon,
  ChevronLeftIcon,
  CheckIcon,
  Cross2Icon
} from "@radix-ui/react-icons";
import BaseGridContainer from '../components/shared/BaseGridContainer';
import { WIDGET_TYPES, DEFAULT_WIDGETS, DEFAULT_LAYOUTS, STORAGE_KEYS } from '../components/shared/widgetRegistry';
import { useAuth } from '../contexts/AuthContext';
import { workspacesAPI } from '../services/api';

const WorkspaceSettings = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  
  const [settings, setSettings] = useState({
    name: '',
    description: '',
    type: 'team',
    isPublic: false,
    allowInvites: true,
    requireApproval: false,
    privacyLevel: 'invite-only'
  });

  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fetch workspace data
  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        setLoading(true);
        const response = await workspacesAPI.getWorkspace(groupId);
        
        if (response.success) {
          const workspaceData = response.workspace;
          setWorkspace(workspaceData);
          setSettings({
            name: workspaceData.name,
            description: workspaceData.description || '',
            type: workspaceData.type || 'team',
            isPublic: workspaceData.settings?.isPublic || false,
            allowInvites: workspaceData.settings?.allowInvites || true,
            requireApproval: workspaceData.settings?.requireApproval || false,
            privacyLevel: workspaceData.settings?.privacyLevel || 'invite-only'
          });
          
          // Determine user role
          const member = workspaceData.members.find(m => m.userId === user?.id);
          setUserRole(member?.role || 'member');
        }
      } catch (error) {
        console.error('Error fetching workspace:', error);
        setError('Failed to load workspace settings');
      } finally {
        setLoading(false);
      }
    };

    if (groupId && user) {
      fetchWorkspace();
    }
  }, [groupId, user]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const response = await workspacesAPI.updateWorkspace(groupId, {
        name: settings.name,
        description: settings.description,
        type: settings.type,
        settings: {
          isPublic: settings.isPublic,
          allowInvites: settings.allowInvites,
          requireApproval: settings.requireApproval,
          privacyLevel: settings.privacyLevel
        }
      });

      if (response.success) {
        // Update local state
        setWorkspace(prev => ({
          ...prev,
          ...response.workspace
        }));
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLeaveWorkspace = async () => {
    if (!confirm('Are you sure you want to leave this workspace? You will lose access to all workspace data.')) {
      return;
    }

    try {
      await workspacesAPI.removeMember(groupId, user.id);
      navigate('/app/groups');
    } catch (error) {
      console.error('Error leaving workspace:', error);
      setError('Failed to leave workspace');
    }
  };

  // Category options
  const categoryOptions = [
    { value: 'all', label: 'All Settings', icon: GearIcon },
    { value: 'general', label: 'General', icon: InfoCircledIcon },
    { value: 'members', label: 'Members', icon: PersonIcon },
    { value: 'privacy', label: 'Privacy', icon: LockClosedIcon },
    { value: 'danger', label: 'Danger Zone', icon: TrashIcon },
  ];

  // Check permissions
  const canEditSettings = userRole === 'owner' || userRole === 'admin';
  const isOwner = userRole === 'owner';

  // Settings widget components
  const settingsWidgets = useMemo(() => ({
    'general-settings-widget': {
      title: "General Settings",
      component: () => (
        <div className="h-full glass-card-minimal p-6 rounded-2xl flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <InfoCircledIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-dmSerif text-[var(--color-text-primary)]">General Settings</h3>
              <p className="text-sm text-[var(--color-text-secondary)] font-outfit">Basic workspace information</p>
            </div>
          </div>
          
          <div className="flex-1 space-y-6">
            <SettingItem
              label="Workspace Name"
              description="The display name for your workspace"
              value={settings.name}
              type="text"
              editable={canEditSettings}
              onChange={(value) => handleSettingChange('name', value)}
              icon={<GroupIcon className="w-4 h-4 text-[var(--color-text-tertiary)]" />}
            />
            
            <SettingItem
              label="Description"
              description="Brief description of your workspace purpose"
              value={settings.description}
              type="textarea"
              editable={canEditSettings}
              onChange={(value) => handleSettingChange('description', value)}
              icon={<InfoCircledIcon className="w-4 h-4 text-[var(--color-text-tertiary)]" />}
            />
            
            <SettingItem
              label="Workspace Type"
              description="Category that best describes your workspace"
              value={settings.type}
              type="select"
              editable={canEditSettings}
              options={[
                { label: "👨‍👩‍👧‍👦 Family", value: "family" },
                { label: "💼 Team/Work", value: "team" },
                { label: "💪 Fitness Group", value: "fitness" },
                { label: "📚 Study Group", value: "study" },
                { label: "🌟 Community", value: "community" },
                { label: "👤 Personal", value: "personal" }
              ]}
              onChange={(value) => handleSettingChange('type', value)}
              icon={<GroupIcon className="w-4 h-4 text-[var(--color-text-tertiary)]" />}
            />
          </div>
        </div>
      )
    },

    'member-management-widget': {
      title: "Member Management",
      component: () => (
        <div className="h-full glass-card-minimal p-6 rounded-2xl flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <PersonIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-dmSerif text-[var(--color-text-primary)]">Member Management</h3>
              <p className="text-sm text-[var(--color-text-secondary)] font-outfit">Control who can join and invite others</p>
            </div>
          </div>
          
          <div className="flex-1 space-y-4">
            <SettingItem
              label="Allow Invitations"
              description="Members can invite new people to the workspace"
              value={settings.allowInvites}
              type="toggle"
              editable={canEditSettings}
              onChange={(value) => handleSettingChange('allowInvites', value)}
              icon={<PersonIcon className="w-4 h-4 text-emerald-500" />}
            />
            
            <SettingItem
              label="Require Approval"
              description="New members need admin approval to join"
              value={settings.requireApproval}
              type="toggle"
              editable={canEditSettings}
              onChange={(value) => handleSettingChange('requireApproval', value)}
              icon={<CheckIcon className="w-4 h-4 text-blue-500" />}
            />
            
            <div className="pt-4 border-t border-[var(--color-border-primary)]/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[var(--color-text-primary)] font-outfit">Current Members</p>
                  <p className="text-sm text-[var(--color-text-secondary)] font-outfit">
                    {workspace?.members?.length || 0} active members
                  </p>
                </div>
                <Button
                  variant="soft"
                  size="2"
                  onClick={() => navigate(`/app/groups/${groupId}`)}
                  className="font-outfit"
                >
                  Manage Members
                </Button>
              </div>
            </div>
          </div>
        </div>
      )
    },

    'privacy-settings-widget': {
      title: "Privacy & Visibility",
      component: () => (
        <div className="h-full glass-card-minimal p-6 rounded-2xl flex flex-col">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <LockClosedIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-dmSerif text-[var(--color-text-primary)]">Privacy & Visibility</h3>
              <p className="text-sm text-[var(--color-text-secondary)] font-outfit">Control workspace visibility and access</p>
            </div>
          </div>
          
          <div className="flex-1 space-y-4">
            <SettingItem
              label="Public Workspace"
              description="Make workspace visible in public directories"
              value={settings.isPublic}
              type="toggle"
              editable={canEditSettings}
              onChange={(value) => handleSettingChange('isPublic', value)}
              icon={<LockClosedIcon className="w-4 h-4 text-purple-500" />}
            />
            
            <SettingItem
              label="Privacy Level"
              description="Who can discover and join this workspace"
              value={settings.privacyLevel}
              type="select"
              editable={canEditSettings}
              options={[
                { label: "🔒 Invite Only", value: "invite-only" },
                { label: "👥 Members Only", value: "members-only" },
                { label: "🌐 Open to All", value: "open" }
              ]}
              onChange={(value) => handleSettingChange('privacyLevel', value)}
              icon={<LockClosedIcon className="w-4 h-4 text-purple-500" />}
            />
          </div>
        </div>
      )
    },

    'danger-zone-widget': {
      title: "Danger Zone",
      component: () => (
        <div className="h-full glass-card-minimal p-6 rounded-2xl flex flex-col border-2 border-red-500/20">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
              <TrashIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-dmSerif text-[var(--color-text-primary)]">Danger Zone</h3>
              <p className="text-sm text-[var(--color-text-secondary)] font-outfit">Irreversible and destructive actions</p>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {!isOwner && (
                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/30">
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-200 font-outfit">Leave Workspace</p>
                    <p className="text-sm text-red-600 dark:text-red-300 font-outfit">
                      You will lose access to all workspace data
                    </p>
                  </div>
                  <Button
                    variant="solid"
                    color="red"
                    onClick={handleLeaveWorkspace}
                    className="font-outfit"
                  >
                    <ExitIcon className="w-4 h-4 mr-2" />
                    Leave Workspace
                  </Button>
                </div>
              )}
              
              {isOwner && (
                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/30">
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-200 font-outfit">Delete Workspace</p>
                    <p className="text-sm text-red-600 dark:text-red-300 font-outfit">
                      Permanently delete this workspace and all data
                    </p>
                  </div>
                  <Button
                    variant="solid"
                    color="red"
                    disabled={true}
                    className="font-outfit"
                  >
                    <TrashIcon className="w-4 h-4 mr-2" />
                    Delete (Coming Soon)
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }
  }), [settings, workspace, userRole, canEditSettings, isOwner, handleSettingChange, handleLeaveWorkspace, navigate, groupId]);

  // Default layouts for workspace settings widgets
  const defaultLayouts = {
    lg: [
      { i: 'general-settings-widget', x: 0, y: 0, w: 6, h: 4 },
      { i: 'member-management-widget', x: 6, y: 0, w: 6, h: 4 },
      { i: 'privacy-settings-widget', x: 0, y: 4, w: 6, h: 4 },
      { i: 'danger-zone-widget', x: 6, y: 4, w: 6, h: 4 }
    ],
    md: [
      { i: 'general-settings-widget', x: 0, y: 0, w: 6, h: 4 },
      { i: 'member-management-widget', x: 6, y: 0, w: 6, h: 4 },
      { i: 'privacy-settings-widget', x: 0, y: 4, w: 6, h: 4 },
      { i: 'danger-zone-widget', x: 6, y: 4, w: 6, h: 4 }
    ],
    sm: [
      { i: 'general-settings-widget', x: 0, y: 0, w: 4, h: 4 },
      { i: 'member-management-widget', x: 0, y: 4, w: 4, h: 4 },
      { i: 'privacy-settings-widget', x: 0, y: 8, w: 4, h: 4 },
      { i: 'danger-zone-widget', x: 0, y: 12, w: 4, h: 4 }
    ]
  };

  const defaultWidgets = ['general-settings-widget', 'member-management-widget', 'privacy-settings-widget', 'danger-zone-widget'];
  
  const storageKeys = {
    widgets: `workspaceSettingsWidgets_${groupId}`,
    layouts: `workspaceSettingsLayouts_${groupId}`
  };

  if (loading) {
    return (
      <div className="min-h-screen page-container p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-brand-600)] mx-auto mb-4"></div>
          <p className="text-[var(--color-text-secondary)] font-outfit">Loading workspace settings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen page-container p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-outfit mb-4">{error}</p>
          <Button onClick={() => navigate(`/app/groups/${groupId}`)}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-container p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex items-center gap-4 mb-6 lg:mb-0">
            <Button 
              variant="ghost" 
              size="2"
              onClick={() => navigate(`/app/groups/${groupId}`)}
              className="mr-2"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold font-dmSerif gradient-text mb-2">
                Workspace Settings
              </h1>
              <p className="text-lg text-[var(--color-text-secondary)] font-outfit">
                Configure settings for "{workspace?.name}"
              </p>
            </div>
          </div>

          {/* Save button */}
          {canEditSettings && (
            <div className="flex items-center gap-3">
              <Button
                variant="solid"
                size="3"
                onClick={handleSaveSettings}
                disabled={saving}
                className="font-outfit"
              >
                {saving ? (
                  <>
                    <UpdateIcon className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Permission Notice */}
        {!canEditSettings && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/30">
            <p className="text-amber-800 dark:text-amber-200 font-outfit">
              ⚠️ You have read-only access to these settings. Only workspace owners and admins can make changes.
            </p>
          </div>
        )}

        {/* Category Filter */}
        <div className="flex items-center gap-2 mb-8">
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

        {/* Settings Grid */}
        <BaseGridContainer
          widgets={settingsWidgets}
          defaultLayouts={defaultLayouts}
          defaultWidgets={defaultWidgets}
          storageKeys={storageKeys}
          minH={300}
        />
      </div>
    </div>
  );
};

// SettingItem component for workspace settings
const SettingItem = ({ label, description, value, type, options, onChange, icon, editable = true }) => {
  const [editMode, setEditMode] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleSave = () => {
    onChange(tempValue);
    setEditMode(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setEditMode(false);
  };

  const renderInput = () => {
    switch (type) {
      case "toggle":
        return (
          <Switch
            checked={value}
            onCheckedChange={editable ? onChange : undefined}
            disabled={!editable}
            className="data-[state=checked]:bg-[var(--color-brand-600)] scale-110"
          />
        );
      case "select":
        return (
          <Select.Root value={value} onValueChange={editable ? onChange : undefined}>
            <Select.Trigger 
              className="w-48 h-10 px-3 bg-[var(--color-surface-elevated)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/30 rounded-lg font-outfit transition-all duration-200 shadow-sm" 
              disabled={!editable}
            />
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
        return editable && editMode ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="px-3 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/30 rounded-lg font-outfit text-sm w-48"
              autoFocus
            />
            <Button size="1" variant="soft" onClick={handleSave}>
              <CheckIcon className="w-3 h-3" />
            </Button>
            <Button size="1" variant="ghost" onClick={handleCancel}>
              <Cross2Icon className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div 
            className={`text-sm font-outfit bg-[var(--color-surface-elevated)] px-3 py-2 rounded-lg border border-[var(--color-border-primary)]/30 min-w-32 ${
              editable ? 'cursor-pointer hover:bg-[var(--color-surface-hover)]' : 'opacity-60'
            }`}
            onClick={editable ? () => setEditMode(true) : undefined}
          >
            {value || 'Click to edit'}
          </div>
        );
      case "textarea":
        return editable && editMode ? (
          <div className="flex flex-col gap-2 w-full">
            <textarea
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="px-3 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/30 rounded-lg font-outfit text-sm w-full h-20 resize-none"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button size="1" variant="soft" onClick={handleSave}>
                <CheckIcon className="w-3 h-3" />
              </Button>
              <Button size="1" variant="ghost" onClick={handleCancel}>
                <Cross2Icon className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div 
            className={`text-sm font-outfit bg-[var(--color-surface-elevated)] px-3 py-2 rounded-lg border border-[var(--color-border-primary)]/30 min-w-32 min-h-[2.5rem] ${
              editable ? 'cursor-pointer hover:bg-[var(--color-surface-hover)]' : 'opacity-60'
            }`}
            onClick={editable ? () => setEditMode(true) : undefined}
          >
            {value || 'Click to edit description'}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex justify-between items-start py-3 px-2 rounded-lg hover:bg-[var(--color-surface-hover)]/30 transition-all duration-200">
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

export default WorkspaceSettings;
