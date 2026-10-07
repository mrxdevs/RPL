"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent, u = username, p = password) => {
    if (e) e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "Authentication failed");
        return;
      }

      // Redirect based on role
      const role = json.data?.role;
      if (role === "admin") router.push("/admin");
      else if (role === "captain") router.push("/captain");
      else if (role === "umpire") router.push("/umpire");
      else router.push("/");

      router.refresh();
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    handleLogin(undefined, u, p);
  };

  return (
    <PageShell className="flex items-center justify-center min-h-[75vh]">
      <div className="w-full max-w-md space-y-6 mx-auto">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--color-brand-orange)] text-[var(--color-text-inverse)] font-display font-black text-2xl tracking-tight shadow-md">
            RPL
          </div>
          <h1 className="text-3xl font-black font-display uppercase tracking-wide text-white">
            Official Portal
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Sign in to access Admin, Captain, or Umpire consoles
          </p>
        </div>

        <Card variant="surface">
          <CardBody className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-[var(--color-status-live-bg)] border border-[var(--color-status-live)]/30 text-[var(--color-status-live)] text-xs font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-sm text-white placeholder-[var(--color-text-disabled)] focus:border-[var(--color-accent)] focus:outline-none"
                  placeholder="Enter username"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] font-display">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border)] text-sm text-white placeholder-[var(--color-text-disabled)] focus:border-[var(--color-accent)] focus:outline-none"
                  placeholder="Enter password"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                className="w-full"
              >
                Sign In
              </Button>
            </form>

            {/* Quick Demo Credentials */}
            <div className="mt-6 pt-5 border-t border-[var(--color-border)] space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] font-display block text-center">
                Quick Access Demo Accounts
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => quickLogin("admin", "admin123")}
                  className="p-2.5 rounded-lg bg-black/30 border border-white/5 hover:border-[var(--color-brand-teal)] text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold text-white font-display uppercase">Tournament Admin</div>
                  <div className="text-[10px] text-[var(--color-brand-teal-light)]">admin</div>
                </button>

                <button
                  type="button"
                  onClick={() => quickLogin("umpire", "umpire123")}
                  className="p-2.5 rounded-lg bg-black/30 border border-white/5 hover:border-[var(--color-accent)] text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold text-white font-display uppercase">Match Umpire</div>
                  <div className="text-[10px] text-[var(--color-accent)]">umpire</div>
                </button>

                <button
                  type="button"
                  onClick={() => quickLogin("captain_chargers", "captain123")}
                  className="p-2.5 rounded-lg bg-black/30 border border-white/5 hover:border-[var(--color-brand-orange)] text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold text-white font-display uppercase">Captain (Chargers)</div>
                  <div className="text-[10px] text-[var(--color-brand-orange-light)]">captain_chargers</div>
                </button>

                <button
                  type="button"
                  onClick={() => quickLogin("captain_blasters", "captain123")}
                  className="p-2.5 rounded-lg bg-black/30 border border-white/5 hover:border-[var(--color-brand-teal)] text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold text-white font-display uppercase">Captain (Blasters)</div>
                  <div className="text-[10px] text-[var(--color-brand-teal-light)]">captain_blasters</div>
                </button>

                <button
                  type="button"
                  onClick={() => quickLogin("user", "user123")}
                  className="col-span-2 p-2.5 rounded-lg bg-black/30 border border-white/5 hover:border-white/30 text-left transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-white font-display uppercase">General User / Fan</div>
                    <div className="text-[10px] text-[var(--color-text-secondary)]">user (password: user123)</div>
                  </div>
                  <span className="text-[10px] font-semibold text-[var(--color-accent)] font-mono">Role: User</span>
                </button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </PageShell>
  );
}
