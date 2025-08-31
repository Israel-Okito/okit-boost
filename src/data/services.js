import Image from "next/image"


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
  