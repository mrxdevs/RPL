import React from "react";
import { BatsmanInningsStats } from "@/lib/types";

interface BattingTableProps {
  batsmen: BatsmanInningsStats[];
  currentStrikerId?: string;
  currentNonStrikerId?: string;
}

export function BattingTable({
  batsmen,
  currentStrikerId,
  currentNonStrikerId,
}: BattingTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
            <th className="py-2.5 px-3">Batter</th>
            <th className="py-2.5 px-3 text-right">R</th>
            <th className="py-2.5 px-3 text-right">B</th>
            <th className="py-2.5 px-3 text-right">4s</th>
            <th className="py-2.5 px-3 text-right">6s</th>
            <th className="py-2.5 px-3 text-right">SR</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 font-score">
          {batsmen.map((b) => {
            const isStriker = b.playerId === currentStrikerId;
            const isNonStriker = b.playerId === currentNonStrikerId;
            const isAtCrease = isStriker || isNonStriker;

            return (
              <tr
                key={b.playerId}
                className={`hover:bg-white/5 transition-colors ${
                  isAtCrease ? "bg-[var(--color-accent-muted)]/40 font-semibold" : ""
                }`}
              >
                <td className="py-3 px-3">
                  <div className="flex flex-col">
                    <span className="font-sans text-[var(--color-text-primary)] font-medium">
                      {b.playerName}
                      {isStriker && (
                        <span className="ml-1.5 text-xs text-[var(--color-accent)] font-bold">
                          *
                        </span>
                      )}
                    </span>
                    <span className="font-sans text-xs text-[var(--color-text-secondary)]">
                      {b.isOut
                        ? b.dismissalDescription || "out"
                        : isAtCrease
                        ? "batting"
                        : "not out"}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-3 text-right font-bold text-[var(--color-text-primary)]">
                  {b.runs}
                </td>
                <td className="py-3 px-3 text-right text-[var(--color-text-secondary)]">
                  {b.ballsFaced}
                </td>
                <td className="py-3 px-3 text-right text-[var(--color-text-secondary)]">
                  {b.fours}
                </td>
                <td className="py-3 px-3 text-right text-[var(--color-text-secondary)]">
                  {b.sixes}
                </td>
                <td className="py-3 px-3 text-right text-[var(--color-text-secondary)]">
                  {b.strikeRate.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
