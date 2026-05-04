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
import { groupsAPI } from "../services/api";
import { useAppNotifications } from "../hooks/useAppNotifications";
import LeaveGroupButton from "../components/settingsPage/LeaveGroupButton";
import SkeletonTransition from "../components/ui/SkeletonTransition";

/* ================================================================
   GroupSettings — sectioned list layout (no widget grid)
   ================================================================ */
const GroupSettings = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { group: notifications, app } = useAppNotifications();

  const [group, setGroup] = useState(null);
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
        const res = await groupsAPI.getGroup(groupId);
        if (res.success) {
          const ws = res.group;
          setGroup(ws);
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
        console.error("Error fetching group:", err);
        setError("Failed to load group settings");
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
      const res = await groupsAPI.updateGroup(groupId, {
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
        setGroup((p) => ({ ...p, ...res.group }));
        window.dispatchEvent(
          new CustomEvent("groupUpdated", {
            detail: { group: res.group },
          })
        );
        notifications.updated("Group settings");
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
        "Are you sure you want to delete this group? This cannot be undone."
      )
    )
      return;
    const check = prompt("Type DELETE to confirm:");
    if (check !== "DELETE") {
      app.error("Deletion cancelled — confirmation text did not match.");
      return;
    }
    try {
      await groupsAPI.deleteGroup(groupId);
      navigate("/app/groups", {
        state: {
          notification: {
            message: "Group deleted successfully",
            type: "success",
          },
        },
      });
    } catch (err) {
      notifications.error("delete group", err.message || "Please try again.");
    }
  };

  /* ── analytics reset ────────────────── */
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetText, setResetText] = useState("");
  const [resetBefore, setResetBefore] = useState("");
  const [resetting, setResetting] = useState(false);

  const handleResetGroupAnalytics = async () => {
    if (resetText !== "RESET") return;
    try {
      setResetting(true);
      const res = await groupsAPI.resetGroupAnalytics(groupId, {
        before: resetBefore || undefined,
      });
      const { habitEntriesDeleted, habitsReset, membersAffected } = res.data || {};
      notifications.success(
        `Reset complete — ${habitEntriesDeleted ?? 0} entries deleted across ${membersAffected ?? 0} members`
      );
      setResetConfirm(false);
      setResetText("");
      setResetBefore("");
    } catch (err) {
      notifications.error("reset analytics", err.message || "Please try again.");
    } finally {
      setResetting(false);
    }
  };

  /* ── perms ──────────────────────────── */

  const canEdit = userRole === "owner" || userRole === "admin";
  const isOwner = userRole === "owner";

  /* ── skeleton ────────────────────────── */

  const settingsSkeleton = (
    <div className="min-h-screen page-container px-4 sm:px-6 py-10">
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

  /* ── loading / error ────────────────── */

  if (error && !group) {
    return (
      <div className="min-h-screen page-container px-4 sm:px-6 py-10 flex items-center justify-center">
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
    <SkeletonTransition isLoading={loading} skeleton={settingsSkeleton}>
    <div className="min-h-screen page-container px-4 sm:px-6 py-10">
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
                {group?.name}
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
            label="Group Name"
            description="The display name for your group"
          >
            <TextInput
              value={settings.name}
              onChange={(v) => set("name", v)}
              disabled={!canEdit}
            />
          </SettingRow>

          <SettingRow
            label="Description"
            description="Brief description of your group purpose"
          >
            <TextInput
              value={settings.description}
              onChange={(v) => set("description", v)}
              disabled={!canEdit}
              multiline
            />
          </SettingRow>

          <SettingRow
            label="Group Type"
            description="Category that best describes your group"
          >
            <SelectInput
              value={settings.type}
              onChange={(v) => set("type", v)}
              disabled={!canEdit}
              options={[
                { label: "Family", value: "family" },
                { label: "Team / Work", value: "team" },
                { label: "Fitness", value: "fitness" },
                { label: "Study", value: "study" },
                { label: "Community", value: "community" },
                { label: "Personal", value: "personal" },
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
                { label: "Public", value: "public" },
                { label: "Progress Only", value: "progress-only" },
                { label: "Streaks Only", value: "streaks-only" },
                { label: "Private", value: "private" },
              ]}
            />
          </SettingRow>
        </Section>

        {/* ── Privacy ─────────────────── */}
        <Section title="Privacy" icon={<LockClosedIcon className="w-4 h-4" />}>
          <SettingRow
            label="Public Group"
            description="Make group visible in public directories"
          >
            <Switch
              checked={settings.isPublic}
              onCheckedChange={canEdit ? (v) => set("isPublic", v) : undefined}
              disabled={!canEdit}
            />
          </SettingRow>

          <SettingRow
            label="Privacy Level"
            description="Who can discover and join this group"
          >
            <SelectInput
              value={settings.privacyLevel}
              onChange={(v) => set("privacyLevel", v)}
              disabled={!canEdit}
              options={[
                { label: "Invite Only", value: "invite-only" },
                { label: "Members Only", value: "members-only" },
                { label: "Open to All", value: "open" },
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
              <LeaveGroupButton group={group} isOwner={false} />
            </div>
          )}

          {/* Reset group completion data — admin/owner only */}
          {canEdit && (
            <div className="px-5 py-4">
              <p className="text-sm font-medium font-spartan text-[var(--color-text-primary)] mb-1">
                Reset Completion Data
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)] font-spartan mb-3">
                Permanently deletes all completion history for every member of
                this group. Group habits are kept, but streaks, completion
                rates, and entry history will be cleared.
              </p>

              {!resetConfirm ? (
                <button
                  onClick={() => setResetConfirm(true)}
                  className="h-8 px-4 border border-red-500/40 text-red-500 hover:bg-red-500/10 rounded-lg text-xs font-spartan font-medium transition-colors"
                >
                  Reset Completion Data
                </button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-[var(--color-text-secondary)] font-spartan block mb-1">
                      Clear data before (optional — leave blank to reset all)
                    </label>
                    <input
                      type="date"
                      value={resetBefore}
                      onChange={(e) => setResetBefore(e.target.value)}
                      className="h-8 px-3 rounded-lg border border-[var(--color-border-primary)]/30 bg-transparent text-xs font-spartan text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
                    />
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] font-spartan">
                    Type <strong>RESET</strong> to confirm:
                  </p>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      value={resetText}
                      onChange={(e) => setResetText(e.target.value)}
                      placeholder="RESET"
                      className="flex-1 h-8 px-3 rounded-lg border border-red-500/30 bg-transparent text-sm font-spartan text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
                    />
                    <button
                      onClick={handleResetGroupAnalytics}
                      disabled={resetText !== "RESET" || resetting}
                      className="h-8 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-spartan font-medium disabled:opacity-40 flex items-center gap-2 transition-colors"
                    >
                      {resetting ? (
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <TrashIcon className="w-3 h-3" />
                      )}
                      Confirm Reset
                    </button>
                    <button
                      onClick={() => {
                        setResetConfirm(false);
                        setResetText("");
                        setResetBefore("");
                      }}
                      className="h-8 px-3 rounded-lg text-xs font-spartan text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {isOwner && (
            <SettingRow
              label="delete group"
              description="Permanently delete this group and all data"
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
    </SkeletonTransition>
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
          className="px-2.5 py-1.5 bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)]/30 rounded-lg text-base sm:text-sm font-spartan w-full sm:w-44 resize-none"
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
      className={`text-sm font-spartan px-3 py-1.5 rounded-lg border border-[var(--color-border-primary)]/20 bg-[var(--color-surface-primary)] min-w-0 sm:min-w-[10rem] truncate ${
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
        className="w-full sm:w-44 h-9 px-3 bg-[var(--color-surface-primary)] border border-[var(--color-border-primary)]/20 rounded-lg font-spartan text-base sm:text-sm"
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

export default GroupSettings;
