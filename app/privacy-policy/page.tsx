import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | AOH Church of God Directory",
  description: "Privacy Policy for the AOH Church of God Directory app and website.",
  alternates: {
    canonical: "https://aohdirectory.com/privacy-policy"
  }
};

const sections = [
  {
    title: "1. Information We Collect",
    body: [
      "AOH Directory may display church-related information such as church names, locations, districts, pastor or leader names, service information, and public contact details. This information is used to help users find and connect with Apostolic Overcoming Holy Church of God, Inc. churches.",
      "If users submit information through forms, contact requests, prayer requests, registration forms, or updates, we may collect the information provided, such as name, email address, phone number, church name, or message content."
    ]
  },
  {
    title: "2. How We Use Information",
    bullets: [
      "Maintain and improve the church directory",
      "Help users find church information",
      "Respond to submitted requests or questions",
      "Verify or update church directory listings",
      "Improve app performance and user experience",
      "Communicate important updates related to the directory"
    ]
  },
  {
    title: "3. Information Sharing",
    body: [
      "AOH Directory does not sell personal information. Information may be shared only when necessary to operate the directory, respond to requests, maintain accurate church records, comply with legal obligations, or support app and website services."
    ]
  },
  {
    title: "4. Public Directory Information",
    body: [
      "Some church information may be publicly visible in the app and website, including church name, city, state, district, pastor or leader name, and other directory-related details. Users or church representatives may request corrections or updates to directory information."
    ]
  },
  {
    title: "5. Data Security",
    body: [
      "We take reasonable steps to protect information submitted through the app or website. However, no online system can be guaranteed to be completely secure."
    ]
  },
  {
    title: "6. Third-Party Services",
    body: [
      "The app or website may use third-party services for hosting, analytics, maps, forms, or other app functions. These services may collect limited technical information according to their own privacy policies."
    ]
  },
  {
    title: "7. Children's Privacy",
    body: [
      "AOH Directory is not designed to knowingly collect personal information from children under the age of 13. If we learn that such information has been submitted, we will take reasonable steps to remove it."
    ]
  },
  {
    title: "8. Updates to This Policy",
    body: [
      "This Privacy Policy may be updated from time to time. Any updates will be posted on this page with a revised effective date."
    ]
  }
] as const;

export default function PrivacyPolicyPage() {
  return (
    <main id="main-content" className="min-h-screen bg-surface">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <Link
          href="/aoh"
          className="inline-flex min-h-11 items-center rounded-full border border-brand-100 bg-white px-5 py-2 text-sm font-semibold text-ink shadow-card transition hover:border-pine hover:text-pine"
        >
          Back to Directory
        </Link>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-line/80 bg-white shadow-soft">
          <div className="bg-gradient-to-br from-[#341457] via-[#4b1f6f] to-[#25123d] px-6 py-8 text-white sm:px-8 sm:py-10">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-200">Privacy Policy</p>
            <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">AOH Directory</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/85 sm:text-lg">
              AOH Directory respects your privacy. This page explains how information is handled when
              you use the AOH Directory app and website.
            </p>
            <p className="mt-4 text-sm font-medium text-brand-100">Effective Date: April 27, 2026</p>
          </div>

          <div className="space-y-8 px-6 py-8 sm:px-8 sm:py-10">
            {sections.map((section) => (
              <section key={section.title} className="space-y-4">
                <h2 className="text-2xl font-serif text-ink">{section.title}</h2>
                {"body" in section
                  ? section.body.map((paragraph) => (
                      <p key={paragraph} className="text-base leading-8 text-muted">
                        {paragraph}
                      </p>
                    ))
                  : null}
                {"bullets" in section ? (
                  <ul className="space-y-3 text-base leading-8 text-muted">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3">
                        <span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-brand-600" aria-hidden="true" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}

            <section className="space-y-4">
              <h2 className="text-2xl font-serif text-ink">9. Contact</h2>
              <p className="text-base leading-8 text-muted">
                For questions, corrections, or privacy-related requests, please contact:
              </p>
              <div className="rounded-[1.5rem] border border-brand-100 bg-surface p-5 text-base leading-8 text-ink">
                <p className="font-semibold text-ink">Tech Ed and Solutions</p>
                <p>
                  Website:{" "}
                  <a className="text-pine underline decoration-brand-300 underline-offset-4" href="https://aohdirectory.com">
                    https://aohdirectory.com
                  </a>
                </p>
                <p>
                  Email:{" "}
                  <a className="text-pine underline decoration-brand-300 underline-offset-4" href="mailto:support@techedsupport.com">
                    support@techedsupport.com
                  </a>
                </p>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
