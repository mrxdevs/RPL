import React from "react";
import { FallOfWicket } from "@/lib/types";

interface FallOfWicketsTableProps {
  fallOfWickets: FallOfWicket[];
}

export function FallOfWicketsTable({ fallOfWickets }: FallOfWicketsTableProps) {
  if (fallOfWickets.length === 0) {
    return (
      <div className="text-xs text-[var(--color-text-secondary)] py-2">
        No wickets have fallen in this innings.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3 font-score text-xs">
      {fallOfWickets.map((fow) => (
        <div
          key={fow.wicketNumber}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/20 border border-white/5"
        >
          <span className="font-bold text-[var(--color-accent)]">
            {fow.runs}/{fow.wicketNumber}
          </span>
          <span className="text-[var(--color-text-secondary)] font-sans">
            ({fow.batsmanName}, {fow.overString} ov)
          </span>
        </div>
      ))}
    </div>
  );
}
