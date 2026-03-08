import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { IBM_Plex_Mono } from "next/font/google";
import { Navbar, Footer } from "@/components/layout";
import { Providers } from "@/components/Providers";
import "./globals.css";

const atemicaSans = localFont({
  src: "./fonts/AtemicaSans_PERSONAL_USE_ONLY.otf",
  variable: "--font-atemica",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono-fam",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ranqly — The Fair Content Layer for Web3",
  description:
    "The fairest content contest platform in Web3. Submit, vote, and earn through transparent algorithmic scoring.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0A0A0F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${atemicaSans.variable} ${ibmPlexMono.variable}`}
      >
        <Providers>
          <Navbar />
          <main className="min-h-[calc(100vh-var(--navbar-height))]">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
