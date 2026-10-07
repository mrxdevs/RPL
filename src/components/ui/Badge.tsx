import React from "react";

export type BadgeVariant =
  | "live"
  | "win"
  | "loss"
  | "draw"
  | "upcoming"
  | "yellow"
  | "teal"
  | "neutral";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
  withPulse?: boolean;
}

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  className = "",
  withPulse = false,
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    live: "bg-[var(--color-status-live-bg)] text-[var(--color-status-live)] border border-[var(--color-status-live)]/30",
    win: "bg-[var(--color-status-win-bg)] text-[var(--color-status-win)] border border-[var(--color-status-win)]/30",
    loss: "bg-[var(--color-status-loss-bg)] text-[var(--color-status-loss)] border border-[var(--color-status-loss)]/30",
    draw: "bg-[var(--color-status-draw-bg)] text-[var(--color-status-draw)] border border-[var(--color-status-draw)]/30",
    upcoming: "bg-[var(--color-status-upcoming-bg)] text-[var(--color-status-upcoming)] border border-white/10",
    yellow: "bg-[var(--color-accent-muted)] text-[var(--color-accent)] border border-[var(--color-accent)]/30",
    teal: "bg-[var(--color-brand-teal)]/15 text-[var(--color-brand-teal-light)] border border-[var(--color-brand-teal)]/30",
    neutral: "bg-white/5 text-[var(--color-text-secondary)] border border-white/10",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 font-medium tracking-wide",
    md: "text-xs px-2.5 py-1 font-semibold tracking-wider uppercase font-display",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {withPulse && <span className="live-dot" />}
      {children}
    </span>
  );
}
