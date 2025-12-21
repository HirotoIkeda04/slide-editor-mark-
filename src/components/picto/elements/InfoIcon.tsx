interface InfoIconProps {
  size?: number
}

export function InfoIcon({ size = 50 }: InfoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Blue rectangle with waves (data icon) */}
      <rect x="5" y="5" width="40" height="40" stroke="#2196F3" strokeWidth="2" fill="none" rx="2" />
      {/* Wave lines representing data */}
      <path
        d="M10 20 Q17.5 15, 25 20 T40 20"
        stroke="#2196F3"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M10 30 Q17.5 25, 25 30 T40 30"
        stroke="#2196F3"
        strokeWidth="2"
        fill="none"
      />
      {/* Label */}
      <text
        x="25"
        y="42"
        textAnchor="middle"
        fontSize="8"
        fill="#2196F3"
        fontFamily="sans-serif"
      >
        データ
      </text>
    </svg>
  )
}
