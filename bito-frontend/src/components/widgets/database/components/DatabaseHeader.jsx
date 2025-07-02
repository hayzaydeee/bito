import React from "react";
import { TargetIcon, GridIcon, ListBulletIcon } from "@radix-ui/react-icons";

/**
 * Header component for the DatabaseWidget
 */
export const DatabaseHeader = ({
  title,
  viewType,
  setViewType,
  filterComponent,
}) => (
  <div className="flex flex-col gap-3 mb-4 flex-shrink-0">
    {/* Title and Filters Row */}
    <div className="flex items-center justify-between gap-4">
      <h3 className="text-xl font-bold text-[var(--color-text-primary)] font-dmSerif flex-shrink-0">
        {title}
      </h3>
      {filterComponent && (
        <div className="flex-shrink-0 ml-auto">{filterComponent}</div>
      )}
    </div>

    {/* View Toggle Row */}
    <div className="flex items-center justify-end">
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
