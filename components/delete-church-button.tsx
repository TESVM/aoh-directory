"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { ActionResult, deleteChurchAction } from "@/app/actions";

export function DeleteChurchButton({
  tenantSlug,
  churchId
}: {
  tenantSlug: string;
  churchId: string;
}) {
  const router = useRouter();
  const initialState: ActionResult = { ok: false, message: "" };
  const [state, formAction] = useActionState(
    async (_state: ActionResult, formData: FormData) => deleteChurchAction(formData),
    initialState
  );

  useEffect(() => {
    if (state.ok) {
      router.push(`/${tenantSlug}/admin`);
      router.refresh();
    }
  }, [router, state.ok, tenantSlug]);

  return (
    <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50/80 p-6 shadow-card">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-700">Danger zone</p>
          <h2 className="mt-3 font-serif text-3xl text-ink">Delete this church profile</h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            This removes the church from the public directory and the back office list for this tenant. Use this only
            when the listing should no longer appear at all.
          </p>
          {state.message ? (
            <div
              className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                state.ok
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-white text-rose-800"
              }`}
              aria-live="polite"
            >
              {state.message}
            </div>
          ) : null}
        </div>

        <form
          action={formAction}
          onSubmit={(event) => {
            if (!window.confirm("Delete this church profile? This will remove it from the directory.")) {
              event.preventDefault();
            }
          }}
          className="shrink-0"
        >
          <input type="hidden" name="tenantSlug" value={tenantSlug} />
          <input type="hidden" name="churchId" value={churchId} />
          <DeleteSubmitButton />
        </form>
      </div>
    </div>
  );
}

function DeleteSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 items-center justify-center rounded-full bg-rose-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Deleting church..." : "Delete church profile"}
    </button>
  );
}
