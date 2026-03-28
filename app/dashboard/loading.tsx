import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1.5">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-36" />
      </div>

      {/* Recovery + Sleep row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-4 w-32" /></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <Skeleton className="h-24 w-24 rounded-full flex-shrink-0" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[0,1,2,3].map((j) => <Skeleton key={j} className="h-14 rounded-lg" />)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* HRV chart */}
      <Card>
        <CardHeader><Skeleton className="h-4 w-36" /></CardHeader>
        <CardContent><Skeleton className="h-[220px] w-full rounded-lg" /></CardContent>
      </Card>

      {/* Workout list */}
      <Card>
        <CardHeader><Skeleton className="h-4 w-40" /></CardHeader>
        <CardContent className="space-y-3">
          {[0,1,2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-5 w-8 flex-shrink-0" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
