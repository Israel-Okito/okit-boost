# Système de Paiement CinetPay

## Vue d'ensemble

Le système de paiement intègre CinetPay pour traiter les paiements mobiles (Orange Money, Airtel Money, M-Pesa) en République Démocratique du Congo.

## Architecture

### Flux de Paiement

1. **Initialisation** : L'utilisateur sélectionne ses services et procède au paiement
2. **Création Transaction** : Une transaction est créée dans `payment_transactions`
3. **Redirection CinetPay** : L'utilisateur est redirigé vers CinetPay
4. **Paiement** : L'utilisateur effectue le paiement via mobile money
5. **Webhook** : CinetPay notifie notre webhook du résultat
6. **Création Commande** : Si succès, une commande est automatiquement créée
7. **Confirmation** : L'utilisateur voit la confirmation de sa commande

### Composants Principaux

#### 1. Service CinetPay (`/src/lib/services/cinetpay.js`)
- Configuration API CinetPay
- Initialisation des paiements
- Vérification des signatures webhook
- Gestion des canaux de paiement par pays

#### 2. Webhook (`/src/app/api/webhooks/cinetpay/route.js`)
- Traite les notifications CinetPay
- Met à jour le statut des transactions
- Crée automatiquement les commandes pour les paiements réussis
- Gestion des erreurs et logging

#### 3. API Status (`/src/app/api/payments/cinetpay/status/route.js`)
- Récupère le statut d'une transaction
- Retourne les informations de commande associée
- Interface pour les pages de confirmation

#### 4. Composant Paiement (`/src/components/payments/cinetPayPayment.jsx`)
- Interface utilisateur pour initier les paiements
- Sélection du mode de paiement (Orange Money, Airtel Money, M-Pesa)
- Instructions de paiement personnalisées

## Base de Données

### Tables Principales

#### `payment_transactions`
```sql
- id (uuid, primary key)
- transaction_id (text, unique) -- ID CinetPay
- user_id (uuid, foreign key)
- amount (integer) -- Montant en centimes
- currency (text) -- 'CDF', 'USD'
- status (text) -- 'pending', 'completed', 'failed', 'cancelled'
- payment_method (text) -- 'orange', 'airtel', 'mpesa'
- customer_name (text)
- customer_email (text)
- customer_phone (text)
- metadata (jsonb) -- Données du panier
- created_at (timestamp)
- completed_at (timestamp)
- order_id (uuid, foreign key) -- Lié après création commande
```

#### `orders`
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key)
- order_number (text, auto-generated) -- Format: OKIT{timestamp}{random}
- total_usd (decimal)
- total_cdf (integer)
- currency (text)
- customer_name (text)
- customer_email (text)
- customer_phone (text)
- payment_method (text)
- payment_transaction_id (text)
- status (text) -- 'pending', 'processing', 'completed', 'cancelled'
- admin_notes (text)
- created_at (timestamp)
```

#### `order_items`
```sql
- id (uuid, primary key)
- order_id (uuid, foreign key)
- service_id (uuid, foreign key)
- service_name (text)
- platform_name (text)
- target_link (text)
- quantity (integer)
- price_usd (decimal)
- price_cdf (integer)
- total_usd (decimal)
- total_cdf (integer)
- status (text) -- 'pending', 'processing', 'completed', 'cancelled'
- created_at (timestamp)
```

## Configuration

### Variables d'Environnement

```env
# CinetPay
CINETPAY_API_KEY=your_api_key
CINETPAY_SITE_ID=your_site_id
CINETPAY_SECRET_KEY=your_secret_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### URL de Production

Pour la production, configurez dans CinetPay :
- **URL de notification** : `https://votre-domaine.com/api/webhooks/cinetpay`
- **URL de retour** : `https://votre-domaine.com/paiement/success`
- **URL d'annulation** : `https://votre-domaine.com/paiement/cancel`

## Scripts Utilitaires

### Vérification de Statut
```bash
node scripts/check-payment-status.js TRANSACTION_ID
```

### Test Webhook (Développement)
```bash
node scripts/test-webhook.js TRANSACTION_ID
```

## Sécurité

1. **Vérification de Signature** : Tous les webhooks sont vérifiés via signature HMAC
2. **Service Role Key** : Utilisée uniquement côté serveur pour les opérations sensibles
3. **Validation des Données** : Tous les inputs sont validés et échappés
4. **Gestion d'Erreurs** : Logging complet sans exposer d'informations sensibles

## Monitoring

### Logs Importants
- Création de transactions
- Réception de webhooks
- Création de commandes
- Erreurs de traitement

### Métriques à Surveiller
- Taux de succès des paiements
- Temps de traitement des webhooks
- Nombre de transactions par jour
- Commandes créées vs paiements réussis

## Dépannage

### Problèmes Courants

1. **Webhook 500** : Vérifier les logs serveur et la configuration Supabase
2. **Transaction non trouvée** : Vérifier que la transaction existe en base
3. **Commande non créée** : Vérifier les métadonnées de la transaction
4. **Signature invalide** : Vérifier la clé secrète CinetPay

### Commandes de Debug
```bash
# Vérifier le statut d'un paiement
node scripts/check-payment-status.js TRANSACTION_ID

# Tester le webhook en local
node scripts/test-webhook.js TRANSACTION_ID
```

## Support des Devises

- **CDF** : Franc Congolais (devise principale)
- **USD** : Dollar Américain (conversion automatique)
- **Taux de change** : 1 USD = 1667 CDF (configurable)

## Méthodes de Paiement Supportées

- **Orange Money** : Canal principal en RDC
- **Airtel Money** : Deuxième opérateur
- **M-Pesa** : Disponible via CinetPay
