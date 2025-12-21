interface StoreIconProps {
  size?: number
}

export function StoreIcon({ size = 50 }: StoreIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Roof (awning) */}
      <path
        d="M5 18 L25 6 L45 18 L5 18"
        stroke="#333"
        strokeWidth="2"
        fill="none"
      />
      {/* Building */}
      <rect x="8" y="18" width="34" height="28" stroke="#333" strokeWidth="2" fill="none" />
      {/* Door */}
      <rect x="20" y="30" width="10" height="16" stroke="#333" strokeWidth="1.5" fill="none" />
      {/* Windows */}
      <rect x="12" y="24" width="6" height="6" stroke="#333" strokeWidth="1.5" fill="none" />
      <rect x="32" y="24" width="6" height="6" stroke="#333" strokeWidth="1.5" fill="none" />
    </svg>
  )
}
