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
import IntensitySelector from "../components/groups/IntensitySelector";
import "../components/groups/groups-theme.css";

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
            intensity: ws.settings?.intensity || "accountable",
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
          intensity: settings.intensity,
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
    <div className="grp grp-surface min-h-screen px-4 sm:px-8 py-7 sm:py-10">
      <div className="max-w-2xl mx-auto space-y-8 animate-pulse">
        <div>
          <div className="h-3 w-20 rounded bg-[var(--surface-2)] mb-2" />
          <div className="h-10 w-48 rounded bg-[var(--surface-2)] mb-4" />
          <div className="grp-rule" />
        </div>
        <div className="space-y-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 grp-card bg-[var(--surface-2)]" />
          ))}
        </div>
      </div>
    </div>
  );

  /* ── loading / error ────────────────── */

  if (error && !group) {
    return (
      <div className="grp grp-surface min-h-screen px-4 sm:px-8 py-10 flex items-center justify-center">
        <div className="text-center">
          <p className="grp-mono text-[12px] text-[var(--rose)] mb-4">{error}</p>
          <button
            onClick={() => navigate(`/app/groups/${groupId}`)}
            className="grp-btn grp-btn--signal mx-auto"
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
    <div className="grp grp-surface min-h-screen px-4 sm:px-8 py-7 sm:py-10">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* header */}
        <div className="grp-rise" style={{ animationDelay: "40ms" }}>
          <button
            onClick={() => navigate(`/app/groups/${groupId}`)}
            className="grp-btn grp-btn--sm mb-6 flex items-center gap-1.5"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            Group
          </button>
          
          <div className="flex items-end justify-between gap-4 flex-wrap mb-1">
            <div className="min-w-0">
              <p className="grp-kicker text-[var(--signal)] mb-1.5">Group — Configuration</p>
              <h1 className="grp-display text-4xl sm:text-5xl font-bold text-[var(--ink)] leading-none">
                Settings
              </h1>
            </div>

            {canEdit && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="grp-btn grp-btn--signal disabled:opacity-60"
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
              </div>
            )}
          </div>
          <p className="grp-mono text-[11px] text-[var(--ink-3)] mt-2 uppercase tracking-wider">
            {group?.name}
          </p>
          <div className="grp-rule mt-4" />
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

        {/* ── Intensity ─────────────── */}
        <Section title="Group Intensity" icon={<GearIcon className="w-4 h-4" />}>
          <div className="px-5 py-4">
            <IntensitySelector
              value={settings.intensity || "accountable"}
              onChange={canEdit ? (v) => set("intensity", v) : undefined}
              readOnly={!canEdit}
            />
          </div>
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
              <p className="text-sm font-semibold text-[var(--ink)] mb-1">
                Reset Completion Data
              </p>
              <p className="text-xs text-[var(--ink-3)] mb-3 leading-relaxed">
                Permanently deletes all completion history for every member of
                this group. Group habits are kept, but streaks, completion
                rates, and entry history will be cleared.
              </p>

              {!resetConfirm ? (
                <button
                  onClick={() => setResetConfirm(true)}
                  className="grp-btn grp-btn--sm text-[var(--rose)] border-[var(--rose)]/40 hover:bg-[var(--rose)]/10"
                >
                  Reset Completion Data
                </button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="grp-kicker block mb-1.5">
                      Clear data before (optional)
                    </label>
                    <input
                      type="date"
                      value={resetBefore}
                      onChange={(e) => setResetBefore(e.target.value)}
                      className="h-9 px-3 rounded-[9px] border border-[var(--line-2)] bg-[var(--bg-2)] text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--rose)]"
                    />
                  </div>
                  <p className="grp-mono text-[10px] text-[var(--ink-3)] uppercase tracking-wider">
                    Type <strong className="text-[var(--rose)]">RESET</strong> to confirm
                  </p>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      value={resetText}
                      onChange={(e) => setResetText(e.target.value)}
                      placeholder="RESET"
                      className="flex-1 h-9 px-3 rounded-[9px] border border-[var(--rose)]/30 bg-[var(--bg-2)] grp-mono text-sm tracking-widest text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:border-[var(--rose)]"
                    />
                    <button
                      onClick={handleResetGroupAnalytics}
                      disabled={resetText !== "RESET" || resetting}
                      className="grp-btn grp-btn--sm bg-[var(--rose)] border-[var(--rose)] text-[#1a0509] hover:brightness-110 disabled:opacity-40"
                    >
                      {resetting ? (
                        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <TrashIcon className="w-3 h-3" />
                      )}
                      Confirm
                    </button>
                    <button
                      onClick={() => {
                        setResetConfirm(false);
                        setResetText("");
                        setResetBefore("");
                      }}
                      className="grp-btn grp-btn--sm"
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
                className="grp-btn grp-btn--sm bg-[var(--rose)] border-[var(--rose)] text-[#1a0509] hover:brightness-110"
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
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span className={danger ? "text-[var(--rose)]" : "text-[var(--ink-3)]"}>
          {icon}
        </span>
        <h2 className={`grp-kicker ${danger ? "text-[var(--rose)]" : ""}`}>
          {title}
        </h2>
      </div>
      <div
        className={`grp-card divide-y divide-[var(--line)] overflow-hidden ${
          danger ? "border-[var(--rose)]/25 bg-[var(--rose)]/[0.03]" : ""
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
        <p className="text-sm font-semibold text-[var(--ink)]">{label}</p>
        {description && (
          <p className="text-xs text-[var(--ink-3)] mt-0.5">{description}</p>
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
          className="px-2.5 py-1.5 bg-[var(--bg-2)] border border-[var(--line-2)] rounded-[9px] text-base sm:text-sm w-full sm:w-44 resize-none text-[var(--ink)] focus:outline-none focus:border-[var(--signal)]"
          rows={multiline ? 2 : undefined}
          autoFocus
        />
        <button
          onClick={() => {
            onChange(temp);
            setEditing(false);
          }}
          className="w-7 h-7 rounded-[7px] bg-[var(--signal)] text-[var(--signal-ink)] flex items-center justify-center"
        >
          <CheckIcon className="w-3 h-3" />
        </button>
        <button
          onClick={() => {
            setTemp(value);
            setEditing(false);
          }}
          className="w-7 h-7 rounded-[7px] bg-[var(--surface-2)] flex items-center justify-center text-[var(--ink-2)]"
        >
          <Cross2Icon className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`text-sm px-3 py-1.5 rounded-[9px] border border-[var(--line-2)] bg-[var(--bg-2)] text-[var(--ink)] min-w-0 sm:min-w-[10rem] truncate ${
        disabled ? "opacity-50" : "cursor-pointer hover:border-[var(--line-3)]"
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
        className="w-full sm:w-44 h-9 px-3 bg-[var(--bg-2)] border border-[var(--line-2)] rounded-[9px] text-base sm:text-sm text-[var(--ink)]"
        disabled={disabled}
      />
      <Select.Content className="bg-[var(--surface-2)] border border-[var(--line-3)] rounded-[10px] shadow-xl z-50">
        {options.map((o) => (
          <Select.Item
            key={o.value}
            value={o.value}
            className="px-3 py-2 hover:bg-[var(--surface)] cursor-pointer text-sm text-[var(--ink)]"
          >
            {o.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}

export default GroupSettings;
