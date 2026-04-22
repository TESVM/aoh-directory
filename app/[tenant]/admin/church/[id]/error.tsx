"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function AdminChurchError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams<{ tenant: string }>();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-red-200 bg-white/95 p-8 shadow-card sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-red-700">Church editor error</p>
        <h1 className="mt-4 font-display text-4xl leading-tight text-ink sm:text-5xl">This church edit page failed to load.</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-muted">
          The record may still be missing a Firestore document or a background save check may have failed. Try the page
          again first. If it repeats, return to the admin dashboard and reopen the church from there.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-900"
          >
            Reload editor
          </button>
          <Link
            href={`/${params.tenant}/admin`}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-brand-200 bg-white px-6 py-3 text-sm font-semibold text-brand-800 transition hover:border-brand-400 hover:text-brand-900"
          >
            Back to admin
          </Link>
        </div>
        {error.digest ? (
          <p className="mt-6 text-xs tracking-[0.18em] text-muted">Error reference: {error.digest}</p>
        ) : null}
      </div>
    </main>
  );
}
