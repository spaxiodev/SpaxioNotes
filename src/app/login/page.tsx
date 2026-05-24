import Link from "next/link";
import { Lock } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";

import { login, resetPassword, signup } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string; message?: string; next?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f6f1] px-4 py-8 text-zinc-950">
      <section className="grid w-full max-w-5xl overflow-hidden border border-zinc-200 bg-white shadow-sm lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="hidden bg-zinc-950 p-8 text-white lg:block">
          <Link className="flex items-center gap-3" href="/">
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
          <div className="flex items-center gap-3 lg:hidden">
            <BrandLogo className="border border-zinc-200" />
            <div>
              <p className="text-lg font-semibold leading-none">Spaxio Assistant</p>
              <p className="mt-1 text-xs text-zinc-500">Espace de travail IA</p>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-2">
            <Lock size={18} aria-hidden="true" />
            <h1 className="text-xl font-semibold">Connexion ou creation de compte</h1>
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
            <label className="grid gap-2 text-sm font-medium">
              Courriel
              <input
                className="h-11 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"
                name="email"
                placeholder="vous@exemple.com"
                required
                type="email"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Mot de passe
              <input
                className="h-11 rounded-md border border-zinc-200 px-3 text-sm outline-none focus:border-zinc-400"
                minLength={8}
                name="password"
                placeholder="Au moins 8 caracteres"
                required
                type="password"
              />
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <button className="primary-button" formAction={login} formNoValidate>
                Connexion
              </button>
              <button className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700" formAction={signup}>
                Creer un compte
              </button>
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
              className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700"
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
