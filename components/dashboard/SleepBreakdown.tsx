'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SLEEP_STAGE_COLORS, msToHoursMinutes, formatPercent } from '@/lib/utils'
import { Moon, Wind, Zap, RefreshCw } from 'lucide-react'

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
  // New insight props
  respiratoryRate: number | null
  disturbanceCount: number | null
  sleepCycleCount: number | null
  baselineMs: number | null
  needFromSleepDebtMs: number | null
  needFromRecentStrainMs: number | null
  loading?: boolean
}

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
  respiratoryRate,
  disturbanceCount,
  sleepCycleCount,
  baselineMs,
  needFromSleepDebtMs,
  needFromRecentStrainMs,
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

  // Sleep Need calculation
  const totalNeedMs = (baselineMs ?? 0) + (needFromSleepDebtMs ?? 0) + (needFromRecentStrainMs ?? 0)
  const hasNeedData = totalNeedMs > 0 && totalInBedMs != null
  const needFillPct = hasNeedData ? Math.min((totalInBedMs! / totalNeedMs) * 100, 100) : 0
  const needDeltaMs = hasNeedData ? totalInBedMs! - totalNeedMs : null
  const needColor =
    needDeltaMs == null ? '#94a3b8'
    : needDeltaMs >= 0 ? '#22c55e'
    : needDeltaMs >= -1_800_000 ? '#f59e0b'   // within 30 min
    : '#ef4444'

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

            {/* Sleep Need vs Actual */}
            {hasNeedData && (
              <div className="mb-5 rounded-lg bg-muted p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-foreground">Sleep Need</span>
                  <span
                    className="text-xs font-semibold tabular-nums"
                    style={{ color: needColor }}
                  >
                    {needDeltaMs != null && needDeltaMs >= 0
                      ? `+${msToHoursMinutes(needDeltaMs)} surplus`
                      : needDeltaMs != null
                      ? `${msToHoursMinutes(Math.abs(needDeltaMs))} deficit`
                      : '—'}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-2 w-full rounded-full bg-border overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${needFillPct}%`, backgroundColor: needColor }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
                  <span>Got {msToHoursMinutes(totalInBedMs)}</span>
                  <span>Needed {msToHoursMinutes(totalNeedMs)}</span>
                </div>
              </div>
            )}

            {/* Score row */}
            <div className="grid grid-cols-3 gap-2 border-t border-border pt-4 mb-4">
              <ScorePill label="Efficiency"   value={formatPercent(efficiency)}   rawValue={efficiency} />
              <ScorePill label="Performance"  value={formatPercent(performance)}  rawValue={performance} />
              <ScorePill label="Consistency"  value={formatPercent(consistency)}  rawValue={consistency} />
            </div>

            {/* Mini stats — respiratory rate, disturbances, cycles */}
            <div className="grid grid-cols-3 gap-2">
              <MiniStat
                icon={Wind}
                label="Resp. Rate"
                value={respiratoryRate != null ? `${respiratoryRate.toFixed(1)} rpm` : '—'}
              />
              <MiniStat
                icon={Zap}
                label="Disturbances"
                value={disturbanceCount != null ? String(disturbanceCount) : '—'}
              />
              <MiniStat
                icon={RefreshCw}
                label="Cycles"
                value={sleepCycleCount != null ? String(sleepCycleCount) : '—'}
              />
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

function MiniStat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-muted py-2 px-1">
      <Icon className="h-3 w-3 text-muted-foreground mb-1" aria-hidden="true" />
      <span className="text-[10px] text-muted-foreground mb-0.5">{label}</span>
      <span className="text-xs font-semibold tabular-nums text-foreground">{value}</span>
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
        <Skeleton className="h-5 w-full rounded-full" />
        <div className="grid grid-cols-2 gap-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-5" />)}
        </div>
        <Skeleton className="h-16 w-full rounded-lg" />
        <div className="grid grid-cols-3 gap-2 pt-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
      </CardContent>
    </Card>
  )
}
