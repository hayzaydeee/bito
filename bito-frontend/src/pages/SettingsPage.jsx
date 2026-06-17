import { useState, useEffect, useCallback } from "react";
import HabitIcon from "../components/shared/HabitIcon";
import { useNavigate } from "react-router-dom";
import {
  PersonIcon,
  GearIcon,
  BellIcon,
  MoonIcon,
  SunIcon,
  DesktopIcon,
  Half2Icon,
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
  MagicWandIcon,
  DashboardIcon,
  BarChartIcon,
  ReaderIcon,
  ChatBubbleIcon,
} from "@radix-ui/react-icons";
import { userAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useScale } from "../contexts/ScaleContext";
import usePushNotifications from "../hooks/usePushNotifications";
import PersonalityQuiz from "../components/settingsPage/PersonalityQuiz";
import AvatarPicker from "../components/ui/AvatarPicker";
import DesignSystemSwitcher from "../components/ui/DesignSystemSwitcher";
import SkeletonTransition from "../components/ui/SkeletonTransition";
import AnimatedList from "../components/ui/AnimatedList";
import { motion } from "framer-motion";
import { listItemVariants } from "../utils/motion";

/* ================================================================
   SettingsPage — sectioned list layout (no widget grid)

   Sections:
     1. Profile       — avatar, name, email, connected accounts
     2. Appearance    — theme preview cards (light / dark / auto)
     3. Preferences   — timezone, week start day
     4. Notifications — email toggle, coming-soon push
     5. Privacy       — dashboard sharing per group
     6. Data          — export
     7. About         — version, status
     8. Danger Zone   — delete account (red border)

   Sub-route: /settings/habit-privacy/:habitId
   ================================================================ */

const SettingsPage = ({ section }) => {
  const { user, updateUser } = useAuth();
  const { changeTheme, designSystem, standardGrid, changeStandardGrid } = useTheme();
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
    scale: "medium",
    aiDashboard: true,
    aiAnalytics: true,
  });

  /* ── habit-privacy sub-route state ────── */
  const [habitData, setHabitData] = useState(null);
  const [habitPrivacy, setHabitPrivacy] = useState({
    shareProgress: "progress-only",
    allowInteraction: true,
    shareInActivity: true,
  });

  /* ── privacy / group state ────────── */
  const [groups, setGroups] = useState([]);
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
          scale: u.preferences?.scale ?? "medium",
          aiDashboard: u.preferences?.aiDashboard ?? true,
          aiAnalytics: u.preferences?.aiAnalytics ?? true,
          journalDefaultView: u.preferences?.journalDefaultView ?? "day",
          dashboardStyle: u.preferences?.dashboardStyle ?? "daybook",
        }));
      } catch {
        console.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  /* ── load groups for privacy section */
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        setPrivacyLoading(true);
        const token = localStorage.getItem("token");
        const base = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await fetch(`${base}/api/groups`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (res.ok) {
          const data = await res.json();
          setGroups(data.groups || []);
          const perms = {};
          for (const ws of data.groups || []) {
            try {
              const pr = await fetch(
                `${base}/api/groups/${ws._id}/dashboard-permissions`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                }
              );
              perms[ws._id] = pr.ok
                ? (await pr.json()).permissions || {
                    isPublicToGroup: true,
                  }
                : { isPublicToGroup: true };
            } catch {
              perms[ws._id] = { isPublicToGroup: true };
            }
          }
          setDashPerms(perms);
        }
      } catch {
        console.error("Failed to load groups");
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
          if (data.data.habit.groupSettings) {
            setHabitPrivacy({
              shareProgress:
                data.data.habit.groupSettings.shareProgress ||
                "progress-only",
              allowInteraction:
                data.data.habit.groupSettings.allowInteraction ?? true,
              shareInActivity:
                data.data.habit.groupSettings.shareInActivity ?? true,
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

    const supported = ["emailNotifications", "timezone", "weekStartsOn", "aiDashboard", "aiAnalytics", "journalDefaultView", "dashboardStyle"];
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
        aiDashboard: "Dashboard AI insights",
        aiAnalytics: "Analytics AI insights",
        journalDefaultView: "Journal default view",
        dashboardStyle: "Dashboard style",
      };
      showToast(`${names[key]} updated`);
    } catch {
      setSettings((p) => ({ ...p, [key]: prev }));
      showToast("Failed to save setting", "error");
    } finally {
      setSaving(false);
    }
  };

  /* ── toggle group dashboard sharing ─ */
  const toggleWsPublic = async (wsId, isPublic) => {
    const prev = dashPerms[wsId];
    setDashPerms((p) => ({
      ...p,
      [wsId]: { ...p[wsId], isPublicToGroup: isPublic },
    }));
    try {
      const token = localStorage.getItem("token");
      const base = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(
        `${base}/api/groups/${wsId}/dashboard-permissions`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...dashPerms[wsId],
            isPublicToGroup: isPublic,
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

  /* ── analytics reset ──────────────────── */
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetText, setResetText] = useState("");
  const [resetBefore, setResetBefore] = useState("");
  const [resetting, setResetting] = useState(false);

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

  const handleResetAnalytics = async () => {
    if (resetText !== "RESET") return;
    try {
      setResetting(true);
      const res = await userAPI.resetAnalytics({
        before: resetBefore || undefined,
      });
      const { habitEntriesDeleted, habitsReset } = res.data || {};
      showToast(
        `Reset complete — ${habitEntriesDeleted ?? 0} entries deleted, ${habitsReset ?? 0} habits cleared`
      );
      window.dispatchEvent(new CustomEvent('analyticsReset'));
      setResetConfirm(false);
      setResetText("");
      setResetBefore("");
    } catch (e) {
      showToast(e.message || "Reset failed", "error");
    } finally {
      setResetting(false);
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
        body: JSON.stringify({ groupSettings: habitPrivacy }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast("Privacy settings saved");
        navigate(`/app/groups/${habitData.groupId}`);
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
      <div className="std px-4 sm:px-8 py-7 sm:py-10 h-full flex flex-col min-h-0 space-y-0">
        <div className="max-w-2xl mx-auto flex-shrink-0 space-y-8 pb-8 w-full">
          <div className="std-rise" style={{ animationDelay: "40ms" }}>
            <button
              onClick={() => navigate("/app/settings")}
              className="std-btn std-btn--sm mb-6 flex items-center gap-1.5"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              Settings
            </button>
            <div className="flex items-end justify-between gap-4 flex-wrap mb-1">
              <div className="min-w-0">
                <p className="std-kicker text-[var(--signal)] mb-1.5">Customise</p>
                <h1 className="std-display text-4xl sm:text-5xl font-bold text-[var(--ink)] leading-none">
                  AI Voice
                </h1>
              </div>
            </div>
            <p className="std-mono text-[11px] text-[var(--ink-3)] mt-2 uppercase tracking-wider">
              Choose how Bito talks to you across insights, reports, and nudges.
              Pick the voice that sounds right — not the label that sounds right.
            </p>
            <div className="std-rule mt-4" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pb-20 scrollbar-hide -mx-4 px-4 sm:-mx-8 sm:px-8">
          <div className="max-w-2xl mx-auto space-y-8">
            <PersonalityQuiz
              currentPersonality={personality}
              onSave={handlePersonalitySave}
              onReset={handlePersonalityReset}
              saving={saving}
            />
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================
     HABIT PRIVACY SUB-ROUTE
     ================================================================ */
  if (section === "habit-privacy") {
    return (
      <div className="std px-4 sm:px-8 py-7 sm:py-10 h-full flex flex-col min-h-0 space-y-0">
        <div className="max-w-2xl mx-auto flex-shrink-0 space-y-8 pb-8 w-full">
          <div className="std-rise" style={{ animationDelay: "40ms" }}>
            <button
              onClick={() => navigate(`/app/groups/${habitData?.groupId || ""}`)}
              className="std-btn std-btn--sm mb-6 flex items-center gap-1.5"
            >
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              Group
            </button>
            <div className="flex items-end justify-between gap-4 flex-wrap mb-1">
              <div className="min-w-0">
                <p className="std-kicker text-[var(--signal)] mb-1.5">Sharing</p>
                <h1 className="std-display text-4xl sm:text-5xl font-bold text-[var(--ink)] leading-none">
                  Habit Privacy
                </h1>
              </div>
            </div>
            <p className="std-mono text-[11px] text-[var(--ink-3)] mt-2 uppercase tracking-wider">
              {habitData
                ? `Control sharing for "${habitData.name}"`
                : "Loading…"}
            </p>
            <div className="std-rule mt-4" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pb-20 scrollbar-hide -mx-4 px-4 sm:-mx-8 sm:px-8">
          <div className="max-w-2xl mx-auto space-y-8">
            {!habitData ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 std-card animate-pulse" />
                ))}
              </div>
            ) : (
              <>
              {/* habit card */}
              <div className="std-card flex items-center gap-3 p-4 mb-6">
                <span
                  className="w-10 h-10 rounded-[var(--r-btn)] flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${habitData.color || "var(--signal)"}18` }}
                >
                  {habitData.icon ? <HabitIcon icon={habitData.icon} size={18} /> : <HabitIcon icon="Target" size={18} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[var(--ink)] truncate">{habitData.name}</p>
                  <p className="std-mono text-[10px] text-[var(--ink-3)]">
                    {habitData.category || "No category"} · Group habit
                  </p>
                </div>
              </div>

              {/* share level */}
              <Section title="Share Progress Level">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[var(--line)]">
                  {[
                    { value: "full",          label: "Full Details",   desc: "Completion dates, notes, and stats" },
                    { value: "progress-only", label: "Progress Only",  desc: "Completion rates and weekly summaries" },
                    { value: "streaks-only",  label: "Streaks Only",   desc: "Current and best streak count" },
                    { value: "private",       label: "Private",        desc: "Nothing shared with the group" },
                  ].map((opt) => {
                    const active = habitPrivacy.shareProgress === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setHabitPrivacy((p) => ({ ...p, shareProgress: opt.value }))}
                        className={`text-left p-4 bg-[var(--surface)] transition-colors hover:bg-[var(--surface-2)] ${active ? 'outline outline-2 outline-[var(--signal)] -outline-offset-2 z-10 relative' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-[var(--ink)]">{opt.label}</span>
                          {active && <span className="w-2 h-2 rounded-full bg-[var(--signal)] flex-shrink-0" />}
                        </div>
                        <p className="std-mono text-[10px] text-[var(--ink-3)]">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </Section>

              {/* toggles */}
              <Section title="Interaction">
                <SettingRow label="Allow Encouragements" description="Let group members send you motivational messages">
                  <Toggle checked={habitPrivacy.allowInteraction} onChange={(v) => setHabitPrivacy((p) => ({ ...p, allowInteraction: v }))} />
                </SettingRow>
                <SettingRow label="Show in Activity Feed" description="Completions appear in the group activity">
                  <Toggle checked={habitPrivacy.shareInActivity} onChange={(v) => setHabitPrivacy((p) => ({ ...p, shareInActivity: v }))} />
                </SettingRow>
              </Section>

              {/* actions */}
              <div className="flex items-center gap-3 mt-8">
                <button
                  onClick={() => navigate(`/app/groups/${habitData.groupId}`)}
                  className="std-btn flex-1 flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  onClick={saveHabitPrivacy}
                  disabled={saving}
                  className="std-btn std-btn--signal flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckIcon className="w-3.5 h-3.5" />
                  )}
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </>
          )}
          </div>
        </div>
        <Toast toast={toast} />
      </div>
    );
  }

  /* ================================================================
     MAIN SETTINGS PAGE
     ================================================================ */

  const pageSkeleton = (
    <div className="std min-h-screen px-4 sm:px-8 py-7 sm:py-10">
      <div className="max-w-2xl mx-auto space-y-8 animate-pulse">
        <div>
          <div className="h-3 w-20 rounded bg-[var(--surface-2)] mb-2" />
          <div className="h-10 w-48 rounded bg-[var(--surface-2)] mb-4" />
          <div className="std-rule" />
        </div>
        <div className="space-y-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 std-card bg-[var(--surface-2)]" />
          ))}
        </div>
      </div>
    </div>
  );

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
    {
      value: "bw",
      label: "B/W",
      icon: Half2Icon,
      bg: "#000000",
      fg: "#f0f0f0",
      accent: "#888",
      surface: "#222",
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
    <SkeletonTransition isLoading={loading} skeleton={pageSkeleton}>
    <div className="std px-4 sm:px-8 py-7 sm:py-10 h-full flex flex-col min-h-0 space-y-0">
      <div className="max-w-2xl mx-auto flex-shrink-0 space-y-8 pb-8 w-full">
        {/* ── header ──────────────────── */}
        <div className="std-rise" style={{ animationDelay: "40ms" }}>
          <div className="flex items-end justify-between gap-4 flex-wrap mb-1">
            <div className="min-w-0">
              <p className="std-kicker text-[var(--signal)] mb-1.5">Configuration</p>
              <h1 className="std-display text-4xl sm:text-5xl font-bold text-[var(--ink)] leading-none">
                Settings
              </h1>
            </div>
          </div>
          <p className="std-mono text-[11px] text-[var(--ink-3)] mt-2 uppercase tracking-wider">
            Account · Preferences · Data
          </p>
          <div className="std-rule mt-4" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pb-20 scrollbar-hide -mx-4 px-4 sm:-mx-8 sm:px-8">
        <div className="max-w-2xl mx-auto space-y-8">

        {/* ═══════ 1. PROFILE ═══════ */}
        <Section title="Profile">
          <div className="flex items-center gap-4 px-5 py-4">
            <AvatarPicker
              currentAvatar={userProfile?.avatar}
              userName={userProfile?.firstName || userProfile?.name || userProfile?.email?.split("@")[0] || "User"}
              onAvatarChange={(url) => {
                setUserProfile((prev) => ({ ...prev, avatar: url }));
                if (updateUser) updateUser({ avatar: url });
              }}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <p className="std-display text-base text-[var(--ink)] truncate">
                {userProfile?.name || "—"}
              </p>
              {userProfile?.username && (
                <p className="std-mono text-[10px] text-[var(--ink-3)] truncate">
                  @{userProfile.username}
                </p>
              )}
              <p className="std-mono text-[10px] text-[var(--ink-2)] truncate">
                {userProfile?.email || "—"}
              </p>
              {userProfile?.hasGoogleAuth && (
                <p className="std-mono text-[10px] text-[var(--ink-3)] mt-0.5">⊕ Google</p>
              )}
            </div>
          </div>
        </Section>

        {/* ═══════ 2. APPEARANCE ═══════ */}
        <Section title="Appearance">
          {/* Design system */}
          <div className="px-5 py-4 border-b border-[var(--line)]">
            <p className="std-kicker text-[10px] text-[var(--ink-3)] mb-1">Design System</p>
            <p className="std-mono text-[10px] text-[var(--ink-3)] mb-3 max-w-md leading-relaxed">
              Switch between the original look (Legacy) and the new Standard design language.
            </p>
            <DesignSystemSwitcher />
          </div>

          {/* Background grid — Standard layout only */}
          {designSystem === "standard" && (
            <div className="px-5 py-4 border-b border-[var(--line)] flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-[var(--ink)]">Background grid</p>
                <p className="std-mono text-[10px] text-[var(--ink-3)] mt-0.5">
                  Show the structural grid behind the Standard layout.
                </p>
              </div>
              <Toggle
                checked={standardGrid}
                onChange={(v) => changeStandardGrid(v)}
              />
            </div>
          )}

          {/* Theme cards */}
          <div className="px-5 py-4 border-b border-[var(--line)]">
            <p className="std-kicker text-[10px] text-[var(--ink-3)] mb-3">Theme</p>
            <AnimatedList className="grid grid-cols-4 gap-2">
              {themeCards.map((t, i) => {
                const active = settings.theme === t.value;
                const Icon = t.icon;
                return (
                  <motion.div key={t.value} variants={listItemVariants} custom={i}>
                  <button
                    onClick={() => saveSetting("theme", t.value)}
                    className={`relative rounded-[var(--r-card)] border overflow-hidden transition-all w-full ${
                      active
                        ? "border-[var(--signal)]"
                        : "border-[var(--line)] hover:border-[var(--line-2,var(--signal))]"
                    }`}
                    style={active ? { boxShadow: '0 0 0 2px color-mix(in srgb, var(--signal) 20%, transparent)' } : {}}
                  >
                    <div className="h-16 p-2.5 flex flex-col justify-between" style={{ background: t.bg }}>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.accent }} />
                        <div className="h-1 w-8 rounded" style={{ backgroundColor: t.surface }} />
                      </div>
                      <div className="space-y-0.5">
                        <div className="h-0.5 w-10 rounded" style={{ backgroundColor: t.surface }} />
                        <div className="h-0.5 w-6 rounded" style={{ backgroundColor: t.surface }} />
                      </div>
                    </div>
                    <div className={`flex items-center justify-center gap-1.5 py-2 std-mono text-[10px] ${
                      active ? 'text-[var(--signal)] bg-[color-mix(in_srgb,var(--signal)_8%,transparent)]' : 'text-[var(--ink-3)]'
                    }`}>
                      <Icon className="w-3 h-3" />
                      {t.label}
                    </div>
                    {active && (
                      <div className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full bg-[var(--signal)] flex items-center justify-center">
                        <CheckIcon className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </button>
                  </motion.div>
                );
              })}
            </AnimatedList>
          </div>
        </Section>

        {/* ═══════ 2b. TEXT SIZE ═══════ */}
        <Section title="Text Size">
          <div className="px-5 py-4">
            <p className="std-mono text-[10px] text-[var(--ink-3)] mb-3">
              Scale text and UI elements for readability
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "small",  label: "Small",  description: "Default",     dotSize: "w-1.5 h-1.5", headingH: "h-1.5", headingW: "w-10", barH: ["h-1",   "h-[3px]"] },
                { value: "medium", label: "Medium", description: "Comfortable", dotSize: "w-2 h-2",     headingH: "h-2",   headingW: "w-11", barH: ["h-1.5", "h-1"]     },
                { value: "large",  label: "Large",  description: "Spacious",    dotSize: "w-2.5 h-2.5", headingH: "h-2.5", headingW: "w-12", barH: ["h-2",   "h-1.5"]   },
              ].map((s) => {
                const active = settings.scale === s.value;
                return (
                  <button
                    key={s.value}
                    onClick={() => saveSetting("scale", s.value)}
                    className={`relative rounded-[var(--r-card)] border overflow-hidden transition-all ${
                      active ? "border-[var(--signal)]" : "border-[var(--line)] hover:border-[var(--line-2,var(--signal))]"
                    }`}
                    style={active ? { boxShadow: '0 0 0 2px color-mix(in srgb, var(--signal) 20%, transparent)' } : {}}
                  >
                    <div className="h-16 p-2.5 flex flex-col justify-between bg-[var(--surface)]">
                      <div className="flex items-center gap-1.5">
                        <div className={`${s.dotSize} rounded-full bg-[var(--signal)]`} />
                        <div className={`${s.headingH} ${s.headingW} rounded bg-[var(--ink)]/20`} />
                      </div>
                      <div className="space-y-0.5">
                        <div className={`${s.barH[0]} w-14 rounded bg-[var(--ink)]/15`} />
                        <div className={`${s.barH[1]} w-10 rounded bg-[var(--ink)]/10`} />
                      </div>
                    </div>
                    <div className={`flex flex-col items-center justify-center py-2 std-mono text-[10px] ${
                      active ? 'text-[var(--signal)] bg-[color-mix(in_srgb,var(--signal)_8%,transparent)]' : 'text-[var(--ink-3)]'
                    }`}>
                      <span>{s.label}</span>
                      <span className="opacity-60">{s.description}</span>
                    </div>
                    {active && (
                      <div className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full bg-[var(--signal)] flex items-center justify-center">
                        <CheckIcon className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </Section>

        {/* ═══════ 3. PREFERENCES ═══════ */}
        <Section title="Preferences">
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
          <SettingRow
            label="Journal Default View"
            description="Which view opens when you visit your journal"
          >
            <SelectInput
              value={settings.journalDefaultView}
              options={[
                { value: 'day', label: 'Day view' },
                { value: 'list', label: 'Entry list' },
              ]}
              onChange={(v) => saveSetting("journalDefaultView", v)}
              disabled={saving}
            />
          </SettingRow>
          {designSystem === "standard" && (
            <SettingRow
              label="Dashboard Style"
              description="Daybook (serif almanac) or Mission Control (status console)"
            >
              <SelectInput
                value={settings.dashboardStyle}
                options={[
                  { value: 'daybook', label: 'Daybook' },
                  { value: 'control', label: 'Mission Control' },
                ]}
                onChange={(v) => saveSetting("dashboardStyle", v)}
                disabled={saving}
              />
            </SettingRow>
          )}
        </Section>

        {/* ═══════ 4. AI FEATURES ═══════ */}
        <Section title="AI Features">
          <SettingRow
            label="Dashboard Insights"
            description="AI-powered nudges and tips on your dashboard"
          >
            <Toggle
              checked={settings.aiDashboard}
              onChange={(v) => saveSetting("aiDashboard", v)}
              disabled={saving}
            />
          </SettingRow>
          <SettingRow
            label="Analytics Insights"
            description="AI analysis and recommendations on the analytics page"
          >
            <Toggle
              checked={settings.aiAnalytics}
              onChange={(v) => saveSetting("aiAnalytics", v)}
              disabled={saving}
            />
          </SettingRow>
          {/* ═══════ AI VOICE ═══════ */}
          <button
            onClick={() => navigate("/app/settings/personality")}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--surface-2)] transition-colors cursor-pointer border-t border-[var(--line)]"
          >
            <div className="flex items-center gap-3">
              <ChatBubbleIcon className="w-3.5 h-3.5 text-[var(--ink-3)]" />
              <div className="text-left">
                <p className="text-sm text-[var(--ink)]">AI Voice</p>
                <p className="std-mono text-[10px] text-[var(--ink-3)] mt-0.5">
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
            <ChevronRightIcon className="w-3 h-3 text-[var(--ink-3)]" />
          </button>
        </Section>

        {/* ═══════ 5. NOTIFICATIONS ═══════ */}
        <NotificationSection saving={saving} settings={settings} saveSetting={saveSetting} />

        {/* ═══════ 5. PRIVACY ═══════ */}
        <Section title="Privacy">
          {privacyLoading ? (
            <div className="flex items-center justify-center py-6">
              <span className="w-4 h-4 border-2 border-[var(--signal)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : groups.length === 0 ? (
            <div className="px-5 py-6">
              <p className="std-mono text-[11px] text-[var(--ink-3)] text-center">
                You're not a member of any groups yet.
              </p>
            </div>
          ) : (
            groups.map((ws) => {
              const pub = dashPerms[ws._id]?.isPublicToGroup ?? true;
              return (
                <SettingRow
                  key={ws._id}
                  label={ws.name}
                  description={pub ? "Members can view your dashboard" : "Dashboard is private"}
                >
                  <Toggle checked={pub} onChange={(v) => toggleWsPublic(ws._id, v)} />
                </SettingRow>
              );
            })
          )}
          <div className="px-5 py-3 flex items-start gap-2 border-t border-[var(--line)]">
            <InfoCircledIcon className="w-3.5 h-3.5 text-[var(--ink-3)] mt-0.5 flex-shrink-0" />
            <p className="std-mono text-[10px] text-[var(--ink-3)] leading-relaxed">
              When sharing is on, members see a read-only view of your habits and progress. Personal notes stay hidden.
            </p>
          </div>
        </Section>

        {/* ═══════ 6. DATA ═══════ */}
        <Section title="Data">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <DownloadIcon className="w-3.5 h-3.5 text-[var(--ink-3)]" />
              <div className="text-left">
                <p className="text-sm text-[var(--ink)]">Export All Data</p>
                <p className="std-mono text-[10px] text-[var(--ink-3)] mt-0.5">
                  Download your habits, entries, and journal as JSON
                </p>
              </div>
            </div>
            {exporting ? (
              <span className="w-3.5 h-3.5 border-2 border-[var(--signal)] border-t-transparent rounded-full animate-spin" />
            ) : (
              <ChevronRightIcon className="w-3 h-3 text-[var(--ink-3)]" />
            )}
          </button>
        </Section>

        {/* ═══════ 7. ABOUT ═══════ */}
        <Section title="About">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--line)]">
            <div>
              <p className="std-display text-sm text-[var(--ink)]">bito</p>
              <p className="std-mono text-[10px] text-[var(--ink-3)]">v1.0.0</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="std-mono text-[10px] text-[var(--ink-3)]">All systems operational</span>
            </div>
          </div>

          {[
            { key: 'dash',      Icon: DashboardIcon, label: 'Replay dashboard tour',  storageKey: (uid) => uid ? `bito_tour_completed_${uid}` : 'bito_tour_completed',               path: '/app/dashboard' },
            { key: 'analytics', Icon: BarChartIcon,  label: 'Replay analytics tour',  storageKey: (uid) => uid ? `bito_analytics_tour_completed_${uid}` : 'bito_analytics_tour_completed', path: '/app/analytics'  },
            { key: 'journal',   Icon: ReaderIcon,    label: 'Replay journal tour',     storageKey: (uid) => uid ? `bito_journal_tour_completed_${uid}` : 'bito_journal_tour_completed',     path: '/app/journal'    },
          ].map(({ key, Icon, label, storageKey, path }) => (
            <button
              key={key}
              onClick={() => {
                const uid = user?._id || user?.id || '';
                try { localStorage.removeItem(storageKey(uid)); } catch {}
                navigate(path);
              }}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--surface-2)] transition-colors border-b border-[var(--line)] last:border-0"
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-3.5 h-3.5 text-[var(--ink-3)]" />
                <span className="text-sm text-[var(--ink)]">{label}</span>
              </div>
              <ChevronRightIcon className="w-3 h-3 text-[var(--ink-3)]" />
            </button>
          ))}
        </Section>

        

        {/* ═══════ 8. DANGER ZONE ═══════ */}
        <div className="mt-10 mb-20">
          <p className="std-kicker text-[var(--ink-3)] mb-3">Danger Zone</p>
          <div className="std-card overflow-hidden" style={{ borderColor: 'rgba(225,29,72,0.3)' }}>

            {/* ── Reset Completion Data ── */}
            <div className="px-5 py-5 border-b border-red-500/10">
              <p className="text-sm text-[var(--ink)] mb-1">Reset Completion Data</p>
              <p className="std-mono text-[10px] text-[var(--ink-3)] mb-3 leading-relaxed">
                Permanently deletes all completion history. Habits are kept, but streaks, rates, and entry history will be cleared.
              </p>
              <p className="std-mono text-[10px] text-[var(--ink-3)] mb-3">
                Recommend{" "}
                <button onClick={handleExport} className="underline text-[color:var(--signal)]">
                  exporting your data
                </button>{" "}
                first.
              </p>

              {!resetConfirm ? (
                <button
                  onClick={() => setResetConfirm(true)}
                  className="h-8 px-4 rounded-[var(--r-btn)] border border-red-500/40 std-mono text-[11px] text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  Reset Completion Data
                </button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="std-mono text-[10px] text-[var(--ink-3)] block mb-1">
                      Clear data before (optional — leave blank to reset all)
                    </label>
                    <input
                      type="date"
                      value={resetBefore}
                      onChange={(e) => setResetBefore(e.target.value)}
                      className="h-8 px-3 rounded-[var(--r-btn)] border border-[var(--line)] bg-transparent std-mono text-[11px] text-[var(--ink)] focus:outline-none focus:border-red-500/50"
                    />
                  </div>
                  <p className="std-mono text-[10px] text-[var(--ink-3)]">
                    Type <strong className="text-[var(--ink)]">RESET</strong> to confirm:
                  </p>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      value={resetText}
                      onChange={(e) => setResetText(e.target.value)}
                      placeholder="RESET"
                      className="flex-1 h-8 px-3 rounded-[var(--r-btn)] border border-red-500/30 bg-transparent std-mono text-[11px] text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:border-red-500/60"
                    />
                    <button
                      onClick={handleResetAnalytics}
                      disabled={resetText !== "RESET" || resetting}
                      className="h-8 px-4 rounded-[var(--r-btn)] bg-red-500 text-white std-mono text-[11px] disabled:opacity-40 flex items-center gap-2"
                    >
                      {resetting ? (
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <TrashIcon className="w-3.5 h-3.5" />
                      )}
                      Confirm Reset
                    </button>
                    <button
                      onClick={() => { setResetConfirm(false); setResetText(""); setResetBefore(""); }}
                      className="h-8 px-3 rounded-[var(--r-btn)] std-mono text-[11px] text-[var(--ink-3)] hover:bg-[var(--surface-2)] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Delete Account ── */}
            <div className="px-5 py-5">
              <p className="text-sm text-[var(--ink)] mb-1">Delete Account</p>
              <p className="std-mono text-[10px] text-[var(--ink-3)] mb-3 leading-relaxed">
                Permanently delete your account and all associated data. This cannot be undone.
              </p>

              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="h-8 px-4 rounded-[var(--r-btn)] border border-red-500/40 std-mono text-[11px] text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  Delete Account
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="std-mono text-[10px] text-[var(--ink-3)]">
                    Type <strong className="text-[var(--ink)]">DELETE</strong> to confirm:
                  </p>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      value={deleteText}
                      onChange={(e) => setDeleteText(e.target.value)}
                      placeholder="DELETE"
                      className="flex-1 h-8 px-3 rounded-[var(--r-btn)] border border-red-500/30 bg-transparent std-mono text-[11px] text-[var(--ink)] placeholder:text-[var(--ink-3)] focus:outline-none focus:border-red-500/60"
                    />
                    <button
                      onClick={handleDelete}
                      disabled={deleteText !== "DELETE"}
                      className="h-8 px-4 rounded-[var(--r-btn)] bg-red-500 text-white std-mono text-[11px] disabled:opacity-40 flex items-center gap-2"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                      Confirm
                    </button>
                    <button
                      onClick={() => { setDeleteConfirm(false); setDeleteText(""); }}
                      className="h-8 px-3 rounded-[var(--r-btn)] std-mono text-[11px] text-[var(--ink-3)] hover:bg-[var(--surface-2)] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>

      {saving && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 std-card shadow-lg std-mono text-[11px] text-[var(--ink-3)]">
          <span className="w-3 h-3 border-2 border-[var(--signal)] border-t-transparent rounded-full animate-spin" />
          Saving…
        </div>
      )}

      <Toast toast={toast} />
    </div>
    </SkeletonTransition>
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
    <Section title="Notifications">
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

      {isSubscribed && (
        <div className="px-5 pb-3 -mt-1">
          <button
            onClick={handleTest}
            disabled={testSending}
            className="std-mono text-[10px] text-[var(--signal)] hover:underline disabled:opacity-50 transition-colors"
          >
            {testSending ? 'Sending…' : testResult === 'sent' ? '✓ Sent!' : testResult === 'error' ? '✗ Failed' : 'Send test notification'}
          </button>
        </div>
      )}

      <SettingRow label="Email Updates" description="Weekly reports and summaries">
        <Toggle
          checked={settings.emailNotifications}
          onChange={(v) => saveSetting("emailNotifications", v)}
          disabled={saving}
        />
      </SettingRow>

      {supported && permission === 'denied' && (
        <div className="px-5 py-3 flex items-start gap-2 border-t border-[var(--line)]">
          <ExclamationTriangleIcon className="w-3.5 h-3.5 text-[var(--ember,#f59e0b)] mt-0.5 flex-shrink-0" />
          <p className="std-mono text-[10px] text-[var(--ink-3)] leading-relaxed">
            Notifications are blocked by your browser. Enable in the address-bar site settings.
          </p>
        </div>
      )}
    </Section>
  );
};

/* ── DRILL: section wrapper ──────────────────────────────── */
const Section = ({ title, icon: _icon, children }) => (
  <div>
    <p className="std-kicker text-[var(--ink-3)] mb-3">{title}</p>
    <div className="std-card overflow-hidden">
      {children}
    </div>
  </div>
);

/* ── DRILL: setting row — label+description left, control right ── */
const SettingRow = ({ label, description, disabled, children }) => (
  <div
    className={`flex items-center justify-between px-5 py-4 border-b border-[var(--line)] last:border-0 ${
      disabled ? "opacity-40" : ""
    }`}
  >
    <div className="min-w-0 flex-1 pr-6">
      <p className="text-sm text-[var(--ink)]">{label}</p>
      {description && (
        <p className="std-mono text-[10px] text-[var(--ink-3)] mt-0.5 leading-relaxed">
          {description}
        </p>
      )}
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

/* ── DRILL: toggle switch ─────────────────────────────────── */
const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
    className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
      checked ? "bg-[var(--signal)]" : "bg-[var(--line-2,var(--line))]"
    } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
  >
    <span
      className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
        checked ? "translate-x-5" : "translate-x-0"
      }`}
    />
  </button>
);

/* ── DRILL: select input ──────────────────────────────────── */
const SelectInput = ({ value, options, onChange, disabled }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    className="h-8 px-3 pr-8 rounded-[var(--r-btn)] bg-[var(--surface-2)] border border-[var(--line)] std-mono text-[11px] text-[var(--ink)] focus:outline-none focus:border-[var(--signal)] disabled:opacity-40 appearance-none cursor-pointer transition-colors"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
      backgroundPosition: "right 0.4rem center",
      backgroundRepeat: "no-repeat",
      backgroundSize: "1.1em 1.1em",
    }}
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
);

/* ── DRILL: toast notification ───────────────────────────── */
const Toast = ({ toast }) => {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div
        className="std-card flex items-center gap-2.5 px-5 py-3 shadow-lg std-mono text-[12px] text-[var(--ink)]"
        style={{ borderLeftWidth: 2, borderLeftColor: isError ? 'var(--rose, #e11d48)' : 'var(--signal)' }}
      >
        {isError ? (
          <ExclamationTriangleIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--rose, #e11d48)' }} />
        ) : (
          <CheckCircledIcon className="w-3.5 h-3.5 flex-shrink-0 text-[var(--signal)]" />
        )}
        {toast.message}
      </div>
    </div>
  );
};

export default SettingsPage;
