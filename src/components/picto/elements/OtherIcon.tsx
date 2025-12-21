interface OtherIconProps {
  size?: number
}

export function OtherIcon({ size = 50 }: OtherIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Simple square */}
      <rect x="5" y="5" width="40" height="40" stroke="#999" strokeWidth="2" fill="none" rx="2" />
    </svg>
  )
}
