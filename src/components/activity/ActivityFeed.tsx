import React from "react";
import { ActivityEvent } from "@/lib/types";
import { Badge, BadgeVariant } from "../ui/Badge";

interface ActivityFeedProps {
  activities: ActivityEvent[];
  maxItems?: number;
}

export function ActivityFeed({ activities, maxItems = 10 }: ActivityFeedProps) {
  const displayActivities = activities.slice(0, maxItems);

  const categoryBadgeVariant: Record<string, BadgeVariant> = {
    ball: "yellow",
    wicket: "live",
    milestone: "win",
    match_status: "teal",
    auction: "upcoming",
    team_update: "neutral",
  };

  if (displayActivities.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-[var(--color-text-secondary)]">
        No recent activity logged.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayActivities.map((act) => {
        const timeAgo = formatTimeAgo(act.timestamp);
        return (
          <div
            key={act.id}
            className="flex items-start gap-3 p-3.5 rounded-lg bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-colors"
          >
            <div className="pt-0.5">
              <Badge variant={categoryBadgeVariant[act.category] || "neutral"} size="sm">
                {act.category.replace("_", " ")}
              </Badge>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                  {act.title}
                </h4>
                <span className="text-[11px] font-mono text-[var(--color-text-disabled)] shrink-0">
                  {timeAgo}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {act.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatTimeAgo(timestamp: string): string {
  try {
    const diffSec = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (diffSec < 60) return "just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  } catch {
    return "";
  }
}
