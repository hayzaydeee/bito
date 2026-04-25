import React from 'react';
import {
  Target, Barbell, BookOpen, Brain, Drop, Heart, Lightning,
  Leaf, Moon, Sun, Star, TrendUp, Check, Clock, Calendar,
  Palette, MusicNote, Code, Briefcase, CurrencyDollar, Users,
  Camera, Bicycle, Person, PersonSimple, Pill, Bed, Tooth, Fire,
  Trophy, Medal, Handshake, Smiley, Sparkle, Globe, House,
  PawPrint, Pen, Notebook, ChartBar, Microphone,
  SwimmingPool, Football, Basketball, Volleyball,
} from '@phosphor-icons/react';

/** All Phosphor icon names that the icon picker can emit. */
export const HABIT_ICONS = {
  // Activity
  Barbell, Bicycle, Person, PersonSimple, SwimmingPool, Football, Basketball, Volleyball,
  // Health
  Drop, Heart, Pill, Bed, Tooth, Leaf, Sun, Moon,
  // Mind / Learning
  Brain, BookOpen, Notebook, Pen, Code, Microphone, Camera, Palette, MusicNote,
  // Productivity
  Target, Lightning, Clock, Calendar, ChartBar, TrendUp, Check, Star,
  // Life / Goals
  Briefcase, CurrencyDollar, Users, Globe, House, PawPrint, Sparkle,
  // Social
  Handshake, Smiley, Trophy, Medal, Fire,
};

// Aliases for common LLM misnaming (map to the nearest valid Phosphor component)
const ICON_ALIASES = {
  People: Users,
  Social: Users,
  Group: Users,
  Mind: Brain,
  Meditation: Moon,
  Run: Person,
  Walk: Person,
  Exercise: Barbell,
  Workout: Barbell,
  Gym: Barbell,
  Read: BookOpen,
  Study: BookOpen,
  Book: BookOpen,
  Write: Pen,
  Writing: Pen,
  Journal: Notebook,
  Music: MusicNote,
  Coding: Code,
  Work: Briefcase,
  Money: CurrencyDollar,
  Finance: CurrencyDollar,
  Nature: Leaf,
  Plant: Leaf,
  Water: Drop,
  Hydrate: Drop,
  Sleep: Bed,
  Rest: Bed,
  Dentist: Tooth,
  Teeth: Tooth,
  Bike: Bicycle,
  Swimming: SwimmingPool,
  Soccer: Football,
};

const DEFAULT_ICON = Target;

/**
 * Renders a habit icon. Accepts either a Phosphor icon name string (e.g. "Target")
 * or an emoji/unknown string (rendered as plain text for backward-compat).
 */
const HabitIcon = ({
  icon,
  size = 20,
  weight = 'regular',
  color,
  className = '',
  style = {},
}) => {
  if (!icon) {
    const Icon = DEFAULT_ICON;
    return <Icon size={size} weight={weight} color={color} className={className} style={style} />;
  }

  // If the icon is a known Phosphor name, render it
  const PhosphorIcon = HABIT_ICONS[icon] || ICON_ALIASES[icon];
  if (PhosphorIcon) {
    return <PhosphorIcon size={size} weight={weight} color={color} className={className} style={style} />;
  }

  // Fallback: render emoji or any other string as text (legacy data)
  return (
    <span
      className={className}
      style={{ fontSize: size * 0.85, lineHeight: 1, display: 'inline-flex', alignItems: 'center', ...style }}
      aria-hidden="true"
    >
      {icon}
    </span>
  );
};

export default HabitIcon;
