import React from 'react';
import { FileTextIcon } from '@radix-ui/react-icons';

const JournalButton = ({ 
  date, 
  hasJournal = false, 
  onClick, 
  isReadOnly = false,
  className = "",
  showLabel = false
}) => {
  const handleClick = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    if (!isReadOnly && onClick) {
      onClick(date);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isReadOnly}
      className={`
        relative p-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5 font-outfit
        ${hasJournal 
          ? 'text-[var(--color-brand-600)] bg-[var(--color-brand-500)]/10 hover:bg-[var(--color-brand-500)]/20 border border-[var(--color-brand-500)]/20' 
          : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] border border-transparent'
        }
        ${isReadOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105'}
        ${className}
      `}
      title={hasJournal ? "View/edit daily journal" : "Start daily journal"}
    >
      <FileTextIcon className="w-4 h-4" />
      
      {/* Indicator dot for existing journal */}
      {hasJournal && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--color-brand-500)] rounded-full shadow-sm" />
      )}
      
      {/* Optional label */}
      {showLabel && (
        <span className={`text-xs font-medium ${hasJournal ? 'text-[var(--color-brand-600)]' : 'text-[var(--color-text-tertiary)]'}`}>
          {hasJournal ? 'Journal' : 'Add Journal'}
        </span>
      )}
    </button>
  );
};

export default JournalButton;
