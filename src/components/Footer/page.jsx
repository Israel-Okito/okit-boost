import Image from "next/image"
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
               <Image src={"/logo.webp"} alt="okit boost" width={80} height={80}/>
            </div>
            <p className="text-gray-400 mb-4">
              Votre partenaire de confiance pour booster votre présence sur les réseaux sociaux. Services de qualité,
              prix abordables, support 24/7.
            </p>
            <div className="flex space-x-4">
              <a href="https://wa.me/243900554141" className="text-gray-400 hover:text-white transition-colors">
                WhatsApp
              </a>
              <a href="mailto:contact@okit-boost.com" className="text-gray-400 hover:text-white transition-colors">
                Email
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/services/tiktok" className="text-gray-400 hover:text-white transition-colors">
                  TikTok
                </Link>
              </li>
              <li>
                <Link href="/services/instagram" className="text-gray-400 hover:text-white transition-colors">
                  Instagram
                </Link>
              </li>
              <li>
                <Link href="/services/youtube" className="text-gray-400 hover:text-white transition-colors">
                  YouTube
                </Link>
              </li>
              <li>
                <Link href="/services/facebook" className="text-gray-400 hover:text-white transition-colors">
                  Facebook
                </Link>
              </li>
              <li>
                <Link href="/formulaire-dessai" className="text-gray-400 hover:text-white transition-colors">
                  Essai Gratuit
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/mon-compte" className="text-gray-400 hover:text-white transition-colors">
                  Mon Compte
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-400 hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/conditions-utilisation" className="text-gray-400 hover:text-white transition-colors">
                  Conditions d'utilisation
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>  &copy; {new Date().getFullYear()} Okit-Boost. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  )
}
