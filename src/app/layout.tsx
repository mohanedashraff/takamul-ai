import type { Metadata } from "next";
import { Alexandria } from "next/font/google";
import "./globals.css";

const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-alexandria",
});

export const metadata: Metadata = {
  title: "Takamul AI | تكامل",
  description: "The Ultimate AI Platform. Create, generate, and explore without limits.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${alexandria.variable} scroll-smooth`}>
      <body className="antialiased min-h-screen flex flex-col bg-bg-primary text-white overflow-x-hidden relative">
        {children}
      </body>
    </html>
  );
}
