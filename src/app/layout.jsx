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
  title: "Okit-Boost - Services de boostage pour TikTok, Instagram, Facebook & YouTube",
  description:
    "Boostez votre présence sur les réseaux sociaux avec Okit-Boost. Obtenez de vrais abonnés, des likes et bien plus encore sur TikTok, Instagram, Facebook, YouTube et d'autres réseaux sociaux, paiement Mobile Money, support 24/7.",
  keywords: "SMM, boostage, boosting, TikTok, Facebook, Instagram, YouTube, followers, likes, vues, abonnés, Congo, RDC, Mobile Money, augmenter followers, augmenter likes, augmenter vues, augmenter abonnés, acheter followers, acheter likes, acheter vues, acheter abonnés",
  referrer: 'origin-when-cross-origin',
  openGraph: {
    title: "Okit-Boost - Services de boostage pour TikTok, Instagram, Facebook & YouTube",
    url: "https://okit-boost.com",
    siteName: "okitdev",
    locale: "fr, en-US",
    type: "website",
    description: "Boostez votre présence sur les réseaux sociaux avec Okit-Boost. Obtenez de vrais abonnés, des likes et bien plus encore sur TikTok, Instagram, Facebook, YouTube et d'autres réseaux sociaux, paiement Mobile Money, support 24/7.",
    // images: options.ogImage,
  },
  alternates: {
    canonical: "https://okit-boost.com",
  },
  other: {
    "google-site-verification":"nFx89CnxidHJfJSrvdbyE9bSiKy4cPmnwO4OJjUsnMM"
  },
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
