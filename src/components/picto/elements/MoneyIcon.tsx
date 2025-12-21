interface MoneyIconProps {
  size?: number
}

export function MoneyIcon({ size = 50 }: MoneyIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Yellow background */}
      <rect x="5" y="5" width="40" height="40" fill="#FFC107" rx="4" />
      {/* Yen symbol */}
      <text
        x="25"
        y="35"
        textAnchor="middle"
        fontSize="28"
        fontWeight="bold"
        fill="#333"
        fontFamily="sans-serif"
      >
        ¥
      </text>
    </svg>
  )
}
