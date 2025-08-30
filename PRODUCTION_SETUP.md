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




regarde ma base de données avec ces tables : create table public.webhook_events (
  id uuid not null default gen_random_uuid (),
  provider character varying(50) not null,
  event_type character varying(100) not null,
  transaction_id character varying(255) null,
  status character varying(50) null,
  payload jsonb not null,
  error_message text null,
  processed_at timestamp with time zone null default now(),
  created_at timestamp with time zone null default now(),
  constraint webhook_events_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_webhook_events_provider on public.webhook_events using btree (provider) TABLESPACE pg_default;

create index IF not exists idx_webhook_events_transaction_id on public.webhook_events using btree (transaction_id) TABLESPACE pg_default;

create index IF not exists idx_webhook_events_created_at on public.webhook_events using btree (created_at) TABLESPACE pg_default;  create table public.payment_transactions (
  id uuid not null default gen_random_uuid (),
  order_id uuid null,
  user_id uuid null,
  transaction_id character varying(255) not null,
  payment_token character varying(255) null,
  amount numeric(15, 2) not null,
  currency character varying(10) not null default 'CDF'::character varying,
  payment_method character varying(50) null,
  status character varying(50) null default 'pending'::character varying,
  provider character varying(50) null default 'cinetpay'::character varying,
  provider_response jsonb null,
  failure_reason text null,
  completed_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  customer_email text null,
  customer_phone bigint null,
  customer_name text null,
  address text null,
  city text null,
  metadata jsonb null,
  expires_at timestamp with time zone null,
  constraint payment_transactions_pkey primary key (id),
  constraint payment_transactions_transaction_id_key unique (transaction_id),
  constraint payment_transactions_order_id_fkey foreign KEY (order_id) references orders (id) on delete CASCADE,
  constraint payment_transactions_user_id_fkey foreign KEY (user_id) references profiles (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_payment_transactions_status on public.payment_transactions using btree (status) TABLESPACE pg_default;

create index IF not exists idx_payment_transactions_order_id on public.payment_transactions using btree (order_id) TABLESPACE pg_default;

create index IF not exists idx_payment_transactions_user_id on public.payment_transactions using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_payment_transactions_transaction_id on public.payment_transactions using btree (transaction_id) TABLESPACE pg_default;

create index IF not exists idx_payment_transactions_created_at on public.payment_transactions using btree (created_at) TABLESPACE pg_default;

create trigger update_payment_transactions_updated_at BEFORE
update on payment_transactions for EACH row
execute FUNCTION update_updated_at_column (); create table public.orders (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid null,
  total_usd numeric(10, 2) not null,
  total_cdf integer not null,
  currency text null default 'CDF'::text,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  payment_method text null,
  admin_notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  payment_transaction_id character varying(255) null,
  status text null default 'pending'::text,
  order_number text null,
  constraint orders_pkey primary key (id),
  constraint orders_user_id_fkey foreign KEY (user_id) references profiles (id) on delete CASCADE,
  constraint orders_currency_check check (
    (currency = any (array['USD'::text, 'CDF'::text]))
  ),
  constraint orders_payment_method_check check (
    (
      payment_method = any (
        array['orange'::text, 'airtel'::text, 'mpesa'::text]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_orders_user_id on public.orders using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_orders_created_at on public.orders using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_orders_payment_transaction_id on public.orders using btree (payment_transaction_id) TABLESPACE pg_default;

create index IF not exists idx_orders_status on public.orders using btree (status) TABLESPACE pg_default;

create trigger trigger_set_order_number BEFORE INSERT on orders for EACH row
execute FUNCTION set_order_number ();

create trigger update_orders_updated_at BEFORE
update on orders for EACH row
execute FUNCTION update_updated_at_column ();
