import type { Metadata } from "next";
import { Alexandria } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { Toaster } from "react-hot-toast";

const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-alexandria",
});

export const metadata: Metadata = {
  title: "Yilow.ai",
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
        <SessionProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "#0a0a0a",
                color: "#fff",
                border: "1px solid rgba(254,228,64,0.2)",
                fontFamily: "var(--font-alexandria), sans-serif",
              },
            }}
          />
        </SessionProvider>
      </body>
    </html>
  );
}
