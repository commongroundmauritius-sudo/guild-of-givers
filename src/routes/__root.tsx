import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsentBanner } from "@/components/site/CookieConsentBanner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-semibold text-primary">404</h1>
        <h2 className="mt-4 font-display text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        <div className="mt-6"><Link to="/" className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">Go home</Link></div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong on our end. Try refreshing or head back home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={reset} className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">Try again</button>
          <a href="/" className="inline-flex items-center justify-center rounded-full border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CommonGround — One Membership. Long-term Impact." },
      { name: "description", content: "CommonGround turns recurring memberships into predictable funding for long-term social impact programs — restoration, education, community resilience." },
      { property: "og:title", content: "CommonGround — One Membership. Long-term Impact." },
      { property: "og:description", content: "A membership-based impact platform supporting vetted, long-horizon programs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: `(() => { try { if (localStorage.getItem("cg_cookie_consent_v1")) document.documentElement.classList.add("cg-consent-given"); } catch (e) {} const protectedPath = /^(\\/admin-dashboard|\\/member|\\/notifications|\\/community-hub|\\/dashboard|\\/organization)(\\/|$)/.test(location.pathname); if (!protectedPath) return; const hasSession = Object.keys(localStorage).some((key) => key.startsWith("sb-") && key.includes("-auth-token")); if (!hasSession) location.replace("/login?redirect=" + encodeURIComponent(location.pathname + location.search)); })();` }} />
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function ProtectedRouteGuard({ children }: { children: React.ReactNode }) {
  const { pathname, search } = useLocation();
  const isProtectedPath = /^(\/admin-dashboard|\/member|\/notifications|\/community-hub|\/dashboard|\/organization)(\/|$)/.test(pathname);
  const [authChecked, setAuthChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let active = true;
    if (!isProtectedPath) {
      setAuthChecked(true);
      setHasSession(true);
      return () => { active = false; };
    }

    const redirectToLogin = () => {
      const redirectPath = `${pathname}${search}`;
      window.location.replace(`/login?redirect=${encodeURIComponent(redirectPath)}`);
    };

    const hasStoredSession = Object.keys(localStorage).some((key) => {
      if (!key.startsWith("sb-") || !key.includes("-auth-token")) return false;
      try {
        const value = JSON.parse(localStorage.getItem(key) || "null");
        return Boolean(value?.access_token) || Boolean(value?.refresh_token);
      } catch {
        return true;
      }
    });

    if (!hasStoredSession) {
      redirectToLogin();
      return () => { active = false; };
    }

    const timeoutId = window.setTimeout(() => {
      if (!active) return;
      redirectToLogin();
    }, 5000);

    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!active) return;
        window.clearTimeout(timeoutId);
        if (error || !data.session) {
          redirectToLogin();
          return;
        }
        setHasSession(true);
        setAuthChecked(true);
      } catch {
        if (!active) return;
        window.clearTimeout(timeoutId);
        redirectToLogin();
      }
    };

    checkSession();
    return () => { active = false; window.clearTimeout(timeoutId); };
  }, [isProtectedPath, pathname, search]);

  if (!isProtectedPath) return <>{children}</>;
  if (!authChecked || !hasSession) {
    return <div className="flex min-h-screen items-center justify-center bg-background px-4"><p className="text-sm text-muted-foreground">Checking your account…</p></div>;
  }
  return <>{children}</>;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <ProtectedRouteGuard><Outlet /></ProtectedRouteGuard>
          <CookieConsentBanner />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
