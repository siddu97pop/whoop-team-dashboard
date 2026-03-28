import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { getWorkoutsForUser } from '@/lib/supabase/queries'
import { WorkoutCharts } from './WorkoutCharts'

export const revalidate = 300

export default async function WorkoutsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/api/whoop/connect')

  const workouts = await getWorkoutsForUser(user.whoop_user_id, 90).catch(() => [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Workout Log</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {workouts.length} workout{workouts.length !== 1 ? 's' : ''} · last 90 days
        </p>
      </div>
      <WorkoutCharts workouts={workouts} />
    </div>
  )
}
