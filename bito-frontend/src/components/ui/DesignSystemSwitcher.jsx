import React from "react";
import { useTheme } from "../../contexts/ThemeContext";

/* ─────────────────────────────────────────────────────────────
   DesignSystemSwitcher V2 — illustrative card picker

   Each option shows a tiny visual fingerprint of the design
   language so the choice feels informed, not just text-based.
   Legacy: dense list rows with legacy color tokens.
   Standard: clean surface + signal dot + grid lines.
   ───────────────────────────────────────────────────────────── */

const DSPreview = ({ type, active }) => {
  // Static previews rendered as SVG-like inline divs
  if (type === "legacy") {
    return (
      <div
        style={{
          height: 56,
          background: "#0D0A1A",
          borderRadius: "6px 6px 0 0",
          padding: "8px 10px",
          display: "flex",
          flexDirection: "column",
          gap: 5,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* header bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c3aed" }} />
          <div style={{ height: 2, width: 22, borderRadius: 999, background: "rgba(255,255,255,0.25)" }} />
        </div>
        {/* list rows */}
        {[0.9, 0.6, 0.35].map((op, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, opacity: op }}>
            <div style={{ width: 5, height: 5, borderRadius: 1, background: ["#7c3aed","#4f46e5","#9333ea"][i], flexShrink: 0 }} />
            <div style={{ height: 2, flex: 1, borderRadius: 999, background: "rgba(255,255,255,0.3)" }} />
            <div style={{ height: 2, width: 10, borderRadius: 999, background: "rgba(255,255,255,0.15)" }} />
          </div>
        ))}
      </div>
    );
  }

  // Standard preview
  return (
    <div
      style={{
        height: 56,
        background: "var(--bg, #050507)",
        borderRadius: "6px 6px 0 0",
        padding: "8px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 5,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* grid lines hint */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.08,
        backgroundImage: "linear-gradient(var(--line,rgba(255,255,255,0.1)) 1px, transparent 1px), linear-gradient(90deg, var(--line,rgba(255,255,255,0.1)) 1px, transparent 1px)",
        backgroundSize: "12px 12px",
      }} />
      {/* kicker + title */}
      <div>
        <div style={{ height: 2, width: 20, borderRadius: 999, background: "var(--signal, #a78bfa)", marginBottom: 3 }} />
        <div style={{ height: 3, width: 34, borderRadius: 999, background: "var(--ink, rgba(255,255,255,0.85))" }} />
      </div>
      {/* card stub */}
      <div style={{
        background: "var(--surface, rgba(255,255,255,0.06))",
        border: "1px solid var(--line, rgba(255,255,255,0.08))",
        borderRadius: 4,
        padding: "4px 6px",
        display: "flex",
        alignItems: "center",
        gap: 5,
        flex: 1,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: 1, background: "var(--signal, #a78bfa)", flexShrink: 0 }} />
        <div style={{ height: 2, flex: 1, borderRadius: 999, background: "var(--ink-3, rgba(255,255,255,0.2))" }} />
      </div>
    </div>
  );
};

const OPTIONS = [
  {
    value: "legacy",
    label: "Legacy",
    tag: "Classic",
    description: "The original Bito interface",
  },
  {
    value: "standard",
    label: "Standard",
    tag: "New",
    description: "Redesigned design system",
  },
];

const DesignSystemSwitcher = () => {
  const { designSystem, changeDesignSystem } = useTheme();

  return (
    <div style={{ display: "flex", gap: 10 }}>
      {OPTIONS.map((opt) => {
        const active = designSystem === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => changeDesignSystem(opt.value)}
            aria-pressed={active}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              padding: 0,
              background: "transparent",
              border: active
                ? "2px solid var(--ink)"
                : "2px solid var(--line-2)",
              outline: active ? "2px solid var(--signal)" : "none",
              outlineOffset: 2,
              borderRadius: 8,
              overflow: "hidden",
              cursor: "pointer",
              transition: "border-color 0.15s ease, outline 0.15s ease, transform 0.15s ease",
              boxShadow: active
                ? "0 0 0 4px color-mix(in srgb, var(--signal) 15%, transparent)"
                : "none",
              textAlign: "left",
            }}
            onMouseOver={(e) => { if (!active) e.currentTarget.style.borderColor = "var(--line-3)"; }}
            onMouseOut={(e)  => { if (!active) e.currentTarget.style.borderColor = "var(--line-2)"; }}
          >
            {/* Illustrative preview */}
            <DSPreview type={opt.value} active={active} />

            {/* Label bar */}
            <div style={{
              background: active ? "var(--surface-2)" : "var(--surface)",
              padding: "8px 10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 6,
              transition: "background 0.15s ease",
            }}>
              <div>
                <div style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: active ? "var(--ink)" : "var(--ink-2)",
                  lineHeight: 1,
                  marginBottom: 2,
                }}>
                  {opt.label}
                </div>
                <div style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: 9,
                  color: "var(--ink-3)",
                  lineHeight: 1.3,
                }}>
                  {opt.description}
                </div>
              </div>
              {/* Active check / tag */}
              {active ? (
                <div style={{
                  width: 16, height: 16, borderRadius: "50%",
                  background: "var(--signal)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3.5 6L6.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ color: "var(--signal-ink, #160f2e)" }} />
                  </svg>
                </div>
              ) : (
                <span style={{
                  fontFamily: "var(--f-mono)",
                  fontSize: 8,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "2px 5px",
                  borderRadius: 3,
                  background: opt.value === "standard"
                    ? "color-mix(in srgb, var(--signal) 12%, transparent)"
                    : "var(--surface-2)",
                  color: opt.value === "standard" ? "var(--signal)" : "var(--ink-3)",
                  border: opt.value === "standard"
                    ? "1px solid color-mix(in srgb, var(--signal) 25%, transparent)"
                    : "1px solid var(--line)",
                  flexShrink: 0,
                }}>
                  {opt.tag}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default DesignSystemSwitcher;
