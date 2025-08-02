import { Geist, Geist_Mono } from "next/font/google";
import { Inter } from 'next/font/google';
import "./globals.css";
import Header from "@/components/Header/page";
import Footer from "@/components/Footer/page";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/hooks/useAuth";

const inter = Inter({ subsets: ['latin'] });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Okit-Boost - Services SMM pour TikTok, Instagram & YouTube",
  description:
    "Boostez votre présence sur les réseaux sociaux avec Okit-Boost. Services SMM de qualité, paiement Mobile Money, support 24/7.",
  keywords: "SMM, TikTok, Facebook, Instagram, YouTube, followers, likes, vues, Congo, RDC, Mobile Money",
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased ${inter.className}`}
        suppressHydrationWarning={true}
      >
        <AuthProvider>
       <div className="grid grid-rows-[auto,1fr,auto] min-h-screen">
          <Header/>
          <main>
            {children}
          </main>
          <Toaster/>
          <Footer/>
       </div>
        </AuthProvider>
      </body>
    </html>
  );
}
