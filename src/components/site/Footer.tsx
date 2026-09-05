import { useMemberCheck } from "@/hooks/use-member-check";
import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Footer() {
  const { handleMemberAction } = useMemberCheck();
  return (
    <footer className="border-t border-border/60 bg-cream-deep/30">
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
              <Link to="/about" className="text-foreground/70 transition-colors hover:text-primary">
                About our mission
              </Link>
            </li>
            <li>
              <Link
                to="/initiatives"
                className="text-foreground/70 transition-colors hover:text-primary"
              >
                Verified Initiatives
              </Link>
            </li>
            <li>
              <Link
                to="/for-orgs"
                className="text-foreground/70 transition-colors hover:text-primary"
              >
                For Organizations
              </Link>
            </li>
            <li>
              <Link
                to="/partner"
                className="text-foreground/70 transition-colors hover:text-primary"
              >
                Partner With Us
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wider text-primary">
            Resources
          </h4>
          <ul className="mt-6 space-y-3 text-sm">
            <li>
              <Link to="/faq" className="text-foreground/70 transition-colors hover:text-primary">
                Common Questions
              </Link>
            </li>
            <li>
              <Link to="/legal" className="text-foreground/70 transition-colors hover:text-primary">
                Legal & Compliance
              </Link>
            </li>
            <li>
              <Link to="/login" className="text-foreground/70 transition-colors hover:text-primary">
                Member Login
              </Link>
            </li>
            <li>
              <Link to="/signup" onClick={handleMemberAction} className="font-semibold text-primary hover:underline">
                Become a member
              </Link>
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
          <div className="flex items-center gap-6">
            <Link to="/legal" className="hover:text-primary">
              Privacy
            </Link>
            <Link to="/legal" className="hover:text-primary">
              Terms
            </Link>
            <span className="font-medium text-primary/40">Rooted in impact.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
