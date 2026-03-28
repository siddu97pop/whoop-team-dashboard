'use client'

import { AnimatedNumber } from './AnimatedNumber'
import { ScoreZoneBadge } from './ScoreZoneBadge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatHRV, getRecoveryZone, RECOVERY_COLORS, msToHoursMinutes } from '@/lib/utils'
import { Heart, Thermometer, Activity, Droplets } from 'lucide-react'

interface RecoveryCardProps {
  recoveryScore: number | null
  hrv: number | null
  restingHR: number | null
  spo2: number | null
  skinTemp: number | null
  scoreState: 'SCORED' | 'PENDING_SCORE' | 'UNSCORABLE'
  loading?: boolean
}

export function RecoveryCard({
  recoveryScore,
  hrv,
  restingHR,
  spo2,
  skinTemp,
  scoreState,
  loading = false,
}: RecoveryCardProps) {
  if (loading) return <RecoveryCardSkeleton />

  const zone = getRecoveryZone(recoveryScore)
  const ringColor = RECOVERY_COLORS[zone]

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Today's Recovery</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1">
        {/* Big score ring */}
        <div className="flex items-center gap-6 mb-6">
          <div
            className="relative flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(${ringColor} ${(recoveryScore ?? 0) * 3.6}deg, hsl(var(--muted)) 0deg)`,
            }}
            role="img"
            aria-label={`Recovery score: ${recoveryScore ?? 'N/A'}%`}
          >
            <div className="flex h-[72px] w-[72px] flex-col items-center justify-center rounded-full bg-card">
              {scoreState === 'SCORED' && recoveryScore != null ? (
                <AnimatedNumber
                  value={recoveryScore}
                  className="text-2xl font-bold tabular-nums leading-none"
                  style={ringColor}
                />
              ) : (
                <span className="text-sm text-muted-foreground">
                  {scoreState === 'PENDING_SCORE' ? '…' : 'N/A'}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground mt-0.5">%</span>
            </div>
          </div>

          <div>
            <ScoreZoneBadge
              score={recoveryScore}
              scoreState={scoreState}
              size="lg"
              showLabel
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Based on last night's sleep
            </p>
          </div>
        </div>

        {/* Vitals grid — mt-auto pushes it down to match sleep card height */}
        <div className="grid grid-cols-2 gap-3 mt-auto">
          <Vital
            icon={Activity}
            label="HRV"
            value={hrv != null ? formatHRV(hrv) : '—'}
            iconColor="#0F6E56"
          />
          <Vital
            icon={Heart}
            label="Resting HR"
            value={restingHR != null ? `${restingHR} bpm` : '—'}
            iconColor="#ef4444"
          />
          <Vital
            icon={Droplets}
            label="SpO₂"
            value={spo2 != null ? `${spo2.toFixed(1)}%` : '—'}
            iconColor="#38bdf8"
          />
          <Vital
            icon={Thermometer}
            label="Skin Temp"
            value={skinTemp != null ? `${skinTemp.toFixed(1)}°C` : '—'}
            iconColor="#f59e0b"
          />
        </div>
      </CardContent>
    </Card>
  )
}

function Vital({
  icon: Icon,
  label,
  value,
  iconColor,
}: {
  icon: React.ElementType
  label: string
  value: string
  iconColor?: string
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-muted px-3 py-2.5">
      <Icon
        className="h-3.5 w-3.5 flex-shrink-0"
        style={{ color: iconColor }}
        aria-hidden="true"
      />
      <div>
        <p className="text-[10px] text-muted-foreground leading-none mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-foreground tabular-nums">{value}</p>
      </div>
    </div>
  )
}

function RecoveryCardSkeleton() {
  return (
    <Card>
      <CardHeader><Skeleton className="h-4 w-32" /></CardHeader>
      <CardContent>
        <div className="flex items-center gap-6 mb-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
