import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import TradingFloor, { type TraderData } from './TradingFloor'
import type { CharacterState } from './pixelData/characters'
import TraderDetailModal from '@/components/portfolio/TraderDetailModal'
import type { Position } from '@/components/portfolio/HyperliquidMultiAccountSummary'
import type { HyperliquidEnvironment } from '@/lib/types/hyperliquid'

interface AccountData {
  account_id: number
  account_name: string
  exchange?: string
  avatar_preset_id?: number | null
  auto_trading_enabled?: boolean
}

interface AccountBalance {
  accountId: number
  accountName: string
  exchange: string
  balance: {
    totalEquity: number
    marginUsagePercent: number
  } | null
  error: string | null
}

interface ArenaViewProps {
  accounts: AccountData[]
  positions: Position[]
  accountBalances: AccountBalance[]
  environment: HyperliquidEnvironment
  onTraderClick?: (accountId: number) => void
}

function deriveState(
  account: AccountData,
  accountPositions: Position[],
  balance: AccountBalance | undefined,
): CharacterState {
  // Priority 1: Offline
  if (account.auto_trading_enabled === false) return 'offline'

  // Priority 2: Error
  if (balance?.error) return 'error'

  // Priority 6/7: Holding with PnL
  const totalPnl = accountPositions.reduce((sum, p) => sum + p.unrealized_pnl, 0)
  if (accountPositions.length > 0) {
    return totalPnl >= 0 ? 'holding_profit' : 'holding_loss'
  }

  // Priority 8: Idle (no positions)
  return 'idle'
}

export default function ArenaView({
  accounts,
  positions,
  accountBalances,
  environment,
  onTraderClick,
}: ArenaViewProps) {
  const { t } = useTranslation()
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const traders: TraderData[] = useMemo(() => {
    return accounts.map((acc) => {
      const accPositions = positions.filter(
        (p) => p.account_id === acc.account_id
      )
      const balance = accountBalances.find(
        (b) => b.accountId === acc.account_id
      )
      const totalPnl = accPositions.reduce((sum, p) => sum + p.unrealized_pnl, 0)
      const state = deriveState(acc, accPositions, balance)

      return {
        accountId: acc.account_id,
        accountName: acc.account_name,
        avatarPresetId: acc.avatar_preset_id ?? null,
        equity: balance?.balance?.totalEquity ?? null,
        unrealizedPnl: totalPnl || null,
        positionCount: accPositions.length,
        state,
      }
    })
  }, [accounts, positions, accountBalances])

  const handleTraderClick = (accountId: number) => {
    setSelectedAccountId(accountId)
    setIsModalOpen(true)
    onTraderClick?.(accountId)
  }

  const selectedBalance = accountBalances.find(
    (b) => b.accountId === selectedAccountId
  )
  const selectedPositions = positions.filter(
    (p) => p.account_id === selectedAccountId
  )

  if (accounts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[280px] rounded-lg bg-card border border-border">
        <div className="text-sm text-muted-foreground">
          {t('dashboard.noAccountConfigured', 'No account configured')}
        </div>
      </div>
    )
  }

  return (
    <>
      <TradingFloor
        traders={traders}
        onTraderClick={handleTraderClick}
      />

      {/* Reuse existing TraderDetailModal */}
      {selectedBalance && (
        <TraderDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          account={selectedBalance as any}
          positions={selectedPositions}
          environment={environment}
        />
      )}
    </>
  )
}
