import { ReactNode, createContext, useContext, useEffect } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

import { attributionService } from "@/lib/attribution-service";

interface SiteLayoutProps {
  children: ReactNode;
}

const SiteLayoutContext = createContext(false);

export function SiteLayout({ children }: SiteLayoutProps) {
  const isAlreadyInsideSiteLayout = useContext(SiteLayoutContext);

  useEffect(() => {
    // Capture attribution only for the outermost site layout.
    if (!isAlreadyInsideSiteLayout) {
      attributionService.captureFromUrl();
    }
  }, [isAlreadyInsideSiteLayout]);

  // Authenticated and nested routes may still contain legacy SiteLayout
  // wrappers. Never render a second header/footer when already inside one.
  if (isAlreadyInsideSiteLayout) {
    return <>{children}</>;
  }

  return (
    <SiteLayoutContext.Provider value={true}>
      <div className="flex min-h-screen flex-col bg-background">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-primary focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-md m-2"
        >
          Skip to main content
        </a>
        <Header />
        <main id="main-content" className="flex-1" tabIndex={-1}>
          {children}
        </main>
        <Footer />
      </div>
    </SiteLayoutContext.Provider>
  );
}
