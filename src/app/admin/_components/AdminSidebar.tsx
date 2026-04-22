"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Wrench, Activity, CreditCard, Shield, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminSidebar({ role }: { role: string }) {
  const pathname = usePathname();

  const links = [
    { href: "/admin",          label: "نظرة عامة",      icon: LayoutDashboard },
    { href: "/admin/users",    label: "المستخدمون",     icon: Users },
    { href: "/admin/activity", label: "النشاط",         icon: Activity },
    { href: "/admin/billing",  label: "الإشتراكات",     icon: CreditCard },
    { href: "/admin/tools",    label: "إدارة الأدوات",  icon: Wrench },
  ];

  return (
    <aside className="md:w-64 md:shrink-0 border-l border-white/5 bg-black/40 md:min-h-[calc(100vh-5rem)]">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <div className="text-sm font-black text-white">
              {role === "SUPER_ADMIN" ? "SUPER ADMIN" : "ADMIN"}
            </div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest">
              Control Panel
            </div>
          </div>
        </div>

        <nav className="space-y-1">
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors",
                  active
                    ? "bg-accent-400/15 text-accent-400 shadow-[inset_0_0_0_1px_rgba(254,228,64,0.2)]"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
