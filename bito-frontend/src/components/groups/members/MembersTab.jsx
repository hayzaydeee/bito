import { useState, useEffect, useCallback } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import MemberCard from "./MemberCard";
import InvitePanel from "./InvitePanel";
import { groupsAPI } from "../../../services/api";

/**
 * MembersTab
 *
 * Props:
 *   groupId       — string
 *   group         — group object
 *   initialMembers — member[] from parent
 *   currentUserId — string
 *   canManage     — boolean
 *   onEncourage   — (memberInfo) => void
 */
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const MembersTab = ({
  groupId,
  group,
  initialMembers = [],
  currentUserId,
  canManage,
  onEncourage,
}) => {
  const [members, setMembers] = useState(initialMembers);
  const [search, setSearch] = useState("");

  /* ── presence polling ───────────────────────────── */
  const refreshMembers = useCallback(async () => {
    try {
      const res = await groupsAPI.getGroupMembers(groupId);
      if (res.success) setMembers(res.members || res.group?.members || []);
    } catch {
      /* keep existing */
    }
  }, [groupId]);

  useEffect(() => {
    const id = setInterval(refreshMembers, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refreshMembers]);

  // Also refresh when tab becomes visible
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshMembers();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refreshMembers]);

  /* ── filtering ──────────────────────────────────── */
  const filtered = members.filter((m) => {
    if (!search.trim()) return true;
    const info = m.userId || m.user || m;
    const q = search.toLowerCase();
    return (
      (info.name || "").toLowerCase().includes(q) ||
      (info.email || "").toLowerCase().includes(q) ||
      (info.username || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex gap-6">
      {/* ── Main member list ── */}
      <div className="flex-1 min-w-0">
        {/* Search */}
        <div className="relative mb-5">
          <MagnifyingGlass
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members"
            className="w-full h-9 pl-8 pr-4 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-primary)]/20 text-sm font-spartan text-[var(--color-text-primary)] placeholder:text-[var(--color-text-quaternary)] focus:outline-none focus:border-[var(--color-brand-500)]/50 transition-colors"
          />
        </div>

        <p className="text-xs text-[var(--color-text-tertiary)] font-spartan mb-3">
          Members ({filtered.length})
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filtered.map((m, idx) => {
            const memberId = (
              m.userId?._id || m.userId || m._id || m.id || ""
            ).toString();
            const isYou = memberId === currentUserId?.toString();
            const info = m.userId || m.user || m;

            return (
              <MemberCard
                key={memberId || idx}
                member={m}
                groupId={groupId}
                isYou={isYou}
                onEncourage={() => onEncourage?.(info)}
              />
            );
          })}
        </div>
      </div>

      {/* ── Sidebar ── */}
      <aside className="w-64 flex-shrink-0 hidden lg:block">
        {canManage ? (
          <InvitePanel
            groupId={groupId}
            group={group}
            isOwner={
              currentUserId &&
              (group?.ownerId?.toString() === currentUserId?.toString() ||
                group?.ownerId?._id?.toString() === currentUserId?.toString())
            }
          />
        ) : (
          /* Read-only panel for regular members */
          <div className="rounded-2xl border border-[var(--color-border-primary)]/20 bg-[var(--color-surface-elevated)]/60 p-5">
            <p className="text-sm font-spartan font-semibold text-[var(--color-text-primary)] mb-2">
              Group members
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)] font-spartan">
              Only admins and owners can invite new members.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
};

export default MembersTab;
