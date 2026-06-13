import {
  User,
  UsersThree,
  House,
  Barbell,
  BookOpen,
  Globe,
  Handshake,
} from "@phosphor-icons/react";

/**
 * Maps group.type → { Icon, label }
 * Icon is the Phosphor component constructor (not JSX — callers render it).
 */
export const GROUP_TYPE_CONFIG = {
  personal:  { Icon: User,       label: "Personal" },
  team:      { Icon: UsersThree, label: "Team" },
  family:    { Icon: House,      label: "Family" },
  fitness:   { Icon: Barbell,    label: "Fitness" },
  study:     { Icon: BookOpen,   label: "Study" },
  community: { Icon: Globe,      label: "Community" },
};

/** Fallback when type is unknown */
export const DEFAULT_GROUP_ICON = Handshake;

export function getGroupTypeConfig(type) {
  return GROUP_TYPE_CONFIG[type] || { Icon: DEFAULT_GROUP_ICON, label: type || "Group" };
}
