import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function WorkoutsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Card>
        <CardHeader><Skeleton className="h-4 w-28" /></CardHeader>
        <CardContent className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0,1].map((i) => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-4 w-40" /></CardHeader>
            <CardContent><Skeleton className="h-[220px] w-full rounded-lg" /></CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
