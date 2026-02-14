import React from 'react';

const ranges = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: 'all', label: 'All' },
];

const TimeRangePills = ({ value, onChange }) => (
  <div className="flex items-center gap-1 bg-[var(--color-surface-elevated)] rounded-full p-1">
    {ranges.map(r => (
      <button
        key={r.value}
        onClick={() => onChange(r.value)}
        className={`px-4 py-1.5 rounded-full text-sm font-spartan font-medium transition-all duration-200 ${
          value === r.value
            ? 'bg-[var(--color-brand-600)] text-white shadow-sm'
            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
        }`}
      >
        {r.label}
      </button>
    ))}
  </div>
);

export default TimeRangePills;
