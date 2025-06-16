import { useState, useEffect } from 'react';

/**
 * Custom hook for managing widget breakpoints and responsive behavior
 * @param {React.RefObject} ref - Reference to the widget container
 * @returns {Object} - Size and breakpoint information
 */
export const useWidgetBreakpoints = (ref) => {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [breakpoint, setBreakpoint] = useState({
    breakpoint: 'lg',
    columns: 0,
    rows: 0
  });

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });

      // Calculate grid columns/rows based on widget size
      const columns = Math.floor(width / 40); // 40px per grid unit
      const rows = Math.floor(height / 30); // 30px per grid unit

      // Determine breakpoint based on total area
      let newBreakpoint;
      if (width < 200) newBreakpoint = 'xs';
      else if (width < 400) newBreakpoint = 'sm';
      else if (width < 600) newBreakpoint = 'md';
      else if (width < 800) newBreakpoint = 'lg';
      else newBreakpoint = 'xl';

      setBreakpoint({
        breakpoint: newBreakpoint,
        columns,
        rows
      });
    });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [ref]);

  return { size, breakpoint };
};

/**
 * Hook for managing widget state with persistence
 * @param {string} storageKey - Local storage key for persistence
 * @param {Array} defaultWidgets - Default widget configuration
 * @returns {Object} - Widget state and update functions
 */
export const useWidgetState = (storageKey = 'habit-widgets', defaultWidgets = []) => {
  const [widgets, setWidgets] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : defaultWidgets;
    } catch {
      return defaultWidgets;
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(widgets));
  }, [widgets, storageKey]);

  const updateWidget = (id, updates) => {
    setWidgets(prev => prev.map(w => 
      w.id === id ? { ...w, ...updates } : w
    ));
  };

  const addWidget = (widget) => {
    setWidgets(prev => [...prev, { ...widget, id: `widget-${Date.now()}` }]);
  };

  const removeWidget = (id) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
  };

  const resetWidgets = () => {
    setWidgets(defaultWidgets);
    localStorage.removeItem(storageKey);
  };

  return {
    widgets,
    updateWidget,
    addWidget,
    removeWidget,
    resetWidgets
  };
};
