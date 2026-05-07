"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User as UserIcon, LogOut, Settings, CreditCard, Zap,
  Shield, Crown, ChevronDown, Sparkles, LayoutGrid, Activity,
  Film, Megaphone, Wand2, Bot, Menu, X, Home,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useUserStore } from "@/stores/useUserStore";
import { cn } from "@/lib/utils";
import { NotificationsBell } from "@/components/layout/NotificationsBell";

// Single source of truth for the primary nav so the desktop links and
// the mobile drawer stay in sync. Color icons are optional — surfaces
// like "السينما / التسويق" use their accent icon, plain links don't.
interface NavItem {
  href:       string;
  label:      string;
  icon:       React.ComponentType<{ className?: string }>;
  iconClass?: string;
  /** Render the LABEL with the brand gradient (used by /chat = Yilow AI). */
  gradient?:  boolean;
}

const PRIMARY_NAV: NavItem[] = [
  { href: "/",          label: "الرئيسية",   icon: Home                                       },
  { href: "/tools",     label: "الأدوات",    icon: LayoutGrid                                  },
  { href: "/soul",      label: "Soul 2.0",  icon: Sparkles,  iconClass: "text-accent-400"      },
  { href: "/cinema",    label: "السينما",    icon: Film,      iconClass: "text-accent-400"      },
  { href: "/marketing", label: "التسويق",    icon: Megaphone, iconClass: "text-accent-400"      },
  { href: "/templates", label: "القوالب",    icon: Wand2,     iconClass: "text-accent-400"      },
  { href: "/agents",    label: "الوكلاء",    icon: Bot,       iconClass: "text-accent-400"      },
  { href: "/chat",      label: "Yilow AI",  icon: Sparkles,  iconClass: "text-fuchsia-400", gradient: true },
  { href: "/spaces",    label: "Spaces",    icon: LayoutGrid                                  },
];

const Navbar = () => {
  const { data: session, status } = useSession();
  const storeUser = useUserStore((s) => s.user);
  const [menuOpen, setMenuOpen]     = useState(false);   // user dropdown
  const [drawerOpen, setDrawerOpen] = useState(false);   // mobile nav drawer
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close dropdown on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Auto-close the drawer when the user navigates (route change).
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Esc closes the drawer + lock body scroll while open
  useEffect(() => {
    if (!drawerOpen) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawerOpen(false); };
    window.addEventListener("keydown", fn);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", fn);
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  const user = storeUser ?? session?.user;
  const isLoggedIn = status === "authenticated";
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  return (
    // Wrap nav + drawer in a fragment so the drawer is a *sibling* of the
    // nav rather than a descendant. Otherwise the nav's backdrop-blur-2xl
    // creates a stacking context that makes the drawer's solid bg render
    // weirdly transparent on Safari/iOS.
    <>
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-bg-primary/20 backdrop-blur-2xl border-b border-border-glass">
      <div className="site-container h-16 md:h-20 flex items-center justify-between gap-3">
        {/* Logo — wordmark only (terminal icon removed per design) */}
        <Link href="/" className="flex items-center gap-1 group select-none shrink-0">
          <span className="text-xl md:text-2xl font-black text-white tracking-tighter group-hover:opacity-90 transition-opacity">
            Yilow<span className="text-accent-400">.ai</span>
          </span>
        </Link>

        {/* Desktop nav links (≥ lg) */}
        <div className="hidden lg:flex items-center gap-7 xl:gap-10">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group text-sm font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap",
                item.gradient
                  ? "text-transparent bg-clip-text bg-gradient-to-l from-primary-400 to-accent-400 hover:opacity-80 drop-shadow-[0_0_10px_rgba(157,78,221,0.5)]"
                  : "text-gray-400 hover:text-white",
                item.label === "Spaces" && "uppercase tracking-wider",
              )}
            >
              {/* Decorative inline icon for tagged surfaces (cinema/templates/...) */}
              {"iconClass" in item && item.iconClass && !item.gradient && (
                <item.icon className={cn("w-4 h-4 group-hover:scale-110 transition-transform", item.iconClass)} />
              )}
              {item.label}
            </Link>
          ))}
        </div>

        {/* Auth area */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Hamburger — mobile/tablet only (< lg). Sits BEFORE auth UI
              so it's the first thumb-target on RTL mobile. */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
            aria-label="القائمة"
            type="button"
          >
            <Menu className="w-5 h-5" />
          </button>

          {status === "loading" && (
            <div className="w-10 h-10 rounded-full bg-white/5 animate-pulse" />
          )}

          {status === "unauthenticated" && (
            <>
              <Link href="/login">
                <Button variant="ghost" className="hidden sm:flex text-sm tracking-wide font-bold">
                  تسجيل الدخول
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="cosmic" className="text-sm tracking-wide font-bold px-8">
                  ابدأ الآن
                </Button>
              </Link>
            </>
          )}

          {isLoggedIn && user && (
            <>
              {/* Credits badge (desktop only) */}
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-400/10 border border-accent-400/20">
                <Zap className="w-3.5 h-3.5 text-accent-400" />
                <span className="text-xs font-black text-accent-400 tabular-nums">
                  {(storeUser?.creditsBalance ?? session.user.creditsBalance ?? 0).toLocaleString("en")}
                </span>
              </div>

              {/* Notifications */}
              <NotificationsBell />

              {/* Profile dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className={cn(
                    "flex items-center gap-2 rounded-full p-0.5 pr-3 transition-all",
                    "bg-gradient-to-tr from-primary-900/40 to-accent-400/10 border border-white/10 hover:border-accent-400/40 hover:shadow-[0_0_20px_rgba(254,228,64,0.15)]"
                  )}
                >
                  <Avatar user={user} />
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 text-gray-400 transition-transform hidden md:block",
                      menuOpen && "rotate-180"
                    )}
                  />
                </button>

                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute left-0 top-full mt-2 w-72 rounded-2xl bg-[#0a0a0b] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden"
                    >
                      {/* User info header */}
                      <div className="p-4 bg-gradient-to-br from-primary-900/20 to-accent-400/5 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          <Avatar user={user} size="lg" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-black text-white truncate">
                              {user.name ?? "مستخدم"}
                            </div>
                            <div className="text-xs text-gray-500 truncate" dir="ltr">
                              {user.email}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <PlanBadge plan={session.user.plan} />
                          {isAdmin && <AdminBadge role={session.user.role} />}
                        </div>
                      </div>

                      {/* Credits */}
                      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                          <Zap className="w-3.5 h-3.5 text-accent-400" />
                          رصيدك
                        </div>
                        <span className="text-sm font-black text-accent-400 tabular-nums">
                          {(storeUser?.creditsBalance ?? session.user.creditsBalance ?? 0).toLocaleString("en")}
                        </span>
                      </div>

                      {/* Menu items */}
                      <div className="py-2">
                        <MenuLink href="/dashboard" icon={LayoutGrid} label="لوحة التحكم" onClick={() => setMenuOpen(false)} />
                        <MenuLink href="/dashboard" icon={Activity} label="سجل الاستخدام" onClick={() => setMenuOpen(false)} />
                        <MenuLink href="/pricing" icon={CreditCard} label="الاشتراك والكريديت" onClick={() => setMenuOpen(false)} />
                        <MenuLink href="/settings" icon={Settings} label="الإعدادات" onClick={() => setMenuOpen(false)} />
                        {isAdmin && (
                          <MenuLink
                            href="/admin"
                            icon={Shield}
                            label="لوحة الأدمن"
                            onClick={() => setMenuOpen(false)}
                            accent
                          />
                        )}
                      </div>

                      {/* Sign out */}
                      <div className="border-t border-white/5 py-2">
                        <button
                          onClick={() => signOut({ callbackUrl: "/" })}
                          className="w-full px-4 py-2.5 flex items-center gap-3 text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          تسجيل الخروج
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>

      {/* ── Mobile drawer ─────────────────────────────────────────────
          A right-side slide-in (RTL natural side) with the same nav
          links as desktop plus quick-links to dashboard/settings/
          billing/admin and a sign-out CTA. Lives OUTSIDE the <nav>
          element so the nav's backdrop-blur stacking context doesn't
          bleed through the drawer's solid background. */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              // Pure-black dim layer (no blur — blur on the backdrop combined
              // with backdrop-blur on the nav above it has caused render
              // issues in the past).
              style={{ backgroundColor: "rgba(0, 0, 0, 0.78)" }}
              className="fixed inset-0 z-[60] lg:hidden"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              // Inline bg + opacity to bypass any tailwind JIT or backdrop-
              // blur stacking-context weirdness — the drawer must always
              // read as a fully opaque dark panel.
              style={{ backgroundColor: "#0a0a0f" }}
              className="fixed top-0 right-0 bottom-0 z-[70] w-[88%] max-w-sm border-l border-white/10 shadow-[-12px_0_60px_rgba(0,0,0,0.6)] flex flex-col lg:hidden"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 h-16 border-b border-white/[0.06] flex-shrink-0">
                <span className="text-xl font-black text-white tracking-tighter">
                  Yilow<span className="text-accent-400">.ai</span>
                </span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center"
                  type="button"
                  aria-label="إغلاق"
                >
                  <X className="w-4 h-4 text-gray-300" />
                </button>
              </div>

              {/* User card (when logged in) */}
              {isLoggedIn && user && (
                <div className="px-4 pt-4 pb-3 border-b border-white/[0.06] flex-shrink-0">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar user={user} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black text-white truncate">
                        {user.name ?? "مستخدم"}
                      </div>
                      <div className="text-xs text-gray-500 truncate" dir="ltr">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-accent-400/10 border border-accent-400/20 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-accent-400">
                      <Zap className="w-3.5 h-3.5" /> رصيدك
                    </div>
                    <span className="text-sm font-black text-accent-400 tabular-nums">
                      {(storeUser?.creditsBalance ?? session.user.creditsBalance ?? 0).toLocaleString("en")}
                    </span>
                  </div>
                </div>
              )}

              {/* Primary nav links */}
              <div className="flex-1 overflow-y-auto py-3">
                <div className="px-2 space-y-0.5">
                  {PRIMARY_NAV.map((item) => {
                    const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setDrawerOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-colors",
                          active
                            ? "bg-white/10 text-white"
                            : item.gradient
                              ? "text-transparent bg-clip-text bg-gradient-to-l from-primary-400 to-accent-400"
                              : "text-gray-300 hover:bg-white/5 hover:text-white",
                        )}
                      >
                        <item.icon className={cn(
                          "w-5 h-5 shrink-0",
                          ("iconClass" in item && item.iconClass) || (active ? "text-white" : "text-gray-500"),
                        )} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Account links (when logged in) */}
                {isLoggedIn && (
                  <div className="mt-4 pt-3 border-t border-white/[0.06] px-2 space-y-0.5">
                    <div className="px-3 mb-1 text-[10px] font-mono text-gray-600 uppercase tracking-wider">حسابي</div>
                    <DrawerLink href="/dashboard" icon={LayoutGrid} label="لوحة التحكم"      onClick={() => setDrawerOpen(false)} />
                    <DrawerLink href="/dashboard" icon={Activity}   label="سجل الاستخدام"  onClick={() => setDrawerOpen(false)} />
                    <DrawerLink href="/pricing"   icon={CreditCard} label="الاشتراك والكريديت" onClick={() => setDrawerOpen(false)} />
                    <DrawerLink href="/settings"  icon={Settings}   label="الإعدادات"        onClick={() => setDrawerOpen(false)} />
                    {isAdmin && (
                      <DrawerLink href="/admin" icon={Shield} label="لوحة الأدمن" onClick={() => setDrawerOpen(false)} accent />
                    )}
                  </div>
                )}
              </div>

              {/* Footer CTA */}
              <div className="p-4 border-t border-white/[0.06] flex-shrink-0">
                {isLoggedIn ? (
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    type="button"
                    className="w-full h-11 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    تسجيل الخروج
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link href="/register" className="w-full">
                      <Button variant="cosmic" className="w-full text-sm font-bold">ابدأ مجاناً</Button>
                    </Link>
                    <Link href="/login" className="w-full">
                      <Button variant="ghost" className="w-full text-sm font-bold border border-white/10">تسجيل الدخول</Button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// ── Drawer link — same shape as MenuLink but used inside the mobile
//    drawer so we can give it a slightly larger tap target. ────
function DrawerLink({
  href, icon: Icon, label, onClick, accent,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-colors",
        accent
          ? "text-red-400 hover:bg-red-500/10"
          : "text-gray-300 hover:bg-white/5 hover:text-white",
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </Link>
  );
}

// ── Subcomponents ────────────────────────────────────────────────
function Avatar({
  user,
  size = "md",
}: {
  user: { name?: string | null; email?: string | null; image?: string | null };
  size?: "md" | "lg";
}) {
  const dim = size === "lg" ? "w-10 h-10" : "w-8 h-8";
  const text = size === "lg" ? "text-sm" : "text-xs";
  const initials = (user.name ?? user.email ?? "U")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (user.image) {
    return (
      <img
        src={user.image}
        alt={user.name ?? "avatar"}
        className={cn(dim, "rounded-full object-cover border border-white/10")}
      />
    );
  }

  return (
    <div
      className={cn(
        dim,
        "rounded-full bg-gradient-to-tr from-primary-500 to-accent-400 text-black font-black flex items-center justify-center",
        text
      )}
    >
      {initials}
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const styles: Record<string, string> = {
    FREE: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    BASIC: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    PRO: "bg-accent-400/15 text-accent-400 border-accent-400/30",
    ENTERPRISE: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  };
  const label: Record<string, string> = {
    FREE: "مجاني",
    BASIC: "أساسي",
    PRO: "PRO",
    ENTERPRISE: "ENTERPRISE",
  };
  return (
    <span className={cn(
      "px-2 py-0.5 rounded-full text-[10px] font-black border inline-flex items-center gap-1",
      styles[plan] ?? styles.FREE
    )}>
      {plan === "PRO" && <Crown className="w-2.5 h-2.5" />}
      {label[plan] ?? plan}
    </span>
  );
}

function AdminBadge({ role }: { role: string }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-black border border-red-500/30 bg-red-500/10 text-red-400 inline-flex items-center gap-1">
      <Shield className="w-2.5 h-2.5" />
      {role === "SUPER_ADMIN" ? "SUPER ADMIN" : "ADMIN"}
    </span>
  );
}

function MenuLink({
  href,
  icon: Icon,
  label,
  onClick,
  accent,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "w-full px-4 py-2.5 flex items-center gap-3 text-sm font-bold transition-colors",
        accent
          ? "text-red-400 hover:bg-red-500/10"
          : "text-gray-300 hover:bg-white/5 hover:text-white"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}

export default Navbar;
