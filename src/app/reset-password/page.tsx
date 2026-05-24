import Link from "next/link";
import { Lock } from "lucide-react";

import { updatePassword } from "@/app/login/actions";
import { BrandLogo } from "@/components/brand-logo";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f6f1] px-4 py-8 text-zinc-950">
      <section className="w-full max-w-md border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
        <Link className="flex items-center gap-3" href="/">
          <BrandLogo className="border border-zinc-200" />
          <div>
            <p className="text-lg font-semibold leading-none">Spaxio Assistant</p>
            <p className="mt-1 text-xs text-zinc-500">Espace de travail IA</p>
          </div>
        </Link>

        <div className="mt-8 flex items-center gap-2">
          <Lock size={18} aria-hidden="true" />
          <h1 className="text-xl font-semibold">Reinitialiser le mot de passe</h1>
        </div>

        {params.message && (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{params.message}</div>
        )}

        <form className="mt-5 grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Nouveau mot de passe
            <input
              className="h-11 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"
              minLength={8}
              name="password"
              placeholder="Au moins 8 caracteres"
              required
              type="password"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Confirmer le mot de passe
            <input
              className="h-11 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"
              minLength={8}
              name="confirmPassword"
              placeholder="Repetez le mot de passe"
              required
              type="password"
            />
          </label>
          <button className="primary-button" formAction={updatePassword}>
            Mettre a jour le mot de passe
          </button>
        </form>
      </section>
    </main>
  );
}
