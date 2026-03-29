/** Deterministic display scores for leaderboard / submission detail until real scoring API exists. */

export function deriveDisplayScores(entryId: string): {
  algorithm: number;
  community: number;
  judge: number;
} {
  const hash = entryId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return {
    algorithm: 70 + (hash % 21),
    community: 65 + ((hash * 3) % 26),
    judge: 72 + ((hash * 7) % 19),
  };
}

export function weightedTotal(s: { algorithm: number; community: number; judge: number }): number {
  return Math.round(s.algorithm * 0.4 + s.community * 0.3 + s.judge * 0.3);
}
