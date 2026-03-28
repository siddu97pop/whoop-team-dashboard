'use client'

import { AnimatedNumber } from '@/components/dashboard/AnimatedNumber'
import { Card, CardContent } from '@/components/ui/card'

interface HRVStatsProps {
  latest: number | null
  avg7d: number | null
  baseline: number | null
  dataPoints: number
}

export function HRVStats({ latest, avg7d, baseline, dataPoints }: HRVStatsProps) {
  const vsBaseline =
    latest != null && baseline != null ? Math.round(latest - baseline) : null

  const stats = [
    {
      label: 'Latest HRV',
      value: latest != null ? <AnimatedNumber value={Math.round(latest)} suffix="ms" className="text-2xl font-bold text-foreground tabular-nums" /> : <span className="text-2xl font-bold text-muted-foreground">—</span>,
    },
    {
      label: '7-Day Avg',
      value: avg7d != null ? <AnimatedNumber value={avg7d} suffix="ms" className="text-2xl font-bold text-foreground tabular-nums" /> : <span className="text-2xl font-bold text-muted-foreground">—</span>,
    },
    {
      label: '90-Day Baseline',
      value: baseline != null ? <AnimatedNumber value={baseline} suffix="ms" className="text-2xl font-bold text-foreground tabular-nums" /> : <span className="text-2xl font-bold text-muted-foreground">—</span>,
    },
    {
      label: 'vs Baseline',
      value:
        vsBaseline != null ? (
          <span className={`text-2xl font-bold tabular-nums ${vsBaseline >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {vsBaseline >= 0 ? '+' : ''}{vsBaseline}ms
          </span>
        ) : (
          <span className="text-2xl font-bold text-muted-foreground">—</span>
        ),
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map(({ label, value }) => (
        <Card key={label}>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground mb-1.5">{label}</p>
            {value}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
