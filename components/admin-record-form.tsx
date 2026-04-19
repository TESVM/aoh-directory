"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { ActionResult } from "@/app/actions";
import { Church, Submission, ViewerContext } from "@/lib/types";

type RecordValues = Pick<
  Church,
  | "name"
  | "pastorName"
  | "pastorTitle"
  | "address"
  | "city"
  | "state"
  | "zip"
  | "district"
  | "phone"
  | "email"
  | "website"
  | "churchImageUrl"
  | "pastorImageUrl"
  | "logoImageUrl"
  | "serviceHours"
  | "onlineWorshipUrl"
  | "status"
  | "source"
  | "notes"
>;

export function AdminRecordForm({
  viewer,
  recordIdName,
  recordIdValue,
  values,
  title,
  description,
  submitLabel,
  action
}: {
  viewer: ViewerContext;
  recordIdName: "churchId" | "submissionId";
  recordIdValue: string;
  values: RecordValues;
  title: string;
  description: string;
  submitLabel: string;
  action: (formData: FormData) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const initialState: ActionResult = { ok: false, message: "" };
  const [state, formAction] = useActionState(async (_state: ActionResult, formData: FormData) => action(formData), initialState);

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [router, state.ok]);

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      className="space-y-8 rounded-[1.75rem] border border-line/80 bg-white p-6 shadow-card"
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-700">Back Office</p>
        <h1 className="mt-3 font-serif text-4xl text-ink">{title}</h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-muted">{description}</p>
      </div>

      <input type="hidden" name="tenantSlug" value={viewer.tenant.slug} />
      <input type="hidden" name={recordIdName} value={recordIdValue} />

      {state.message ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            state.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
          aria-live="polite"
        >
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Church name" name="name" defaultValue={values.name} required />
        <Field label="District" name="district" defaultValue={values.district} required />
        <Field label="Pastor name" name="pastorName" defaultValue={values.pastorName} required />
        <Field label="Pastor title" name="pastorTitle" defaultValue={values.pastorTitle} />
        <Field label="Street address" name="address" defaultValue={values.address} required className="md:col-span-2" />
        <Field label="City" name="city" defaultValue={values.city} required />
        <Field label="State" name="state" defaultValue={values.state} required />
        <Field label="ZIP" name="zip" defaultValue={values.zip} />
        <Field label="Phone" name="phone" defaultValue={values.phone} />
        <Field label="Email" name="email" defaultValue={values.email} type="email" />
        <Field label="Website" name="website" defaultValue={values.website} />
        <Field label="Online worship link" name="onlineWorshipUrl" defaultValue={values.onlineWorshipUrl} className="md:col-span-2" />
        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium text-ink">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={values.status}
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none ring-0 transition focus:border-brand-700"
          >
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
          </select>
        </div>
        <TextArea
          label="Service hours"
          name="serviceHours"
          defaultValue={(values.serviceHours || []).join("\n")}
          className="md:col-span-2"
          rows={4}
          helpText="Put each service time on its own line."
        />
        <div className="md:col-span-2 rounded-[1.5rem] border border-line/80 bg-sky/40 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-700">Visuals</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Add a church photo, pastor photo, and church logo so visitors can connect with the church faster.
          </p>
          <div className="mt-4 rounded-2xl border border-brand-100 bg-white px-4 py-3 text-sm text-muted">
            Upload image files here or paste image links below. If you add both, the new uploaded file will replace the link.
          </div>
          <div className="mt-3 rounded-2xl border border-dashed border-line bg-white/80 px-4 py-3 text-sm leading-6 text-muted">
            <p className="font-semibold text-ink">Accepted upload files:</p>
            <p>PNG, JPG, JPEG, WEBP, and GIF files work best for photos and logos.</p>
            <p>If you have an SVG logo, paste the logo link in the field above instead of uploading the file.</p>
            <p className="mt-2">
              If upload still fails, the church can keep working by pasting image links until Firebase finishes linking the Storage bucket.
            </p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Field
              label="Church photo link"
              name="churchImageUrl"
              defaultValue={values.churchImageUrl}
            />
            <Field
              label="Pastor photo link"
              name="pastorImageUrl"
              defaultValue={values.pastorImageUrl}
            />
            <Field
              label="Church logo link"
              name="logoImageUrl"
              defaultValue={values.logoImageUrl}
            />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <ImageUploadField
              label="Church photo"
              name="churchImage"
              currentUrl={values.churchImageUrl}
              helpText="Use an exterior or sanctuary photo."
            />
            <ImageUploadField
              label="Pastor photo"
              name="pastorImage"
              currentUrl={values.pastorImageUrl}
              helpText="Use a clear portrait photo."
            />
            <ImageUploadField
              label="Church logo"
              name="churchLogo"
              currentUrl={values.logoImageUrl}
              helpText="Square logos work best."
            />
          </div>
        </div>
        <Field label="Source" name="source" defaultValue={values.source} className="md:col-span-2" />
        <TextArea label="Notes" name="notes" defaultValue={values.notes} className="md:col-span-2" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line/80 pt-6">
        <p className="text-sm text-muted">
          {viewer.role === "overseer" || viewer.role === "bishop"
            ? `You can only edit District ${viewer.district} records.`
            : viewer.role === "pastor"
              ? "You can only edit the church assigned to your login."
            : "Tenant admin access can edit and publish all district records."}
        </p>
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Saving changes..." : label}
    </button>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required = false,
  className = ""
}: {
  label: string;
  name: keyof RecordValues | "zip";
  defaultValue?: string;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <label htmlFor={name} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none ring-0 transition focus:border-brand-700"
      />
    </div>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  className = "",
  rows = 5,
  helpText
}: {
  label: string;
  name: "notes" | "serviceHours";
  defaultValue?: string;
  className?: string;
  rows?: number;
  helpText?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`.trim()}>
      <label htmlFor={name} className="text-sm font-medium text-ink">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        rows={rows}
        className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none ring-0 transition focus:border-brand-700"
      />
      {helpText ? <p className="text-xs text-muted">{helpText}</p> : null}
    </div>
  );
}

function ImageUploadField({
  label,
  name,
  currentUrl,
  helpText
}: {
  label: string;
  name: "churchImage" | "pastorImage" | "churchLogo";
  currentUrl?: string;
  helpText?: string;
}) {
  return (
    <div className="space-y-3 rounded-[1.35rem] border border-line/80 bg-white p-4">
      <p className="text-sm font-medium text-ink">{label}</p>
      {currentUrl ? (
        <img
          src={currentUrl}
          alt={label}
          className="aspect-[4/3] w-full rounded-[1.1rem] border border-line/70 object-cover"
        />
      ) : (
        <div className="grid aspect-[4/3] w-full place-items-center rounded-[1.1rem] border border-dashed border-line bg-surface text-center text-sm text-muted">
          No image uploaded yet
        </div>
      )}
      <input
        name={name}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="block w-full text-sm text-ink file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:font-semibold file:text-white"
      />
      {helpText ? <p className="text-xs text-muted">{helpText}</p> : null}
    </div>
  );
}
