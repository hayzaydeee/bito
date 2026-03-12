import React, { memo, useCallback } from 'react';
import { CheckIcon } from '@radix-ui/react-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { springs } from '../../utils/motion';

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
    <motion.button
      onClick={handleClick}
      disabled={disabled}
      whileTap={!disabled ? { scale: 0.85 } : undefined}
      whileHover={!disabled ? { scale: 1.1 } : undefined}
      transition={springs.snappy}
      className={`
        habit-checkbox relative
        w-8 h-8 rounded-lg
        flex items-center justify-center
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${isCompleted 
          ? 'shadow-md' 
          : ''
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
      <AnimatePresence mode="wait">
        {isCompleted && (
          <motion.div
            key="check"
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={springs.bouncy}
          >
            <CheckIcon className="w-4 h-4 text-white font-bold" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Today indicator */}
      {isToday && (
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--color-brand-500)] rounded-full"></div>
      )}
    </motion.button>
  );
});

HabitCheckbox.displayName = 'HabitCheckbox';
