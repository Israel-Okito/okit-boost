import Image from "next/image"


export const mockServices = [
    // TikTok Services
    {
      id: "tiktok-views-1",
      name: "Vues TikTok Instantané",
      platform: "tiktok",
      description: "Obtenez des vues TikTok de qualité instantanément",
      price_usd: 0.01,
      price_cdf: 25,
      min_quantity: 100,
      max_quantity: 100000,
      category: "views",
    },
    {
      id: "tiktok-followers-1",
      name: "Followers TikTok Premium",
      platform: "tiktok",
      description: "Followers TikTok de haute qualité",
      price_usd: 0.05,
      price_cdf: 125,
      min_quantity: 10,
      max_quantity: 10000,
      category: "followers",
    },
    {
      id: "tiktok-likes-1",
      name: "Likes TikTok Rapides",
      platform: "tiktok",
      description: "Likes TikTok instantanés et sécurisés",
      price_usd: 0.02,
      price_cdf: 50,
      min_quantity: 50,
      max_quantity: 50000,
      category: "likes",
    },
  
    // Instagram Services
    {
      id: "instagram-followers-1",
      name: "Followers Instagram Premium",
      platform: "instagram",
      description: "Followers Instagram de haute qualité",
      price_usd: 0.08,
      price_cdf: 200,
      min_quantity: 10,
      max_quantity: 10000,
      category: "followers",
    },
    {
      id: "instagram-likes-1",
      name: "Likes Instagram Instantané",
      platform: "instagram",
      description: "Likes Instagram rapides et sécurisés",
      price_usd: 0.015,
      price_cdf: 37.5,
      min_quantity: 50,
      max_quantity: 10000,
      category: "likes",
    },
    {
      id: "instagram-views-1",
      name: "Vues Instagram Reels",
      platform: "instagram",
      description: "Vues pour vos Reels Instagram",
      price_usd: 0.008,
      price_cdf: 20,
      min_quantity: 100,
      max_quantity: 50000,
      category: "views",
    },
  
    // YouTube Services
    {
      id: "youtube-views-1",
      name: "Vues YouTube Premium",
      platform: "youtube",
      description: "Vues YouTube de haute qualité",
      price_usd: 0.03,
      price_cdf: 75,
      min_quantity: 100,
      max_quantity: 100000,
      category: "views",
    },
    {
      id: "youtube-subscribers-1",
      name: "Abonnés YouTube",
      platform: "youtube",
      description: "Abonnés YouTube actifs",
      price_usd: 0.15,
      price_cdf: 375,
      min_quantity: 10,
      max_quantity: 5000,
      category: "subscribers",
    },
    {
      id: "youtube-likes-1",
      name: "Likes YouTube",
      platform: "youtube",
      description: "Likes pour vos vidéos YouTube",
      price_usd: 0.025,
      price_cdf: 62.5,
      min_quantity: 50,
      max_quantity: 10000,
      category: "likes",
    },
    // Facebook Services
    {
      id: "facebook-followers-1",
      name: "Followers Facebook",
      platform: "facebook",
      description: "Followers Facebook de haute qualité",
    },
    {
      id: "facebook-likes-1",
      name: "Likes Facebook",
      platform: "facebook",
      description: "Likes pour vos posts Facebook",
    },
    { 
      id: "facebook-views-1",
      name: "Vues Facebook",
      platform: "facebook",
      description: "Vues pour vos posts Facebook",
    },
    {
      id: "facebook-subscribers-1",
      name: "Abonnés Facebook",
      platform: "facebook",
      description: "Abonnés Facebook actifs",
    },
    
  ]
  
  export const platforms = [
    {
      id: "tiktok",
      name: "TikTok",
      icon: <Image src="/tiktok.webp" alt="TikTok" width={80} height={80} />,
      color: "from-pink-500 to-red-500",
      description: "Boostez votre présence sur TikTok",
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: <Image src="/instagram.webp" alt="Instagram" width={80} height={80} />,
      color: "from-purple-500 to-pink-500",
      description: "Développez votre compte Instagram",
    },
    // {
    //   id: "youtube",
    //   name: "YouTube",
    //   icon: <Image src="/youtube.webp" alt="YouTube" width={80} height={80} />,
    //   color: "from-red-500 to-red-600",
    //   description: "Faites grandir votre chaîne YouTube",
    // },
    {
      id: "facebook",
      name: "Facebook",
      icon: <Image src="/facebook.webp" alt="Facebook" width={80} height={80} />,
      color: "from-blue-500 to-blue-600",
      description: "Faites grandir votre compte Facebook",
    },
  ]
  