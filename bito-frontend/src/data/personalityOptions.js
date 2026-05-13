import {
  Sun,
  Target,
  Smiley,
  ChartBar,
  Trophy,
  MagnifyingGlass,
  Lightning,
  Scales,
  ChatTeardrop,
  BookOpen,
  Heart,
  Fire,
  Gauge,
} from "@phosphor-icons/react";

/* ================================================================
   Shared AI personality axis definitions.
   Used by: OnboardingPage (step 3) and PersonalityQuiz (Settings).
   ================================================================ */

export const AXES = [
  {
    key: "tone",
    title: "How should Bito talk to you?",
    options: [
      {
        value: "warm",
        Icon: Sun,
        label: "Warm",
        example: `"Honestly, your meditation streak is looking really solid — 34 days and counting."`,
      },
      {
        value: "direct",
        Icon: Target,
        label: "Direct",
        example: `"Meditation: 34-day streak. Reading: 14 days. Exercise held at 100%."`,
      },
      {
        value: "playful",
        Icon: Smiley,
        label: "Playful",
        example: `"Your meditation habit is basically on autopilot at this point — 34 days without blinking."`,
      },
      {
        value: "neutral",
        Icon: ChartBar,
        label: "Neutral",
        example: `"Meditation completed daily for 34 consecutive days. All four habits maintained full completion."`,
      },
    ],
  },
  {
    key: "focus",
    title: "What should Bito lead with?",
    options: [
      {
        value: "wins",
        Icon: Trophy,
        label: "Wins first",
        example: `"You crushed it this week — every single habit, every single day. Your meditation streak just passed 30 days."`,
      },
      {
        value: "patterns",
        Icon: MagnifyingGlass,
        label: "Patterns",
        example: `"Interesting — your exercise and reading completion track together. When one drops, so does the other."`,
      },
      {
        value: "actionable",
        Icon: Lightning,
        label: "Actions",
        example: `"Your phone habit is at 29%. Try moving your phone to another room before bed to break the morning reach."`,
      },
      {
        value: "balanced",
        Icon: Scales,
        label: "Balanced",
        example: `"Strong week overall. Reading streak held at 42 days, but phone-free mornings need attention at 2/7."`,
      },
    ],
  },
  {
    key: "verbosity",
    title: "How much detail do you want?",
    options: [
      {
        value: "concise",
        Icon: ChatTeardrop,
        label: "Just the headlines",
        example: `"Reading streak at 42 days. Exercise alternating. Phone habit needs a new approach."`,
      },
      {
        value: "detailed",
        Icon: BookOpen,
        label: "Full context",
        example: `"Your reading streak hit 42 days — that's your longest active streak and it's been rock-solid. Exercise follows an every-other-day rhythm, which might actually work better than forcing daily."`,
      },
    ],
  },
  {
    key: "accountability",
    title: "When you miss a habit, how should Bito respond?",
    options: [
      {
        value: "gentle",
        Icon: Heart,
        label: "Gentle",
        example: `"You had a tough few days with reading — but your meditation streak held strong."`,
      },
      {
        value: "honest",
        Icon: Gauge,
        label: "Honest",
        example: `"Reading dropped to 2/7 this week, down from 5/7 last week."`,
      },
      {
        value: "tough",
        Icon: Fire,
        label: "Tough",
        example: `"Reading fell off a cliff. Three weeks ago you were at 85%. What happened?"`,
      },
    ],
  },
];
