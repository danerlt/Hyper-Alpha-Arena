import { useTranslation } from 'react-i18next'
import PixelCharacter from './PixelCharacter'
import TraderHUD from './TraderHUD'
import { WORKSTATION, FURNITURE_COLORS, SCREEN_REGION } from './pixelData/furniture'
import { getPreset } from './pixelData/palettes'
import type { CharacterState } from './pixelData/characters'

interface WorkstationProps {
  traderName: string
  equity: number | null
  unrealizedPnl: number | null
  positionCount: number
  avatarPresetId: number | null
  state: CharacterState
  onClick?: () => void
  pixelSize?: number
}

const STATE_GLOW: Record<CharacterState, string> = {
  offline: 'rgba(100,100,100,0.15)',
  error: 'rgba(239,68,68,0.2)',
  program_running: 'rgba(139,92,246,0.2)',
  just_traded: 'rgba(234,179,8,0.25)',
  ai_thinking: 'rgba(59,130,246,0.15)',
  holding_profit: 'rgba(34,197,94,0.2)',
  holding_loss: 'rgba(239,68,68,0.2)',
  idle: 'rgba(100,100,100,0.08)',
}

// Screen content base color by state
const SCREEN_GLOW: Record<CharacterState, string> = {
  offline: '#1a1a1a',
  error: '#3b1010',
  program_running: '#0d1530',
  just_traded: '#1a2a10',
  ai_thinking: '#0d1525',
  holding_profit: '#0a2010',
  holding_loss: '#2a0d0d',
  idle: '#0d1117',
}

export default function Workstation({
  traderName,
  equity,
  unrealizedPnl,
  positionCount,
  avatarPresetId,
  state,
  onClick,
  pixelSize = 3,
}: WorkstationProps) {
  const { t } = useTranslation()
  const preset = getPreset(avatarPresetId)

  const wsRows = WORKSTATION.length
  const wsCols = WORKSTATION[0]?.length || 0
  const svgWidth = wsCols * pixelSize
  const svgHeight = wsRows * pixelSize

  // Total component dimensions (workstation SVG + character overlay)
  const totalWidth = svgWidth
  const totalHeight = svgHeight + 12 // extra padding for HUD

  const glowColor = STATE_GLOW[state]
  const screenColor = SCREEN_GLOW[state]

  return (
    <div
      className="relative flex flex-col items-center cursor-pointer group transition-transform hover:scale-105"
      onClick={onClick}
      style={{ width: totalWidth }}
    >
      {/* HUD overlay above workstation */}
      <TraderHUD
        name={traderName}
        equity={equity}
        unrealizedPnl={unrealizedPnl}
        positionCount={positionCount}
        state={state}
      />

      {/* Ambient glow behind workstation */}
      <div
        className="absolute inset-0 rounded-lg blur-xl transition-colors -z-10"
        style={{ backgroundColor: glowColor }}
      />

      {/* Workstation SVG (furniture) */}
      <div className="relative">
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${wsCols} ${wsRows}`}
          xmlns="http://www.w3.org/2000/svg"
          style={{ imageRendering: 'pixelated' }}
        >
          {WORKSTATION.map((row, y) =>
            row.split('').map((char, x) => {
              let color = FURNITURE_COLORS[char]
              if (!color || color === 'transparent') return null
              // Override screen pixels with state-based glow
              if (char === 'G') color = screenColor
              return (
                <rect
                  key={`ws-${y}-${x}`}
                  x={x}
                  y={y}
                  width={1}
                  height={1}
                  fill={color}
                />
              )
            })
          )}
        </svg>

        {/* Character overlaid on the chair area */}
        <div
          className="absolute"
          style={{
            left: pixelSize * 1,
            top: pixelSize * 7,
          }}
        >
          <PixelCharacter
            preset={preset}
            state={state}
            pixelSize={pixelSize}
          />
        </div>

        {/* Screen content overlay (real DOM for sparkline/PnL — Phase 2) */}
        <div
          className="absolute flex items-center justify-center overflow-hidden"
          style={{
            left: SCREEN_REGION.x * pixelSize,
            top: SCREEN_REGION.y * pixelSize,
            width: SCREEN_REGION.width * pixelSize,
            height: SCREEN_REGION.height * pixelSize,
          }}
        >
          {/* Phase 2: sparkline + PnL number here */}
          {unrealizedPnl !== null && unrealizedPnl !== 0 && (
            <span
              className="text-[6px] font-mono font-bold leading-none"
              style={{
                color: unrealizedPnl > 0 ? '#22c55e' : '#ef4444',
              }}
            >
              {unrealizedPnl > 0 ? '+' : ''}
              {unrealizedPnl.toFixed(0)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
