import type { Metadata } from "next";
import {
  Plus_Jakarta_Sans,
  Inter,
  Fira_Code,
  Instrument_Serif,
} from "next/font/google";
import "./globals.css";
import { cn } from "cn";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-paragraph",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-mono",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-canvas",
});

export const metadata: Metadata = {
  title: "Vizi — Real-Time Collaborative Whiteboard",
  description:
    "A lightweight, ultra-responsive, real-time collaborative whiteboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full antialiased font-sans",
        plusJakartaSans.variable,
        inter.variable,
        firaCode.variable,
        instrumentSerif.variable,
      )}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
