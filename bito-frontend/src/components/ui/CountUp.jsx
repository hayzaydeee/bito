/**
 * CountUp — Animated number counter triggered when scrolled into view.
 *
 * Increments from 0 to `target` over `duration` ms using an ease-out
 * curve, triggered once via useInView. Supports prefix/suffix strings.
 *
 * Usage:
 *   <CountUp target={2847} suffix=" habits" duration={1800} />
 *   <CountUp target={91} suffix="%" duration={1400} />
 */
import React, { useRef, useEffect, useState } from "react";
import { useInView } from "framer-motion";

function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export default function CountUp({
  target,
  duration = 1600,
  prefix = "",
  suffix = "",
  className = "",
  style = {},
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-5% 0px" });
  const [value, setValue] = useState(0);
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!isInView) return;

    startTimeRef.current = null;

    function tick(timestamp) {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      setValue(Math.round(easeOutExpo(progress) * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isInView, target, duration]);

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}{value.toLocaleString()}{suffix}
    </span>
  );
}
