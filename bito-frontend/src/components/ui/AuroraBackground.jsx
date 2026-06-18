import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const AuroraBackground = () => {
  const { gridAnimation, designSystem } = useTheme();

  if (designSystem !== 'standard' || gridAnimation !== 'aurora') return null;

  return (
    <div style={{
      position: 'absolute',
      inset: '-20%', // extend past edges to avoid sharp blur dropoffs
      zIndex: -2,    // behind grid
      pointerEvents: 'none',
      overflow: 'hidden',
    }}>
      <div className="aurora-blob aurora-blob-1" />
      <div className="aurora-blob aurora-blob-2" />
      <div className="aurora-blob aurora-blob-3" />
    </div>
  );
};

export default AuroraBackground;
