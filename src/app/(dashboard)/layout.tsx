import React from "react";
import Navbar from "@/components/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-bg-primary">
      <Navbar />
      <main className="flex-1 overflow-x-hidden pt-20">
        {children}
      </main>
    </div>
  );
}
