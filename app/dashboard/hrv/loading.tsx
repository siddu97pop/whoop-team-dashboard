import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function HRVLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-52" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[0,1,2,3].map((i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-4">
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-7 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><Skeleton className="h-4 w-36" /></CardHeader>
        <CardContent><Skeleton className="h-[220px] w-full rounded-lg" /></CardContent>
      </Card>
    </div>
  )
}
