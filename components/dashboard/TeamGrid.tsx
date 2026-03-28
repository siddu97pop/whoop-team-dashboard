'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ScoreZoneBadge } from './ScoreZoneBadge'
import { getInitials, formatHRV, msToHoursMinutes, getRecoveryZone, RECOVERY_COLORS } from '@/lib/utils'
import { WifiOff } from 'lucide-react'

interface TeamMember {
  whoop_user_id: number
  first_name: string | null
  last_name: string | null
  email: string
  is_active: boolean
  recovery_score: number | null
  hrv: number | null
  sleep_ms: number | null
  recovery_score_state: 'SCORED' | 'PENDING_SCORE' | 'UNSCORABLE'
}

interface TeamGridProps {
  members: TeamMember[]
  loading?: boolean
}

export function TeamGrid({ members, loading = false }: TeamGridProps) {
  if (loading) return <TeamGridSkeleton />

  // Sort: not-connected last, then by recovery score ascending (lowest first = most at risk)
  const sorted = [...members].sort((a, b) => {
    if (!a.is_active && b.is_active) return 1
    if (a.is_active && !b.is_active) return -1
    const aScore = a.recovery_score ?? 101
    const bScore = b.recovery_score ?? 101
    return aScore - bScore
  })

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <WifiOff className="h-10 w-10 text-muted-foreground/40 mb-4" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground mb-1">No team members connected</p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Go to Admin to invite team members to connect their WHOOP accounts.
        </p>
      </div>
    )
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      role="list"
      aria-label="Team members"
    >
      {sorted.map((member) => (
        <TeamMemberCard key={member.whoop_user_id} member={member} />
      ))}
    </div>
  )
}

function TeamMemberCard({ member }: { member: TeamMember }) {
  const initials = getInitials(member.first_name ?? undefined, member.last_name ?? undefined)
  const name = [member.first_name, member.last_name].filter(Boolean).join(' ') || member.email
  const zone = getRecoveryZone(member.recovery_score)
  const ringColor = member.is_active ? RECOVERY_COLORS[zone] : 'hsl(var(--muted-foreground))'

  return (
    <div role="listitem">
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="pt-5">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-4">
            <div
              className="h-14 w-14 rounded-full flex items-center justify-center text-lg font-bold mb-3"
              style={{
                background: `${ringColor}20`,
                color: ringColor,
                border: `2px solid ${ringColor}40`,
              }}
              aria-hidden="true"
            >
              {initials}
            </div>
            <p className="text-sm font-semibold text-foreground text-center leading-tight">{name}</p>
            <p className="text-xs text-muted-foreground mt-0.5 text-center truncate max-w-full">
              {member.email}
            </p>
          </div>

          {!member.is_active ? (
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
              Not connected
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Recovery</span>
                <ScoreZoneBadge
                  score={member.recovery_score}
                  scoreState={member.recovery_score_state}
                  size="sm"
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">HRV</span>
                <span className="font-medium tabular-nums text-foreground">
                  {formatHRV(member.hrv)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Sleep</span>
                <span className="font-medium tabular-nums text-foreground">
                  {msToHoursMinutes(member.sleep_ms)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function TeamGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-5">
            <div className="flex flex-col items-center mb-4">
              <Skeleton className="h-14 w-14 rounded-full mb-3" />
              <Skeleton className="h-4 w-28 mb-1" />
              <Skeleton className="h-3 w-36" />
            </div>
            <div className="space-y-2">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="flex justify-between">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
