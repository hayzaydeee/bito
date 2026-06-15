import React from "react";
import { Stack, Sparkle } from "@phosphor-icons/react";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * DesignSystemSwitcher — toggles the design-system axis (legacy | standard),
 * orthogonal to the light/dark theme. Uses --color-* tokens so it renders
 * correctly under both design systems.
 */
const ICONS = {
  legacy: <Stack size={15} weight="duotone" />,
  standard: <Sparkle size={15} weight="duotone" />,
};

const DesignSystemSwitcher = () => {
  const { designSystem, changeDesignSystem, designSystemOptions } = useTheme();

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--color-surface-hover)]/30">
      {designSystemOptions.map((option) => {
        const isActive = designSystem === option.value;
        return (
          <button
            key={option.value}
            onClick={() => changeDesignSystem(option.value)}
            title={option.description}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium font-outfit transition-all ${
              isActive
                ? "bg-[var(--color-brand-500)] text-white shadow-lg"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
            }`}
          >
            {ICONS[option.value]}
            {option.label}
          </button>
        );
      })}
    </div>
  );
};

export default DesignSystemSwitcher;
