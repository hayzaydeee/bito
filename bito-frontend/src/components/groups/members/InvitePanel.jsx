import { useState, useEffect } from "react";
import { Copy, QrCode, Envelope, X, ArrowClockwise } from "@phosphor-icons/react";
import { groupsAPI } from "../../../services/api";

/**
 * InvitePanel — inline invite sidebar (Members tab)
 *
 * Props:
 *   groupId — string
 *   group   — group object (for invite code)
 *   isOwner — boolean (can regenerate invite code)
 */
const InvitePanel = ({ groupId, group, isOwner }) => {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [localInviteCode, setLocalInviteCode] = useState(group?.inviteCode || null);

  // Build invite URL from the stable invite code
  const inviteCode = localInviteCode || group?.inviteCode;
  const inviteUrl = inviteCode
    ? `${window.location.origin}/invite/${inviteCode}`
    : null;

  useEffect(() => {
    fetchPending();
  }, [groupId]);

  // Keep local code in sync if parent group prop updates
  useEffect(() => {
    if (group?.inviteCode) setLocalInviteCode(group.inviteCode);
  }, [group?.inviteCode]);

  const fetchPending = async () => {
    try {
      const res = await groupsAPI.getInvitations(groupId, "pending");
      if (res.success) setPendingInvites(res.invitations || []);
    } catch {
      /* silent — invites panel still works */
    }
  };

  const handleCopy = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRegenerate = async () => {
    if (regenerating) return;
    setRegenerating(true);
    try {
      const res = await groupsAPI.regenerateInviteCode(groupId);
      if (res.success) setLocalInviteCode(res.inviteCode);
    } catch {
      /* silent */
    } finally {
      setRegenerating(false);
    }
  };

  const handleSend = async () => {
    if (!email.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await groupsAPI.inviteMember(groupId, { email: email.trim(), role: "member" });
      if (res.success) {
        setSent(true);
        setEmail("");
        fetchPending();
        setTimeout(() => setSent(false), 3000);
      }
    } catch (err) {
      setError(err.message || "Failed to send invite");
    } finally {
      setSending(false);
    }
  };

  const handleRevoke = async (invitationId) => {
    try {
      await groupsAPI.cancelInvitation(groupId, invitationId);
      setPendingInvites((prev) => prev.filter((i) => i._id !== invitationId));
    } catch {
      /* silent */
    }
  };

  const handleResend = async (invitationId, inviteEmail) => {
    try {
      await groupsAPI.inviteMember(groupId, { email: inviteEmail, role: "member" });
    } catch {
      /* silent */
    }
  };

  const daysAgo = (dateStr) => {
    if (!dateStr) return "";
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "1d ago";
    return `${days}d ago`;
  };

  const qrSrc = inviteUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(inviteUrl)}&size=200x200&margin=2&bgcolor=ffffff&color=000000`
    : null;

  return (
    <>
      <div className="rounded-2xl border border-[var(--color-border-primary)]/20 bg-[var(--color-surface-elevated)]/60 p-5 space-y-5">
        <p className="text-sm font-spartan font-semibold text-[var(--color-text-primary)]">
          Invite people
        </p>

        {/* Invite link */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/15">
            <span className="flex-1 text-xs text-[var(--color-text-secondary)] truncate font-mono tracking-wider">
              {inviteCode ?? "—"}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              disabled={!inviteUrl}
              className={`flex-1 h-9 rounded-xl text-xs font-spartan font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 ${
                copied
                  ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/20"
                  : "bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] border border-[var(--color-border-primary)]/20 hover:text-[var(--color-text-primary)]"
              }`}
            >
              <Copy size={13} />
              {copied ? "Copied!" : "Copy Link"}
            </button>
            <button
              onClick={() => setShowQR(true)}
              disabled={!qrSrc}
              title="Show QR code"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/20 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex-shrink-0 disabled:opacity-40"
            >
              <QrCode size={15} />
            </button>
            {isOwner && (
              <button
                onClick={handleRegenerate}
                disabled={regenerating}
                title="Regenerate code (invalidates old link)"
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/20 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors flex-shrink-0 disabled:opacity-40"
              >
                <ArrowClockwise size={14} className={regenerating ? "animate-spin" : ""} />
              </button>
            )}
          </div>
        </div>

        {/* Email invite */}
        <div className="space-y-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="email@example.com"
            className="w-full h-9 px-3 rounded-xl bg-[var(--color-surface-hover)] border border-[var(--color-border-primary)]/15 text-sm font-spartan text-[var(--color-text-primary)] placeholder:text-[var(--color-text-quaternary)] focus:outline-none focus:border-[var(--color-brand-500)]/50 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!email.trim() || sending}
            className="w-full h-9 rounded-xl bg-[var(--color-brand-600)] hover:bg-[var(--color-brand-700)] text-white text-xs font-spartan font-medium transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            <Envelope size={13} />
            {sent ? "Sent!" : sending ? "Sending…" : "Send invite"}
          </button>
          {error && (
            <p className="text-[11px] text-red-500 font-spartan">{error}</p>
          )}
        </div>

        {/* Pending invites */}
        {pendingInvites.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-spartan text-[var(--color-text-tertiary)] uppercase tracking-wide flex items-center justify-between">
              Pending
              <span className="normal-case text-[var(--color-text-quaternary)]">{pendingInvites.length}</span>
            </p>
            <ul className="space-y-2">
              {pendingInvites.map((inv) => (
                <li key={inv._id} className="flex items-start gap-2 py-2 border-t border-[var(--color-border-primary)]/10 first:border-0">
                  <Envelope size={13} className="text-[var(--color-text-tertiary)] mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-spartan text-[var(--color-text-secondary)] truncate">
                      {inv.email}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-quaternary)] font-spartan">
                      Invited {daysAgo(inv.createdAt)}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <button
                        onClick={() => handleResend(inv._id, inv.email)}
                        className="text-[11px] font-spartan text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                      >
                        Resend
                      </button>
                      <button
                        onClick={() => handleRevoke(inv._id)}
                        className="text-[11px] font-spartan text-red-500 hover:text-red-400 transition-colors"
                      >
                        Revoke
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* QR Code modal */}
      {showQR && qrSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowQR(false)}
        >
          <div
            className="relative bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4 max-w-[280px] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-black/5 text-black/50 hover:bg-black/10 transition-colors"
            >
              <X size={14} />
            </button>
            <p className="text-sm font-spartan font-semibold text-black/80">
              Scan to join
            </p>
            <img
              src={qrSrc}
              alt="Group invite QR code"
              className="w-[200px] h-[200px] rounded-lg"
              loading="lazy"
            />
            <div className="text-center">
              <p className="text-xs font-spartan text-black/40">Code</p>
              <p className="text-lg font-mono font-bold tracking-widest text-black/80">
                {inviteCode}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className="w-full h-9 rounded-xl border border-black/10 text-xs font-spartan font-medium text-black/60 hover:bg-black/5 transition-colors flex items-center justify-center gap-1.5"
            >
              <Copy size={13} />
              {copied ? "Copied!" : "Copy Link"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default InvitePanel;
