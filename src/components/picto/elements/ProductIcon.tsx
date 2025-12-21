interface ProductIconProps {
  size?: number
}

export function ProductIcon({ size = 50 }: ProductIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Green circle */}
      <circle cx="25" cy="25" r="20" fill="#4CAF50" />
    </svg>
  )
}
