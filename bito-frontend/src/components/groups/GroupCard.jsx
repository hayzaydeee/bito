import { useNavigate } from "react-router-dom";
import AvatarStack from "../shared/AvatarStack";
import { getGroupTypeConfig } from "./groupTypeConfig";
import LedgerCard from "../shared/standard/LedgerCard";

/**
 * GroupCard — entity card for the /app/groups list. Built on the shared
 * LedgerCard frame (twin of the Compass card).
 *
 * Props:
 *   group — group object from the API
 *   index — position in the list (ledger number)
 */
const GroupCard = ({ group, index = 0 }) => {
  const navigate = useNavigate();
  const { Icon } = getGroupTypeConfig(group.type);
  const color = group.color || "#4f46e5";
  const memberCount = group.members?.length || group.stats?.totalMembers || 0;
  const activeToday = group.stats?.activeMembers || 0;
  const typeLabel = getGroupTypeConfig(group.type).label;

  return (
    <LedgerCard
      index={index}
      accent={color}
      onClick={() => navigate(`/app/groups/${group._id}`)}
      icon={
        <span
          className="w-11 h-11 rounded-[10px] flex items-center justify-center flex-shrink-0 border"
          style={{ backgroundColor: `${color}1f`, borderColor: `${color}55` }}
        >
          <Icon size={22} weight="duotone" style={{ color }} />
        </span>
      }
      title={group.name}
      meta={
        <p className="std-mono text-[11px] text-[var(--ink-3)] tracking-wide">
          {String(memberCount).padStart(2, "0")} MEMBER{memberCount !== 1 && "S"}
          {activeToday > 0 && (
            <> · <span className="text-[var(--signal)]">{activeToday} ACTIVE</span></>
          )}
        </p>
      }
      footer={
        <>
          {memberCount > 0 && <AvatarStack members={group.members || []} max={4} size="sm" />}
          <span className="std-tag" style={{ borderColor: `${color}55`, color }}>
            {typeLabel}
          </span>
        </>
      }
    />
  );
};

export default GroupCard;
