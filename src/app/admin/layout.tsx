import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { UserHydrator } from "@/components/providers/UserHydrator";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "./_components/AdminSidebar";
import { Shield } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Defense in depth — middleware also enforces this but a server-side check
  // protects API-less edge cases and gives us session data for the shell.
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin");
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") redirect("/dashboard");

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <UserHydrator />
      <Navbar />
      <div className="flex-1 flex flex-col md:flex-row pt-20">
        <AdminSidebar role={role} />
        <main className="flex-1 min-w-0 overflow-x-hidden">
          {/* Admin ribbon */}
          <div className="border-b border-red-500/20 bg-red-500/[0.04] px-6 py-2 flex items-center gap-2 text-xs font-bold text-red-400">
            <Shield className="w-3.5 h-3.5" />
            منطقة الإدارة — كن حذراً
            <Link href="/dashboard" className="mr-auto text-gray-500 hover:text-white transition-colors">
              خروج للوحة المستخدم →
            </Link>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
