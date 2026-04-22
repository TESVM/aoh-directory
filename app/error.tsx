"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-aura font-sans text-ink antialiased">
        <main className="mx-auto flex min-h-screen max-w-3xl items-center px-4 py-16 sm:px-6">
          <div className="w-full rounded-[2rem] border border-red-200 bg-white/95 p-8 shadow-card sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-red-700">Something went wrong</p>
            <h1 className="mt-4 font-display text-4xl leading-tight text-ink sm:text-5xl">
              The page hit an error, but the site is still recoverable.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-muted">
              Try the page again. If the same church edit screen keeps failing, go back to the admin dashboard and reopen
              the record.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={reset}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-900"
              >
                Try again
              </button>
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-brand-200 bg-white px-6 py-3 text-sm font-semibold text-brand-800 transition hover:border-brand-400 hover:text-brand-900"
              >
                Return home
              </Link>
            </div>
            {error.digest ? (
              <p className="mt-6 text-xs tracking-[0.18em] text-muted">Error reference: {error.digest}</p>
            ) : null}
          </div>
        </main>
      </body>
    </html>
  );
}
