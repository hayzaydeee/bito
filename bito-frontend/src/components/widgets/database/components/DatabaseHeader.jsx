import React from "react";
import { TargetIcon, GridIcon, ListBulletIcon } from "@radix-ui/react-icons";

/**
 * Header component for the DatabaseWidget
 */
export const DatabaseHeader = ({ title, viewType, setViewType }) => (
  <div className="flex items-center justify-between mb-6 flex-shrink-0">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-[var(--color-brand-500)]/20 rounded-lg flex items-center justify-center">
        <TargetIcon className="w-5 h-5 text-[var(--color-brand-400)]" />
      </div>
      <h3 className="text-xl font-bold text-[var(--color-text-primary)] font-dmSerif">
        {title}
      </h3>
    </div>    {/* View Toggle */}
    <div className="flex items-center gap-2">
      <div className="flex bg-[var(--color-surface-elevated)] rounded-xl p-1 border border-[var(--color-border-primary)]">
        <button
          onClick={() => setViewType("table")}
          className={`p-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 ${
            viewType === "table"
              ? "bg-[var(--color-brand-500)] text-white shadow-sm"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
          }`}
        >
          <ListBulletIcon className="w-4 h-4" />
          <span className="text-sm font-outfit font-medium">Table</span>
        </button>
        <button
          onClick={() => setViewType("matrix")}
          className={`p-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 ${
            viewType === "matrix"
              ? "bg-[var(--color-brand-500)] text-white shadow-sm"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
          }`}
        >
          <ListBulletIcon className="w-4 h-4" />
          <span className="text-sm font-outfit font-medium">Matrix</span>
        </button>
        <button
          onClick={() => setViewType("gallery")}
          className={`p-2.5 rounded-lg transition-all duration-200 flex items-center gap-2 ${
            viewType === "gallery"
              ? "bg-[var(--color-brand-500)] text-white shadow-sm"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
          }`}
        >
          <GridIcon className="w-4 h-4" />
          <span className="text-sm font-outfit font-medium">Cards</span>
        </button>
      </div>
    </div>
  </div>
);
