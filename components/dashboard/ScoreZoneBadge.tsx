'use client'

import { cn, getRecoveryZone, RECOVERY_COLORS, type RecoveryZone } from '@/lib/utils'
import { ScoreState } from '@/lib/whoop/types'

interface ScoreZoneBadgeProps {
  score: number | null | undefined
  scoreState?: ScoreState
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const SIZE_DOT: Record<string, string> = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
}

const SIZE_TEXT: Record<string, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
}

const ZONE_LABEL: Record<RecoveryZone, string> = {
  green: 'Recovered',
  yellow: 'Moderate',
  red: 'At Risk',
}

export function ScoreZoneBadge({
  score,
  scoreState = 'SCORED',
  size = 'md',
  showLabel = false,
  className,
}: ScoreZoneBadgeProps) {
  if (scoreState === 'PENDING_SCORE') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 font-medium text-muted-foreground',
          SIZE_TEXT[size],
          className
        )}
      >
        <span className={cn('rounded-full bg-muted animate-pulse', SIZE_DOT[size])} />
        Processing…
      </span>
    )
  }

  if (scoreState === 'UNSCORABLE' || score == null) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 font-medium text-muted-foreground',
          SIZE_TEXT[size],
          className
        )}
        title="Score unavailable"
      >
        <span className={cn('rounded-full bg-muted', SIZE_DOT[size])} />
        N/A
      </span>
    )
  }

  const zone = getRecoveryZone(score)
  const color = RECOVERY_COLORS[zone]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold tabular-nums',
        SIZE_TEXT[size],
        className
      )}
      style={{ color }}
    >
      <span
        className={cn('rounded-full flex-shrink-0', SIZE_DOT[size])}
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      {score}%
      {showLabel && (
        <span className="font-normal text-muted-foreground ml-0.5">
          · {ZONE_LABEL[zone]}
        </span>
      )}
    </span>
  )
}
