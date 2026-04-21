"use client";

import type { FormEvent } from "react";
import { useState, useTransition } from "react";
import { submitPrayerRequestAction } from "@/app/actions";

export function PrayerRequestPanel({
  tenantSlug,
  churchId,
  churchName
}: {
  tenantSlug: string;
  churchId?: string;
  churchName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [requesterPhone, setRequesterPhone] = useState("");
  const [request, setRequest] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    startTransition(async () => {
      const result = await submitPrayerRequestAction(tenantSlug, {
        churchId,
        churchName,
        requesterName,
        requesterEmail,
        requesterPhone,
        request
      });

      setMessage(result.message);
      if (result.ok) {
        setRequesterName("");
        setRequesterEmail("");
        setRequesterPhone("");
        setRequest("");
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
        {open ? "Close Prayer Form" : "Submit A Prayer Request"}
      </button>

      {open ? (
        <form onSubmit={handleSubmit} className="grid gap-3 rounded-[1.25rem] border border-line/80 bg-surface p-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-ink">Your name</span>
            <input
              required
              value={requesterName}
              onChange={(event) => setRequesterName(event.target.value)}
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-ink outline-none focus:border-brand-700"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-ink">Your email</span>
            <input
              type="email"
              value={requesterEmail}
              onChange={(event) => setRequesterEmail(event.target.value)}
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-ink outline-none focus:border-brand-700"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-ink">Your phone number</span>
            <input
              value={requesterPhone}
              onChange={(event) => setRequesterPhone(event.target.value)}
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-ink outline-none focus:border-brand-700"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-ink">Prayer request</span>
            <textarea
              required
              rows={5}
              value={request}
              onChange={(event) => setRequest(event.target.value)}
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-ink outline-none focus:border-brand-700"
            />
          </label>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="text-sm text-muted">Prayer requests are sent privately to the directory back office.</p>
            <button
              type="submit"
              disabled={isPending}
              className="flex min-h-11 w-full items-center justify-center rounded-full bg-ink px-4 py-2 text-center text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
            >
              {isPending ? "Sending..." : "Send Prayer Request"}
            </button>
          </div>
          {message ? (
            <p className="text-sm font-medium text-brand-700" aria-live="polite">{message}</p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
