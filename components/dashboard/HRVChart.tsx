'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'

interface HRVDataPoint {
  date: string         // ISO string
  hrv: number | null   // ms
  recovery: number | null
}

interface HRVChartProps {
  data: HRVDataPoint[]
  baseline?: number
  loading?: boolean
  title?: string
  days?: number
}

// Rolling average helper
function rollingAverage(data: HRVDataPoint[], window = 7): (number | null)[] {
  return data.map((_, i) => {
    const slice = data.slice(Math.max(0, i - window + 1), i + 1)
    const valid = slice.filter((d) => d.hrv != null)
    if (valid.length === 0) return null
    return Math.round(valid.reduce((s, d) => s + (d.hrv ?? 0), 0) / valid.length)
  })
}

export function HRVChart({
  data,
  baseline,
  loading = false,
  title = 'HRV Trend',
  days = 30,
}: HRVChartProps) {
  if (loading) return <HRVChartSkeleton />

  const rolling = rollingAverage(data, 7)
  const chartData = data.map((d, i) => ({
    ...d,
    rolling: rolling[i],
    isLowRecovery: (d.recovery ?? 100) <= 33,
  }))

  const isEmpty = data.length === 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <span className="text-xs font-normal text-muted-foreground">{days}-day window</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-sm text-muted-foreground">No HRV data yet</p>
          </div>
        ) : (
          <>
            {/* Legend */}
            <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-4 rounded-full inline-block" style={{ backgroundColor: '#0F6E56' }} />
                HRV
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-0.5 w-4 inline-block" style={{ backgroundColor: '#6366f1', borderStyle: 'dashed', borderTopWidth: 2 }} />
                7-day avg
              </span>
              {baseline && (
                <span className="flex items-center gap-1.5">
                  <span className="h-0.5 w-4 inline-block" style={{ backgroundColor: '#ca8a04', borderStyle: 'dashed', borderTopWidth: 2 }} />
                  Baseline
                </span>
              )}
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(v) => formatDate(v)}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  tickLine={false}
                  axisLine={false}
                  unit="ms"
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelFormatter={(v) => formatDate(v)}
                  formatter={(value: number, name: string) => [
                    `${value}ms`,
                    name === 'hrv' ? 'HRV' : name === 'rolling' ? '7-day avg' : name,
                  ]}
                />
                {baseline && (
                  <ReferenceLine
                    y={baseline}
                    stroke="#ca8a04"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{ value: 'Baseline', position: 'right', fontSize: 10, fill: '#ca8a04' }}
                  />
                )}
                {/* Annotate red recovery days */}
                {chartData
                  .filter((d) => d.isLowRecovery && d.hrv != null)
                  .map((d) => (
                    <ReferenceLine
                      key={d.date}
                      x={d.date}
                      stroke="#dc2626"
                      strokeOpacity={0.25}
                      strokeWidth={6}
                    />
                  ))}
                <Line
                  type="monotone"
                  dataKey="hrv"
                  stroke="#0F6E56"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#0F6E56' }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="rolling"
                  stroke="#6366f1"
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  dot={false}
                  activeDot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function HRVChartSkeleton() {
  return (
    <Card>
      <CardHeader><Skeleton className="h-4 w-28" /></CardHeader>
      <CardContent>
        <Skeleton className="h-[220px] w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}
