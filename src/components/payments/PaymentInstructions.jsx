// Instructions de paiement pour chaque méthode
import { Info, Smartphone, Clock, Shield } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function PaymentInstructions({ method, amount, currency }) {
  const instructions = {
    mpesa: {
      title: "Instructions M-Pesa",
      steps: [
        "Composez *334# depuis votre téléphone",
        "Sélectionnez 'Payer marchand'",
        "Saisissez le code marchand qui sera fourni",
        `Saisissez le montant: ${amount.toLocaleString()} ${currency}`,
        "Confirmez avec votre code PIN M-Pesa",
        "Vous recevrez un SMS de confirmation"
      ],
      tips: [
        "Assurez-vous d'avoir suffisamment de solde",
        "Gardez votre téléphone allumé pendant le processus",
        "Le paiement est sécurisé et crypté"
      ]
    },
    orange: {
      title: "Instructions Orange Money",
      steps: [
        "Composez #144# depuis votre téléphone Orange",
        "Sélectionnez 'Paiement'",
        "Choisissez 'Paiement marchand'",
        "Saisissez le code marchand fourni",
        `Entrez le montant: ${amount.toLocaleString()} ${currency}`,
        "Confirmez avec votre code PIN Orange Money"
      ],
      tips: [
        "Vérifiez votre solde Orange Money",
        "Les frais sont de 1.5% du montant",
        "Transaction instantanée et sécurisée"
      ]
    },
    airtel: {
      title: "Instructions Airtel Money",
      steps: [
        "Composez *902# depuis votre téléphone Airtel",
        "Sélectionnez 'Paiements'",
        "Choisissez 'Payer un marchand'",
        "Entrez le code marchand fourni",
        `Saisissez: ${amount.toLocaleString()} ${currency}`,
        "Validez avec votre PIN Airtel Money"
      ],
      tips: [
        "Assurez-vous d'avoir du crédit Airtel Money",
        "Frais de transaction: 1.5%",
        "Support client: 111 depuis Airtel"
      ]
    }
  }

  const methodInstructions = instructions[method]
  
  if (!methodInstructions) return null

  return (
    <div className="space-y-4">
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>{methodInstructions.title}</strong>
          <div className="mt-2 space-y-1">
            {methodInstructions.steps.map((step, index) => (
              <div key={index} className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {index + 1}
                </span>
                <span className="text-sm">{step}</span>
              </div>
            ))}
          </div>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {methodInstructions.tips.map((tip, index) => (
          <div key={index} className="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg">
            <Shield className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-gray-700">{tip}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center space-x-2 text-xs text-gray-500 bg-yellow-50 p-3 rounded-lg">
        <Clock className="h-4 w-4 text-yellow-600" />
        <span>
          <strong>Temps limite:</strong> Vous avez 15 minutes pour compléter ce paiement
        </span>
      </div>
    </div>
  )
}
