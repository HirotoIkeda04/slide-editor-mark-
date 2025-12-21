interface PersonIconProps {
  size?: number
}

export function PersonIcon({ size = 50 }: PersonIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Head */}
      <circle cx="25" cy="14" r="10" stroke="#333" strokeWidth="2" fill="none" />
      {/* Body */}
      <rect x="15" y="26" width="20" height="22" stroke="#333" strokeWidth="2" fill="none" rx="2" />
    </svg>
  )
}
