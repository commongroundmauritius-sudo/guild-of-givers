import { ReactNode, useEffect } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

import { attributionService } from "@/lib/attribution-service";

interface SiteLayoutProps {
  children: ReactNode;
}

export function SiteLayout({ children }: SiteLayoutProps) {
  useEffect(() => {
    // Capture attribution on every layout mount
    attributionService.captureFromUrl();
  }, []);

  return (
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
  );
}
