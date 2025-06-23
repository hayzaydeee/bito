import React from 'react';
import { DatabaseWidget } from './DatabaseWidget.jsx'; // Old version
import { DatabaseWidgetV2 } from './DatabaseWidgetV2.jsx'; // New version

// Feature flag to control which version to use
const USE_NEW_WIDGET = true; // Change this to gradually migrate

export const DatabaseWidgetBridge = (props) => {
  // You can add logic here to gradually rollout the new widget
  // For example, based on user ID, feature flags, etc.
    if (USE_NEW_WIDGET) {
    return <DatabaseWidgetV2 {...props} />;
  } else {
    return <DatabaseWidget {...props} />;
  }
};
