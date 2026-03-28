'use client'

import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SLEEP_STAGE_COLORS, formatDate, msToHoursMinutes, formatPercent } from '@/lib/utils'

interface Sleep {
  start_time: string
  total_in_bed_milli: number | null
  total_deep_milli: number | null
  total_rem_milli: number | null
  total_light_milli: number | null
  total_awake_milli: number | null
  sleep_efficiency_pct: number | null
  sleep_consistency_pct: number | null
  need_from_sleep_debt_milli: number | null
  score_state: string
}

interface SleepChartsProps { sleeps: Sleep[] }

const TICK = { fontSize: 10, fill: 'hsl(var(--muted-foreground))' }
const GRID = { strokeDasharray: '3 3', stroke: 'hsl(var(--border))' }
const TOOLTIP_STYLE = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
  fontSize: 12,
}

export function SleepCharts({ sleeps }: SleepChartsProps) {
  const scored = sleeps.filter((s) => s.score_state === 'SCORED')

  const stageData = scored.map((s) => ({
    date: s.start_time,
    deep:  (s.total_deep_milli  ?? 0) / 3_600_000,
    rem:   (s.total_rem_milli   ?? 0) / 3_600_000,
    light: (s.total_light_milli ?? 0) / 3_600_000,
    awake: (s.total_awake_milli ?? 0) / 3_600_000,
  }))

  const efficiencyData = scored.map((s) => ({
    date: s.start_time,
    efficiency:   s.sleep_efficiency_pct ?? null,
    consistency: s.sleep_consistency_pct ?? null,
  }))

  // 7-day avg sleep debt
  const last7 = scored.slice(-7)
  const avgDebtMs = last7.length
    ? last7.reduce((s, r) => s + (r.need_from_sleep_debt_milli ?? 0), 0) / last7.length
    : null

  const totals = scored.reduce(
    (acc, s) => ({
      deep:  acc.deep  + (s.total_deep_milli  ?? 0),
      rem:   acc.rem   + (s.total_rem_milli   ?? 0),
      light: acc.light + (s.total_light_milli ?? 0),
      awake: acc.awake + (s.total_awake_milli ?? 0),
    }),
    { deep: 0, rem: 0, light: 0, awake: 0 }
  )
  const totalMs = totals.deep + totals.rem + totals.light + totals.awake
  const avgEff = scored.length
    ? scored.reduce((s, r) => s + (r.sleep_efficiency_pct ?? 0), 0) / scored.length
    : null

  if (scored.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-border">
        <p className="text-sm text-muted-foreground">No scored sleep data yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Avg Deep',    value: msToHoursMinutes(totals.deep  / (scored.length || 1)) },
          { label: 'Avg REM',     value: msToHoursMinutes(totals.rem   / (scored.length || 1)) },
          { label: 'Avg Efficiency', value: formatPercent(avgEff) },
          { label: '7d Sleep Debt',  value: msToHoursMinutes(avgDebtMs) },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stacked bar — sleep stages */}
      <Card>
        <CardHeader>
          <CardTitle>Sleep Stages by Night</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stageData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <CartesianGrid {...GRID} vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={TICK} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={TICK} tickLine={false} axisLine={false} unit="h" />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                labelFormatter={formatDate}
                formatter={(v: number, name: string) => [
                  `${v.toFixed(1)}h`,
                  name.charAt(0).toUpperCase() + name.slice(1),
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                formatter={(value) => <span style={{ color: '#ffffff' }}>{value}</span>}
              />
              <Bar dataKey="deep"  stackId="a" fill={SLEEP_STAGE_COLORS.deep}  name="Deep"  />
              <Bar dataKey="rem"   stackId="a" fill={SLEEP_STAGE_COLORS.rem}   name="REM"   />
              <Bar dataKey="light" stackId="a" fill={SLEEP_STAGE_COLORS.light} name="Light" />
              <Bar dataKey="awake" stackId="a" fill={SLEEP_STAGE_COLORS.awake} name="Awake" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Line — efficiency & consistency */}
      <Card>
        <CardHeader>
          <CardTitle>Efficiency & Consistency Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={efficiencyData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <CartesianGrid {...GRID} />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={TICK} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={TICK} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                labelFormatter={formatDate}
                formatter={(v: number, name: string) => [`${v.toFixed(0)}%`, name.charAt(0).toUpperCase() + name.slice(1)]}
              />
              <Legend
                wrapperStyle={{ fontSize: 11 }}
                formatter={(value) => <span style={{ color: '#ffffff' }}>{value}</span>}
              />
              <Line type="monotone" dataKey="efficiency"   stroke="#0F6E56" strokeWidth={2} dot={false} connectNulls name="Efficiency" />
              <Line type="monotone" dataKey="consistency"  stroke="#6366f1" strokeWidth={2} dot={false} connectNulls name="Consistency" strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
