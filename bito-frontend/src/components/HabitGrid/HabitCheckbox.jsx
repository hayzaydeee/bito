import React, { memo, useCallback } from 'react';
import { CheckIcon } from '@radix-ui/react-icons';

export const HabitCheckbox = memo(({ 
  habitId,
  date,
  isCompleted, 
  isToday, 
  color, 
  onToggle,
  disabled = false
}) => {
  // Memoized click handler
  const handleClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;
    
    onToggle();
  }, [onToggle, disabled]);

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        habit-checkbox relative
        w-8 h-8 rounded-lg transition-all duration-200 
        flex items-center justify-center
        hover:scale-105 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${isCompleted 
          ? 'shadow-md transform scale-105' 
          : 'hover:shadow-sm'
        }
        ${isToday 
          ? 'ring-2 ring-[var(--color-brand-400)] ring-opacity-50' 
          : ''
        }
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-pointer'
        }
      `}
      style={{
        backgroundColor: isCompleted ? color : 'transparent',
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: color,
        boxShadow: isCompleted ? `0 2px 6px ${color}30` : 'none',
        focusRingColor: color
      }}
      aria-label={`Toggle ${habitId} for ${date}`}
      aria-pressed={isCompleted}
    >
      {isCompleted && (
        <CheckIcon className="w-4 h-4 text-white font-bold" />
      )}
      
      {/* Today indicator */}
      {isToday && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--color-brand-500)] rounded-full"></div>
      )}
    </button>
  );
});

HabitCheckbox.displayName = 'HabitCheckbox';
