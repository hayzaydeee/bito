import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Custom hook for managing resizable column functionality
 */
export const useResizableColumns = () => {
  const COLUMN_WIDTHS_KEY = "habit-tracker-column-widths";
  const DEFAULT_COLUMN_WIDTH = 120;
  const MIN_COLUMN_WIDTH = 80;
  const MAX_COLUMN_WIDTH = 200;

  // Load column widths from localStorage
  const [columnWidths, setColumnWidths] = useState(() => {
    try {
      const saved = localStorage.getItem(COLUMN_WIDTHS_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.warn("Failed to load column widths from localStorage:", error);
      return {};
    }
  });

  // Save column widths to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(COLUMN_WIDTHS_KEY, JSON.stringify(columnWidths));
    } catch (error) {
      console.warn("Failed to save column widths to localStorage:", error);
    }
  }, [columnWidths]);

  // Refs for resize functionality
  const tableRef = useRef(null);
  const resizingRef = useRef(null);

  // Get column width for a habit
  const getColumnWidth = useCallback(
    (habitId) => {
      return columnWidths[habitId] || DEFAULT_COLUMN_WIDTH;
    },
    [columnWidths]
  );

  // Handle column resize
  const handleColumnResize = useCallback((habitId, newWidth) => {
    const clampedWidth = Math.max(
      MIN_COLUMN_WIDTH,
      Math.min(MAX_COLUMN_WIDTH, newWidth)
    );
    setColumnWidths((prev) => ({
      ...prev,
      [habitId]: clampedWidth,
    }));
  }, []);

  // Mouse down handler for resize
  const handleResizeStart = useCallback(
    (e, habitId) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = getColumnWidth(habitId);

      resizingRef.current = { habitId, startX, startWidth };

      const handleMouseMove = (e) => {
        if (!resizingRef.current) return;

        const deltaX = e.clientX - resizingRef.current.startX;
        const newWidth = resizingRef.current.startWidth + deltaX;
        handleColumnResize(resizingRef.current.habitId, newWidth);
      };

      const handleMouseUp = () => {
        resizingRef.current = null;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "default";
        document.body.style.userSelect = "auto";
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [getColumnWidth, handleColumnResize]
  );

  // Reset column widths
  const resetColumnWidths = useCallback(() => {
    setColumnWidths({});
  }, []);

  return {
    tableRef,
    getColumnWidth,
    handleResizeStart,
    resetColumnWidths,
  };
};
