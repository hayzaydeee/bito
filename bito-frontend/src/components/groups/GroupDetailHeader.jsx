import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Gear, QrCode, Copy, X } from "@phosphor-icons/react";
import AvatarStack from "../shared/AvatarStack";
import { getGroupTypeConfig } from "./groupTypeConfig";

/**
 * GroupDetailHeader
 *
 * Props:
 *   group    — group object
 *   groupId  — string
 *   members  — array of member objects
 */
const GroupDetailHeader = ({ group, groupId, members }) => {
  const navigate = useNavigate();
  const color = group?.color || "#4f46e5";
  const { Icon } = getGroupTypeConfig(group?.type);
  const typeLabel = getGroupTypeConfig(group?.type).label;
  const intensity = group?.settings?.intensity;
  const intensityLabel =
    intensity === "supportive"
      ? "Supportive mode"
      : intensity === "sharp"
      ? "Sharp mode"
      : intensity === "accountable"
      ? "Accountable mode"
      : null;

  const subtitle = [typeLabel, `${members.length} member${members.length !== 1 ? "s" : ""}`, intensityLabel]
    .filter(Boolean)
    .join(" · ");

  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const inviteCode = group?.inviteCode;
  const inviteUrl = inviteCode
    ? `${window.location.origin}/invite/${inviteCode}`
    : null;
  const qrSrc = inviteUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(inviteUrl)}&size=220x220&margin=2&bgcolor=ffffff&color=000000`
    : null;

  const handleCopy = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const iconBtn =
    "w-9 h-9 rounded-[4px] flex items-center justify-center bg-[var(--surface)] border border-[var(--line-2)] hover:border-[var(--line-3)] hover:bg-[var(--surface-2)] text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors";

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-7">
        {/* left: back + icon + name */}
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => navigate("/app/groups")}
            className={`${iconBtn} flex-shrink-0`}
            aria-label="Back to groups"
          >
            <ArrowLeft size={16} weight="bold" />
          </button>

          <span
            className="w-14 h-14 rounded-[5px] flex items-center justify-center flex-shrink-0 border"
            style={{ backgroundColor: `${color}1f`, borderColor: `${color}55` }}
          >
            <Icon size={28} weight="duotone" style={{ color }} />
          </span>

          <div className="min-w-0">
            <h1 className="grp-display text-[28px] sm:text-[34px] font-bold text-[var(--ink)] truncate leading-[0.95]">
              {group?.name}
            </h1>
            <p className="grp-mono text-[11px] text-[var(--ink-3)] mt-1 truncate uppercase tracking-wider">
              {subtitle}
            </p>
          </div>
        </div>

        {/* right: avatar stack + QR + settings */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {members.length > 0 && (
            <AvatarStack members={members} max={5} size="sm" />
          )}
          {inviteCode && (
            <button
              onClick={() => setShowQR(true)}
              className={iconBtn}
              aria-label="Show QR invite code"
              title="Invite via QR code"
            >
              <QrCode size={16} weight="bold" />
            </button>
          )}
          <button
            onClick={() => navigate(`/app/groups/${groupId}/settings`)}
            className={iconBtn}
            aria-label="Group settings"
          >
            <Gear size={16} weight="bold" />
          </button>
        </div>
      </div>

      {/* QR Modal */}
      {showQR && qrSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowQR(false)}
        >
          <div
            className="relative bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4 max-w-[300px] w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-black/5 text-black/50 hover:bg-black/10 transition-colors"
            >
              <X size={14} />
            </button>
            <div className="text-center">
              <p className="text-sm font-spartan font-semibold text-black/80">
                {group?.name}
              </p>
              <p className="text-xs font-spartan text-black/40 mt-0.5">Scan to join</p>
            </div>
            <img
              src={qrSrc}
              alt={`QR code to join ${group?.name}`}
              className="w-[220px] h-[220px] rounded-lg"
              loading="lazy"
            />
            <div className="text-center">
              <p className="text-xs font-spartan text-black/40">Or share code</p>
              <p className="text-xl font-mono font-bold tracking-widest text-black/80 mt-1">
                {inviteCode}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className="w-full h-9 rounded-xl border border-black/10 text-xs font-spartan font-medium text-black/60 hover:bg-black/5 transition-colors flex items-center justify-center gap-1.5"
            >
              <Copy size={13} />
              {copied ? "Copied!" : "Copy Invite Link"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default GroupDetailHeader;
