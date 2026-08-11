import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Aleena — AI Digital Companion",
  description: "A premium AI Digital Human Companion interface with holographic 3D avatar, real-time chat, and voice interaction.",
  keywords: ["AI", "digital companion", "holographic", "chat", "voice"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-bg text-text-main antialiased">
        {children}
      </body>
    </html>
  );
}
