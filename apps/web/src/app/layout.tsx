import type { Metadata } from "next";
import { Yeseva_One, Josefin_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { BabyProvider } from "@/context/BabyContext";

const yesevaOne = Yeseva_One({
  variable: "--font-yeseva-one",
  weight: "400",
  subsets: ["latin"],
});

const josefinSans = Josefin_Sans({
  variable: "--font-josefin-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lumina Prenatal & Newborn Suite",
  description: "Prenatal & Newborn Caregiver Tracking Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${yesevaOne.variable} ${josefinSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <AuthProvider>
            <BabyProvider>{children}</BabyProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
