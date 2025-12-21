interface SmartphoneIconProps {
  size?: number
}

export function SmartphoneIcon({ size = 50 }: SmartphoneIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Phone outline */}
      <rect x="13" y="3" width="24" height="44" stroke="#333" strokeWidth="2" fill="none" rx="4" />
      {/* Screen */}
      <rect x="16" y="10" width="18" height="26" stroke="#333" strokeWidth="1" fill="none" />
      {/* Home button */}
      <circle cx="25" cy="42" r="3" stroke="#333" strokeWidth="1.5" fill="none" />
    </svg>
  )
}
