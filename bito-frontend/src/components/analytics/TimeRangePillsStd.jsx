import React from 'react';

const ranges = [
  { value: '7d',  label: '7D'  },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: 'all', label: 'All' },
];

const TimeRangePillsStd = ({ value, onChange }) => (
  <>
    {/* Desktop Pills */}
    <div className="hidden sm:flex rounded-[var(--r-pill)] border border-[var(--line)] overflow-hidden flex-shrink-0">
      {ranges.map(r => (
        <button
          key={r.value}
          onClick={() => onChange(r.value)}
          className="px-4 py-1.5 std-mono text-[11px] uppercase tracking-wider transition-colors"
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

    {/* Mobile Select */}
    <div className="sm:hidden relative flex-shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-transparent border border-[var(--line)] rounded-[var(--r-pill)] px-4 py-1.5 pr-8 std-mono text-[11px] uppercase tracking-wider text-[var(--ink)] focus:outline-none focus:border-[var(--signal)]"
        style={{
           WebkitAppearance: 'none',
           MozAppearance: 'none'
        }}
      >
        {ranges.map(r => (
          <option key={r.value} value={r.value} className="text-black">
            {r.label}
          </option>
        ))}
      </select>
      {/* Custom dropdown arrow */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-[var(--ink-3)]">
        <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
        </svg>
      </div>
    </div>
  </>
);

export default TimeRangePillsStd;
