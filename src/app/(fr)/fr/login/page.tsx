import Link from "next/link";
import type { Metadata } from "next";
import { Lock } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { login, resetPassword, signup } from "@/lib/auth-actions";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function LoginPageFr({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string; message?: string; next?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f6f1] px-4 py-6 text-zinc-950 sm:py-8">
      <section className="grid w-full max-w-5xl overflow-hidden border border-zinc-200 bg-white shadow-sm lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="hidden bg-zinc-950 p-8 text-white lg:block">
          <Link className="flex items-center gap-3" href="/fr">
            <BrandLogo />
            <div>
              <p className="text-lg font-semibold leading-none">Spaxio Assistant</p>
              <p className="mt-1 text-xs text-zinc-300">Espace de travail IA</p>
            </div>
          </Link>
          <div className="mt-20">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-zinc-400">Espace securise</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-normal">Connectez-vous a votre espace de travail personnel.</h1>
            <p className="mt-5 text-sm leading-7 text-zinc-300">
              L&apos;authentification utilise des cookies necessaires de session. Les donnees utilisateur sont protegees par des politiques
              d&apos;acces par utilisateur.
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-8">
          <div className="flex items-center justify-between gap-3 lg:hidden">
            <Link className="flex items-center gap-3" href="/fr">
              <BrandLogo className="border border-zinc-200" />
              <div>
                <p className="text-base font-semibold leading-none sm:text-lg">Spaxio Assistant</p>
                <p className="mt-1 text-xs text-zinc-500">Espace de travail IA</p>
              </div>
            </Link>
            <Link
              className="inline-flex h-8 items-center justify-center rounded-sm border border-zinc-200 px-3 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
              href={`/login${params.invite ? `?invite=${encodeURIComponent(params.invite)}` : ""}`}
              hrefLang="en"
            >
              EN
            </Link>
          </div>

          <div className="mt-6 flex items-center gap-2 sm:mt-8">
            <Lock size={18} aria-hidden="true" />
            <h1 className="text-lg font-semibold sm:text-xl">Connexion ou creation de compte</h1>
          </div>

          {params.message && (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{params.message}</div>
          )}

          {params.invite && (
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              Creez un compte avec cette invitation. Votre contact obtient son mois de reference apres votre inscription; votre compte
              commence au prix Pro standard de 15 $ CA/mois jusqu&apos;a ce que vous invitiez aussi quelqu&apos;un.
            </div>
          )}

          <form className="mt-5 grid gap-4">
            <input name="next" type="hidden" value={params.next ?? "/app"} />
            <input name="invite" type="hidden" value={params.invite ?? ""} />
            <input name="locale" type="hidden" value="fr" />
            <label className="grid gap-2 text-sm font-medium">
              Courriel
              <input
                autoComplete="email"
                className="h-11 w-full rounded-md border border-zinc-200 px-3 text-base outline-none focus:border-zinc-400 sm:text-sm"
                inputMode="email"
                name="email"
                placeholder="vous@exemple.com"
                required
                type="email"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Mot de passe
              <input
                autoComplete="current-password"
                className="h-11 w-full rounded-md border border-zinc-200 px-3 text-base outline-none focus:border-zinc-400 sm:text-sm"
                minLength={8}
                name="password"
                placeholder="Au moins 8 caracteres"
                required
                type="password"
              />
            </label>
            <button className="primary-button w-full justify-center" formAction={login} formNoValidate>
              Connexion
            </button>

            <div className="mt-2 border-t border-zinc-200 pt-4">
              <p className="text-sm font-medium text-zinc-700">Nouveau ? Creez un compte</p>
              <div className="mt-3 grid gap-4">
                <label className="grid gap-2 text-sm font-medium">
                  Nom complet
                  <input
                    autoComplete="name"
                    className="h-11 w-full rounded-md border border-zinc-200 px-3 text-base outline-none focus:border-zinc-400 sm:text-sm"
                    name="fullName"
                    placeholder="Jeanne Tremblay"
                    type="text"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium">
                  Confirmer le mot de passe
                  <input
                    autoComplete="new-password"
                    className="h-11 w-full rounded-md border border-zinc-200 px-3 text-base outline-none focus:border-zinc-400 sm:text-sm"
                    minLength={8}
                    name="confirmPassword"
                    placeholder="Saisir le mot de passe a nouveau"
                    type="password"
                  />
                </label>
                <button
                  className="inline-flex h-10 w-full items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700"
                  formAction={signup}
                >
                  Creer un compte
                </button>
              </div>
            </div>
            <label className="flex items-start gap-2 text-xs leading-5 text-zinc-500">
              <input className="mt-1 size-4 rounded border-zinc-300" name="legalAccepted" required type="checkbox" value="yes" />
              <span>
                Pour creer un compte, j&apos;accepte les{" "}
                <Link className="font-medium text-zinc-700 hover:text-zinc-950" href="/fr/conditions">
                  conditions d&apos;utilisation
                </Link>{" "}
                et je reconnais avoir lu la{" "}
                <Link className="font-medium text-zinc-700 hover:text-zinc-950" href="/fr/confidentialite">
                  politique de confidentialite
                </Link>
                .
              </span>
            </label>
            <button
              className="inline-flex h-10 w-full items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700"
              formAction={resetPassword}
              formNoValidate
            >
              Mot de passe oublie
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
