import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-700">AOH Directory</p>
      <h1 className="mt-4 font-serif text-5xl text-ink">Page not found</h1>
      <p className="mt-4 max-w-xl text-lg leading-8 text-muted">
        The page you requested does not exist or has moved. Use the live directory or the admin back office links to keep navigating.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white">
          Tenant home
        </Link>
        <Link href="/aoh" className="rounded-full border border-line px-5 py-3 text-sm font-semibold text-ink">
          AOH directory
        </Link>
      </div>
    </main>
  );
}
