import Link from 'next/link'
import { Activity, Heart, Moon, Dumbbell, Users, TrendingUp, ArrowRight } from 'lucide-react'

const FEATURES = [
  {
    icon: Heart,
    title: 'Recovery Scores',
    description: "See every team member's daily readiness at a glance — colour-coded green, yellow, and red.",
  },
  {
    icon: Moon,
    title: 'Sleep Analytics',
    description: '30-day sleep stage breakdowns, efficiency trends, and consistency scores for the whole team.',
  },
  {
    icon: TrendingUp,
    title: 'HRV Trends',
    description: 'Track heart rate variability over 90 days with rolling averages and personal baselines.',
  },
  {
    icon: Dumbbell,
    title: 'Workout Log',
    description: 'Full activity history with strain scores, heart rate zones, and training load over time.',
  },
  {
    icon: Users,
    title: 'Team Overview',
    description: "One grid to see everyone's status. Lowest recovery scores surface at the top so nothing slips through.",
  },
  {
    icon: Activity,
    title: 'Live Webhooks',
    description: 'Powered by WHOOP webhooks — data updates the moment WHOOP processes it, no manual sync needed.',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* ── Nav ────────────────────────────────────────────── */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Activity className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} aria-hidden="true" />
            </div>
            <span className="font-semibold text-sm tracking-tight text-foreground">WHOOP Team</span>
          </div>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Dashboard →
          </Link>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 sm:py-28 text-center">
        {/* Subtle teal glow behind the badge */}
        <div className="relative mb-6">
          <div
            className="absolute inset-0 -m-8 rounded-full blur-3xl opacity-20 dark:opacity-10"
            style={{ backgroundColor: '#0F6E56' }}
            aria-hidden="true"
          />
          <span className="relative inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" aria-hidden="true" />
            Powered by WHOOP v2 API
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground max-w-3xl leading-tight">
          Your team's health,{' '}
          <span style={{ color: '#0F6E56' }}>in one place.</span>
        </h1>

        <p className="mt-6 text-lg text-muted-foreground max-w-xl leading-relaxed">
          Connect your team's WHOOP accounts and get a unified view of recovery, sleep, HRV, and
          workout data — updated in real time.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/api/whoop/connect"
            className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:opacity-90 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            style={{ backgroundColor: '#0F6E56' }}
          >
            Connect your WHOOP
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors duration-150 active:scale-95"
          >
            View dashboard
          </Link>
        </div>

        {/* Social proof strip */}
        <p className="mt-8 text-xs text-muted-foreground">
          OAuth 2.0 · Data stays in your Supabase · No third-party sharing
        </p>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="text-center text-xl font-semibold text-foreground mb-12">
            Everything your team needs to train smarter
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-background p-5 hover:shadow-sm transition-shadow duration-200"
              >
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="mb-1.5 text-sm font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">WHOOP Team Dashboard</p>
          <p className="text-xs text-muted-foreground">Not affiliated with WHOOP, Inc.</p>
        </div>
      </footer>
    </div>
  )
}
