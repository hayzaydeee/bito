import React from 'react';
import { DatabaseWidget } from './DatabaseWidget.jsx';

export const DatabaseWidgetBridge = (props) => {
  // Bridge now simply forwards to the main DatabaseWidget
  return <DatabaseWidget {...props} />;
};
