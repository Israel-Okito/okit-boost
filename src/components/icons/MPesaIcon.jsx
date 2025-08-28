// M-Pesa Icon Component
export function MPesaIcon({ className = "w-6 h-6" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="24" height="24" rx="4" fill="#00B04F"/>
      <path 
        d="M6 8h12v8H6z" 
        fill="white"
      />
      <text 
        x="12" 
        y="13.5" 
        fontSize="5" 
        fontWeight="bold" 
        textAnchor="middle" 
        fill="#00B04F" 
        fontFamily="Arial, sans-serif"
      >
        M-PESA
      </text>
    </svg>
  )
}

// Orange Money Icon
export function OrangeMoneyIcon({ className = "w-6 h-6" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="24" height="24" rx="4" fill="#FF7900"/>
      <circle cx="12" cy="12" r="8" fill="white"/>
      <text 
        x="12" 
        y="14" 
        fontSize="4" 
        fontWeight="bold" 
        textAnchor="middle" 
        fill="#FF7900" 
        fontFamily="Arial, sans-serif"
      >
        Orange
      </text>
    </svg>
  )
}

// Airtel Money Icon
export function AirtelMoneyIcon({ className = "w-6 h-6" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="24" height="24" rx="4" fill="#ED1C24"/>
      <path 
        d="M4 12 L12 6 L20 12 L12 18 Z" 
        fill="white"
      />
      <text 
        x="12" 
        y="14" 
        fontSize="3" 
        fontWeight="bold" 
        textAnchor="middle" 
        fill="#ED1C24" 
        fontFamily="Arial, sans-serif"
      >
        Airtel
      </text>
    </svg>
  )
}
