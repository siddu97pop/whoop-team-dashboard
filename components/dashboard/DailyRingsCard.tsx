'use client'

import { AnimatedNumber } from './AnimatedNumber'
import { Card, CardContent } from '@/components/ui/card'
import { formatHRV, getRecoveryZone, RECOVERY_COLORS } from '@/lib/utils'
import { Activity, Heart, Thermometer, Droplets } from 'lucide-react'

interface DailyRingsCardProps {
  recoveryScore: number | null
  recoveryState: 'SCORED' | 'PENDING_SCORE' | 'UNSCORABLE'
  sleepPerformance: number | null
  sleepState: 'SCORED' | 'PENDING_SCORE' | 'UNSCORABLE'
  todayStrain: number | null
  hrv: number | null
  restingHR: number | null
  spo2: number | null
  skinTemp: number | null
}

function sleepColor(perf: number | null): string {
  if (perf == null) return '#94a3b8'
  if (perf >= 80) return '#22c55e'
  if (perf >= 60) return '#f59e0b'
  return '#ef4444'
}

function strainColor(strain: number | null): string {
  if (strain == null) return '#94a3b8'
  if (strain >= 14) return '#dc2626'
  if (strain >= 10) return '#ca8a04'
  return '#0F6E56'
}

function sleepLabel(perf: number | null, state: string): string {
  if (state !== 'SCORED') return state === 'PENDING_SCORE' ? 'Processing…' : 'N/A'
  if (perf == null) return '—'
  if (perf >= 80) return 'Well Rested'
  if (perf >= 60) return 'Adequate'
  return 'Sleep More'
}

function recoveryLabel(score: number | null, state: string): string {
  if (state !== 'SCORED') return state === 'PENDING_SCORE' ? 'Processing…' : 'N/A'
  if (score == null) return '—'
  if (score >= 67) return 'Recovered'
  if (score >= 34) return 'Moderate'
  return 'Strained'
}

function strainLabel(strain: number | null): string {
  if (strain == null || strain === 0) return 'No Activity'
  if (strain >= 14) return 'Strenuous'
  if (strain >= 10) return 'Moderate'
  return 'Light'
}

export function DailyRingsCard({
  recoveryScore,
  recoveryState,
  sleepPerformance,
  sleepState,
  todayStrain,
  hrv,
  restingHR,
  spo2,
  skinTemp,
}: DailyRingsCardProps) {
  const recoveryZone = getRecoveryZone(recoveryScore)
  const recoveryColor = RECOVERY_COLORS[recoveryZone]
  const sleepC = sleepColor(sleepPerformance)
  const strainC = strainColor(todayStrain)

  return (
    <Card>
      <CardContent className="pt-8 pb-6 px-6">
        {/* 3 Rings */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* Sleep */}
          <Ring
            value={sleepPerformance}
            max={100}
            color={sleepC}
            scored={sleepState === 'SCORED'}
            title="Sleep"
            subtitle={sleepLabel(sleepPerformance, sleepState)}
            unit="%"
            decimals={0}
          />

          {/* Recovery */}
          <Ring
            value={recoveryScore}
            max={100}
            color={recoveryColor}
            scored={recoveryState === 'SCORED'}
            title="Recovery"
            subtitle={recoveryLabel(recoveryScore, recoveryState)}
            unit="%"
            decimals={0}
          />

          {/* Strain */}
          <Ring
            value={todayStrain}
            max={21}
            color={strainC}
            scored={todayStrain != null}
            title="Strain"
            subtitle={strainLabel(todayStrain)}
            unit="/21"
            decimals={1}
          />
        </div>

        {/* Vitals row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-border pt-6">
          <Vital icon={Activity}    label="HRV"        value={hrv != null ? formatHRV(hrv) : '—'}                iconColor="#0F6E56" />
          <Vital icon={Heart}       label="Resting HR"  value={restingHR != null ? `${restingHR} bpm` : '—'}     iconColor="#ef4444" />
          <Vital icon={Droplets}    label="SpO₂"        value={spo2 != null ? `${spo2.toFixed(1)}%` : '—'}       iconColor="#38bdf8" />
          <Vital icon={Thermometer} label="Skin Temp"   value={skinTemp != null ? `${skinTemp.toFixed(1)}°C` : '—'} iconColor="#f59e0b" />
        </div>
      </CardContent>
    </Card>
  )
}

// ── Ring ────────────────────────────────────────────────────────────────────

function Ring({
  value,
  max,
  color,
  scored,
  title,
  subtitle,
  unit,
  decimals = 0,
}: {
  value: number | null
  max: number
  color: string
  scored: boolean
  title: string
  subtitle: string
  unit: string
  decimals?: number
}) {
  const fillDeg = scored && value != null ? Math.min((value / max) * 360, 360) : 0

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative flex h-36 w-36 flex-shrink-0 items-center justify-center rounded-full"
        style={{ background: `conic-gradient(${color} ${fillDeg}deg, hsl(var(--muted)) 0deg)` }}
        role="img"
        aria-label={`${title}: ${value ?? 'N/A'}`}
      >
        <div className="flex h-[108px] w-[108px] flex-col items-center justify-center rounded-full bg-card">
          {scored && value != null ? (
            <>
              <AnimatedNumber
                value={value}
                decimals={decimals}
                className="text-4xl font-bold tabular-nums leading-none"
                style={color}
              />
              <span className="text-xs text-muted-foreground mt-1">{unit}</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </div>
      </div>
      <div className="text-center">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">{title}</p>
        <p className="text-sm font-medium text-foreground mt-0.5">{subtitle}</p>
      </div>
    </div>
  )
}

// ── Vital tile ───────────────────────────────────────────────────────────────

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
    <div className="flex items-center gap-3 rounded-lg bg-muted px-4 py-3">
      <Icon className="h-4 w-4 flex-shrink-0" style={{ color: iconColor }} aria-hidden="true" />
      <div>
        <p className="text-[10px] text-muted-foreground leading-none mb-1">{label}</p>
        <p className="text-sm font-semibold text-foreground tabular-nums">{value}</p>
      </div>
    </div>
  )
}
