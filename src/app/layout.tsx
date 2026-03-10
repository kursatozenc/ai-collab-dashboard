import type { Metadata } from "next";
import { Inter, DM_Serif_Text, Caveat } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const dmSerif = DM_Serif_Text({
  variable: "--font-dm-serif",
  weight: "400",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Atlas of Human-AI Collaboration",
  description:
    "A navigable scholarly landscape of human-AI collaboration research. Six territories. Emergent neighborhoods. Real sources. For designers and knowledge workers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${dmSerif.variable} ${caveat.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
