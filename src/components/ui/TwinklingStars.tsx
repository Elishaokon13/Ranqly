"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";

const STAR_COUNT = 12;

function randomPercent(min: number, max: number) {
  return `${min + Math.random() * (max - min)}%`;
}

// 4-point star (outer points N,E,S,W; inner at diagonals), viewBox 0 0 24 24
const starPath4 =
  "M12 2 L14.83 9.17 L22 12 L14.83 14.83 L12 22 L9.17 14.83 L2 12 L9.17 9.17 Z";

function SingleStar({
  id,
  size,
  duration,
  delay,
}: {
  id: number;
  size: number;
  duration: number;
  delay: number;
}) {
  const [position, setPosition] = useState(() => ({
    left: randomPercent(2, 92),
    top: randomPercent(3, 88),
  }));

  const pickNewPosition = useCallback(() => {
    setPosition({
      left: randomPercent(2, 92),
      top: randomPercent(3, 88),
    });
  }, []);

  return (
    <motion.div
      className="absolute text-primary-300/80"
      style={{
        left: position.left,
        top: position.top,
        width: size,
        height: size,
      }}
      animate={{ opacity: [0, 0.85, 0] }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      onAnimationComplete={pickNewPosition}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-full w-full drop-shadow-[0_0_4px_rgba(104,116,232,0.5)]"
        aria-hidden
      >
        <path d={starPath4} />
      </svg>
    </motion.div>
  );
}

export function TwinklingStars() {
  const stars = Array.from({ length: STAR_COUNT }, (_, i) => ({
    id: i,
    size: 10 + (i % 5),
    delay: i * 0.5 + (i % 4) * 0.8,
    duration: 2 + (i % 3) * 0.5,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {stars.map((s) => (
        <SingleStar
          key={s.id}
          id={s.id}
          size={s.size}
          duration={s.duration}
          delay={s.delay}
        />
      ))}
    </div>
  );
}
