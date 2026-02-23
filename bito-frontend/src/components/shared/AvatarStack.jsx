/**
 * AvatarStack — overlapping avatar circles for groups/teams.
 * Shows up to `max` members with a "+N" overflow indicator.
 */
const SIZES = {
  sm: { ring: "w-7 h-7 text-[10px]", offset: "-ml-2" },
  md: { ring: "w-9 h-9 text-xs", offset: "-ml-2.5" },
};

const AVATAR_COLORS = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-cyan-500",
  "bg-violet-500",
  "bg-orange-500",
  "bg-teal-500",
];

const AvatarStack = ({ members = [], max = 4, size = "md" }) => {
  const s = SIZES[size] || SIZES.md;
  const visible = members.slice(0, max);
  const overflow = members.length - max;

  return (
    <div className="flex items-center">
      {visible.map((member, i) => {
        const name =
          member?.user?.name ||
          member?.name ||
          member?.email ||
          "?";
        const avatar = member?.user?.avatar || member?.avatar;
        const colorClass = AVATAR_COLORS[i % AVATAR_COLORS.length];

        return (
          <div
            key={member?._id || member?.user?._id || i}
            className={`${s.ring} rounded-full flex items-center justify-center font-spartan font-bold text-white ring-2 ring-[var(--color-surface-elevated)] flex-shrink-0 ${
              i > 0 ? s.offset : ""
            } ${avatar ? "" : colorClass}`}
            style={
              avatar
                ? {
                    backgroundImage: `url(${avatar})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : undefined
            }
            title={name}
          >
            {!avatar && name.charAt(0).toUpperCase()}
          </div>
        );
      })}

      {overflow > 0 && (
        <div
          className={`${s.ring} rounded-full flex items-center justify-center font-spartan font-semibold text-[var(--color-text-secondary)] bg-[var(--color-surface-hover)] ring-2 ring-[var(--color-surface-elevated)] flex-shrink-0 ${s.offset}`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
};

export default AvatarStack;
