# Scripts Utilitaires

Ce répertoire contient les scripts utilitaires pour la gestion du système de paiement.

## Scripts disponibles

### `check-payment-status.js`
Vérifie le statut d'un paiement et affiche les informations détaillées.

**Usage:**
```bash
node scripts/check-payment-status.js <transaction_id>
```

**Exemple:**
```bash
node scripts/check-payment-status.js OKIT1756431911287W1HSJ0XL
```

**Affichage:**
- Statut de la transaction
- Informations client
- Commande associée (si créée)
- Articles de la commande

### `test-webhook.js`
Teste le webhook CinetPay en mode développement.

**Usage:**
```bash
node scripts/test-webhook.js [transaction_id]
```

**Exemple:**
```bash
node scripts/test-webhook.js OKIT1756431911287W1HSJ0XL
```

**Fonctionnalités:**
- Simule une notification CinetPay
- Vérifie le traitement du webhook
- Affiche le statut mis à jour

## Configuration requise

Assurez-vous que le fichier `.env.local` contient :
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Installation des dépendances

```bash
npm install dotenv @supabase/supabase-js
```
