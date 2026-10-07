import React from "react";
import { BowlerInningsStats } from "@/lib/types";

interface BowlingTableProps {
  bowlers: BowlerInningsStats[];
  currentBowlerId?: string;
}

export function BowlingTable({ bowlers, currentBowlerId }: BowlingTableProps) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="border-b border-[var(--color-border)] text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
            <th className="py-2.5 px-3">Bowler</th>
            <th className="py-2.5 px-3 text-right">O</th>
            <th className="py-2.5 px-3 text-right">M</th>
            <th className="py-2.5 px-3 text-right">R</th>
            <th className="py-2.5 px-3 text-right">W</th>
            <th className="py-2.5 px-3 text-right">ECON</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 font-score">
          {bowlers.map((b) => {
            const isCurrent = b.playerId === currentBowlerId;

            return (
              <tr
                key={b.playerId}
                className={`hover:bg-white/5 transition-colors ${
                  isCurrent ? "bg-[var(--color-brand-teal)]/10 font-semibold" : ""
                }`}
              >
                <td className="py-3 px-3">
                  <div className="font-sans text-[var(--color-text-primary)] font-medium">
                    {b.playerName}
                    {isCurrent && (
                      <span className="ml-1.5 text-xs text-[var(--color-brand-teal-light)] font-bold">
                        *
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-3 text-right text-[var(--color-text-secondary)]">
                  {b.overs.toFixed(1)}
                </td>
                <td className="py-3 px-3 text-right text-[var(--color-text-secondary)]">
                  {b.maidens}
                </td>
                <td className="py-3 px-3 text-right text-[var(--color-text-secondary)]">
                  {b.runsConceded}
                </td>
                <td className="py-3 px-3 text-right font-bold text-[var(--color-accent)]">
                  {b.wickets}
                </td>
                <td className="py-3 px-3 text-right text-[var(--color-text-secondary)]">
                  {b.economy.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
