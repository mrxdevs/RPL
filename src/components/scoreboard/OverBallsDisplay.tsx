import React from "react";
import { BallRecord } from "@/lib/types";

interface OverBallsDisplayProps {
  balls: BallRecord[];
  limit?: number;
}

export function OverBallsDisplay({ balls, limit = 6 }: OverBallsDisplayProps) {
  const recentBalls = balls.slice(0, limit);

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1 font-score">
      {recentBalls.length === 0 ? (
        <span className="text-xs text-[var(--color-text-secondary)]">No balls bowled yet in this over</span>
      ) : (
        recentBalls.map((b) => {
          let style =
            "bg-white/10 text-[var(--color-text-primary)] border border-white/10";

          if (b.outcome === "4") {
            style =
              "bg-[var(--color-brand-orange)]/20 text-[var(--color-brand-orange)] border border-[var(--color-brand-orange)]/50 font-bold";
          } else if (b.outcome === "6") {
            style =
              "bg-[var(--color-brand-yellow)]/20 text-[var(--color-brand-yellow)] border border-[var(--color-brand-yellow)]/50 font-black";
          } else if (b.isWicket || b.outcome === "Wicket") {
            style =
              "bg-[var(--color-status-live)]/20 text-[var(--color-status-live)] border border-[var(--color-status-live)]/50 font-bold";
          } else if (b.outcome === "Wide" || b.outcome === "No-ball") {
            style =
              "bg-[var(--color-brand-teal)]/20 text-[var(--color-brand-teal-light)] border border-[var(--color-brand-teal)]/40";
          }

          const label =
            b.outcome === "Wide"
              ? "Wd"
              : b.outcome === "No-ball"
              ? "Nb"
              : b.outcome === "Wicket"
              ? "W"
              : b.outcome;

          return (
            <span
              key={b.id}
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs shrink-0 ${style}`}
            >
              {label}
            </span>
          );
        })
      )}
    </div>
  );
}
