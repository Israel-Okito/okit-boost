import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HelpCircle, MessageCircle, Mail, Star, Shield, Zap } from "lucide-react"
import Link from "next/link"

export default function FAQPage() {
  const faqCategories = [
    {
      title: "Commandes et Services",
      icon: <Zap className="w-5 h-5" />,
      color: "bg-blue-100 text-blue-600",
      questions: [
        {
          question: "Comment passer une commande sur Okit-Boost ?",
          answer:
            "C'est très simple ! 1) Choisissez votre plateforme (TikTok, Instagram, YouTube), 2) Sélectionnez le service souhaité, 3) Entrez le lien cible et la quantité, 4) Ajoutez au panier, 5) Procédez au paiement via Mobile Money. Vous recevrez une confirmation par email et WhatsApp.",
        },
        {
          question: "Combien de temps prend la livraison ?",
          answer:
            "La livraison varie selon le service : \n• Vues et Likes : 1-6 heures\n• Followers/Abonnés : 6-24 heures\n• Services premium : 12-48 heures\nVous pouvez suivre l'avancement de votre commande dans votre compte.",
        },
        {
          question: "Puis-je modifier ou annuler ma commande ?",
          answer:
            "Vous pouvez modifier ou annuler votre commande uniquement si elle n'a pas encore été mise en traitement. Contactez-nous immédiatement sur WhatsApp avec votre numéro de commande. Une fois le traitement commencé, les modifications ne sont plus possibles.",
        },
        {
          question: "Que se passe-t-il si je ne reçois pas ma commande ?",
          answer:
            "Si vous ne recevez pas votre commande dans les délais annoncés, contactez-nous immédiatement. Nous offrons une garantie de livraison à 100%. En cas de problème, nous relançons la commande gratuitement ou vous remboursons intégralement.",
        },
      ],
    },
    {
      title: "Paiements",
      icon: <Shield className="w-5 h-5" />,
      color: "bg-green-100 text-green-600",
      questions: [
        {
          question: "Quels moyens de paiement acceptez-vous ?",
          answer:
            "Nous acceptons tous les principaux moyens de paiement mobile en RDC :\n• Orange Money\n• Airtel Money\n• M-Pesa\n• Tous les paiements sont sécurisés et vous devez fournir une preuve de paiement.",
        },
        {
          question: "Comment fournir ma preuve de paiement ?",
          answer:
            "Après avoir effectué votre paiement Mobile Money, prenez une capture d'écran ou une photo du reçu de transaction. Téléchargez cette image lors de la finalisation de votre commande. Notre équipe vérifiera le paiement sous 30 minutes.",
        },
        {
          question: "Puis-je payer en plusieurs fois ?",
          answer:
            "Actuellement, nous n'acceptons que les paiements en une seule fois. Cependant, pour les gros volumes (plus de 100$ USD), contactez-nous sur WhatsApp pour discuter d'arrangements spéciaux.",
        },
        {
          question: "Que faire si mon paiement n'est pas reconnu ?",
          answer:
            "Si votre paiement n'est pas reconnu après 1 heure, vérifiez que :\n1) Le montant est correct\n2) Le numéro de destination est bon\n3) Votre preuve de paiement est claire\nSi tout est correct, contactez-nous sur WhatsApp avec votre preuve de paiement.",
        },
      ],
    },
    {
      title: "Sécurité et Qualité",
      icon: <Shield className="w-5 h-5" />,
      color: "bg-purple-100 text-purple-600",
      questions: [
        {
          question: "Vos services sont-ils sûrs pour mon compte ?",
          answer:
            "Oui, absolument ! Nous utilisons uniquement des méthodes conformes aux conditions d'utilisation des plateformes. Nos services proviennent de comptes réels et actifs. Nous ne demandons jamais vos mots de passe et ne violons aucune règle des plateformes.",
        },
        {
          question: "Risque-t-on d'être banni ou sanctionné ?",
          answer:
            "Non, nos services sont 100% sûrs. Nous respectons les limites de chaque plateforme et utilisons des techniques naturelles. Aucun de nos clients n'a jamais été sanctionné. Nous offrons même une garantie contre les sanctions.",
        },
        {
          question: "D'où viennent vos followers/likes/vues ?",
          answer:
            "Nos services proviennent de :\n• Comptes réels et actifs\n• Utilisateurs géographiquement diversifiés\n• Profils avec photos et activité\n• Aucun bot ou faux compte\nNous privilégions la qualité à la quantité.",
        },
        {
          question: "Garantissez-vous la rétention ?",
          answer:
            "Oui ! Nous offrons une garantie de rétention :\n• 30 jours pour les followers/abonnés\n• 15 jours pour les likes\n• Les vues sont permanentes\nEn cas de baisse, nous compensons gratuitement.",
        },
      ],
    },
    {
      title: "Essai Gratuit",
      icon: <Star className="w-5 h-5" />,
      color: "bg-yellow-100 text-yellow-600",
      questions: [
        {
          question: "Comment obtenir un essai gratuit ?",
          answer:
            "Remplissez notre formulaire d'essai gratuit en indiquant :\n• Vos informations de contact\n• La plateforme souhaitée\n• Le service à tester\n• Le lien cible\nNotre équipe vous contactera sous 24h pour valider votre essai.",
        },
        {
          question: "Combien d'essais puis-je demander ?",
          answer:
            "Vous pouvez demander un essai gratuit par plateforme (TikTok, Instagram, YouTube) et par type de service. Par exemple : 1 essai vues TikTok + 1 essai followers Instagram + 1 essai vues YouTube.",
        },
        {
          question: "L'essai gratuit a-t-il des conditions ?",
          answer:
            "L'essai est 100% gratuit sans obligation d'achat. Les seules conditions sont :\n• Avoir un compte réel et actif\n• Fournir des informations de contact valides\n• Un seul essai par service et par personne\n• Respecter nos conditions d'utilisation",
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <HelpCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Questions Fréquentes</h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              Trouvez rapidement les réponses à toutes vos questions sur nos services SMM
            </p>
            <Badge className="bg-green-500 text-white px-4 py-2 text-lg">
              <div className="flex items-center">
                <HelpCircle className="w-4 h-4 mr-2" />
                Plus de 50 questions répondues
              </div>
            </Badge>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {faqCategories.map((category, categoryIndex) => (
              <Card key={categoryIndex} className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl">
                    <div className={`w-10 h-10 rounded-lg ${category.color} flex items-center justify-center mr-4`}>
                      {category.icon}
                    </div>
                    {category.title}
                  </CardTitle>
                  <CardDescription className="text-lg">
                    {category.questions.length} questions dans cette catégorie
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((faq, index) => (
                      <AccordionItem key={index} value={`item-${categoryIndex}-${index}`}>
                        <AccordionTrigger className="text-left hover:text-blue-600 transition-colors">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-600 whitespace-pre-line leading-relaxed">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Vous ne trouvez pas votre réponse ?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Notre équipe de support est disponible 24/7 pour répondre à toutes vos questions spécifiques
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <a
              href="https://wa.me/243900554141?text=Bonjour%20Okit-Boost,%20j'ai%20une%20question%20qui%20n'est%20pas%20dans%20la%20FAQ"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full h-16 bg-green-500 hover:bg-green-600 text-white text-lg">
                <MessageCircle className="w-6 h-6 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">WhatsApp</div>
                  <div className="text-sm opacity-90">Réponse sous 5 min</div>
                </div>
              </Button>
            </a>

            <Link href="/contact">
              <Button variant="outline" className="w-full h-16 text-lg border-2 bg-transparent">
                <Mail className="w-6 h-6 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Email</div>
                  <div className="text-sm text-gray-500">Réponse sous 2h</div>
                </div>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Tips */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Conseils rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Commande rapide</h3>
              <p className="text-sm text-gray-600">
                Utilisez notre essai gratuit pour tester la qualité avant de passer une grosse commande.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Paiement sécurisé</h3>
              <p className="text-sm text-gray-600">
                Gardez toujours votre preuve de paiement Mobile Money jusqu'à confirmation de la commande.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Star className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Meilleurs résultats</h3>
              <p className="text-sm text-gray-600">
                Assurez-vous que votre compte est public et actif pour de meilleurs résultats.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
