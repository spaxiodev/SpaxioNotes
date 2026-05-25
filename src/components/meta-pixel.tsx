"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";

const META_PIXEL_ID = "1482203236219771";
const STORAGE_KEY = "spaxio-privacy-consent";

type ConsentChoice = {
  optional?: boolean;
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function hasOptionalConsent(storedConsent: string | null) {
  if (!storedConsent) {
    return false;
  }

  try {
    const choice = JSON.parse(storedConsent) as ConsentChoice;

    return choice.optional === true;
  } catch {
    return false;
  }
}

export function MetaPixel() {
  const pathname = usePathname();
  const trackedPathname = useRef<string | null>(null);
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
    () => null,
  );
  const hasConsent = hasOptionalConsent(storedConsent);

  useEffect(() => {
    if (!hasConsent) {
      return;
    }

    if (trackedPathname.current === null) {
      trackedPathname.current = pathname;
      return;
    }

    if (trackedPathname.current === pathname || !window.fbq) {
      return;
    }

    trackedPathname.current = pathname;
    window.fbq("track", "PageView");
  }, [hasConsent, pathname]);

  if (!hasConsent) {
    return null;
  }

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');
      `}
    </Script>
  );
}
