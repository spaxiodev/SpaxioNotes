import Link from "next/link";
import type { Metadata } from "next";
import { Lock } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { updatePassword } from "@/lib/auth-actions";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f6f1] px-4 py-6 text-zinc-950 sm:py-8">
      <section className="w-full max-w-md border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
        <Link className="flex items-center gap-3" href="/">
          <BrandLogo className="border border-zinc-200" />
          <div>
            <p className="text-base font-semibold leading-none sm:text-lg">Spaxio Assistant</p>
            <p className="mt-1 text-xs text-zinc-500">AI workspace</p>
          </div>
        </Link>

        <div className="mt-6 flex items-center gap-2 sm:mt-8">
          <Lock size={18} aria-hidden="true" />
          <h1 className="text-lg font-semibold sm:text-xl">Reset password</h1>
        </div>

        {params.message && (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{params.message}</div>
        )}

        <form className="mt-5 grid gap-4">
          <input name="locale" type="hidden" value="en" />
          <label className="grid gap-2 text-sm font-medium">
            New password
            <input
              autoComplete="new-password"
              className="h-11 w-full rounded-md border border-zinc-200 px-3 text-base outline-none focus:border-zinc-400 sm:text-sm"
              minLength={8}
              name="password"
              placeholder="At least 8 characters"
              required
              type="password"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Confirm password
            <input
              autoComplete="new-password"
              className="h-11 w-full rounded-md border border-zinc-200 px-3 text-base outline-none focus:border-zinc-400 sm:text-sm"
              minLength={8}
              name="confirmPassword"
              placeholder="Repeat the password"
              required
              type="password"
            />
          </label>
          <button className="primary-button w-full justify-center" formAction={updatePassword}>
            Update password
          </button>
        </form>
      </section>
    </main>
  );
}
