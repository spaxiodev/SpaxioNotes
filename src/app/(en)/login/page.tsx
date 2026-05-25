import Link from "next/link";
import type { Metadata } from "next";
import { Lock } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { login, resetPassword, signup } from "@/lib/auth-actions";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string; message?: string; next?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f6f1] px-4 py-6 text-zinc-950 sm:py-8">
      <section className="grid w-full max-w-5xl overflow-hidden border border-zinc-200 bg-white shadow-sm lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="hidden bg-zinc-950 p-8 text-white lg:block">
          <Link className="flex items-center gap-3" href="/">
            <BrandLogo />
            <div>
              <p className="text-lg font-semibold leading-none">Spaxio Assistant</p>
              <p className="mt-1 text-xs text-zinc-300">AI workspace</p>
            </div>
          </Link>
          <div className="mt-20">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-zinc-400">Secure space</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-normal">Sign in to your personal workspace.</h1>
            <p className="mt-5 text-sm leading-7 text-zinc-300">
              Authentication uses required session cookies. User data is protected by per-user access policies.
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-8">
          <div className="flex items-center justify-between gap-3 lg:hidden">
            <Link className="flex items-center gap-3" href="/">
              <BrandLogo className="border border-zinc-200" />
              <div>
                <p className="text-base font-semibold leading-none sm:text-lg">Spaxio Assistant</p>
                <p className="mt-1 text-xs text-zinc-500">AI workspace</p>
              </div>
            </Link>
            <Link
              className="inline-flex h-8 items-center justify-center rounded-sm border border-zinc-200 px-3 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
              href={`/fr/login${params.invite ? `?invite=${encodeURIComponent(params.invite)}` : ""}`}
              hrefLang="fr"
            >
              FR
            </Link>
          </div>

          <div className="mt-6 flex items-center gap-2 sm:mt-8">
            <Lock size={18} aria-hidden="true" />
            <h1 className="text-lg font-semibold sm:text-xl">Sign in or create account</h1>
          </div>

          {params.message && (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{params.message}</div>
          )}

          {params.invite && (
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Create an account with this invite. Your inviter gets their referral month after you sign up; your account starts at the
              standard Pro price of CA$15/month until you invite someone too.
            </div>
          )}

          <form className="mt-5 grid gap-4">
            <input name="next" type="hidden" value={params.next ?? "/app"} />
            <input name="invite" type="hidden" value={params.invite ?? ""} />
            <input name="locale" type="hidden" value="en" />
            <label className="grid gap-2 text-sm font-medium">
              Email
              <input
                autoComplete="email"
                className="h-11 w-full rounded-md border border-zinc-200 px-3 text-base outline-none focus:border-zinc-400 sm:text-sm"
                inputMode="email"
                name="email"
                placeholder="you@example.com"
                required
                type="email"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Password
              <input
                autoComplete="current-password"
                className="h-11 w-full rounded-md border border-zinc-200 px-3 text-base outline-none focus:border-zinc-400 sm:text-sm"
                minLength={8}
                name="password"
                placeholder="At least 8 characters"
                required
                type="password"
              />
            </label>
            <button className="primary-button w-full justify-center" formAction={login} formNoValidate>
              Sign in
            </button>

            <div className="mt-2 border-t border-zinc-200 pt-4">
              <p className="text-sm font-medium text-zinc-700">New here? Create an account</p>
              <div className="mt-3 grid gap-4">
                <label className="grid gap-2 text-sm font-medium">
                  Full name
                  <input
                    autoComplete="name"
                    className="h-11 w-full rounded-md border border-zinc-200 px-3 text-base outline-none focus:border-zinc-400 sm:text-sm"
                    name="fullName"
                    placeholder="Jane Doe"
                    type="text"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Confirm password
                  <input
                    autoComplete="new-password"
                    className="h-11 w-full rounded-md border border-zinc-200 px-3 text-base outline-none focus:border-zinc-400 sm:text-sm"
                    minLength={8}
                    name="confirmPassword"
                    placeholder="Re-enter your password"
                    type="password"
                  />
                </label>
                <button
                  className="inline-flex h-10 w-full items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700"
                  formAction={signup}
                >
                  Create account
                </button>
              </div>
            </div>
            <label className="flex items-start gap-2 text-xs leading-5 text-zinc-500">
              <input className="mt-1 size-4 rounded border-zinc-300" name="legalAccepted" required type="checkbox" value="yes" />
              <span>
                To create an account, I accept the{" "}
                <Link className="font-medium text-zinc-700 hover:text-zinc-950" href="/terms">
                  terms of use
                </Link>{" "}
                and I acknowledge having read the{" "}
                <Link className="font-medium text-zinc-700 hover:text-zinc-950" href="/privacy">
                  privacy policy
                </Link>
                .
              </span>
            </label>
            <button
              className="inline-flex h-10 w-full items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700"
              formAction={resetPassword}
              formNoValidate
            >
              Forgot password
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
