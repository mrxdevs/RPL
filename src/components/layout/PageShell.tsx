import React from "react";

interface PageShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageShell({
  children,
  title,
  subtitle,
  action,
  className = "",
}: PageShellProps) {
  return (
    <main className={`flex-1 py-8 sm:py-10 pb-24 md:pb-10 ${className}`}>
      <div className="container-rpl space-y-8">
        {(title || action) && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
            <div>
              {title && (
                <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-[var(--color-text-primary)]">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {subtitle}
                </p>
              )}
            </div>
            {action && <div className="flex items-center gap-3">{action}</div>}
          </div>
        )}
        {children}
      </div>
    </main>
  );
}
