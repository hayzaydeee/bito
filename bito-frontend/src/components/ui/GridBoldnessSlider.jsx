import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/* ─────────────────────────────────────────────────────────────
   GridBoldnessSlider
   A styled 3-step range input for grid intensity.
   ───────────────────────────────────────────────────────────── */

const GridBoldnessSlider = () => {
  const { gridBoldness, changeGridBoldness, designSystem, standardGrid } = useTheme();

  // Hidden if legacy DS or if grid is turned off completely
  if (designSystem !== 'standard' || !standardGrid) return null;

  const steps = ['low', 'medium', 'high'];
  const currentIndex = steps.indexOf(gridBoldness) >= 0 ? steps.indexOf(gridBoldness) : 0;

  const handleChange = (e) => {
    const newIndex = parseInt(e.target.value, 10);
    changeGridBoldness(steps[newIndex]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 200, margin: '0 auto' }}>
      <input
        type="range"
        min="0"
        max="2"
        step="1"
        value={currentIndex}
        onChange={handleChange}
        style={{
          width: '100%',
          cursor: 'pointer',
          accentColor: 'var(--signal)',
          height: 4,
          borderRadius: 2,
          background: 'var(--line-2)',
          appearance: 'none',
          outline: 'none'
        }}
      />
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        width: '100%', 
        marginTop: 8,
        fontFamily: 'var(--f-mono)',
        fontSize: 9,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--ink-3)'
      }}>
        <span style={{ color: currentIndex === 0 ? 'var(--ink)' : 'var(--ink-3)', transition: 'color 0.2s' }}>Low</span>
        <span style={{ color: currentIndex === 1 ? 'var(--ink)' : 'var(--ink-3)', transition: 'color 0.2s' }}>Med</span>
        <span style={{ color: currentIndex === 2 ? 'var(--ink)' : 'var(--ink-3)', transition: 'color 0.2s' }}>High</span>
      </div>
    </div>
  );
};

export default GridBoldnessSlider;
