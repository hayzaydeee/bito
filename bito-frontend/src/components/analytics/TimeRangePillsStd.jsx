import React from 'react';

const ranges = [
  { value: '7d',  label: '7D'  },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: 'all', label: 'All' },
];

const TimeRangePillsStd = ({ value, onChange }) => (
  <div className="flex rounded-[var(--r-pill)] border border-[var(--line)] overflow-hidden flex-shrink-0">
    {ranges.map(r => (
      <button
        key={r.value}
        onClick={() => onChange(r.value)}
        className="px-4 py-1.5 std-mono text-[10px] uppercase tracking-wider transition-colors"
        style={
          value === r.value
            ? { background: 'var(--signal)', color: 'var(--signal-ink)' }
            : { color: 'var(--ink-3)' }
        }
      >
        {r.label}
      </button>
    ))}
  </div>
);

export default TimeRangePillsStd;
