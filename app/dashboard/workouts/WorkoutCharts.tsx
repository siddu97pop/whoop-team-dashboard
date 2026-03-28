'use client'

import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, formatDateTime, msToHoursMinutes, durationMs } from '@/lib/utils'

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
  score_state: string
}

interface WorkoutChartsProps { workouts: Workout[] }

const ZONE_COLORS = ['#e2e8f0', '#bae6fd', '#6ee7b7', '#fde047', '#f97316', '#ef4444']
const SPORT_COLORS = ['#0F6E56', '#6366f1', '#f59e0b', '#ec4899', '#14b8a6', '#8b5cf6', '#f97316']

const TICK = { fontSize: 10, fill: 'hsl(var(--muted-foreground))' }
const GRID = { strokeDasharray: '3 3', stroke: 'hsl(var(--border))' }
const TOOLTIP_STYLE = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
  fontSize: 12,
}

export function WorkoutCharts({ workouts }: WorkoutChartsProps) {
  const scored = workouts.filter((w) => w.score_state === 'SCORED')

  if (workouts.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-border">
        <p className="text-sm text-muted-foreground">No workouts recorded yet</p>
      </div>
    )
  }

  // Weekly strain bar chart
  const weeklyMap: Record<string, number> = {}
  scored.forEach((w) => {
    const weekStart = getWeekStart(w.start_time)
    weeklyMap[weekStart] = (weeklyMap[weekStart] ?? 0) + (w.strain ?? 0)
  })
  const weeklyData = Object.entries(weeklyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([date, strain]) => ({ date, strain: parseFloat(strain.toFixed(1)) }))

  // Sport pie chart
  const sportMap: Record<string, number> = {}
  scored.forEach((w) => {
    const sport = w.sport_name ?? 'Activity'
    sportMap[sport] = (sportMap[sport] ?? 0) + 1
  })
  const sportData = Object.entries(sportMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 7)
    .map(([name, count]) => ({ name, value: count }))

  return (
    <div className="space-y-4">
      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Workouts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Workout log">
              <thead>
                <tr className="border-b border-border">
                  {['Sport', 'Date', 'Duration', 'Strain', 'Avg HR'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-medium text-muted-foreground"
                      scope="col"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {workouts.slice(0, 50).map((w) => (
                  <tr key={w.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">{w.sport_name ?? 'Activity'}</td>
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">{formatDate(w.start_time)}</td>
                    <td className="px-5 py-3 text-muted-foreground tabular-nums">{msToHoursMinutes(durationMs(w.start_time, w.end_time))}</td>
                    <td className="px-5 py-3 tabular-nums font-medium text-foreground">
                      {w.score_state === 'SCORED' && w.strain != null ? w.strain.toFixed(1) : '—'}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground tabular-nums">
                      {w.avg_heart_rate ? `${w.avg_heart_rate} bpm` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weekly training load */}
        <Card>
          <CardHeader><CardTitle>Weekly Training Load</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                <CartesianGrid {...GRID} vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatDate} tick={TICK} tickLine={false} axisLine={false} />
                <YAxis tick={TICK} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                  labelFormatter={formatDate}
                  formatter={(v: number) => [v.toFixed(1), 'Total Strain']}
                />
                <Bar dataKey="strain" fill="#0F6E56" radius={[4, 4, 0, 0]} name="Strain" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sport breakdown */}
        <Card>
          <CardHeader><CardTitle>Total Strain by Sport</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={sportData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {sportData.map((_, i) => (
                    <Cell key={i} fill={SPORT_COLORS[i % SPORT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(v: number, name: string) => [v, name]}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: '#ffffff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}
