import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ScoreState } from './whoop/types'

// ── Tailwind class helper ────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Time helpers ─────────────────────────────────────────────

/** Convert milliseconds to hours (1 decimal place) */
export function msToHours(ms: number | null | undefined): number {
  if (!ms) return 0
  return Math.round((ms / 3_600_000) * 10) / 10
}

/** Convert milliseconds to "Xh Ym" string */
export function msToHoursMinutes(ms: number | null | undefined): string {
  if (!ms || ms <= 0) return '—'
  const totalMinutes = Math.floor(ms / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

/** Format a date string to a short readable format */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(dateStr))
}

/** Format date + time */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

/** Duration between two ISO strings in ms */
export function durationMs(start: string, end: string): number {
  return new Date(end).getTime() - new Date(start).getTime()
}

// ── Recovery score helpers ───────────────────────────────────

export type RecoveryZone = 'green' | 'yellow' | 'red'

export function getRecoveryZone(score: number | null | undefined): RecoveryZone {
  if (score == null) return 'red'
  if (score >= 67) return 'green'
  if (score >= 34) return 'yellow'
  return 'red'
}

export const RECOVERY_COLORS: Record<RecoveryZone, string> = {
  green: '#16a34a',
  yellow: '#ca8a04',
  red: '#dc2626',
}

export const RECOVERY_BG: Record<RecoveryZone, string> = {
  green: 'bg-green-100 dark:bg-green-900/30',
  yellow: 'bg-yellow-100 dark:bg-yellow-900/30',
  red: 'bg-red-100 dark:bg-red-900/30',
}

export const RECOVERY_TEXT: Record<RecoveryZone, string> = {
  green: 'text-green-700 dark:text-green-400',
  yellow: 'text-yellow-700 dark:text-yellow-400',
  red: 'text-red-700 dark:text-red-400',
}

// ── Sleep stage colors ───────────────────────────────────────

export const SLEEP_STAGE_COLORS = {
  deep:  '#0F6E56',  // WHOOP teal  — restorative deep/SWS
  rem:   '#6366f1',  // indigo      — vivid REM/dreaming
  light: '#38bdf8',  // sky-400     — light transitional sleep
  awake: '#fb923c',  // orange-400  — awake/aroused
} as const

// ── Score state display ──────────────────────────────────────

export function scoreStateLabel(state: ScoreState): string {
  switch (state) {
    case 'SCORED': return ''
    case 'PENDING_SCORE': return 'Processing...'
    case 'UNSCORABLE': return 'N/A'
  }
}

export function isScored(state: ScoreState): boolean {
  return state === 'SCORED'
}

// ── Number formatting ────────────────────────────────────────

export function formatHRV(milli: number | null | undefined): string {
  if (milli == null) return '—'
  return `${Math.round(milli)}ms`
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${Math.round(value)}%`
}

export function formatKilojoules(kj: number | null | undefined): string {
  if (kj == null) return '—'
  if (kj >= 1000) return `${(kj / 1000).toFixed(1)}MJ`
  return `${Math.round(kj)}kJ`
}

// ── Initials from name ───────────────────────────────────────

export function getInitials(firstName?: string, lastName?: string): string {
  const f = firstName?.[0]?.toUpperCase() ?? ''
  const l = lastName?.[0]?.toUpperCase() ?? ''
  return f + l || '?'
}

// ── Date range helpers ───────────────────────────────────────

export function daysAgoISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

export function nowISO(): string {
  return new Date().toISOString()
}
