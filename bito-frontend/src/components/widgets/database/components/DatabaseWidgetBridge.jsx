import React from 'react';
import { DatabaseWidget } from './DatabaseWidget.jsx'; // Original working version
import { DatabaseWidgetV2 } from './DatabaseWidgetV2.jsx'; // Enhanced version

/**
 * DatabaseWidgetBridge - Intelligent bridge between widget versions
 * 
 * This bridge determines which version to use based on the props and context.
 * - V1 (DatabaseWidget): Simpler, more reliable, uses HabitContext directly
 * - V2 (DatabaseWidgetV2): More features, complex prop handling, custom data flow
 */
export const DatabaseWidgetBridge = (props) => {
  const {
    habits,
    entries,
    mode,
    useV2 = false, // Explicit prop to force V2
    viewType = "table",
    ...otherProps
  } = props;

  // Decision logic for which version to use
  const shouldUseV2 = useV2 || (
    // Use V2 when we have custom habits/entries props (Dashboard integration)
    (habits !== null && habits !== undefined) ||
    (entries !== null && entries !== undefined) ||
    // Or when using advanced modes
    mode === "month" ||
    mode === "year"
  );

  if (shouldUseV2) {
    // Use enhanced version for complex scenarios
    return <DatabaseWidgetV2 {...props} />;
  } else {
    // Use simple, reliable version for standard table view
    return <DatabaseWidget {...props} />;
  }
};
