"use client";

import { useEffect, useState } from "react";
import { useInView } from "framer-motion";
import { useRef } from "react";

interface CountUpProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function CountUp({
  end,
  duration = 2,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start: number;
    const step = (t: number) => {
      if (!start) start = t;
      const progress = Math.min((t - start) / (duration * 1000), 1);
      const easeOut = 1 - (1 - progress) ** 2;
      setValue(easeOut * end);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, end, duration]);

  const display =
    decimals > 0
      ? value.toFixed(decimals)
      : value >= 1000
        ? value.toLocaleString("en-US", { maximumFractionDigits: 0 })
        : Math.round(value).toString();

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
