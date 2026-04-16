"use client";

import { useActionState } from "react";
import { sendBroadcastMessageAction, type CommunicationResult } from "@/app/actions";

const initialState: CommunicationResult = {
  ok: false,
  message: ""
};

export function CommunicationsCenter({
  tenantSlug,
  districts
}: {
  tenantSlug: string;
  districts: string[];
}) {
  const [state, formAction, pending] = useActionState(sendBroadcastMessageAction, initialState);

  return (
    <section className="rounded-[1.75rem] border border-line/80 bg-white p-6 shadow-card">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-700">Communications Center</p>
      <h2 className="mt-3 font-serif text-3xl text-ink">Send a message to churches</h2>
      <p className="mt-3 max-w-3xl text-base leading-7 text-muted">
        Send one message by email, text message, or both. Leave district blank to contact every church in the directory.
      </p>

      <form action={formAction} className="mt-6 grid gap-4 md:grid-cols-2">
        <input type="hidden" name="tenantSlug" value={tenantSlug} />

        <div className="space-y-2">
          <label htmlFor="channel" className="text-sm font-medium text-ink">
            Send by
          </label>
          <select
            id="channel"
            name="channel"
            defaultValue="email"
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none focus:border-brand-700"
          >
            <option value="email">Email</option>
            <option value="sms">Text message</option>
            <option value="both">Email and text message</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="district" className="text-sm font-medium text-ink">
            District
          </label>
          <select
            id="district"
            name="district"
            defaultValue=""
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none focus:border-brand-700"
          >
            <option value="">All districts</option>
            {districts.map((district) => (
              <option key={district} value={district}>
                District {district}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="subject" className="text-sm font-medium text-ink">
            Email subject
          </label>
          <input
            id="subject"
            name="subject"
            placeholder="Example: District meeting this Saturday"
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none focus:border-brand-700"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="body" className="text-sm font-medium text-ink">
            Message
          </label>
          <textarea
            id="body"
            name="body"
            required
            rows={8}
            placeholder="Write the message you want every church to receive."
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none focus:border-brand-700"
          />
        </div>

        <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-4 border-t border-line/80 pt-4">
          <p className="text-sm text-muted">
            Email needs SendGrid keys. Text messaging needs Twilio keys.
          </p>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Sending..." : "Send Message"}
          </button>
        </div>

        {state.message ? (
          <div
            className={`md:col-span-2 rounded-2xl px-4 py-3 text-sm ${
              state.ok ? "border border-emerald-200 bg-emerald-50 text-emerald-900" : "border border-claret/20 bg-claret/5 text-claret"
            }`}
          >
            {state.message}
          </div>
        ) : null}
      </form>
    </section>
  );
}
