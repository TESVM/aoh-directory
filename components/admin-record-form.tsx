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
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action} className="space-y-8 rounded-[1.75rem] border border-line/80 bg-white p-6 shadow-card">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-700">Back Office</p>
        <h1 className="mt-3 font-serif text-4xl text-ink">{title}</h1>
        <p className="mt-3 max-w-3xl text-lg leading-8 text-muted">{description}</p>
      </div>

      <input type="hidden" name="tenantSlug" value={viewer.tenant.slug} />
      <input type="hidden" name={recordIdName} value={recordIdValue} />

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
        <Field label="Source" name="source" defaultValue={values.source} className="md:col-span-2" />
        <TextArea label="Notes" name="notes" defaultValue={values.notes} className="md:col-span-2" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line/80 pt-6">
        <p className="text-sm text-muted">
          {viewer.role === "district_leader"
            ? `You can only edit District ${viewer.district} records.`
            : "Tenant admin access can edit and publish all district records."}
        </p>
        <button className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">
          {submitLabel}
        </button>
      </div>
    </form>
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
  className = ""
}: {
  label: string;
  name: "notes";
  defaultValue?: string;
  className?: string;
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
        rows={5}
        className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-ink outline-none ring-0 transition focus:border-brand-700"
      />
    </div>
  );
}
