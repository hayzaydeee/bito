import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  PersonIcon,
  EyeOpenIcon,
  CheckCircledIcon,
} from "@radix-ui/react-icons";
import { groupsAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { habitUtils } from "../contexts/HabitContext";

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
          source: h.source || (h.workspaceId ? "workspace" : "personal"),
          isGroupHabit: h.source === "workspace" || !!h.workspaceId,
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

  const habitStats = useMemo(() => {
    return habits.map((h) => {
      const he = entries[h._id] || {};
      const todayDone = !!he[todayStr]?.completed;
      const weekDone = last7.filter((d) => he[d]?.completed).length;
      return { ...h, todayDone, weekDone };
    });
  }, [habits, entries, todayStr, last7]);

  const todayTotal = habitStats.filter((h) => h.todayDone).length;

  /* ── loading ────────────────────────── */

  if (loading) {
    return (
      <div className="min-h-screen page-container px-4 sm:px-6 py-10">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="h-8 w-56 rounded-lg bg-[var(--color-surface-elevated)] animate-pulse" />
          <div className="h-5 w-72 rounded bg-[var(--color-surface-elevated)] animate-pulse" />
          <div className="mt-8 space-y-3">
            {[...Array(5)].map((_, i) => (
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

  /* ── error ──────────────────────────── */

  if (error) {
    return (
      <div className="min-h-screen page-container px-4 sm:px-6 py-10">
        <div className="max-w-3xl mx-auto text-center py-20">
          <p className="text-4xl mb-4">⚠️</p>
          <h2 className="text-xl font-garamond font-bold text-[var(--color-text-primary)] mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] font-spartan mb-6">
            {error}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={fetchData}
              className="h-9 px-5 bg-[var(--color-brand-600)] text-white rounded-xl text-sm font-spartan font-medium"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate(`/app/groups/${groupId}`)}
              className="h-9 px-5 border border-[var(--color-border-primary)]/30 rounded-xl text-sm font-spartan text-[var(--color-text-secondary)]"
            >
              Back to Group
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── render ─────────────────────────── */

  return (
    <div className="min-h-screen page-container px-4 sm:px-6 py-10">
      <div className="max-w-3xl mx-auto">
        {/* header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(`/app/groups/${groupId}`)}
            className="w-10 h-10 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 flex items-center justify-center hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 text-[var(--color-text-secondary)]" />
          </button>

          <div className="w-11 h-11 rounded-full bg-[var(--color-brand-600)] flex items-center justify-center text-white text-base font-spartan font-bold flex-shrink-0">
            {member.name?.charAt(0)?.toUpperCase() || "?"}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold font-garamond text-[var(--color-text-primary)] truncate">
              {member.name}
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] font-spartan">
              <EyeOpenIcon className="w-3 h-3" />
              Read-only view
            </div>
          </div>
        </div>

        {/* summary row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard label="Habits" value={habits.length} />
          <StatCard label="Today" value={`${todayTotal}/${habits.length}`} />
          <StatCard
            label="Personal"
            value={habits.filter((h) => !h.isGroupHabit).length}
          />
          <StatCard
            label="Group"
            value={habits.filter((h) => h.isGroupHabit).length}
          />
        </div>

        {/* empty state */}
        {habits.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">📋</p>
            <h3 className="text-lg font-garamond font-bold text-[var(--color-text-primary)] mb-1">
              No habits yet
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] font-spartan">
              {member.name} hasn't created any habits to track yet.
            </p>
          </div>
        )}

        {/* habit list with 7-day dots */}
        {habits.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-spartan font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                Habits — Last 7 Days
              </h2>
            </div>

            <ul className="space-y-2">
              {habitStats.map((h) => (
                <li
                  key={h._id}
                  className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20"
                >
                  <span className="text-lg flex-shrink-0">
                    {h.icon || "🎯"}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-spartan font-semibold text-[var(--color-text-primary)] truncate">
                        {h.name}
                      </p>
                      {h.isGroupHabit && (
                        <span className="text-[10px] font-spartan px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600">
                          group
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-text-tertiary)] font-spartan">
                      {h.weekDone}/7 this week
                    </p>
                  </div>

                  {/* 7-day completion dots */}
                  <div className="flex gap-1 flex-shrink-0">
                    {last7.map((day) => {
                      const he = entries[h._id] || {};
                      const done = !!he[day]?.completed;
                      return (
                        <div
                          key={day}
                          className={`w-3 h-3 rounded-full ${
                            done
                              ? "bg-green-500"
                              : "bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/30"
                          }`}
                          title={`${day}: ${done ? "Done" : "Missed"}`}
                        />
                      );
                    })}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
};

/* ── stat card ────────────────────────── */

function StatCard({ label, value }) {
  return (
    <div className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 text-center">
      <p className="text-lg font-garamond font-bold text-[var(--color-text-primary)]">
        {value}
      </p>
      <p className="text-[11px] text-[var(--color-text-tertiary)] font-spartan uppercase tracking-wide">
        {label}
      </p>
    </div>
  );
}

export default MemberDashboardView;
