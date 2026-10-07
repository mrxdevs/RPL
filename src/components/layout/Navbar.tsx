"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SessionData } from "@/lib/types";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasLiveMatch, setHasLiveMatch] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkState() {
      try {
        const [meRes, matchRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/matches?status=live"),
        ]);
        const [meJson, matchJson] = await Promise.all([
          meRes.json(),
          matchRes.json(),
        ]);

        if (isMounted) {
          if (meJson.success && meJson.data) {
            setSession(meJson.data);
          } else {
            setSession(null);
          }
          if (matchJson.success && matchJson.data && matchJson.data.length > 0) {
            setHasLiveMatch(true);
          } else {
            setHasLiveMatch(false);
          }
        }
      } catch {
        // Silently catch fetch errors on unmount
      }
    }

    checkState();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
    router.push("/login");
    router.refresh();
  };

  const navLinks = [
    { label: "Matches", href: "/scoreboard" },
    { label: "Schedule", href: "/schedule" },
    { label: "Auction", href: "/auction" },
    { label: "Teams", href: "/teams" },
    { label: "Players", href: "/players" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--color-border)] bg-[var(--color-bg-base)]/90 backdrop-blur-md">
      <div className="container-rpl flex items-center justify-between h-16">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 group text-decoration-none"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--color-brand-orange)] text-[var(--color-text-inverse)] font-display font-black text-2xl tracking-tighter shadow-md group-hover:scale-105 transition-transform">
              RPL
            </div>
            <div className="flex flex-col">
              <span className="font-display font-black text-lg tracking-wider text-[var(--color-text-primary)] leading-none uppercase">
                Raptee Premier League
              </span>
              <span className="text-[10px] font-semibold text-[var(--color-accent)] tracking-widest uppercase">
                Season 2
              </span>
            </div>
          </Link>

          {hasLiveMatch && (
            <Link href="/scoreboard" className="hidden sm:inline-block">
              <Badge variant="live" withPulse>
                Live Now
              </Badge>
            </Link>
          )}
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "text-[var(--color-accent)] bg-white/5 font-semibold"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User actions */}
        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <div className="flex items-center gap-3">
              {session.role === "admin" && (
                <Link href="/admin">
                  <Button size="sm" variant="teal">
                    Admin Console
                  </Button>
                </Link>
              )}
              {session.role === "captain" && (
                <Link href="/captain">
                  <Button size="sm" variant="teal">
                    Captain Hub
                  </Button>
                </Link>
              )}
              {session.role === "umpire" && (
                <Link href="/umpire">
                  <Button size="sm" variant="primary">
                    Umpire Console
                  </Button>
                </Link>
              )}

              <div className="flex items-center gap-2 pl-2 border-l border-[var(--color-border)]">
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {session.displayName}
                </span>
                <Button size="sm" variant="ghost" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm" variant="primary">
                Portal Login
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          {hasLiveMatch && (
            <Link href="/scoreboard">
              <Badge variant="live" withPulse size="sm">
                Live
              </Badge>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-[var(--color-text-primary)] hover:bg-white/5"
            >
              {link.label}
            </Link>
          ))}

          <div className="pt-3 border-t border-[var(--color-border)]">
            {session ? (
              <div className="space-y-2">
                <div className="text-xs text-[var(--color-text-secondary)] px-3">
                  Signed in as <span className="font-semibold text-white">{session.displayName}</span> ({session.role})
                </div>
                {session.role === "admin" && (
                  <Link href="/admin" className="block">
                    <Button size="sm" variant="teal" className="w-full">
                      Admin Console
                    </Button>
                  </Link>
                )}
                {session.role === "captain" && (
                  <Link href="/captain" className="block">
                    <Button size="sm" variant="teal" className="w-full">
                      Captain Hub
                    </Button>
                  </Link>
                )}
                {session.role === "umpire" && (
                  <Link href="/umpire" className="block">
                    <Button size="sm" variant="primary" className="w-full">
                      Umpire Console
                    </Button>
                  </Link>
                )}
                <Button size="sm" variant="ghost" onClick={handleLogout} className="w-full">
                  Logout
                </Button>
              </div>
            ) : (
              <Link href="/login" className="block">
                <Button size="sm" variant="primary" className="w-full">
                  Portal Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
