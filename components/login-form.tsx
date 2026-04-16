"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase/client";

export function LoginForm({ nextPath = "/aoh/admin" }: { nextPath?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const auth = getFirebaseClientAuth();
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();

      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, email })
      });

      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "Login failed.");
      }

      window.location.assign(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-ink">Email</span>
        <input
          type="email"
          required
          className="w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-brand-500"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-ink">Password</span>
        <input
          type="password"
          required
          className="w-full rounded-2xl border border-line bg-surface px-4 py-3 outline-none focus:border-brand-500"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-ink px-5 py-3 font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
      {error ? <p className="text-sm font-medium text-claret">{error}</p> : null}
    </form>
  );
}
