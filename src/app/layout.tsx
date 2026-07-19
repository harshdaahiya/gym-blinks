import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppLayout } from "@/components/layout/AppLayout";
import { ThemeProvider } from "@/components/common/ThemeProvider";
import "./globals.css";

const figtreeFont = localFont({
  src: [
    {
      path: "../../public/fonts/Figtree-VariableFont_wght.ttf",
      style: "normal",
    },
    {
      path: "../../public/fonts/Figtree-Italic-VariableFont_wght.ttf",
      style: "italic",
    },
  ],
  variable: "--font-figtree",
});

export const metadata: Metadata = {
  title: "GymBlinks",
  description: "Personal Gym Progress & Overload Tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${figtreeFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AppLayout>{children}</AppLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
