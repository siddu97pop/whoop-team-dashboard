'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SLEEP_STAGE_COLORS, msToHoursMinutes, formatPercent } from '@/lib/utils'
import { Moon } from 'lucide-react'

interface SleepBreakdownProps {
  totalInBedMs: number | null
  deepMs: number | null
  remMs: number | null
  lightMs: number | null
  awakeMs: number | null
  efficiency: number | null
  performance: number | null
  consistency: number | null
  scoreState: 'SCORED' | 'PENDING_SCORE' | 'UNSCORABLE'
  loading?: boolean
}

const STAGES = [
  { key: 'deep',  label: 'Deep',  color: SLEEP_STAGE_COLORS.deep },
  { key: 'rem',   label: 'REM',   color: SLEEP_STAGE_COLORS.rem },
  { key: 'light', label: 'Light', color: SLEEP_STAGE_COLORS.light },
  { key: 'awake', label: 'Awake', color: SLEEP_STAGE_COLORS.awake },
] as const

export function SleepBreakdown({
  totalInBedMs,
  deepMs,
  remMs,
  lightMs,
  awakeMs,
  efficiency,
  performance,
  consistency,
  scoreState,
  loading = false,
}: SleepBreakdownProps) {
  if (loading) return <SleepBreakdownSkeleton />

  const total = totalInBedMs ?? 1
  const stages = [
    { key: 'deep',  label: 'Deep',  ms: deepMs  ?? 0, color: SLEEP_STAGE_COLORS.deep },
    { key: 'rem',   label: 'REM',   ms: remMs   ?? 0, color: SLEEP_STAGE_COLORS.rem },
    { key: 'light', label: 'Light', ms: lightMs ?? 0, color: SLEEP_STAGE_COLORS.light },
    { key: 'awake', label: 'Awake', ms: awakeMs ?? 0, color: SLEEP_STAGE_COLORS.awake },
  ]

  const isEmpty = !totalInBedMs || scoreState !== 'SCORED'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Moon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          Last Night's Sleep
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <EmptyState state={scoreState} />
        ) : (
          <>
            {/* Total time */}
            <div className="mb-4">
              <span className="text-3xl font-bold text-foreground tabular-nums">
                {msToHoursMinutes(totalInBedMs)}
              </span>
              <span className="ml-2 text-sm text-muted-foreground">in bed</span>
            </div>

            {/* Stage bar */}
            <div
              className="flex h-5 w-full overflow-hidden rounded-full mb-4"
              role="img"
              aria-label="Sleep stage breakdown"
            >
              {stages.map(({ key, ms, color }) => {
                const pct = (ms / total) * 100
                if (pct < 0.5) return null
                return (
                  <div
                    key={key}
                    className="h-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                )
              })}
            </div>

            {/* Stage legend */}
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-5">
              {stages.map(({ key, label, ms, color }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                  <span className="text-xs font-medium tabular-nums text-foreground">
                    {msToHoursMinutes(ms)}
                  </span>
                </div>
              ))}
            </div>

            {/* Score row */}
            <div className="grid grid-cols-3 gap-2 border-t border-border pt-4">
              <ScorePill label="Efficiency"   value={formatPercent(efficiency)}   rawValue={efficiency} />
              <ScorePill label="Performance"  value={formatPercent(performance)}  rawValue={performance} />
              <ScorePill label="Consistency"  value={formatPercent(consistency)}  rawValue={consistency} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function scoreColor(v: number | null | undefined): string {
  if (v == null) return 'text-foreground'
  if (v >= 80) return 'text-green-500 dark:text-green-400'
  if (v >= 60) return 'text-yellow-500 dark:text-yellow-400'
  return 'text-red-500 dark:text-red-400'
}

function ScorePill({ label, value, rawValue }: { label: string; value: string; rawValue?: number | null }) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-muted py-2 px-1">
      <span className="text-[10px] text-muted-foreground mb-0.5">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${scoreColor(rawValue)}`}>{value}</span>
    </div>
  )
}

function EmptyState({ state }: { state: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Moon className="h-8 w-8 text-muted-foreground/50 mb-3" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">
        {state === 'PENDING_SCORE' ? 'Processing sleep data…' : 'No sleep data available'}
      </p>
    </div>
  )
}

function SleepBreakdownSkeleton() {
  return (
    <Card>
      <CardHeader><Skeleton className="h-4 w-40" /></CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-4 w-full rounded-full" />
        <div className="grid grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-5" />)}
        </div>
        <div className="grid grid-cols-3 gap-2 pt-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      </CardContent>
    </Card>
  )
}
