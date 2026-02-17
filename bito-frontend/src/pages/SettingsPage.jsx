import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  PersonIcon,
  GearIcon,
  BellIcon,
  MoonIcon,
  SunIcon,
  DesktopIcon,
  LockClosedIcon,
  DownloadIcon,
  TrashIcon,
  GlobeIcon,
  InfoCircledIcon,
  CheckCircledIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  CheckIcon,
} from "@radix-ui/react-icons";
import { userAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useScale } from "../contexts/ScaleContext";
import usePushNotifications from "../hooks/usePushNotifications";
import PersonalityQuiz from "../components/settingsPage/PersonalityQuiz";

/* ================================================================
   SettingsPage — sectioned list layout (no widget grid)

   Sections:
     1. Profile       — avatar, name, email, connected accounts
     2. Appearance    — theme preview cards (light / dark / auto)
     3. Preferences   — timezone, week start day
     4. Notifications — email toggle, coming-soon push
     5. Privacy       — dashboard sharing per workspace
     6. Data          — export
     7. About         — version, status
     8. Danger Zone   — delete account (red border)

   Sub-route: /settings/habit-privacy/:habitId
   ================================================================ */

const SettingsPage = ({ section }) => {
  const { user } = useAuth();
  const { theme, changeTheme } = useTheme();
  const { scale: currentScale, changeScale } = useScale();
  const navigate = useNavigate();

  /* ── core state ───────────────────────── */
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [settings, setSettings] = useState({
    emailNotifications: true,
    timezone: "UTC",
    weekStartsOn: 1,
    theme: "auto",
    scale: "small",
  });

  /* ── habit-privacy sub-route state ────── */
  const [habitData, setHabitData] = useState(null);
  const [habitPrivacy, setHabitPrivacy] = useState({
    shareProgress: "progress-only",
    allowInteraction: true,
    shareInActivity: true,
  });

  /* ── privacy / workspace state ────────── */
  const [workspaces, setWorkspaces] = useState([]);
  const [dashPerms, setDashPerms] = useState({});
  const [privacyLoading, setPrivacyLoading] = useState(false);

  /* ── toast helper ─────────────────────── */
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  /* ── load profile ─────────────────────── */
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        setLoading(true);
        const res = await userAPI.getProfile();
        const u = res.data.user;
        setUserProfile(u);
        setSettings((p) => ({
          ...p,
          emailNotifications: u.preferences?.emailNotifications ?? true,
          timezone: u.preferences?.timezone ?? "UTC",
          weekStartsOn: u.preferences?.weekStartsOn ?? 1,
          theme: u.preferences?.theme ?? "auto",
          scale: u.preferences?.scale ?? "small",
        }));
      } catch {
        console.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  /* ── load workspaces for privacy section */
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        setPrivacyLoading(true);
        const token = localStorage.getItem("token");
        const base = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await fetch(`${base}/api/workspaces`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (res.ok) {
          const data = await res.json();
          setWorkspaces(data.workspaces || []);
          const perms = {};
          for (const ws of data.workspaces || []) {
            try {
              const pr = await fetch(
                `${base}/api/workspaces/${ws._id}/dashboard-permissions`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                }
              );
              perms[ws._id] = pr.ok
                ? (await pr.json()).permissions || {
                    isPublicToWorkspace: true,
                  }
                : { isPublicToWorkspace: true };
            } catch {
              perms[ws._id] = { isPublicToWorkspace: true };
            }
          }
          setDashPerms(perms);
        }
      } catch {
        console.error("Failed to load workspaces");
      } finally {
        setPrivacyLoading(false);
      }
    })();
  }, [user]);

  /* ── load habit data (sub-route) ──────── */
  useEffect(() => {
    if (section !== "habit-privacy") return;
    const id = window.location.pathname.split("/").pop();
    if (!id) return;
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const base = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await fetch(`${base}/api/habits/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        if (res.ok && data.success && data.data.habit) {
          setHabitData(data.data.habit);
          if (data.data.habit.workspaceSettings) {
            setHabitPrivacy({
              shareProgress:
                data.data.habit.workspaceSettings.shareProgress ||
                "progress-only",
              allowInteraction:
                data.data.habit.workspaceSettings.allowInteraction ?? true,
              shareInActivity:
                data.data.habit.workspaceSettings.shareInActivity ?? true,
            });
          }
        }
      } catch (e) {
        console.error("Error fetching habit:", e);
      }
    })();
  }, [section]);

  /* ── save a backend-supported setting ── */
  const saveSetting = async (key, value) => {
    const prev = settings[key];
    setSettings((p) => ({ ...p, [key]: value }));

    if (key === "theme") {
      try {
        await changeTheme(value);
        showToast("Theme updated");
      } catch {
        setSettings((p) => ({ ...p, [key]: prev }));
        showToast("Failed to update theme", "error");
      }
      return;
    }

    if (key === "scale") {
      try {
        await changeScale(value);
        showToast("Text size updated");
      } catch {
        setSettings((p) => ({ ...p, [key]: prev }));
        showToast("Failed to update text size", "error");
      }
      return;
    }

    const supported = ["emailNotifications", "timezone", "weekStartsOn"];
    if (!supported.includes(key)) return;

    try {
      setSaving(true);
      await userAPI.updateProfile({
        preferences: { ...userProfile?.preferences, [key]: value },
      });
      setUserProfile((p) => ({
        ...p,
        preferences: { ...p?.preferences, [key]: value },
      }));
      const names = {
        emailNotifications: "Email notifications",
        timezone: "Timezone",
        weekStartsOn: "Week start day",
      };
      showToast(`${names[key]} updated`);
    } catch {
      setSettings((p) => ({ ...p, [key]: prev }));
      showToast("Failed to save setting", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── toggle workspace dashboard sharing ─ */
  const toggleWsPublic = async (wsId, isPublic) => {
    const prev = dashPerms[wsId];
    setDashPerms((p) => ({
      ...p,
      [wsId]: { ...p[wsId], isPublicToWorkspace: isPublic },
    }));
    try {
      const token = localStorage.getItem("token");
      const base = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(
        `${base}/api/workspaces/${wsId}/dashboard-permissions`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...dashPerms[wsId],
            isPublicToWorkspace: isPublic,
          }),
        }
      );
      if (res.ok) {
        const result = await res.json();
        setDashPerms((p) => ({ ...p, [wsId]: result.permissions }));
        showToast("Dashboard sharing updated");
      } else {
        throw new Error();
      }
    } catch {
      setDashPerms((p) => ({ ...p, [wsId]: prev }));
      showToast("Failed to update sharing", "error");
    }
  };

  /* ── export ───────────────────────────── */
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await userAPI.exportData();
      const str = JSON.stringify(res.data, null, 2);
      const uri =
        "data:application/json;charset=utf-8," + encodeURIComponent(str);
      const a = document.createElement("a");
      a.setAttribute("href", uri);
      a.setAttribute(
        "download",
        `bito-export-${new Date().toISOString().split("T")[0]}.json`
      );
      a.click();
      showToast("Data exported — check your downloads");
    } catch {
      showToast("Export failed", "error");
    } finally {
      setExporting(false);
    }
  };

  /* ── delete account ───────────────────── */
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  const handleDelete = async () => {
    if (deleteText !== "DELETE") return;
    try {
      await userAPI.deleteAccount({
        password: "confirmed",
        confirmDeletion: "DELETE_MY_ACCOUNT",
      });
      showToast("Account deleted. Logging out…");
      setTimeout(() => (window.location.href = "/"), 2000);
    } catch (e) {
      showToast(e.message || "Deletion failed", "error");
    }
  };

  /* ── habit privacy save ───────────────── */
  const saveHabitPrivacy = async () => {
    if (!habitData) return;
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const base = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${base}/api/habits/${habitData._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workspaceSettings: habitPrivacy }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast("Privacy settings saved");
        navigate(`/app/groups/${habitData.workspaceId}`);
      } else {
        showToast(result.error || "Failed to save", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ================================================================
     PERSONALITY SUB-ROUTE
     ================================================================ */
  if (section === "personality") {
    const personality = userProfile?.aiPersonality || {};
    
    const handlePersonalitySave = async (selections) => {
      setSaving(true);
      try {
        await userAPI.updateProfile({
          aiPersonality: selections,
          personalityCustomized: true,
        });
        setUserProfile((prev) => ({
          ...prev,
          aiPersonality: selections,
          personalityCustomized: true,
        }));
        showToast("AI voice updated");
      } catch {
        showToast("Failed to save", "error");
      } finally {
        setSaving(false);
      }
    };

    const handlePersonalityReset = async () => {
      setSaving(true);
      try {
        // Re-derive from onboarding data by clearing customized flag
        await userAPI.updateProfile({
          personalityCustomized: false,
          // Send onboardingData to trigger server-side re-derivation
          onboardingData: userProfile?.onboardingData || {},
        });
        const res = await userAPI.getProfile();
        setUserProfile(res.data.user);
        showToast("Reset to defaults");
      } catch {
        showToast("Failed to reset", "error");
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="min-h-screen page-container px-4 sm:px-6 py-10">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate("/app/settings")}
            className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] font-spartan mb-6 hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to settings
          </button>

          <h1 className="text-2xl font-bold font-garamond text-[var(--color-text-primary)] mb-2">
            AI Voice
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] font-spartan mb-8">
            Choose how Bito talks to you across insights, reports, and nudges.
            Pick the voice that sounds right — not the label that sounds right.
          </p>

          <PersonalityQuiz
            currentPersonality={personality}
            onSave={handlePersonalitySave}
            onReset={handlePersonalityReset}
            saving={saving}
          />
        </div>
      </div>
    );
  }

  /* ================================================================
     HABIT PRIVACY SUB-ROUTE
     ================================================================ */
  if (section === "habit-privacy") {
    return (
      <div className="min-h-screen page-container px-4 sm:px-6 py-10">
        <div className="max-w-2xl mx-auto">
          {/* back */}
          <button
            onClick={() =>
              navigate(`/app/groups/${habitData?.workspaceId || ""}`)
            }
            className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] font-spartan mb-6 hover:text-[var(--color-text-primary)] transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to group
          </button>

          <h1 className="text-2xl font-bold font-garamond text-[var(--color-text-primary)] mb-2">
            Habit Privacy
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] font-spartan mb-8">
            {habitData
              ? `Control sharing for "${habitData.name}"`
              : "Loading…"}
          </p>

          {!habitData ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl bg-[var(--color-surface-elevated)] animate-pulse"
                />
              ))}
            </div>
          ) : (
            <>
              {/* habit card */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 mb-6">
                <span
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                  style={{
                    backgroundColor: `${habitData.color || "#4f46e5"}18`,
                  }}
                >
                  {habitData.icon || "🎯"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium font-spartan text-[var(--color-text-primary)] truncate">
                    {habitData.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)] font-spartan">
                    {habitData.category || "No category"} · Adopted from
                    workspace
                  </p>
                </div>
              </div>

              {/* share level */}
              <Section title="Share Progress Level">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      value: "full",
                      label: "Full Details",
                      desc: "Completion dates, notes, and stats",
                    },
                    {
                      value: "progress-only",
                      label: "Progress Only",
                      desc: "Completion rates and weekly summaries",
                    },
                    {
                      value: "streaks-only",
                      label: "Streaks Only",
                      desc: "Current and best streak count",
                    },
                    {
                      value: "private",
                      label: "Private",
                      desc: "Nothing shared with the group",
                    },
                  ].map((opt) => {
                    const active = habitPrivacy.shareProgress === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() =>
                          setHabitPrivacy((p) => ({
                            ...p,
                            shareProgress: opt.value,
                          }))
                        }
                        className={`text-left p-3 rounded-xl border transition-colors ${
                          active
                            ? "border-[var(--color-brand-500)] bg-[var(--color-brand-500)]/8"
                            : "border-[var(--color-border-primary)]/20 hover:bg-[var(--color-surface-hover)]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium font-spartan text-[var(--color-text-primary)]">
                            {opt.label}
                          </span>
                          {active && (
                            <CheckCircledIcon className="w-4 h-4 text-[var(--color-brand-500)]" />
                          )}
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)] font-spartan">
                          {opt.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </Section>

              {/* toggles */}
              <Section title="Interaction">
                <SettingRow
                  label="Allow Encouragements"
                  description="Let group members send you motivational messages"
                >
                  <Toggle
                    checked={habitPrivacy.allowInteraction}
                    onChange={(v) =>
                      setHabitPrivacy((p) => ({ ...p, allowInteraction: v }))
                    }
                  />
                </SettingRow>
                <SettingRow
                  label="Show in Activity Feed"
                  description="Completions appear in the group activity"
                >
                  <Toggle
                    checked={habitPrivacy.shareInActivity}
                    onChange={(v) =>
                      setHabitPrivacy((p) => ({ ...p, shareInActivity: v }))
                    }
                  />
                </SettingRow>
              </Section>

              {/* actions */}
              <div className="flex items-center gap-3 mt-8">
                <button
                  onClick={() =>
                    navigate(`/app/groups/${habitData.workspaceId}`)
                  }
                  className="flex-1 h-10 rounded-xl border border-[var(--color-border-primary)]/30 text-sm font-spartan font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveHabitPrivacy}
                  disabled={saving}
                  className="flex-1 h-10 rounded-xl bg-[var(--color-brand-600)] text-white text-sm font-spartan font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      Save
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
        <Toast toast={toast} />
      </div>
    );
  }

  /* ================================================================
     MAIN SETTINGS PAGE
     ================================================================ */

  if (loading) {
    return (
      <div className="min-h-screen page-container px-4 sm:px-6 py-10">
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="h-8 w-40 rounded-lg bg-[var(--color-surface-elevated)] animate-pulse" />
          <div className="h-5 w-64 rounded bg-[var(--color-surface-elevated)] animate-pulse" />
          <div className="mt-8 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-[var(--color-surface-elevated)] animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── theme cards config ───────────────── */
  const themeCards = [
    {
      value: "light",
      label: "Light",
      icon: SunIcon,
      bg: "#ffffff",
      fg: "#1a1a1a",
      accent: "#4f46e5",
      surface: "#f5f5f5",
    },
    {
      value: "dark",
      label: "Dark",
      icon: MoonIcon,
      bg: "#0f0f0f",
      fg: "#e5e5e5",
      accent: "#818cf8",
      surface: "#1a1a1a",
    },
    {
      value: "auto",
      label: "System",
      icon: DesktopIcon,
      bg: "linear-gradient(135deg, #ffffff 50%, #0f0f0f 50%)",
      fg: "#888",
      accent: "#4f46e5",
      surface: "#ccc",
    },
  ];

  const timezones = [
    { label: "UTC", value: "UTC" },
    { label: "EST (UTC-5)", value: "America/New_York" },
    { label: "CST (UTC-6)", value: "America/Chicago" },
    { label: "MST (UTC-7)", value: "America/Denver" },
    { label: "PST (UTC-8)", value: "America/Los_Angeles" },
    { label: "GMT (UTC+0)", value: "Europe/London" },
    { label: "CET (UTC+1)", value: "Europe/Paris" },
    { label: "JST (UTC+9)", value: "Asia/Tokyo" },
    { label: "AEST (UTC+10)", value: "Australia/Sydney" },
  ];

  const weekDays = [
    { label: "Sunday", value: 0 },
    { label: "Monday", value: 1 },
    { label: "Tuesday", value: 2 },
    { label: "Wednesday", value: 3 },
    { label: "Thursday", value: 4 },
    { label: "Friday", value: 5 },
    { label: "Saturday", value: 6 },
  ];

  return (
    <div className="min-h-screen page-container px-4 sm:px-6 py-10">
      <div className="max-w-2xl mx-auto">
        {/* ── header ──────────────────── */}
        <h1 className="text-2xl font-bold font-garamond text-[var(--color-text-primary)] mb-1">
          Settings
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] font-spartan mb-10">
          Manage your account, preferences, and data.
        </p>

        {/* ═══════ 1. PROFILE ═══════ */}
        <Section title="Profile" icon={PersonIcon}>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20">
            <div className="w-14 h-14 rounded-full bg-[var(--color-brand-600)] flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
              {userProfile?.avatar ? (
                <img
                  src={userProfile.avatar}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                userProfile?.name?.charAt(0)?.toUpperCase() || "U"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-medium font-spartan text-[var(--color-text-primary)] truncate">
                {userProfile?.name || "—"}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] font-spartan truncate">
                {userProfile?.email || "—"}
              </p>
              {(userProfile?.hasGoogleAuth || userProfile?.hasGithubAuth) && (
                <p className="text-xs text-[var(--color-text-tertiary)] font-spartan mt-0.5">
                  Connected:{" "}
                  {[
                    userProfile.hasGoogleAuth && "Google",
                    userProfile.hasGithubAuth && "GitHub",
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
            </div>
          </div>
        </Section>

        {/* ═══════ 2. APPEARANCE ═══════ */}
        <Section title="Appearance" icon={MoonIcon}>
          <div className="grid grid-cols-3 gap-3">
            {themeCards.map((t) => {
              const active = settings.theme === t.value;
              const Icon = t.icon;
              return (
                <button
                  key={t.value}
                  onClick={() => saveSetting("theme", t.value)}
                  className={`relative rounded-xl border-2 overflow-hidden transition-all ${
                    active
                      ? "border-[var(--color-brand-500)] ring-2 ring-[var(--color-brand-500)]/20"
                      : "border-[var(--color-border-primary)]/20 hover:border-[var(--color-border-primary)]/50"
                  }`}
                >
                  {/* mini preview */}
                  <div
                    className="h-20 p-3 flex flex-col justify-between"
                    style={{ background: t.bg }}
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: t.accent }}
                      />
                      <div
                        className="h-1.5 w-12 rounded"
                        style={{ backgroundColor: t.surface }}
                      />
                    </div>
                    <div className="space-y-1">
                      <div
                        className="h-1 w-16 rounded"
                        style={{ backgroundColor: t.surface }}
                      />
                      <div
                        className="h-1 w-10 rounded"
                        style={{ backgroundColor: t.surface }}
                      />
                    </div>
                  </div>
                  {/* label */}
                  <div
                    className={`flex items-center justify-center gap-2 py-2.5 text-sm font-spartan font-medium ${
                      active
                        ? "text-[var(--color-brand-600)] bg-[var(--color-brand-500)]/8"
                        : "text-[var(--color-text-secondary)]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </div>
                  {active && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--color-brand-500)] flex items-center justify-center">
                      <CheckIcon className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ═══════ 2b. TEXT SIZE ═══════ */}
        <Section title="Text Size" icon={GearIcon}>
          <p className="text-xs text-[var(--color-text-tertiary)] font-spartan mb-3">
            Scale text and UI elements for better readability
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                value: "small",
                label: "Small",
                description: "Default",
                textBarWidths: ["w-14", "w-10"],
                textBarHeights: ["h-1", "h-[3px]"],
                dotSize: "w-1.5 h-1.5",
                headingHeight: "h-1.5",
                headingWidth: "w-10",
              },
              {
                value: "medium",
                label: "Medium",
                description: "Comfortable",
                textBarWidths: ["w-14", "w-10"],
                textBarHeights: ["h-1.5", "h-1"],
                dotSize: "w-2 h-2",
                headingHeight: "h-2",
                headingWidth: "w-11",
              },
              {
                value: "large",
                label: "Large",
                description: "Spacious",
                textBarWidths: ["w-14", "w-10"],
                textBarHeights: ["h-2", "h-1.5"],
                dotSize: "w-2.5 h-2.5",
                headingHeight: "h-2.5",
                headingWidth: "w-12",
              },
            ].map((s) => {
              const active = settings.scale === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => saveSetting("scale", s.value)}
                  className={`relative rounded-xl border-2 overflow-hidden transition-all ${
                    active
                      ? "border-[var(--color-brand-500)] ring-2 ring-[var(--color-brand-500)]/20"
                      : "border-[var(--color-border-primary)]/20 hover:border-[var(--color-border-primary)]/50"
                  }`}
                >
                  {/* mini preview showing relative text sizes */}
                  <div className="h-20 p-3 flex flex-col justify-between bg-[var(--color-surface-primary)]">
                    {/* mock heading */}
                    <div className="flex items-center gap-1.5">
                      <div className={`${s.dotSize} rounded-full bg-[var(--color-brand-400)]`} />
                      <div
                        className={`${s.headingHeight} ${s.headingWidth} rounded bg-[var(--color-text-primary)]/25`}
                      />
                    </div>
                    {/* mock body lines */}
                    <div className="space-y-1">
                      <div
                        className={`${s.textBarHeights[0]} ${s.textBarWidths[0]} rounded bg-[var(--color-text-secondary)]/30`}
                      />
                      <div
                        className={`${s.textBarHeights[1]} ${s.textBarWidths[1]} rounded bg-[var(--color-text-secondary)]/20`}
                      />
                    </div>
                  </div>
                  {/* label */}
                  <div
                    className={`flex flex-col items-center justify-center py-2.5 text-sm font-spartan font-medium ${
                      active
                        ? "text-[var(--color-brand-600)] bg-[var(--color-brand-500)]/8"
                        : "text-[var(--color-text-secondary)]"
                    }`}
                  >
                    <span>{s.label}</span>
                    <span className="text-[10px] font-normal opacity-60">{s.description}</span>
                  </div>
                  {active && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--color-brand-500)] flex items-center justify-center">
                      <CheckIcon className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ═══════ 3. PREFERENCES ═══════ */}
        <Section title="Preferences" icon={GearIcon}>
          <SettingRow
            label="Timezone"
            description="Your local timezone for accurate tracking"
          >
            <SelectInput
              value={settings.timezone}
              options={timezones}
              onChange={(v) => saveSetting("timezone", v)}
              disabled={saving}
            />
          </SettingRow>
          <SettingRow
            label="Week Starts On"
            description="Which day your week begins"
          >
            <SelectInput
              value={settings.weekStartsOn}
              options={weekDays}
              onChange={(v) => saveSetting("weekStartsOn", Number(v))}
              disabled={saving}
            />
          </SettingRow>
        </Section>

        {/* ═══════ 4. NOTIFICATIONS ═══════ */}
        <NotificationSection saving={saving} settings={settings} saveSetting={saveSetting} />

        {/* ═══════ 5. PRIVACY ═══════ */}
        <Section title="Privacy" icon={LockClosedIcon}>
          <p className="text-xs text-[var(--color-text-secondary)] font-spartan mb-4">
            Control which group members can view your dashboard and habit
            progress.
          </p>

          {privacyLoading ? (
            <div className="flex items-center justify-center py-6">
              <span className="w-5 h-5 border-2 border-[var(--color-brand-500)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : workspaces.length === 0 ? (
            <p className="text-sm text-[var(--color-text-tertiary)] font-spartan text-center py-4">
              You're not a member of any workspaces yet.
            </p>
          ) : (
            <div className="space-y-2">
              {workspaces.map((ws) => {
                const pub = dashPerms[ws._id]?.isPublicToWorkspace ?? true;
                return (
                  <div
                    key={ws._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium font-spartan text-[var(--color-text-primary)] truncate">
                        {ws.name}
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)] font-spartan">
                        {pub
                          ? "Members can view your dashboard"
                          : "Dashboard is private"}
                      </p>
                    </div>
                    <Toggle
                      checked={pub}
                      onChange={(v) => toggleWsPublic(ws._id, v)}
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex items-start gap-2.5 p-3 rounded-xl bg-[var(--color-surface-elevated)]/60 border border-[var(--color-border-primary)]/10">
            <InfoCircledIcon className="w-4 h-4 text-[var(--color-text-tertiary)] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[var(--color-text-tertiary)] font-spartan leading-relaxed">
              When dashboard sharing is on, members see a read-only view of your
              habits and progress. Personal notes stay hidden.
            </p>
          </div>
        </Section>

        {/* ═══════ 6. DATA ═══════ */}
        <Section title="Data" icon={DownloadIcon}>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <DownloadIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
              <div className="text-left">
                <p className="text-sm font-medium font-spartan text-[var(--color-text-primary)]">
                  Export All Data
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] font-spartan">
                  Download your habits, entries, and journal as JSON
                </p>
              </div>
            </div>
            {exporting ? (
              <span className="w-4 h-4 border-2 border-[var(--color-brand-500)] border-t-transparent rounded-full animate-spin" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-[var(--color-text-tertiary)]" />
            )}
          </button>
        </Section>

        {/* ═══════ 7. ABOUT ═══════ */}
        <Section title="About" icon={InfoCircledIcon}>
          <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20">
            <div>
              <p className="text-sm font-medium font-spartan text-[var(--color-text-primary)]">
                bito
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)] font-spartan">
                v1.0.0
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-[var(--color-text-tertiary)] font-spartan">
                All systems operational
              </span>
            </div>
          </div>

          {/* Replay tour */}
          <button
            onClick={() => {
              const uid = user?._id || user?.id || '';
              const key = uid ? `bito_tour_completed_${uid}` : 'bito_tour_completed';
              try { localStorage.removeItem(key); } catch {}
              navigate('/app/dashboard');
            }}
            className="w-full mt-2 flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">🗺️</span>
              <span className="text-sm font-medium font-spartan text-[var(--color-text-primary)]">
                Replay dashboard tour
              </span>
            </div>
            <ChevronRightIcon className="w-4 h-4 text-[var(--color-text-tertiary)]" />
          </button>

          {/* Replay analytics tour */}
          <button
            onClick={() => {
              const uid = user?._id || user?.id || '';
              const key = uid ? `bito_analytics_tour_completed_${uid}` : 'bito_analytics_tour_completed';
              try { localStorage.removeItem(key); } catch {}
              navigate('/app/analytics');
            }}
            className="w-full mt-2 flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">📊</span>
              <span className="text-sm font-medium font-spartan text-[var(--color-text-primary)]">
                Replay analytics tour
              </span>
            </div>
            <ChevronRightIcon className="w-4 h-4 text-[var(--color-text-tertiary)]" />
          </button>
        </Section>

        {/* ═══════ 7.5 AI VOICE ═══════ */}
        <Section title="AI Voice" icon={GearIcon}>
          <button
            onClick={() => navigate("/app/settings/personality")}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 hover:bg-[var(--color-surface-hover)] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="text-base">🗣️</span>
              <div className="text-left">
                <p className="text-sm font-medium font-spartan text-[var(--color-text-primary)]">
                  Customise how Bito talks to you
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] font-spartan mt-0.5">
                  {(() => {
                    const p = userProfile?.aiPersonality || {};
                    const labels = {
                      tone: { warm: "Warm", direct: "Direct", playful: "Playful", neutral: "Neutral" },
                      focus: { wins: "Wins", patterns: "Patterns", actionable: "Actions", balanced: "Balanced" },
                      verbosity: { concise: "Concise", detailed: "Detailed" },
                      accountability: { gentle: "Gentle", honest: "Honest", tough: "Tough" },
                    };
                    return [
                      labels.tone[p.tone] || "Warm",
                      labels.focus[p.focus] || "Balanced",
                      labels.verbosity[p.verbosity] || "Concise",
                      labels.accountability[p.accountability] || "Gentle",
                    ].join(" · ");
                  })()}
                </p>
              </div>
            </div>
            <ChevronRightIcon className="w-4 h-4 text-[var(--color-text-tertiary)]" />
          </button>
        </Section>

        {/* ═══════ 8. DANGER ZONE ═══════ */}
        <div className="mt-10 mb-20">
          <div className="rounded-xl border border-red-500/30 p-5">
            <h3 className="text-sm font-medium font-spartan text-red-500 mb-1">
              Danger Zone
            </h3>
            <p className="text-xs text-[var(--color-text-tertiary)] font-spartan mb-4">
              Permanently delete your account and all associated data. This
              cannot be undone.
            </p>

            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="h-9 px-5 rounded-xl border border-red-500/40 text-sm font-spartan font-medium text-red-500 hover:bg-red-500/10 transition-colors"
              >
                Delete Account
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-[var(--color-text-secondary)] font-spartan">
                  Type <strong>DELETE</strong> to confirm:
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    value={deleteText}
                    onChange={(e) => setDeleteText(e.target.value)}
                    placeholder="DELETE"
                    className="flex-1 h-9 px-3 rounded-lg border border-red-500/30 bg-transparent text-base sm:text-sm font-spartan text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-red-500/30"
                  />
                  <button
                    onClick={handleDelete}
                    disabled={deleteText !== "DELETE"}
                    className="h-9 px-5 rounded-lg bg-red-500 text-white text-sm font-spartan font-medium disabled:opacity-40 flex items-center gap-2"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                    Confirm
                  </button>
                  <button
                    onClick={() => {
                      setDeleteConfirm(false);
                      setDeleteText("");
                    }}
                    className="h-9 px-3 rounded-lg text-sm font-spartan text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* saving indicator */}
      {saving && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 shadow-lg text-xs font-spartan text-[var(--color-text-secondary)]">
          <span className="w-3.5 h-3.5 border-2 border-[var(--color-brand-500)] border-t-transparent rounded-full animate-spin" />
          Saving…
        </div>
      )}

      <Toast toast={toast} />
    </div>
  );
};

/* ================================================================
   Sub-components
   ================================================================ */

/** Section wrapper with optional icon */
/** ═══════ Notification Section (Phase 16) ═══════ */
const NotificationSection = ({ saving, settings, saveSetting }) => {
  const { permission, isSubscribed, isLoading, supported, subscribe, unsubscribe, sendTest } = usePushNotifications();
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handlePushToggle = async (enable) => {
    try {
      if (enable) {
        await subscribe();
      } else {
        await unsubscribe();
      }
    } catch (err) {
      console.error('Push toggle failed:', err);
    }
  };

  const handleTest = async () => {
    setTestSending(true);
    setTestResult(null);
    try {
      await sendTest();
      setTestResult('sent');
    } catch {
      setTestResult('error');
    } finally {
      setTestSending(false);
      setTimeout(() => setTestResult(null), 3000);
    }
  };

  return (
    <Section title="Notifications" icon={BellIcon}>
      {/* Push notifications */}
      <SettingRow
        label="Push Notifications"
        description={
          !supported
            ? 'Not supported in this browser'
            : permission === 'denied'
              ? 'Blocked — enable in browser settings'
              : 'Habit reminders & achievement alerts'
        }
        disabled={!supported || permission === 'denied'}
      >
        <Toggle
          checked={isSubscribed}
          onChange={handlePushToggle}
          disabled={!supported || permission === 'denied' || isLoading}
        />
      </SettingRow>

      {/* Test notification button */}
      {isSubscribed && (
        <div className="ml-1 mb-3">
          <button
            onClick={handleTest}
            disabled={testSending}
            className="text-xs font-spartan font-medium text-[var(--color-brand-500)] hover:text-[var(--color-brand-600)] transition-colors disabled:opacity-50"
          >
            {testSending ? 'Sending…' : testResult === 'sent' ? '✓ Test sent!' : testResult === 'error' ? '✗ Failed' : 'Send test notification'}
          </button>
        </div>
      )}

      <div className="border-t border-[var(--color-border-primary)]/10 pt-3 mt-1">
        {/* Email notifications */}
        <SettingRow
          label="Email Updates"
          description="Weekly reports and summaries"
        >
          <Toggle
            checked={settings.emailNotifications}
            onChange={(v) => saveSetting("emailNotifications", v)}
            disabled={saving}
          />
        </SettingRow>
      </div>

      {/* Permission info */}
      {supported && permission === 'denied' && (
        <div className="flex items-start gap-2 mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <ExclamationTriangleIcon className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs font-spartan text-[var(--color-text-secondary)]">
            Notifications are blocked by your browser. To enable them, click the lock icon in your address bar and allow notifications for this site.
          </p>
        </div>
      )}
    </Section>
  );
};

const Section = ({ title, icon: Icon, children }) => (
  <div className="mb-8">
    <div className="flex items-center gap-2 mb-3">
      {Icon && (
        <Icon className="w-4 h-4 text-[var(--color-text-tertiary)]" />
      )}
      <h2 className="text-xs font-medium font-spartan text-[var(--color-text-tertiary)] uppercase tracking-wider">
        {title}
      </h2>
    </div>
    {children}
  </div>
);

/** A single setting row — label + description on left, control on right */
const SettingRow = ({ label, description, disabled, children }) => (
  <div
    className={`flex items-center justify-between py-3 ${
      disabled ? "opacity-50" : ""
    }`}
  >
    <div className="min-w-0 flex-1 pr-4">
      <p className="text-sm font-medium font-spartan text-[var(--color-text-primary)]">
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

/** Simple toggle switch */
const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
    className={`relative w-11 h-6 rounded-full transition-colors ${
      checked
        ? "bg-[var(--color-brand-500)]"
        : "bg-[var(--color-border-primary)]/40"
    } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
  >
    <span
      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
        checked ? "translate-x-5" : "translate-x-0"
      }`}
    />
  </button>
);

/** Native select styled to match design system */
const SelectInput = ({ value, options, onChange, disabled }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    className="h-9 px-3 pr-8 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 text-base sm:text-sm font-spartan text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-500)]/30 disabled:opacity-50 appearance-none cursor-pointer"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
      backgroundPosition: "right 0.5rem center",
      backgroundRepeat: "no-repeat",
      backgroundSize: "1.25em 1.25em",
    }}
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);

/** Toast notification */
const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div
        className={`flex items-center gap-2.5 px-5 py-3 rounded-xl shadow-lg text-sm font-spartan font-medium ${
          toast.type === "error"
            ? "bg-red-500 text-white"
            : "bg-[var(--color-brand-600)] text-white"
        }`}
      >
        {toast.type === "error" ? (
          <ExclamationTriangleIcon className="w-4 h-4" />
        ) : (
          <CheckCircledIcon className="w-4 h-4" />
        )}
        {toast.message}
      </div>
    </div>
  );
};

export default SettingsPage;
