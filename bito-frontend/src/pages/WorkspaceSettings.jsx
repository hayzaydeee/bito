import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Switch, Select, Button } from "@radix-ui/themes";
import {
  GearIcon,
  PersonIcon,
  LockClosedIcon,
  TrashIcon,
  ArrowLeftIcon,
  CheckIcon,
  Cross2Icon,
  PlusIcon,
  EyeOpenIcon,
  InfoCircledIcon,
  UpdateIcon,
} from "@radix-ui/react-icons";
import { useAuth } from "../contexts/AuthContext";
import { workspacesAPI } from "../services/api";
import { useAppNotifications } from "../hooks/useAppNotifications";
import LeaveWorkspaceButton from "../components/settingsPage/LeaveWorkspaceButton";

/* ================================================================
   WorkspaceSettings — sectioned list layout (no widget grid)
   ================================================================ */
const WorkspaceSettings = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { workspace: notifications, app } = useAppNotifications();

  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const [settings, setSettings] = useState({
    name: "",
    description: "",
    type: "team",
    isPublic: false,
    allowInvites: true,
    requireApproval: false,
    privacyLevel: "invite-only",
    allowMemberHabitCreation: true,
    defaultHabitVisibility: "progress-only",
  });

  /* ── fetch ──────────────────────────── */

  useEffect(() => {
    if (!groupId || !user) return;
    (async () => {
      try {
        setLoading(true);
        const res = await workspacesAPI.getWorkspace(groupId);
        if (res.success) {
          const ws = res.workspace;
          setWorkspace(ws);
          setSettings({
            name: ws.name,
            description: ws.description || "",
            type: ws.type || "team",
            isPublic: ws.settings?.isPublic || false,
            allowInvites: ws.settings?.allowInvites ?? true,
            requireApproval: ws.settings?.requireApproval || false,
            privacyLevel: ws.settings?.privacyLevel || "invite-only",
            allowMemberHabitCreation:
              ws.settings?.allowMemberHabitCreation !== false,
            defaultHabitVisibility:
              ws.settings?.defaultHabitVisibility || "progress-only",
          });

          const uid = user?.id || user?._id;
          const member = ws.members.find((m) => {
            const mid = (m.userId?._id || m.userId || "").toString();
            return mid === uid?.toString();
          });
          setUserRole(member?.role || "member");
        }
      } catch (err) {
        console.error("Error fetching workspace:", err);
        setError("Failed to load workspace settings");
      } finally {
        setLoading(false);
      }
    })();
  }, [groupId, user]);

  /* ── handlers ───────────────────────── */

  const set = (key, value) =>
    setSettings((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await workspacesAPI.updateWorkspace(groupId, {
        name: settings.name,
        description: settings.description,
        type: settings.type,
        settings: {
          isPublic: settings.isPublic,
          allowInvites: settings.allowInvites,
          requireApproval: settings.requireApproval,
          privacyLevel: settings.privacyLevel,
          allowMemberHabitCreation: settings.allowMemberHabitCreation,
          defaultHabitVisibility: settings.defaultHabitVisibility,
        },
      });
      if (res.success) {
        setWorkspace((p) => ({ ...p, ...res.workspace }));
        window.dispatchEvent(
          new CustomEvent("workspaceUpdated", {
            detail: { workspace: res.workspace },
          })
        );
        notifications.updated("Workspace settings");
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      setError("Failed to save settings");
      notifications.error("save settings", err.message || "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this workspace? This cannot be undone."
      )
    )
      return;
    const check = prompt("Type DELETE to confirm:");
    if (check !== "DELETE") {
      app.error("Deletion cancelled — confirmation text did not match.");
      return;
    }
    try {
      await workspacesAPI.deleteWorkspace(groupId);
      navigate("/app/groups", {
        state: {
          notification: {
            message: "Workspace deleted successfully",
            type: "success",
          },
        },
      });
    } catch (err) {
      notifications.error("delete workspace", err.message || "Please try again.");
    }
  };

  /* ── perms ──────────────────────────── */

  const canEdit = userRole === "owner" || userRole === "admin";
  const isOwner = userRole === "owner";

  /* ── loading / error ────────────────── */

  if (loading) {
    return (
      <div className="min-h-screen page-container px-6 py-10">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="h-8 w-48 rounded-lg bg-[var(--color-surface-elevated)] animate-pulse" />
          <div className="h-5 w-64 rounded bg-[var(--color-surface-elevated)] animate-pulse" />
          <div className="mt-8 space-y-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-2xl bg-[var(--color-surface-elevated)] animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !workspace) {
    return (
      <div className="min-h-screen page-container px-6 py-10 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-500 font-spartan mb-4">{error}</p>
          <button
            onClick={() => navigate(`/app/groups/${groupId}`)}
            className="h-9 px-4 bg-[var(--color-brand-600)] text-white rounded-lg text-sm font-spartan"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  /* ── render ─────────────────────────── */

  return (
    <div className="min-h-screen page-container px-6 py-10">
      <div className="max-w-2xl mx-auto">
        {/* header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/app/groups/${groupId}`)}
              className="w-10 h-10 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 flex items-center justify-center hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
            </button>
            <div>
              <h1 className="text-2xl font-bold font-garamond text-[var(--color-text-primary)]">
                Settings
              </h1>
              <p className="text-sm text-[var(--color-text-secondary)] font-spartan">
                {workspace?.name}
              </p>
            </div>
          </div>

          {canEdit && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 h-9 px-4 bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] disabled:opacity-60 text-white rounded-xl text-sm font-spartan font-medium transition-colors"
            >
              {saving ? (
                <>
                  <UpdateIcon className="w-3.5 h-3.5 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <CheckIcon className="w-3.5 h-3.5" />
                  Save
                </>
              )}
            </button>
          )}
        </div>

        {/* ── General ─────────────────── */}
        <Section title="General" icon={<InfoCircledIcon className="w-4 h-4" />}>
          <SettingRow
            label="Workspace Name"
            description="The display name for your workspace"
          >
            <TextInput
              value={settings.name}
              onChange={(v) => set("name", v)}
              disabled={!canEdit}
            />
          </SettingRow>

          <SettingRow
            label="Description"
            description="Brief description of your workspace purpose"
          >
            <TextInput
              value={settings.description}
              onChange={(v) => set("description", v)}
              disabled={!canEdit}
              multiline
            />
          </SettingRow>

          <SettingRow
            label="Workspace Type"
            description="Category that best describes your workspace"
          >
            <SelectInput
              value={settings.type}
              onChange={(v) => set("type", v)}
              disabled={!canEdit}
              options={[
                { label: "👨‍👩‍👧‍👦 Family", value: "family" },
                { label: "💼 Team/Work", value: "team" },
                { label: "💪 Fitness", value: "fitness" },
                { label: "📚 Study", value: "study" },
                { label: "🌍 Community", value: "community" },
                { label: "👤 Personal", value: "personal" },
              ]}
            />
          </SettingRow>
        </Section>

        {/* ── Members ─────────────────── */}
        <Section title="Members" icon={<PersonIcon className="w-4 h-4" />}>
          <SettingRow
            label="Allow Invitations"
            description="Members can invite new people"
          >
            <Switch
              checked={settings.allowInvites}
              onCheckedChange={canEdit ? (v) => set("allowInvites", v) : undefined}
              disabled={!canEdit}
            />
          </SettingRow>

          <SettingRow
            label="Require Approval"
            description="New members need admin approval"
          >
            <Switch
              checked={settings.requireApproval}
              onCheckedChange={canEdit ? (v) => set("requireApproval", v) : undefined}
              disabled={!canEdit}
            />
          </SettingRow>

          <SettingRow
            label="Allow Member Habit Creation"
            description="Members can create their own habits"
          >
            <Switch
              checked={settings.allowMemberHabitCreation}
              onCheckedChange={
                canEdit ? (v) => set("allowMemberHabitCreation", v) : undefined
              }
              disabled={!canEdit}
            />
          </SettingRow>

          <SettingRow
            label="Default Habit Visibility"
            description="Default visibility for new habits"
          >
            <SelectInput
              value={settings.defaultHabitVisibility}
              onChange={(v) => set("defaultHabitVisibility", v)}
              disabled={!canEdit}
              options={[
                { label: "🌐 Public", value: "public" },
                { label: "📊 Progress Only", value: "progress-only" },
                { label: "🔥 Streaks Only", value: "streaks-only" },
                { label: "🔒 Private", value: "private" },
              ]}
            />
          </SettingRow>
        </Section>

        {/* ── Privacy ─────────────────── */}
        <Section title="Privacy" icon={<LockClosedIcon className="w-4 h-4" />}>
          <SettingRow
            label="Public Workspace"
            description="Make workspace visible in public directories"
          >
            <Switch
              checked={settings.isPublic}
              onCheckedChange={canEdit ? (v) => set("isPublic", v) : undefined}
              disabled={!canEdit}
            />
          </SettingRow>

          <SettingRow
            label="Privacy Level"
            description="Who can discover and join this workspace"
          >
            <SelectInput
              value={settings.privacyLevel}
              onChange={(v) => set("privacyLevel", v)}
              disabled={!canEdit}
              options={[
                { label: "🔒 Invite Only", value: "invite-only" },
                { label: "👥 Members Only", value: "members-only" },
                { label: "🌐 Open to All", value: "open" },
              ]}
            />
          </SettingRow>
        </Section>

        {/* ── Danger Zone ─────────────── */}
        <Section
          title="Danger Zone"
          icon={<TrashIcon className="w-4 h-4" />}
          danger
        >
          {!isOwner && (
            <div className="py-2">
              <LeaveWorkspaceButton workspace={workspace} isOwner={false} />
            </div>
          )}

          {isOwner && (
            <SettingRow
              label="Delete Workspace"
              description="Permanently delete this workspace and all data"
            >
              <button
                onClick={handleDelete}
                className="h-8 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-spartan font-medium transition-colors"
              >
                Delete
              </button>
            </SettingRow>
          )}
        </Section>
      </div>
    </div>
  );
};

/* ================================================================
   Sub-components
   ================================================================ */

function Section({ title, icon, danger = false, children }) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span
          className={
            danger
              ? "text-red-500"
              : "text-[var(--color-text-tertiary)]"
          }
        >
          {icon}
        </span>
        <h2
          className={`text-sm font-spartan font-semibold uppercase tracking-wider ${
            danger
              ? "text-red-500"
              : "text-[var(--color-text-secondary)]"
          }`}
        >
          {title}
        </h2>
      </div>
      <div
        className={`rounded-2xl border divide-y divide-[var(--color-border-primary)]/15 ${
          danger
            ? "border-red-500/20 bg-red-500/[0.03]"
            : "border-[var(--color-border-primary)]/20 bg-[var(--color-surface-elevated)]"
        }`}
      >
        {children}
      </div>
    </section>
  );
}

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-spartan font-medium text-[var(--color-text-primary)]">
          {label}
        </p>
        {description && (
          <p className="text-xs text-[var(--color-text-tertiary)] font-spartan mt-0.5">
            {description}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function TextInput({ value, onChange, disabled, multiline = false }) {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(value);

  useEffect(() => setTemp(value), [value]);

  if (editing && !disabled) {
    const Tag = multiline ? "textarea" : "input";
    return (
      <div className="flex items-center gap-1.5">
        <Tag
          value={temp}
          onChange={(e) => setTemp(e.target.value)}
          className="px-2.5 py-1.5 bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)]/30 rounded-lg text-sm font-spartan w-44 resize-none"
          rows={multiline ? 2 : undefined}
          autoFocus
        />
        <button
          onClick={() => {
            onChange(temp);
            setEditing(false);
          }}
          className="w-7 h-7 rounded-md bg-[var(--color-brand-600)] text-white flex items-center justify-center"
        >
          <CheckIcon className="w-3 h-3" />
        </button>
        <button
          onClick={() => {
            setTemp(value);
            setEditing(false);
          }}
          className="w-7 h-7 rounded-md bg-[var(--color-surface-hover)] flex items-center justify-center"
        >
          <Cross2Icon className="w-3 h-3 text-[var(--color-text-secondary)]" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`text-sm font-spartan px-3 py-1.5 rounded-lg border border-[var(--color-border-primary)]/20 bg-[var(--color-surface-primary)] min-w-[10rem] truncate ${
        disabled ? "opacity-50" : "cursor-pointer hover:bg-[var(--color-surface-hover)]"
      }`}
      onClick={() => !disabled && setEditing(true)}
    >
      {value || "Click to edit"}
    </div>
  );
}

function SelectInput({ value, onChange, disabled, options }) {
  return (
    <Select.Root value={value} onValueChange={disabled ? undefined : onChange}>
      <Select.Trigger
        className="w-44 h-9 px-3 bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)]/20 rounded-lg font-spartan text-sm"
        disabled={disabled}
      />
      <Select.Content className="font-spartan bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 rounded-lg shadow-xl z-50">
        {options.map((o) => (
          <Select.Item
            key={o.value}
            value={o.value}
            className="px-3 py-2 hover:bg-[var(--color-surface-hover)] font-spartan cursor-pointer text-sm"
          >
            {o.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}

export default WorkspaceSettings;
