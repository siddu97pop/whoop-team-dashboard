'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, msToHoursMinutes, durationMs, formatKilojoules } from '@/lib/utils'
import { Dumbbell } from 'lucide-react'

interface Workout {
  id: string
  sport_name: string | null
  start_time: string
  end_time: string
  strain: number | null
  avg_heart_rate: number | null
  max_heart_rate: number | null
  kilojoule: number | null
  zone_0_milli: number | null
  zone_1_milli: number | null
  zone_2_milli: number | null
  zone_3_milli: number | null
  zone_4_milli: number | null
  zone_5_milli: number | null
  score_state: 'SCORED' | 'PENDING_SCORE' | 'UNSCORABLE'
}

interface WorkoutListProps {
  workouts: Workout[]
  limit?: number
  loading?: boolean
}

const STRAIN_COLOR = (s: number) => {
  if (s >= 14) return '#dc2626'
  if (s >= 10) return '#ca8a04'
  return '#0F6E56'
}

// HR zone colors: Z0 (below aerobic) → Z5 (max effort)
const ZONE_COLORS = ['#cbd5e1', '#38bdf8', '#4ade80', '#facc15', '#fb923c', '#ef4444']
const ZONE_LABELS = ['Z0', 'Z1', 'Z2', 'Z3', 'Z4', 'Z5']

export function WorkoutList({ workouts, limit = 5, loading = false }: WorkoutListProps) {
  if (loading) return <WorkoutListSkeleton />

  const visible = workouts.slice(0, limit)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          Recent Workouts
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Dumbbell className="h-8 w-8 text-muted-foreground/50 mb-3" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">No workouts recorded yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-border" role="list">
            {visible.map((w) => {
              const duration = durationMs(w.start_time, w.end_time)
              const color = w.strain != null ? STRAIN_COLOR(w.strain) : undefined

              // Build zone segments
              const zoneMills = [
                w.zone_0_milli ?? 0,
                w.zone_1_milli ?? 0,
                w.zone_2_milli ?? 0,
                w.zone_3_milli ?? 0,
                w.zone_4_milli ?? 0,
                w.zone_5_milli ?? 0,
              ]
              const totalZoneMs = zoneMills.reduce((a, b) => a + b, 0)
              const hasZones = w.score_state === 'SCORED' && totalZoneMs > 0

              return (
                <li key={w.id} className="py-3 first:pt-0">
                  {/* Top row: icon + name + strain */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: `${color}18` }}
                        aria-hidden="true"
                      >
                        <Dumbbell className="h-3.5 w-3.5" style={{ color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {w.sport_name ?? 'Activity'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(w.start_time)} · {msToHoursMinutes(duration)}
                          {w.avg_heart_rate && ` · ${w.avg_heart_rate}`}
                          {w.max_heart_rate && ` → ${w.max_heart_rate} bpm`}
                          {w.kilojoule != null && ` · ${formatKilojoules(w.kilojoule)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-3 text-right">
                      {w.score_state === 'SCORED' && w.strain != null ? (
                        <span
                          className="text-sm font-semibold tabular-nums"
                          style={{ color }}
                          aria-label={`Strain: ${w.strain.toFixed(1)}`}
                        >
                          {w.strain.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {w.score_state === 'PENDING_SCORE' ? '…' : 'N/A'}
                        </span>
                      )}
                      <p className="text-[10px] text-muted-foreground">strain</p>
                    </div>
                  </div>

                  {/* HR Zone bar */}
                  {hasZones && (
                    <div className="mt-2 pl-11">
                      <div
                        className="flex h-2 w-full overflow-hidden rounded-full"
                        role="img"
                        aria-label="Heart rate zone breakdown"
                      >
                        {zoneMills.map((ms, i) => {
                          const pct = (ms / totalZoneMs) * 100
                          if (pct < 1) return null
                          return (
                            <div
                              key={i}
                              className="h-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: ZONE_COLORS[i] }}
                              title={`${ZONE_LABELS[i]}: ${msToHoursMinutes(ms)}`}
                            />
                          )
                        })}
                      </div>
                      {/* Zone legend — only show zones that exist */}
                      <div className="flex gap-3 mt-1.5 flex-wrap">
                        {zoneMills.map((ms, i) => {
                          if (ms < 60_000) return null // skip zones under 1 min
                          return (
                            <span key={i} className="flex items-center gap-1 text-[10px] text-muted-foreground tabular-nums">
                              <span
                                className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: ZONE_COLORS[i] }}
                                aria-hidden="true"
                              />
                              {ZONE_LABELS[i]} {msToHoursMinutes(ms)}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function WorkoutListSkeleton() {
  return (
    <Card>
      <CardHeader><Skeleton className="h-4 w-36" /></CardHeader>
      <CardContent className="space-y-4 pt-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-5 w-8 flex-shrink-0" />
            </div>
            <Skeleton className="h-2 w-full rounded-full ml-11" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
