"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal, User as UserIcon, LogOut, Settings, CreditCard, Zap,
  Shield, Crown, ChevronDown, Sparkles, LayoutGrid, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useUserStore } from "@/stores/useUserStore";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const { data: session, status } = useSession();
  const storeUser = useUserStore((s) => s.user);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const user = storeUser ?? session?.user;
  const isLoggedIn = status === "authenticated";
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-bg-primary/20 backdrop-blur-2xl border-b border-border-glass">
      <div className="site-container h-16 md:h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.05)] overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-400 to-accent-400 opacity-20 group-hover:opacity-100 transition-opacity duration-500" />
            <Terminal className="w-4 h-4 md:w-5 md:h-5 text-white relative z-10" />
          </div>
          <span className="text-xl md:text-2xl font-black text-white tracking-tighter">
            Yilow<span className="text-accent-400">.ai</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden lg:flex items-center gap-10">
          <Link href="/" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">
            الرئيسية
          </Link>
          <Link href="/tools" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">
            الأدوات
          </Link>
          <Link
            href="/chat"
            className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-l from-primary-400 to-accent-400 hover:opacity-80 transition-opacity drop-shadow-[0_0_10px_rgba(157,78,221,0.5)]"
          >
            Yilow AI
          </Link>
          <Link href="/agents" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">
            الوكلاء
          </Link>
          <Link href="/spaces" className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wider">
            Spaces
          </Link>
        </div>

        {/* Auth area */}
        <div className="flex items-center gap-3">
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
  );
};

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
