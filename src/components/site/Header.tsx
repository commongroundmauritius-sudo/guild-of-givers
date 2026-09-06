import { useMemberCheck } from "@/hooks/use-member-check";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  Settings,
  Heart,
  FileText,
  MessageCircle,
  TrendingUp,
  Building2,
  ChevronDown,
  Users,
  Shield,
  MessageSquare,
  Home,
  Megaphone,
} from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { cn } from "@/lib/utils";

const GUEST_NAV = [
  { label: "About Us", to: "/about" },
  { label: "Meet Our Partners", to: "/organizations" },
  { label: "FAQ", to: "/faq" },
  { label: "Partner with Us", to: "/partner" },
] as const;

const PRIMARY_ADMIN_NAV = [
  { label: "Dashboard", to: "/admin-dashboard", icon: LayoutDashboard },
  { label: "Community Hub", to: "/community-hub", icon: MessageCircle },
  { label: "Initiatives", to: "/admin-dashboard/initiatives", icon: Heart },
  { label: "Members", to: "/admin-dashboard/members", icon: User },
  { label: "Analytics", to: "/admin-dashboard/analytics", icon: TrendingUp },
] as const;

const MORE_ADMIN_NAV = [
  { label: "Homepage Layout", to: "/admin-dashboard/homepage-layout", icon: Home },
  { label: "Announcements", to: "/admin-dashboard/announcements", icon: Megaphone },
  { label: "Organizations", to: "/admin-dashboard/organizations", icon: Building2 },
  { label: "Leads", to: "/admin-dashboard/leads", icon: Users },
  { label: "Reports", to: "/admin-dashboard/reports", icon: FileText },
  {
    label: "Partner Applications",
    to: "/admin-dashboard/partner-applications",
    icon: MessageSquare,
  },
  { label: "Moderation", to: "/admin-dashboard/community-posts", icon: Shield },
  { label: "Finances", to: "/admin-dashboard/finances", icon: TrendingUp },
] as const;

const MEMBER_NAV = [
  { label: "Dashboard", to: "/member", icon: LayoutDashboard },
  { label: "Community Hub", to: "/community-hub", icon: MessageCircle },
  { label: "Contributions", to: "/member", icon: Heart },
  { label: "Supported", to: "/member", icon: FileText },
] as const;

const Organization_NAV = [
  { label: "Dashboard", to: "/organization", icon: LayoutDashboard },
  { label: "Community Hub", to: "/community-hub", icon: MessageCircle },
  { label: "Initiatives", to: "/organization", icon: Heart },
  { label: "Reports", to: "/organization", icon: FileText },
] as const;

export function Header() {
  const { handleMemberAction } = useMemberCheck();
  const [open, setOpen] = useState(false);
  const { user, role, profile, isSubscribed, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = role === "admin" || role === "super_admin";

  const navItems = isAdmin
    ? PRIMARY_ADMIN_NAV
    : role === "organization"
      ? Organization_NAV
      : role === "member"
        ? MEMBER_NAV
        : GUEST_NAV;

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.substring(0, 2).toUpperCase();

  const isMoreActive = MORE_ADMIN_NAV.some((item) => location.pathname.startsWith(item.to));

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {navItems.map((item) => {
              if (item.to === "/partner") {
                return (
                  <Link
                    key={item.label + item.to}
                    to={item.to}
                    className="inline-flex items-center justify-center rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-primary-foreground shadow-xs"
                    activeProps={{ className: "bg-primary text-primary-foreground font-bold" }}
                  >
                    {item.label}
                  </Link>
                );
              }
              return (
                <Link
                  key={item.label + item.to}
                  to={item.to}
                  className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
                  activeOptions={item.to === "/admin-dashboard" ? { exact: true } : {}}
                  activeProps={{ className: "text-primary font-bold" }}
                >
                  {item.label}
                </Link>
              );
            })}

            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Toggle menu"
                    className={cn(
                      "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary focus:outline-none",
                      isMoreActive ? "text-primary font-bold" : "text-foreground/80",
                    )}
                  >
                    More <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {MORE_ADMIN_NAV.map((item) => (
                    <DropdownMenuItem key={item.to} asChild>
                      <Link
                        to={item.to}
                        className="flex w-full items-center gap-2 cursor-pointer"
                        activeProps={{ className: "bg-primary/5 text-primary font-bold" }}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>
        </div>

        <div className="hidden items-center gap-4 lg:flex">
          {!user ? (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                onClick={handleMemberAction}
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md active:scale-95"
              >
                Become a Member
              </Link>
            </>
          ) : (
            <>
              {!isSubscribed && role === "member" && (
                <Link
                  to="/signup"
                  className="mr-2 inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-95"
                >
                  Complete Membership
                </Link>
              )}

              <NotificationBell />

              <div className="flex items-center gap-3 pr-2">
                <span className="text-sm font-medium text-foreground/70">{displayName}</span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative flex h-10 items-center gap-2 rounded-full px-1 py-1 hover:bg-muted"
                  >
                    <Avatar className="h-8 w-8 border border-border/60">
                      <AvatarImage src={profile?.avatar_url || ""} alt={displayName} />
                      <AvatarFallback
                        className={
                          isAdmin ? "bg-amber-100 text-amber-700" : "bg-teal-100 text-teal-700"
                        }
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      {role && (
                        <span
                          className={cn(
                            "mt-1 inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                            isAdmin ? "bg-amber-100 text-amber-700" : "bg-teal-100 text-teal-700",
                          )}
                        >
                          {role}
                        </span>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      to={
                        isAdmin
                          ? "/admin-dashboard"
                          : role === "organization"
                            ? "/organization"
                            : "/member"
                      }
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={isAdmin ? "/admin-dashboard/profile" : "/member/profile"}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={isAdmin ? "/admin-dashboard/settings" : "/member/settings"}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut().then(() => navigate({ to: "/login" }))}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>

        <button
          aria-label="Toggle menu"
          className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border/60 bg-background shadow-lg">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-6">
            {navItems.map((item) => {
              if (item.to === "/partner") {
                return (
                  <Link
                    key={item.label + item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="my-1 inline-flex items-center justify-center rounded-full border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary transition-all hover:bg-primary hover:text-primary-foreground"
                    activeProps={{ className: "bg-primary text-primary-foreground font-bold" }}
                  >
                    {item.label}
                  </Link>
                );
              }
              return (
                <Link
                  key={item.label + item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-base font-medium text-foreground/80 hover:bg-muted"
                  activeOptions={item.to === "/admin-dashboard" ? { exact: true } : {}}
                  activeProps={{ className: "bg-primary/5 text-primary font-bold" }}
                >
                  {item.label}
                </Link>
              );
            })}

            {isAdmin && (
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="more" className="border-none">
                  <AccordionTrigger
                    className={cn(
                      "rounded-xl px-4 py-3 text-base font-medium hover:bg-muted hover:no-underline",
                      isMoreActive ? "text-primary font-bold bg-primary/5" : "text-foreground/80",
                    )}
                  >
                    More
                  </AccordionTrigger>
                  <AccordionContent className="flex flex-col gap-1 pb-2 pl-4 pr-0">
                    {MORE_ADMIN_NAV.map((item) => (
                      <Link
                        key={item.label + item.to}
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className="rounded-xl px-4 py-3 text-base font-medium text-foreground/80 hover:bg-muted"
                        activeProps={{ className: "bg-primary/5 text-primary font-bold" }}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="h-5 w-5" />
                          {item.label}
                        </div>
                      </Link>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {user && (
              <>
                <div className="my-2 h-px bg-border/60" />
                <Link
                  to={isAdmin ? "/admin-dashboard/profile" : "/member/profile"}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-foreground/80 hover:bg-muted"
                  activeProps={{ className: "bg-primary/5 text-primary font-bold" }}
                >
                  <User className="h-5 w-5" />
                  Profile
                </Link>
                <Link
                  to={isAdmin ? "/admin-dashboard/settings" : "/member/settings"}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-foreground/80 hover:bg-muted"
                  activeProps={{ className: "bg-primary/5 text-primary font-bold" }}
                >
                  <Settings className="h-5 w-5" />
                  Settings
                </Link>
              </>
            )}

            <div className="px-4 pt-4 flex flex-col gap-3">
              {user ? (
                <button
                  onClick={() => {
                    signOut().then(() => navigate({ to: "/login" }));
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 py-3.5 text-sm font-bold text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="inline-flex w-full items-center justify-center rounded-full border border-input bg-background px-5 py-3.5 text-sm font-bold text-foreground"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={(e) => {
                      setOpen(false);
                      handleMemberAction(e);
                    }}
                    className="inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-sm active:scale-[0.98] transition-transform"
                  >
                    Become a Member
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
