import { headers } from "next/headers";

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const url = configuredUrl || (vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000");

  return url.replace(/\/+$/, "");
}

export async function getRequestOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL?.trim()) return getSiteUrl();

  const headerStore = await headers();
  const forwardedHost = headerStore.get("x-forwarded-host");
  const host = forwardedHost ?? headerStore.get("host");

  if (!host) return getSiteUrl();

  const proto = headerStore.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export function sanitizeRedirectPath(value: string | null | undefined, fallback = "/app") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;

  try {
    const url = new URL(value, getSiteUrl());
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
