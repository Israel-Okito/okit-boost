import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { FileText, Shield, AlertTriangle, CheckCircle, Mail, MessageCircle } from "lucide-react"
import Link from "next/link"

export default function ConditionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Conditions d'Utilisation</h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Conditions générales d'utilisation des services Okit-Boost
            </p>
            <Badge className="bg-green-500 text-white px-4 py-2 text-lg">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Dernière mise à jour : 31 Juillet 2025
              </div>
            </Badge>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Introduction */}
          <Card className="mb-8 shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mr-4">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                Information Importante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                En utilisant les services d'Okit-Boost, vous acceptez d'être lié par les présentes conditions
                d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Important :</strong> Ces conditions peuvent être modifiées à tout moment. Les utilisateurs
                  seront informés des changements importants par email et/ou notification sur le site.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-8">
            {/* 1. Définitions */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-xl">1. Définitions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Okit-Boost</h4>
                    <p className="text-sm text-gray-600">
                      Désigne la société et la plateforme de services SMM (Social Media Marketing).
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Utilisateur/Client</h4>
                    <p className="text-sm text-gray-600">Toute personne physique ou morale utilisant nos services.</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Services SMM</h4>
                    <p className="text-sm text-gray-600">
                      Followers, likes, vues, abonnés et autres services de marketing sur les réseaux sociaux.
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Plateforme</h4>
                    <p className="text-sm text-gray-600">
                      TikTok, Instagram, YouTube et autres réseaux sociaux supportés.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Acceptation des Conditions */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-xl">2. Acceptation des Conditions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  En accédant à notre site web, en créant un compte ou en passant une commande, vous confirmez que :
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Vous avez lu et compris ces conditions d'utilisation</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Vous acceptez d'être lié par ces conditions</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Vous êtes majeur ou avez l'autorisation parentale</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">
                      Vous possédez les droits sur les comptes pour lesquels vous commandez
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* 3. Description des Services */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-xl">3. Description des Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Okit-Boost propose des services de marketing sur les réseaux sociaux incluant :
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <h4 className="font-semibold text-blue-800 mb-2">TikTok</h4>
                    <p className="text-sm text-blue-700">Vues, Followers, Likes</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <h4 className="font-semibold text-purple-800 mb-2">Instagram</h4>
                    <p className="text-sm text-purple-700">Followers, Likes, Vues</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg text-center">
                    <h4 className="font-semibold text-red-800 mb-2">YouTube</h4>
                    <p className="text-sm text-red-700">Vues, Abonnés, Likes</p>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>Note :</strong> Tous nos services respectent les conditions d'utilisation des plateformes
                    concernées et proviennent de comptes réels et actifs.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 4. Obligations de l'Utilisateur */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-xl">4. Obligations de l'Utilisateur</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold text-gray-900">L'utilisateur s'engage à :</h4>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">
                      Fournir des informations exactes et à jour lors de l'inscription et des commandes
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">
                      Utiliser nos services uniquement pour des comptes dont il est propriétaire ou autorisé
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">
                      Ne pas utiliser nos services à des fins illégales, frauduleuses ou nuisibles
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">
                      Respecter les conditions d'utilisation des plateformes tierces (TikTok, Instagram, YouTube)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">Maintenir la confidentialité de ses informations de compte</span>
                  </li>
                </ul>

                <Separator className="my-6" />

                <h4 className="font-semibold text-gray-900">Il est strictement interdit de :</h4>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-red-600 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">
                      Revendre ou redistribuer nos services sans autorisation écrite
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-red-600 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">
                      Utiliser nos services pour des contenus illégaux, haineux ou offensants
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-red-600 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">Tenter de pirater ou compromettre notre système</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-red-600 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">Créer de faux comptes ou fournir de fausses informations</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* 5. Paiements et Facturation */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-xl">5. Paiements et Facturation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Moyens de Paiement</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-gray-700">Orange Money</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-gray-700">Airtel Money</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-gray-700">M-Pesa</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Conditions de Paiement</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                        <span className="text-gray-700">Paiement intégral avant livraison</span>
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                        <span className="text-gray-700">Preuve de paiement obligatoire</span>
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                        <span className="text-gray-700">Validation sous 30 minutes</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Politique de Remboursement</h4>
                  <p className="text-blue-700 text-sm">
                    Les remboursements sont possibles uniquement si le service n'a pas été livré dans les délais
                    annoncés ou en cas de problème technique de notre part. Les demandes de remboursement doivent être
                    faites dans les 48h suivant la commande.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 6. Livraison et Garanties */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-xl">6. Livraison et Garanties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Délais de Livraison</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Vues/Likes : 1-6h</li>
                      <li>• Followers : 6-24h</li>
                      <li>• Services premium : 12-48h</li>
                    </ul>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Garantie de Livraison</h4>
                    <p className="text-sm text-blue-700">
                      100% de livraison garantie ou remboursement intégral si non livré dans les délais.
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">Garantie de Rétention</h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• Followers : 30 jours</li>
                      <li>• Likes : 15 jours</li>
                      <li>• Vues : Permanentes</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 7. Limitation de Responsabilité */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-xl">7. Limitation de Responsabilité</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">Limitations Importantes</h4>
                  <ul className="text-sm text-red-700 space-y-2">
                    <li>
                      • Okit-Boost ne peut être tenu responsable des actions des plateformes tierces (suspensions,
                      modifications d'algorithmes, etc.)
                    </li>
                    <li>
                      • Nous ne garantissons pas de résultats spécifiques en termes d'engagement ou de croissance
                      organique
                    </li>
                    <li>• Notre responsabilité est limitée au montant payé pour le service concerné</li>
                    <li>• Nous ne sommes pas responsables des dommages indirects, consécutifs ou punitifs</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* 8. Propriété Intellectuelle */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-xl">8. Propriété Intellectuelle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Tous les éléments du site Okit-Boost (logo, design, textes, images, code) sont protégés par les droits
                  de propriété intellectuelle. Toute reproduction sans autorisation est interdite.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Droits de l'Utilisateur</h4>
                  <p className="text-sm text-gray-700">
                    L'utilisateur conserve tous les droits sur ses comptes et contenus. Okit-Boost n'accède jamais aux
                    mots de passe et ne revendique aucun droit sur les comptes clients.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 9. Confidentialité */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-xl">9. Protection des Données</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Nous nous engageons à protéger vos données personnelles conformément aux lois en vigueur :
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Shield className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Chiffrement SSL de toutes les données sensibles</span>
                  </li>
                  <li className="flex items-start">
                    <Shield className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Aucun partage de données avec des tiers sans consentement</span>
                  </li>
                  <li className="flex items-start">
                    <Shield className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">
                      Droit d'accès, de modification et de suppression de vos données
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Shield className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Conservation des données limitée à la durée nécessaire</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* 10. Résiliation */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-xl">10. Résiliation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Par l'Utilisateur</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      Vous pouvez fermer votre compte à tout moment en nous contactant. Les commandes en cours seront
                      honorées.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Par Okit-Boost</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      Nous nous réservons le droit de suspendre ou fermer un compte en cas de violation de ces
                      conditions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 11. Droit Applicable */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-xl">11. Droit Applicable et Juridiction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Ces conditions d'utilisation sont régies par le droit congolais (RDC). En cas de litige, les tribunaux
                  de Kinshasa seront seuls compétents.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Résolution des Conflits</h4>
                  <p className="text-blue-700 text-sm">
                    Avant tout recours judiciaire, nous encourageons la résolution amiable des conflits par contact
                    direct avec notre service client.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 12. Modifications */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-xl">12. Modifications des Conditions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  Okit-Boost se réserve le droit de modifier ces conditions à tout moment. Les utilisateurs seront
                  informés des modifications importantes par :
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Mail className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-gray-700">Email de notification</span>
                  </li>
                  <li className="flex items-center">
                    <MessageCircle className="w-4 h-4 text-green-600 mr-2" />
                    <span className="text-gray-700">Message WhatsApp</span>
                  </li>
                  <li className="flex items-center">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
                    <span className="text-gray-700">Notification sur le site web</span>
                  </li>
                </ul>
                <p className="text-sm text-gray-600">
                  La poursuite de l'utilisation de nos services après modification vaut acceptation des nouvelles
                  conditions.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Section */}
          <Card className="mt-12 shadow-lg border-0 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="text-xl text-center">Questions sur ces Conditions ?</CardTitle>
              <CardDescription className="text-center">
                Notre équipe juridique est disponible pour clarifier tout point de ces conditions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://wa.me/243900554141?text=Bonjour%20Okit-Boost,%20j'ai%20une%20question%20concernant%20vos%20conditions%20d'utilisation"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="bg-green-500 hover:bg-green-600 text-white">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                </a>
                <a href="mailto:legal@okit-boost.com?subject=Question sur les Conditions d'Utilisation">
                  <Button variant="outline" className="bg-transparent">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Juridique
                  </Button>
                </a>
                <Link href="/contact">
                  <Button variant="outline" className="bg-transparent">
                    <FileText className="w-4 h-4 mr-2" />
                    Page Contact
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
