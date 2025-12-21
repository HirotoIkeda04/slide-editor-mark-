interface CompanyIconProps {
  size?: number
}

export function CompanyIcon({ size = 50 }: CompanyIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Building outline */}
      <rect x="8" y="6" width="34" height="42" stroke="#333" strokeWidth="2" fill="none" />
      {/* Windows row 1 */}
      <rect x="14" y="12" width="6" height="6" stroke="#333" strokeWidth="1.5" fill="none" />
      <rect x="30" y="12" width="6" height="6" stroke="#333" strokeWidth="1.5" fill="none" />
      {/* Windows row 2 */}
      <rect x="14" y="24" width="6" height="6" stroke="#333" strokeWidth="1.5" fill="none" />
      <rect x="30" y="24" width="6" height="6" stroke="#333" strokeWidth="1.5" fill="none" />
      {/* Door */}
      <rect x="20" y="36" width="10" height="12" stroke="#333" strokeWidth="1.5" fill="none" />
    </svg>
  )
}
