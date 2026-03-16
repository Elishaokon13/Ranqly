"use client";

import { TwinklingStars } from "./TwinklingStars";

export function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(104,116,232,0.6) 1px, transparent 1px),
            linear-gradient(90deg, rgba(104,116,232,0.6) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />
      <TwinklingStars />
    </div>
  );
}
