import { useMemberCheck } from "@/hooks/use-member-check";
import { useCookieConsent } from "@/hooks/use-cookie-consent";
import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Footer() {
  const { handleMemberAction } = useMemberCheck();
  const { openModal } = useCookieConsent();

  return (
    <footer className="border-t border-border/60 bg-cream-deep/30 text-foreground">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Building the financial and governance infrastructure for long-term social impact. One
            membership, a lifetime of change for verified Organizations in Mauritius.
          </p>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wider text-primary">
            Platform
          </h4>
          <ul className="mt-6 space-y-3 text-sm">
            <li>
              <Link
                to="/about"
                className="text-foreground/80 transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              >
                About our mission
              </Link>
            </li>
            <li>
              <Link
                to="/initiatives"
                className="text-foreground/80 transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              >
                Verified Initiatives
              </Link>
            </li>
            <li>
              <Link
                to="/for-orgs"
                className="text-foreground/80 transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              >
                For Organizations
              </Link>
            </li>
            <li>
              <Link
                to="/partner"
                className="text-foreground/80 transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              >
                Partner With Us
              </Link>
            </li>
            <li>
              <Link
                to="/signup"
                onClick={handleMemberAction}
                className="font-semibold text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              >
                Become a member
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wider text-primary">
            Governance & Legal
          </h4>
          <ul className="mt-6 space-y-3 text-sm">
            <li>
              <Link
                to="/privacy-policy"
                className="text-foreground/80 transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                to="/terms-and-conditions"
                className="text-foreground/80 transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              >
                Terms & Conditions
              </Link>
            </li>
            <li>
              <Link
                to="/refund-policy"
                className="text-foreground/80 transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              >
                Refund & Cancellation Policy
              </Link>
            </li>
            <li>
              <Link
                to="/cookies-policy"
                className="text-foreground/80 transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              >
                Cookies Policy
              </Link>
            </li>
            <li>
              <button
                data-cg-consent="open-modal"
                onClick={openModal}
                className="text-foreground/80 transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded text-left"
              >
                Cookie Preferences
              </button>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/40">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <div className="flex flex-col gap-1">
            <span>© {new Date().getFullYear()} CommonGround Mauritius. All rights reserved.</span>
            <span>Registered social infrastructure platform.</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Link
              to="/privacy-policy"
              className="hover:text-primary focus:outline-none focus:ring-1 focus:ring-primary rounded"
            >
              Privacy
            </Link>
            <Link
              to="/terms-and-conditions"
              className="hover:text-primary focus:outline-none focus:ring-1 focus:ring-primary rounded"
            >
              Terms
            </Link>
            <Link
              to="/refund-policy"
              className="hover:text-primary focus:outline-none focus:ring-1 focus:ring-primary rounded"
            >
              Refunds
            </Link>
            <Link
              to="/cookies-policy"
              className="hover:text-primary focus:outline-none focus:ring-1 focus:ring-primary rounded"
            >
              Cookies
            </Link>
            <span className="font-medium text-primary/60">Rooted in impact.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
