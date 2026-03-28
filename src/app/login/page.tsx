"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogle() {
    setGoogleLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });

    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  }

  return (
    <div className="lifeline-auth-canvas flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-[var(--lifeline-accent)] hover:opacity-80 transition-opacity w-fit"
          >
            Lifeline.
          </Link>
          <p className="lifeline-section-label">Account</p>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Sign in</h1>
          <p className="text-sm text-zinc-500 leading-relaxed">Continue to your dashboard.</p>
        </div>

        {sent ? (
          <div className="flex flex-col gap-3">
            <div className="border border-zinc-900/[0.08] rounded-2xl bg-white px-5 py-4 shadow-sm shadow-zinc-900/[0.04]">
              <p className="text-sm text-zinc-700 font-medium">Check your email</p>
              <p className="text-sm text-zinc-500 mt-1">We sent a link to <span className="text-zinc-900">{email}</span>. Click it to sign in.</p>
            </div>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors text-left"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 rounded-2xl border border-zinc-900/[0.08] bg-white p-6 shadow-lg shadow-zinc-900/[0.04]">
            {/* Google */}
            <Button
              onClick={handleGoogle}
              disabled={googleLoading}
              variant="outline"
              className="h-11 w-full gap-3 text-sm rounded-xl border-zinc-200"
            >
              <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {googleLoading ? "Redirecting..." : "Continue with Google"}
            </Button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-zinc-900/10" />
              <span className="text-xs text-zinc-400 font-medium">or</span>
              <div className="flex-1 h-px bg-zinc-900/10" />
            </div>

            {/* Magic link */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 text-sm rounded-xl"
                autoFocus
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <Button
                type="submit"
                disabled={loading || !email.trim()}
                variant="outline"
                className="h-11 text-sm rounded-xl"
              >
                {loading ? "Sending..." : "Send magic link"}
              </Button>
            </form>
          </div>
        )}

        <p className="text-xs text-zinc-400 text-center">
          By signing in you agree to our terms of service.
        </p>
      </div>
    </div>
  );
}
