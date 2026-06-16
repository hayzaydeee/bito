import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  PersonIcon,
  EyeOpenIcon,
  CheckCircledIcon,
} from "@radix-ui/react-icons";
import { Warning, ClipboardText } from "@phosphor-icons/react";
import { groupsAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { habitUtils } from "../contexts/HabitContext";
import SkeletonTransition from "../components/ui/SkeletonTransition";
import HabitIcon from "../components/shared/HabitIcon";

/* ================================================================
   MemberDashboardView — read-only stacked layout (no widget grid)
   ================================================================ */
const MemberDashboardView = () => {
  const { groupId, memberId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ── fetch ──────────────────────────── */

  useEffect(() => {
    fetchData();
  }, [groupId, memberId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await groupsAPI.getMemberDashboard(groupId, memberId);

      if (!res.success) {
        setError(res.error || "Failed to load member dashboard");
        return;
      }

      if (!res.member) {
        setError("Unable to load member information");
        return;
      }

      // normalise entries: array → object keyed by date
      const entries = {};
      if (res.entries && typeof res.entries === "object") {
        Object.keys(res.entries).forEach((habitId) => {
          if (!habitId || habitId === "undefined") return;
          const raw = res.entries[habitId];
          if (Array.isArray(raw)) {
            entries[habitId] = {};
            raw.forEach((e) => {
              if (e?.date) {
                const d =
                  typeof e.date === "string"
                    ? e.date.split("T")[0]
                    : new Date(e.date).toISOString().split("T")[0];
                entries[habitId][d] = e;
              }
            });
          } else if (typeof raw === "object") {
            entries[habitId] = raw;
          }
        });
      }

      const habits = (res.habits || [])
        .filter((h) => h?._id)
        .map((h) => ({
          ...h,
          _id: h._id || h.id,
          name: h.name || "Unnamed habit",
          source: h.source || (h.groupId ? "group" : "personal"),
          isGroupHabit: h.source === "group" || !!h.groupId,
        }));

      setMemberData({ member: res.member, habits, entries });
    } catch (err) {
      console.error("Error fetching member dashboard:", err);
      setError(err.message || "Failed to load member dashboard");
    } finally {
      setLoading(false);
    }
  };

  /* ── today's date helpers ───────────── */

  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  }, []);

  const last7 = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split("T")[0]);
    }
    return days;
  }, []);

  /* ── derived data (must stay above early returns to keep hook order stable) */

  const habits = memberData?.habits || [];
  const entries = memberData?.entries || {};
  const member = memberData?.member || null;
  const memberName = member?.name || "Member";

  const habitStats = useMemo(() => {
    return habits.map((h) => {
      const he = entries[h._id] || {};
      const todayDone = !!he[todayStr]?.completed;
      const weekDone = last7.filter((d) => he[d]?.completed).length;
      return { ...h, todayDone, weekDone };
    });
  }, [habits, entries, todayStr, last7]);

  const todayTotal = habitStats.filter((h) => h.todayDone).length;

  /* ── skeleton ────────────────────────── */

  const memberSkeleton = (
    <div className="std min-h-screen px-4 sm:px-8 py-7 sm:py-12">
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 rounded-[var(--r-card)] bg-[var(--surface-2)]" />
          <div className="w-11 h-11 rounded-full bg-[var(--surface-2)]" />
          <div className="flex-1 space-y-1.5">
            <div className="h-6 w-40 rounded bg-[var(--surface-2)]" />
            <div className="h-3 w-24 rounded bg-[var(--surface-2)]" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-16 std-card bg-[var(--surface-2)]" />)}
        </div>
        <div className="space-y-2 mt-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 std-card bg-[var(--surface-2)]" />)}
        </div>
      </div>
    </div>
  );

  /* ── error ──────────────────────────── */

  if (error) {
    return (
      <div className="std min-h-screen px-4 sm:px-8 py-7 sm:py-12">
        <div className="max-w-3xl mx-auto text-center py-20">
          <Warning size={40} weight="duotone" className="mx-auto mb-4" style={{ color: 'var(--ember, #f59e0b)' }} />
          <p className="std-display text-xl text-[var(--ink)] mb-2">Something went wrong</p>
          <p className="std-mono text-[11px] text-[var(--ink-3)] mb-6">{error}</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={fetchData} className="std-btn std-btn--signal">Try Again</button>
            <button onClick={() => navigate(`/app/groups/${groupId}`)} className="std-btn">Back to Group</button>
          </div>
        </div>
      </div>
    );
  }

  /* ── render ─────────────────────────── */

  return (
    <SkeletonTransition isLoading={loading} skeleton={memberSkeleton}>
    {member ? (
    <div className="std min-h-screen px-4 sm:px-8 py-7 sm:py-12">
      <div className="max-w-3xl mx-auto">
        {/* header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(`/app/groups/${groupId}`)}
            className="std-btn std-btn--sm w-10 h-10 flex items-center justify-center p-0 flex-shrink-0"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
          </button>

          <div className="w-11 h-11 rounded-full bg-[var(--signal)] flex items-center justify-center text-white std-mono text-sm font-bold flex-shrink-0">
            {memberName.charAt(0)?.toUpperCase() || "?"}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="std-display text-2xl text-[var(--ink)] truncate">{memberName}</h1>
            <div className="flex items-center gap-1.5 std-mono text-[10px] text-[var(--ink-3)]">
              <EyeOpenIcon className="w-3 h-3" />
              Read-only view
            </div>
          </div>
        </div>

        {/* summary strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--line)] rounded-[var(--r-card)] overflow-hidden mb-8">
          <StatCard label="Habits" value={habits.length} />
          <StatCard label="Today" value={`${todayTotal}/${habits.length}`} />
          <StatCard label="Personal" value={habits.filter((h) => !h.isGroupHabit).length} />
          <StatCard label="Group"    value={habits.filter((h) => h.isGroupHabit).length} />
        </div>

        {/* empty state */}
        {habits.length === 0 && (
          <div className="std-card p-10 text-center">
            <ClipboardText size={36} weight="duotone" className="mx-auto mb-3" style={{ color: 'var(--ink-3)' }} />
            <p className="std-display text-base text-[var(--ink)] mb-1">No habits yet</p>
            <p className="std-mono text-[11px] text-[var(--ink-3)]">
              {memberName} hasn't created any habits to track yet.
            </p>
          </div>
        )}

        {/* habit list */}
        {habits.length > 0 && (
          <section>
            <p className="std-kicker text-[var(--ink-3)] mb-3">Habits — Last 7 Days</p>
            <div className="std-card overflow-hidden">
              {habitStats.map((h, idx) => (
                <div
                  key={h._id}
                  className={`flex items-center gap-4 px-5 py-3 ${idx < habitStats.length - 1 ? 'border-b border-[var(--line)]' : ''}`}
                >
                  <span className="flex-shrink-0 text-[var(--ink-3)]">
                    <HabitIcon icon={h.icon || "Target"} size={15} />
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-[var(--ink)] truncate">{h.name}</p>
                      {h.isGroupHabit && (
                        <span className="std-mono text-[10px] px-1.5 py-0.5 border border-[var(--line)] rounded-[var(--r-pill)] text-[var(--ink-3)]">
                          group
                        </span>
                      )}
                    </div>
                    <p className="std-mono text-[10px] text-[var(--ink-3)]">{h.weekDone}/7 this week</p>
                  </div>

                  {/* 7-day dots */}
                  <div className="flex gap-1 flex-shrink-0">
                    {last7.map((day) => {
                      const done = !!(entries[h._id] || {})[day]?.completed;
                      return (
                        <div
                          key={day}
                          className="w-2.5 h-2.5 rounded-full transition-colors"
                          style={{ background: done ? 'var(--signal)' : 'var(--line)' }}
                          title={`${day}: ${done ? "Done" : "Missed"}`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
    ) : null}
    </SkeletonTransition>
  );
};

/* ── stat card ────────────────────────── */

function StatCard({ label, value }) {
  return (
    <div className="bg-[var(--surface)] px-4 py-4 text-center">
      <p className="std-num text-xl text-[var(--ink)]">{value}</p>
      <p className="std-kicker text-[10px] text-[var(--ink-3)] mt-0.5">{label}</p>
    </div>
  );
}

export default MemberDashboardView;
