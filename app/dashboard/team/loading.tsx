import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

export default function TeamLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-5">
              <div className="flex flex-col items-center mb-4">
                <Skeleton className="h-14 w-14 rounded-full mb-3" />
                <Skeleton className="h-4 w-28 mb-1" />
                <Skeleton className="h-3 w-36" />
              </div>
              <div className="space-y-2">
                {[0,1,2].map((j) => (
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
    </div>
  )
}
