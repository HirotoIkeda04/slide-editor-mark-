import { useId } from 'react'

interface EulerIconProps {
  size?: number
  className?: string
  color?: string
}

export function EulerIcon({ size = 24, className, color }: EulerIconProps) {
  const id = useId()
  const strokeColor = color || 'currentColor'
  const fillColor = color || 'currentColor'
  
  // 円の中心と半径（正三角形配置で均等に重なる）
  const d = 4
  const centerY = 11.5
  const r = 5
  const circleA = { cx: 12 - d * Math.sin(Math.PI / 3), cy: centerY + d * 0.5, r }  // 左下
  const circleB = { cx: 12 + d * Math.sin(Math.PI / 3), cy: centerY + d * 0.5, r }  // 右下
  const circleC = { cx: 12, cy: centerY - d, r }  // 上

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={{ display: 'block' }}
    >
      <defs>
        {/* マスク: Aのみ（B, Cの外側） */}
        <mask id={`${id}-maskA`}>
          <circle cx={circleA.cx} cy={circleA.cy} r={circleA.r} fill="white" />
          <circle cx={circleB.cx} cy={circleB.cy} r={circleB.r} fill="black" />
          <circle cx={circleC.cx} cy={circleC.cy} r={circleC.r} fill="black" />
        </mask>

        {/* マスク: Bのみ（A, Cの外側） */}
        <mask id={`${id}-maskB`}>
          <circle cx={circleB.cx} cy={circleB.cy} r={circleB.r} fill="white" />
          <circle cx={circleA.cx} cy={circleA.cy} r={circleA.r} fill="black" />
          <circle cx={circleC.cx} cy={circleC.cy} r={circleC.r} fill="black" />
        </mask>

        {/* マスク: Cのみ（A, Bの外側） */}
        <mask id={`${id}-maskC`}>
          <circle cx={circleC.cx} cy={circleC.cy} r={circleC.r} fill="white" />
          <circle cx={circleA.cx} cy={circleA.cy} r={circleA.r} fill="black" />
          <circle cx={circleB.cx} cy={circleB.cy} r={circleB.r} fill="black" />
        </mask>

        {/* ストローク用マスク：他の円の内側のストロークを完全に隠す */}
        <mask id={`${id}-strokeMaskA`}>
          <rect width="24" height="24" fill="white" />
          <circle cx={circleB.cx} cy={circleB.cy} r={circleB.r} fill="black" />
          <circle cx={circleC.cx} cy={circleC.cy} r={circleC.r} fill="black" />
        </mask>
        <mask id={`${id}-strokeMaskB`}>
          <rect width="24" height="24" fill="white" />
          <circle cx={circleA.cx} cy={circleA.cy} r={circleA.r} fill="black" />
          <circle cx={circleC.cx} cy={circleC.cy} r={circleC.r} fill="black" />
        </mask>
        <mask id={`${id}-strokeMaskC`}>
          <rect width="24" height="24" fill="white" />
          <circle cx={circleA.cx} cy={circleA.cy} r={circleA.r} fill="black" />
          <circle cx={circleB.cx} cy={circleB.cy} r={circleB.r} fill="black" />
        </mask>
      </defs>

      {/* Aのみの部分（塗りつぶし） */}
      <rect width="24" height="24" fill={fillColor} mask={`url(#${id}-maskA)`} />

      {/* Bのみの部分（塗りつぶし） */}
      <rect width="24" height="24" fill={fillColor} mask={`url(#${id}-maskB)`} />

      {/* Cのみの部分（塗りつぶし） */}
      <rect width="24" height="24" fill={fillColor} mask={`url(#${id}-maskC)`} />

      {/* アウトライン（ストローク）- 重なり部分は隠す */}
      <circle 
        cx={circleA.cx} cy={circleA.cy} r={circleA.r} 
        fill="none" 
        stroke={strokeColor} 
        strokeWidth="1.5"
        mask={`url(#${id}-strokeMaskA)`}
      />
      <circle 
        cx={circleB.cx} cy={circleB.cy} r={circleB.r} 
        fill="none" 
        stroke={strokeColor} 
        strokeWidth="1.5"
        mask={`url(#${id}-strokeMaskB)`}
      />
      <circle 
        cx={circleC.cx} cy={circleC.cy} r={circleC.r} 
        fill="none" 
        stroke={strokeColor} 
        strokeWidth="1.5"
        mask={`url(#${id}-strokeMaskC)`}
      />
    </svg>
  )
}
