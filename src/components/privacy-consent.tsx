"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "spaxio-privacy-consent";

type ConsentChoice = {
  acceptedAt: string;
  optional: boolean;
  version: string;
};

export function PrivacyConsent() {
  const pathname = usePathname();
  const isEnglish = pathname === "/en" || pathname.startsWith("/en/") || pathname === "/privacy" || pathname === "/terms";
  const storedConsent = useSyncExternalStore(
    (listener) => {
      window.addEventListener("storage", listener);
      window.addEventListener("spaxio-consent", listener);

      return () => {
        window.removeEventListener("storage", listener);
        window.removeEventListener("spaxio-consent", listener);
      };
    },
    () => window.localStorage.getItem(STORAGE_KEY),
    () => "server",
  );

  function saveConsent(optional: boolean) {
    const choice: ConsentChoice = {
      acceptedAt: new Date().toISOString(),
      optional,
      version: "2026-05-24",
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(choice));
    window.dispatchEvent(new Event("spaxio-consent"));
  }

  if (storedConsent) {
    return null;
  }

  return (
    <section
      aria-label={isEnglish ? "Privacy consent" : "Consentement a la confidentialite"}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white px-4 py-4 shadow-[0_-10px_30px_rgb(24_24_27_/_0.08)] sm:px-6"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-zinc-950">
            {isEnglish ? "Privacy and terms" : "Confidentialite et conditions"}
          </p>
          <p className="mt-1 text-sm leading-6 text-zinc-600">
            {isEnglish ? (
              <>
                We use technologies necessary for the site and account to work. Non-essential identification, location,
                or profiling features are not enabled by default. By continuing, you confirm that you have read the{" "}
                <Link className="font-medium text-zinc-950 underline underline-offset-4" href="/privacy">
                  privacy policy
                </Link>{" "}
                and{" "}
                <Link className="font-medium text-zinc-950 underline underline-offset-4" href="/terms">
                  terms and conditions
                </Link>
                .
              </>
            ) : (
              <>
                Nous utilisons les technologies necessaires au fonctionnement du site et du compte. Les fonctions
                d&apos;identification, de localisation ou de profilage non essentielles ne sont pas activees par defaut. En
                continuant, vous confirmez avoir lu la{" "}
                <Link className="font-medium text-zinc-950 underline underline-offset-4" href="/fr/confidentialite">
                  politique de confidentialite
                </Link>{" "}
                et les{" "}
                <Link className="font-medium text-zinc-950 underline underline-offset-4" href="/fr/conditions">
                  conditions d&apos;utilisation
                </Link>
                .
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:text-zinc-950"
            onClick={() => saveConsent(false)}
            type="button"
          >
            {isEnglish ? "Necessary only" : "Necessaires seulement"}
          </button>
          <button className="primary-button" onClick={() => saveConsent(true)} type="button">
            {isEnglish ? "I accept" : "J&apos;accepte"}
          </button>
        </div>
      </div>
    </section>
  );
}
