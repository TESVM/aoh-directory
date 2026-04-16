import { LoginForm } from "@/components/login-form";
import { SetupBanner } from "@/components/setup-banner";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const nextPath = Array.isArray(resolvedSearchParams.next)
    ? resolvedSearchParams.next[0]
    : resolvedSearchParams.next || "/aoh/admin";

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="w-full space-y-6">
        <SetupBanner />
        <div className="grid gap-8 rounded-[2rem] border border-line/80 bg-white p-8 shadow-soft lg:grid-cols-[1fr_0.9fr]">
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">Firebase Auth</p>
          <h1 className="mt-4 font-serif text-5xl text-ink">Administrator sign in</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted">
            Sign in with a Firebase Authentication email/password account that also has a matching
            document in the Firestore `users` collection. Session cookies are issued server-side.
          </p>
        </section>
        <section className="rounded-[1.5rem] border border-line/80 bg-surface p-6">
          <LoginForm nextPath={nextPath} />
        </section>
        </div>
      </div>
    </main>
  );
}
