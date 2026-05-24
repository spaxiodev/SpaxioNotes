import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";

type Section = {
  title: string;
  body?: string;
  items?: string[];
};

type LegalPageProps = {
  title: string;
  eyebrow: string;
  updated: string;
  updatedLabel?: string;
  intro: string;
  sections: Section[];
  languageLinks: Array<{ href: string; label: string; hrefLang: string }>;
  navLinks?: Array<{ href: string; label: string }>;
};

export default function LegalPage({
  eyebrow,
  intro,
  languageLinks,
  navLinks = [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
  ],
  sections,
  title,
  updated,
  updatedLabel = "Last updated",
}: LegalPageProps) {
  return (
    <main className="min-h-screen bg-[#f5f6f1] px-4 py-6 text-zinc-950 sm:px-6 lg:px-8">
      <article className="mx-auto max-w-4xl">
        <nav className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 pb-5">
          <Link className="flex items-center gap-3" href="/">
            <BrandLogo className="border border-zinc-200" />
            <div>
              <p className="text-lg font-semibold leading-none">Spaxio Assistant</p>
              <p className="mt-1 text-xs text-zinc-500">AI memory workspace</p>
            </div>
          </Link>
          <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-zinc-600">
            {navLinks.map((link) => (
              <Link className="hover:text-zinc-950" href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
            {languageLinks.map((link) => (
              <Link
                className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:text-zinc-950"
                href={link.href}
                hrefLang={link.hrefLang}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        <header className="py-10">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-zinc-500">{eyebrow}</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-normal sm:text-5xl">{title}</h1>
          <p className="mt-4 text-sm font-medium text-zinc-500">
            {updatedLabel}: {updated}
          </p>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-600">{intro}</p>
        </header>

        <div className="grid gap-4 pb-12">
          {sections.map((section) => (
            <section className="border-t border-zinc-200 py-6" key={section.title}>
              <h2 className="text-xl font-semibold">{section.title}</h2>
              {section.body && <p className="mt-3 text-sm leading-7 text-zinc-600">{section.body}</p>}
              {section.items && (
                <ul className="mt-4 grid gap-2 text-sm leading-7 text-zinc-600">
                  {section.items.map((item) => (
                    <li className="flex gap-3" key={item}>
                      <span className="mt-3 size-1.5 shrink-0 rounded-full bg-zinc-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
