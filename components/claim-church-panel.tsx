"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { submitChurchClaimAction } from "@/app/actions";

export function ClaimChurchPanel({
  tenantSlug,
  churchId,
  churchName
}: {
  tenantSlug: string;
  churchId: string;
  churchName: string;
}) {
  const [open, setOpen] = useState(false);
  const [claimantName, setClaimantName] = useState("");
  const [claimantEmail, setClaimantEmail] = useState("");
  const [claimantPhone, setClaimantPhone] = useState("");
  const [roleAtChurch, setRoleAtChurch] = useState("");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    startTransition(async () => {
      const result = await submitChurchClaimAction(tenantSlug, {
        churchId,
        churchName,
        claimantName,
        claimantEmail,
        claimantPhone,
        roleAtChurch,
        verificationNotes
      });

      setMessage(result.message);
      if (result.ok) {
        setClaimantName("");
        setClaimantEmail("");
        setClaimantPhone("");
        setRoleAtChurch("");
        setVerificationNotes("");
      }
    });
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-center rounded-full border border-line px-4 py-2 text-center text-sm font-semibold text-ink transition hover:border-brand-500 hover:text-brand-700 sm:w-auto"
      >
        {open ? "Close Claim Form" : "Claim This Church"}
      </button>

      {open ? (
        <form onSubmit={handleSubmit} className="grid gap-3 rounded-[1.25rem] border border-line/80 bg-surface p-4">
          <p className="text-sm text-muted">
            This request goes to the admin for review. Access is only given after the church connection is checked.
          </p>
          <label className="space-y-2">
            <span className="text-sm font-medium text-ink">Your name</span>
            <input
              required
              value={claimantName}
              onChange={(event) => setClaimantName(event.target.value)}
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-ink outline-none focus:border-brand-700"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-ink">Your email</span>
            <input
              required
              type="email"
              value={claimantEmail}
              onChange={(event) => setClaimantEmail(event.target.value)}
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-ink outline-none focus:border-brand-700"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-ink">Your phone number</span>
            <input
              value={claimantPhone}
              onChange={(event) => setClaimantPhone(event.target.value)}
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-ink outline-none focus:border-brand-700"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-ink">Your role at the church</span>
            <input
              required
              placeholder="Pastor, assistant pastor, church admin, etc."
              value={roleAtChurch}
              onChange={(event) => setRoleAtChurch(event.target.value)}
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-ink outline-none focus:border-brand-700"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-ink">How can admin verify you?</span>
            <textarea
              rows={4}
              placeholder="Give your church email, website page, or any details that help confirm you are the pastor or authorized leader."
              value={verificationNotes}
              onChange={(event) => setVerificationNotes(event.target.value)}
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-ink outline-none focus:border-brand-700"
            />
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="text-sm text-muted">Admin will review this before any pastor login is created.</p>
            <button
              type="submit"
              disabled={isPending}
              className="flex min-h-11 w-full items-center justify-center rounded-full bg-ink px-4 py-2 text-center text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
            >
              {isPending ? "Sending..." : "Send Claim Request"}
            </button>
          </div>
          {message ? <p className="text-sm font-medium text-brand-700" aria-live="polite">{message}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
