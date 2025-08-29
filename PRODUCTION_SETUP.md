# 🚀 Configuration Production - Paiements CinetPay

## 🔧 Variables d'environnement requises

### 1. URL de base de l'application
```bash
NEXT_PUBLIC_SITE_URL=https://votre-domaine.com
```
**Important** : Remplacez `https://votre-domaine.com` par votre vraie URL de production.

### 2. Configuration CinetPay Production
```bash
# Mode production (très important!)
CINETPAY_SANDBOX_MODE=false

# Clés de production CinetPay
CINETPAY_API_KEY=votre_api_key_production
CINETPAY_SITE_ID=votre_site_id_production
CINETPAY_SECRET_KEY=votre_secret_key_production
```

### 3. Configuration Supabase
```bash
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

## 🌐 URLs CinetPay automatiques

Avec `NEXT_PUBLIC_SITE_URL` définie, les URLs suivantes seront automatiquement générées :

- **Webhook** : `https://votre-domaine.com/api/webhooks/cinetpay`
- **Succès** : `https://votre-domaine.com/paiement/success`
- **Annulation** : `https://votre-domaine.com/paiement/cancel`

## ⚙️ Configuration sur Vercel

### 1. Variables d'environnement Vercel
```bash
vercel env add NEXT_PUBLIC_SITE_URL
# Entrer: https://votre-domaine.com

vercel env add CINETPAY_SANDBOX_MODE
# Entrer: false

vercel env add CINETPAY_API_KEY
# Entrer: votre_api_key_production

vercel env add CINETPAY_SITE_ID  
# Entrer: votre_site_id_production

vercel env add CINETPAY_SECRET_KEY
# Entrer: votre_secret_key_production
```

### 2. Redéploiement
```bash
vercel --prod
```

## 🔍 Configuration CinetPay Dashboard

### 1. URLs de notification
Dans votre tableau de bord CinetPay, configurez :

- **URL de notification** : `https://votre-domaine.com/api/webhooks/cinetpay`
- **URL de retour** : `https://votre-domaine.com/paiement/success`
- **URL d'annulation** : `https://votre-domaine.com/paiement/cancel`

### 2. Mode production
- Assurez-vous que votre compte CinetPay est en **mode production**
- Utilisez les **clés de production** (pas les clés de test)

## 🧪 Test de la configuration

### 1. Vérifier les URLs
```bash
curl https://votre-domaine.com/api/webhooks/cinetpay
```

### 2. Test de paiement
1. Faites un paiement test avec un petit montant
2. Vérifiez que le webhook arrive dans les logs
3. Vérifiez que la commande est créée

### 3. Script de diagnostic
```bash
# En local pour tester la prod
NEXT_PUBLIC_SITE_URL=https://votre-domaine.com node scripts/debug-production-payment.js
```

## ❌ Problèmes courants

### 1. Page blanche après paiement
**Cause** : `NEXT_PUBLIC_SITE_URL` mal configurée ou API de status qui échoue

**Solution** :
- Vérifier que `NEXT_PUBLIC_SITE_URL` correspond à votre vraie URL
- Tester l'API : `https://votre-domaine.com/api/payments/cinetpay/status?transactionId=TEST`

### 2. Webhook ne reçoit pas les notifications
**Cause** : URL de notification incorrecte ou en localhost

**Solution** :
- Vérifier l'URL dans le dashboard CinetPay
- S'assurer que `CINETPAY_SANDBOX_MODE=false`
- Tester : `curl -X POST https://votre-domaine.com/api/webhooks/cinetpay`

### 3. Commandes pas créées
**Cause** : Webhook échoue ou mode sandbox

**Solution** :
- Vérifier les logs Vercel
- S'assurer que `CINETPAY_SANDBOX_MODE=false`
- Vérifier la signature du webhook

## 📊 Monitoring

### 1. Logs Vercel
```bash
vercel logs --follow
```

### 2. Dashboard admin
- Vérifier l'onglet "Transactions"
- Surveiller les revenus
- Contrôler les commandes créées

### 3. Supabase Dashboard  
- Vérifier les tables `payment_transactions`, `orders`, `webhook_events`
- Surveiller les erreurs RLS

## 🔒 Sécurité Production

### 1. Variables sensibles
- Jamais de clés dans le code
- Utiliser les variables d'environnement
- Clés production différentes du sandbox

### 2. HTTPS obligatoire
- Toutes les URLs doivent être en HTTPS
- CinetPay n'accepte que HTTPS en production

### 3. Validation des webhooks
- Signature automatiquement vérifiée
- IP CinetPay whitelistée si nécessaire

## ✅ Checklist de déploiement

- [ ] `NEXT_PUBLIC_SITE_URL` définie avec la vraie URL
- [ ] `CINETPAY_SANDBOX_MODE=false`
- [ ] Clés CinetPay de production configurées
- [ ] URLs configurées dans le dashboard CinetPay
- [ ] Test de paiement effectué
- [ ] Webhook reçu et traité
- [ ] Commande créée automatiquement
- [ ] Page de succès fonctionnelle
- [ ] Dashboard admin opérationnel
