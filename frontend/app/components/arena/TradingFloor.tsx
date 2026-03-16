import { useMemo } from 'react'
import Workstation from './Workstation'
import type { CharacterState } from './pixelData/characters'

export interface TraderData {
  accountId: number
  accountName: string
  avatarPresetId: number | null
  equity: number | null
  unrealizedPnl: number | null
  positionCount: number
  state: CharacterState
}

interface TradingFloorProps {
  traders: TraderData[]
  onTraderClick?: (accountId: number) => void
}

export default function TradingFloor({ traders, onTraderClick }: TradingFloorProps) {
  // Compute grid layout based on trader count
  const layout = useMemo(() => {
    const count = traders.length
    if (count <= 2) return { cols: count, rows: 1 }
    if (count <= 4) return { cols: 2, rows: Math.ceil(count / 2) }
    if (count <= 6) return { cols: 3, rows: Math.ceil(count / 3) }
    return { cols: 3, rows: Math.ceil(count / 3) }
  }, [traders.length])

  const needsScroll = traders.length > 6

  return (
    <div className="relative w-full h-full min-h-[280px] rounded-lg overflow-hidden">
      {/* Floor background with grid lines */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(135deg, #0a0a1a 0%, #0d1117 50%, #0a0a1a 100%)
          `,
        }}
      />
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(100,200,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(100,200,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      {/* Subtle glow at bottom center */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[40%] opacity-[0.04] rounded-full blur-3xl"
        style={{ background: 'radial-gradient(ellipse, #6366f1, transparent)' }}
      />

      {/* Workstation grid */}
      <div
        className={`relative z-10 flex items-center justify-center h-full p-4 ${
          needsScroll ? 'overflow-x-auto' : ''
        }`}
      >
        <div
          className="grid gap-6"
          style={{
            gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))`,
          }}
        >
          {traders.map((trader) => (
            <Workstation
              key={trader.accountId}
              traderName={trader.accountName}
              equity={trader.equity}
              unrealizedPnl={trader.unrealizedPnl}
              positionCount={trader.positionCount}
              avatarPresetId={trader.avatarPresetId}
              state={trader.state}
              onClick={() => onTraderClick?.(trader.accountId)}
              pixelSize={3}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
