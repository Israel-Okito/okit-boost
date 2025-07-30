// -- Supprimer les tables existantes si elles existent
// DROP TABLE IF EXISTS order_items CASCADE;
// DROP TABLE IF EXISTS orders CASCADE;
// DROP TABLE IF EXISTS services CASCADE;
// DROP TABLE IF EXISTS platforms CASCADE;
// DROP TABLE IF EXISTS profiles CASCADE;

// -- Extensions nécessaires
// CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

// -- 1. Table des profils utilisateurs
// CREATE TABLE profiles (
//     id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
//     email TEXT UNIQUE NOT NULL,
//     full_name TEXT,
//     phone TEXT,
//     avatar_url TEXT,
//     role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
//     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
//     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
// );

// -- 2. Table des plateformes
// CREATE TABLE platforms (
//     id TEXT PRIMARY KEY,
//     name TEXT NOT NULL,
//     description TEXT,
//     icon_url TEXT,
//     color_from TEXT,
//     color_to TEXT,
//     is_active BOOLEAN DEFAULT true,
//     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
// );

// -- 3. Table des services
// CREATE TABLE services (
//     id TEXT PRIMARY KEY,
//     platform_id TEXT REFERENCES platforms(id) ON DELETE CASCADE,
//     name TEXT NOT NULL,
//     description TEXT,
//     category TEXT NOT NULL,
//     price_usd DECIMAL(10,4) NOT NULL,
//     price_cdf INTEGER NOT NULL,
//     min_quantity INTEGER NOT NULL DEFAULT 1,
//     max_quantity INTEGER NOT NULL DEFAULT 1000000,
//     is_active BOOLEAN DEFAULT true,
//     delivery_time TEXT DEFAULT '0-12 heures',
//     quality TEXT DEFAULT 'Premium',
//     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
//     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
// );

// -- 4. Table des commandes
// CREATE TABLE orders (
//     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
//     user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
//     order_number TEXT UNIQUE NOT NULL,
//     status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded')),
//     total_usd DECIMAL(10,2) NOT NULL,
//     total_cdf INTEGER NOT NULL,
//     currency TEXT DEFAULT 'CDF' CHECK (currency IN ('USD', 'CDF')),
    
//     -- Informations client
//     customer_name TEXT NOT NULL,
//     customer_email TEXT NOT NULL,
//     customer_phone TEXT NOT NULL,
    
//     -- Informations de paiement
//     payment_method TEXT CHECK (payment_method IN ('orange', 'airtel', 'mpesa')),
//     payment_proof_url TEXT,
//     payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'verified', 'failed')),
    
//     -- Métadonnées
//     notes TEXT,
//     admin_notes TEXT,
//     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
//     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
// );

// -- 5. Table des éléments de commande
// CREATE TABLE order_items (
//     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
//     order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
//     service_id TEXT REFERENCES services(id) ON DELETE CASCADE,
//     service_name TEXT NOT NULL,
//     platform_name TEXT NOT NULL,
//     target_link TEXT NOT NULL,
//     quantity INTEGER NOT NULL,
//     unit_price_usd DECIMAL(10,4) NOT NULL,
//     unit_price_cdf INTEGER NOT NULL,
//     total_usd DECIMAL(10,2) NOT NULL,
//     total_cdf INTEGER NOT NULL,
//     status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
//     start_count INTEGER DEFAULT 0,
//     remains INTEGER DEFAULT 0,
//     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
//     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
// );

// -- 6. Table des essais gratuits
// CREATE TABLE trial_requests (
//     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
//     name TEXT NOT NULL,
//     email TEXT NOT NULL,
//     phone TEXT NOT NULL,
//     platform TEXT NOT NULL,
//     service TEXT NOT NULL,
//     target_link TEXT NOT NULL,
//     notes TEXT,
//     status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'delivered', 'rejected')),
//     admin_notes TEXT,
//     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
//     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
// );

// -- Index pour les performances
// CREATE INDEX idx_orders_user_id ON orders(user_id);
// CREATE INDEX idx_orders_status ON orders(status);
// CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
// CREATE INDEX idx_order_items_order_id ON order_items(order_id);
// CREATE INDEX idx_services_platform_id ON services(platform_id);
// CREATE INDEX idx_services_is_active ON services(is_active);

// -- Fonctions pour générer les numéros de commande
// CREATE OR REPLACE FUNCTION generate_order_number()
// RETURNS TEXT AS $$
// DECLARE
//     new_number TEXT;
//     counter INTEGER;
// BEGIN
//     -- Format: OKB-YYYYMMDD-XXXX
//     SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 'OKB-[0-9]{8}-([0-9]+)') AS INTEGER)), 0) + 1
//     INTO counter
//     FROM orders
//     WHERE order_number LIKE 'OKB-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%';
    
//     new_number := 'OKB-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
    
//     RETURN new_number;
// END;
// $$ LANGUAGE plpgsql;

// -- Trigger pour générer automatiquement le numéro de commande
// CREATE OR REPLACE FUNCTION set_order_number()
// RETURNS TRIGGER AS $$
// BEGIN
//     IF NEW.order_number IS NULL THEN
//         NEW.order_number := generate_order_number();
//     END IF;
//     RETURN NEW;
// END;
// $$ LANGUAGE plpgsql;

// CREATE TRIGGER trigger_set_order_number
//     BEFORE INSERT ON orders
//     FOR EACH ROW
//     EXECUTE FUNCTION set_order_number();

// -- Trigger pour mettre à jour updated_at
// CREATE OR REPLACE FUNCTION update_updated_at_column()
// RETURNS TRIGGER AS $$
// BEGIN
//     NEW.updated_at = NOW();
//     RETURN NEW;
// END;
// $$ LANGUAGE plpgsql;

// CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
// CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
// CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
// CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
// CREATE TRIGGER update_trial_requests_updated_at BEFORE UPDATE ON trial_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

// -- RLS (Row Level Security)
// ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
// ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
// ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
// ALTER TABLE trial_requests ENABLE ROW LEVEL SECURITY;

// -- Politiques RLS pour profiles
// CREATE POLICY "Users can view own profile" ON profiles
//     FOR SELECT USING (auth.uid() = id);

// CREATE POLICY "Users can update own profile" ON profiles
//     FOR UPDATE USING (auth.uid() = id);

// CREATE POLICY "Admins can view all profiles" ON profiles
//     FOR ALL USING (
//         EXISTS (
//             SELECT 1 FROM profiles
//             WHERE id = auth.uid() AND role = 'admin'
//         )
//     );

// -- Politiques RLS pour orders
// CREATE POLICY "Users can view own orders" ON orders
//     FOR SELECT USING (auth.uid() = user_id);

// CREATE POLICY "Users can create own orders" ON orders
//     FOR INSERT WITH CHECK (auth.uid() = user_id);

// CREATE POLICY "Admins can view all orders" ON orders
//     FOR ALL USING (
//         EXISTS (
//             SELECT 1 FROM profiles
//             WHERE id = auth.uid() AND role = 'admin'
//         )
//     );

// -- Politiques RLS pour order_items
// CREATE POLICY "Users can view own order items" ON order_items
//     FOR SELECT USING (
//         EXISTS (
//             SELECT 1 FROM orders
//             WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
//         )
//     );

// CREATE POLICY "Admins can view all order items" ON order_items
//     FOR ALL USING (
//         EXISTS (
//             SELECT 1 FROM profiles
//             WHERE id = auth.uid() AND role = 'admin'
//         )
//     );

// -- Les tables platforms et services sont publiques en lecture
// ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
// ALTER TABLE services ENABLE ROW LEVEL SECURITY;

// CREATE POLICY "Anyone can view platforms" ON platforms FOR SELECT USING (true);
// CREATE POLICY "Anyone can view services" ON services FOR SELECT USING (true);

// -- Seuls les admins peuvent modifier platforms et services
// CREATE POLICY "Admins can modify platforms" ON platforms
//     FOR ALL USING (
//         EXISTS (
//             SELECT 1 FROM profiles
//             WHERE id = auth.uid() AND role = 'admin'
//         )
//     );

// CREATE POLICY "Admins can modify services" ON services
//     FOR ALL USING (
//         EXISTS (
//             SELECT 1 FROM profiles
//             WHERE id = auth.uid() AND role = 'admin'
//         )
//     );

// -- Données initiales
// INSERT INTO platforms (id, name, description, icon_url, color_from, color_to) VALUES
//     ('tiktok', 'TikTok', 'Boostez votre présence sur TikTok', '/tiktok.webp', 'from-pink-500', 'to-red-500'),
//     ('instagram', 'Instagram', 'Développez votre compte Instagram', '/instagram.webp', 'from-purple-500', 'to-pink-500'),
//     ('youtube', 'YouTube', 'Faites grandir votre chaîne YouTube', '/youtube.webp', 'from-red-500', 'to-red-600'),
//     ('facebook', 'Facebook', 'Faites grandir votre compte Facebook', '/facebook.webp', 'from-blue-500', 'to-blue-600');

// INSERT INTO services (id, platform_id, name, description, category, price_usd, price_cdf, min_quantity, max_quantity) VALUES
//     -- TikTok
//     ('tiktok-views-1', 'tiktok', 'Vues TikTok Instantané', 'Obtenez des vues TikTok de qualité instantanément', 'views', 0.01, 25, 100, 100000),
//     ('tiktok-followers-1', 'tiktok', 'Followers TikTok Premium', 'Followers TikTok de haute qualité', 'followers', 0.05, 125, 10, 10000),
//     ('tiktok-likes-1', 'tiktok', 'Likes TikTok Rapides', 'Likes TikTok instantanés et sécurisés', 'likes', 0.02, 50, 50, 50000),
    
//     -- Instagram
//     ('instagram-followers-1', 'instagram', 'Followers Instagram Premium', 'Followers Instagram de haute qualité', 'followers', 0.08, 200, 10, 10000),
//     ('instagram-likes-1', 'instagram', 'Likes Instagram Instantané', 'Likes Instagram rapides et sécurisés', 'likes', 0.015, 37.5, 50, 10000),
//     ('instagram-views-1', 'instagram', 'Vues Instagram Reels', 'Vues pour vos Reels Instagram', 'views', 0.008, 20, 100, 50000),
    
//     -- YouTube
//     ('youtube-views-1', 'youtube', 'Vues YouTube Premium', 'Vues YouTube de haute qualité', 'views', 0.03, 75, 100, 100000),
//     ('youtube-subscribers-1', 'youtube', 'Abonnés YouTube', 'Abonnés YouTube actifs', 'subscribers', 0.15, 375, 10, 5000),
//     ('youtube-likes-1', 'youtube', 'Likes YouTube', 'Likes pour vos vidéos YouTube', 'likes', 0.025, 62.5, 50, 10000),
    
//     -- Facebook
//     ('facebook-followers-1', 'facebook', 'Followers Facebook', 'Followers Facebook de haute qualité', 'followers', 0.06, 150, 10, 10000),
//     ('facebook-likes-1', 'facebook', 'Likes Facebook', 'Likes pour vos posts Facebook', 'likes', 0.02, 50, 50, 10000),
//     ('facebook-views-1', 'facebook', 'Vues Facebook', 'Vues pour vos vidéos Facebook', 'views', 0.012, 30, 100, 50000);