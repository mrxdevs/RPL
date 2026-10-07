import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "surface" | "elevated" | "accent";
  className?: string;
}

export function Card({
  children,
  variant = "surface",
  className = "",
  ...props
}: CardProps) {
  const variantStyles = {
    surface: "bg-[var(--color-bg-surface)] border border-[var(--color-border)]",
    elevated: "bg-[var(--color-bg-elevated)] border border-[var(--color-border-strong)]",
    accent: "bg-[var(--color-bg-surface)] border border-[var(--color-border-accent)]",
  };

  return (
    <div
      className={`rounded-xl shadow-md overflow-hidden ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`p-4 sm:p-5 border-b border-[var(--color-border)] ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`p-4 sm:p-5 ${className}`}>{children}</div>;
}

export function CardFooter({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`p-4 sm:p-5 border-t border-[var(--color-border)] bg-black/10 ${className}`}>
      {children}
    </div>
  );
}
