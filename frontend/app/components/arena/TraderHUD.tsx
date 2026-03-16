import { useTranslation } from 'react-i18next'
import type { CharacterState } from './pixelData/characters'

interface TraderHUDProps {
  name: string
  equity: number | null
  unrealizedPnl: number | null
  positionCount: number
  state: CharacterState
}

const STATE_LABELS: Record<CharacterState, { key: string; fallback: string; color: string }> = {
  offline: { key: 'arena.status.offline', fallback: 'Offline', color: 'bg-gray-500' },
  error: { key: 'arena.status.error', fallback: 'Error', color: 'bg-red-500' },
  program_running: { key: 'arena.status.program', fallback: 'Program', color: 'bg-violet-500' },
  just_traded: { key: 'arena.status.traded', fallback: 'Traded', color: 'bg-yellow-500' },
  ai_thinking: { key: 'arena.status.thinking', fallback: 'Thinking', color: 'bg-blue-500' },
  holding_profit: { key: 'arena.status.profit', fallback: 'Profit', color: 'bg-green-500' },
  holding_loss: { key: 'arena.status.loss', fallback: 'Loss', color: 'bg-red-500' },
  idle: { key: 'arena.status.idle', fallback: 'Idle', color: 'bg-gray-400' },
}

export default function TraderHUD({
  name,
  equity,
  unrealizedPnl,
  positionCount,
  state,
}: TraderHUDProps) {
  const { t } = useTranslation()
  const stateLabel = STATE_LABELS[state]

  return (
    <div className="mb-1 px-2 py-1 rounded-md bg-card/80 backdrop-blur-sm border border-border/50 text-center min-w-[80px] group-hover:bg-card group-hover:border-border transition-colors">
      {/* Trader name */}
      <div className="text-[10px] font-semibold text-foreground truncate max-w-[100px]">
        {name}
      </div>

      {/* Equity */}
      {equity !== null && (
        <div className="text-[9px] text-muted-foreground font-mono">
          ${equity.toLocaleString('en-US', { maximumFractionDigits: 0 })}
        </div>
      )}

      {/* Status badge */}
      <div className="flex items-center justify-center gap-1 mt-0.5">
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${stateLabel.color}`} />
        <span className="text-[8px] text-muted-foreground">
          {t(stateLabel.key, stateLabel.fallback)}
        </span>
      </div>

      {/* Hover detail: PnL + position count */}
      <div className="hidden group-hover:block mt-1 pt-1 border-t border-border/30 text-[8px]">
        {unrealizedPnl !== null && unrealizedPnl !== 0 && (
          <div className={unrealizedPnl > 0 ? 'text-green-500' : 'text-red-500'}>
            PnL: {unrealizedPnl > 0 ? '+' : ''}${unrealizedPnl.toFixed(2)}
          </div>
        )}
        <div className="text-muted-foreground">
          {positionCount > 0
            ? `${positionCount} ${t('arena.hud.positions', 'pos')}`
            : t('arena.hud.noPositions', 'No positions')}
        </div>
      </div>
    </div>
  )
}
