import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--color-border)] bg-[var(--color-brand-night-mid)] py-12">
      <div className="container-rpl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-xl tracking-wider text-[var(--color-accent)]">
              RPL
            </span>
            <span className="text-sm font-semibold tracking-wide uppercase text-[var(--color-text-primary)]">
              Raptee Premier League
            </span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Official cricket tournament management and live scoring platform
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--color-text-secondary)]">
          <Link href="/scoreboard" className="hover:text-[var(--color-text-primary)] transition-colors">
            Scoreboard
          </Link>
          <Link href="/schedule" className="hover:text-[var(--color-text-primary)] transition-colors">
            Schedule
          </Link>
          <Link href="/auction" className="hover:text-[var(--color-text-primary)] transition-colors">
            Auction
          </Link>
          <Link href="/teams" className="hover:text-[var(--color-text-primary)] transition-colors">
            Teams
          </Link>
          <Link href="/players" className="hover:text-[var(--color-text-primary)] transition-colors">
            Players
          </Link>
          <Link href="/login" className="hover:text-[var(--color-accent)] transition-colors">
            Official Portal
          </Link>
        </div>

        <div className="text-xs text-[var(--color-text-disabled)] font-mono">
          Raptee Premier League Season 2
        </div>
      </div>
    </footer>
  );
}
