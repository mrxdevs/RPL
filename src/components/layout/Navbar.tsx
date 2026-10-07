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
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

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
    setMobileMenuOpen(false);
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

  const userConsoleLink = session
    ? session.role === "admin"
      ? { label: "Admin Console", href: "/admin", variant: "teal" as const }
      : session.role === "captain"
      ? { label: "Captain Hub", href: "/captain", variant: "teal" as const }
      : session.role === "umpire"
      ? { label: "Umpire Console", href: "/umpire", variant: "primary" as const }
      : null
    : null;

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[var(--color-border)] bg-[var(--color-bg-base)]/90 backdrop-blur-md">
        <div className="container-rpl flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
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

          {/* Desktop User actions */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <div className="flex items-center gap-3">
                {userConsoleLink && (
                  <Link href={userConsoleLink.href}>
                    <Button size="sm" variant={userConsoleLink.variant}>
                      {userConsoleLink.label}
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

          {/* Mobile menu trigger button */}
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
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5 active:bg-white/10 cursor-pointer touch-manipulation transition-colors"
            >
              <svg
                className="w-6 h-6 pointer-events-none"
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
          <div className="relative z-40 md:hidden border-t border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4 space-y-3 max-h-[calc(100dvh-4.5rem)] overflow-y-auto shadow-2xl">
            <div className="space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      isActive
                        ? "text-[var(--color-accent)] bg-white/10 font-bold"
                        : "text-[var(--color-text-primary)] hover:bg-white/5"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[var(--color-border)] space-y-2">
              {session ? (
                <>
                  <div className="text-xs text-[var(--color-text-secondary)] px-3">
                    Signed in as <span className="font-semibold text-white">{session.displayName}</span> ({session.role})
                  </div>
                  {userConsoleLink && (
                    <Link
                      href={userConsoleLink.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block w-full py-2.5 px-4 rounded-lg text-sm font-bold text-center transition-colors ${
                        userConsoleLink.variant === "primary"
                          ? "bg-[var(--color-accent)] text-[var(--color-text-inverse)] glow-yellow"
                          : "bg-[var(--color-brand-teal)] text-[var(--color-text-inverse)] glow-teal"
                      }`}
                    >
                      {userConsoleLink.label}
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-[var(--color-text-secondary)] hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-center"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-2.5 px-4 rounded-lg bg-[var(--color-accent)] text-[var(--color-text-inverse)] text-sm font-bold text-center glow-yellow"
                >
                  Portal Login
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Backdrop overlay for mobile menu drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 top-16 z-30 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Bottom Tab Bar */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-bg-base)]/95 backdrop-blur-md border-t border-[var(--color-border)] py-1.5 px-2 flex items-center justify-around"
      >
        {[
          {
            label: "Home",
            href: "/",
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            ),
          },
          {
            label: "Matches",
            href: "/scoreboard",
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            ),
          },
          {
            label: "Auction",
            href: "/auction",
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
          {
            label: "Teams",
            href: "/teams",
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            ),
          },
          {
            label: session ? (session.role === "admin" ? "Admin" : session.role === "captain" ? "Captain" : "Umpire") : "Login",
            href: session ? (session.role === "admin" ? "/admin" : session.role === "captain" ? "/captain" : "/umpire") : "/login",
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            ),
          },
        ].map((tab) => {
          const isActive = tab.href === "/" ? pathname === "/" : pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors ${
                isActive
                  ? "text-[var(--color-accent)] font-bold"
                  : "text-[var(--color-text-secondary)] hover:text-white"
              }`}
            >
              <span className="mb-0.5">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
