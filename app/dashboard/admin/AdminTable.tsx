'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getInitials, formatDateTime } from '@/lib/utils'
import { WifiOff, Wifi, Trash2, RefreshCw } from 'lucide-react'

interface WhoopUser {
  whoop_user_id: number
  email: string
  first_name: string | null
  last_name: string | null
  is_active: boolean
  connected_at: string
  last_sync_at: string | null
}

interface AdminTableProps {
  users: WhoopUser[]
  currentUserId: number
}

export function AdminTable({ users, currentUserId }: AdminTableProps) {
  const [disconnecting, setDisconnecting] = useState<number | null>(null)
  const [localUsers, setLocalUsers] = useState(users)

  async function handleDisconnect(whoopUserId: number) {
    if (!confirm('Remove this WHOOP connection? Their data will remain in the database.')) return
    setDisconnecting(whoopUserId)
    try {
      const res = await fetch('/api/whoop/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whoopUserId }),
      })
      if (res.ok) {
        setLocalUsers((prev) => prev.filter((u) => u.whoop_user_id !== whoopUserId))
      }
    } catch (err) {
      console.error('Disconnect error:', err)
    } finally {
      setDisconnecting(null)
    }
  }

  if (localUsers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-16 text-center">
          <WifiOff className="h-10 w-10 text-muted-foreground/40 mb-4" aria-hidden="true" />
          <p className="text-sm font-medium text-foreground mb-1">No connections yet</p>
          <p className="text-xs text-muted-foreground">
            Click "Connect WHOOP" above to link your first account.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Accounts ({localUsers.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Connected WHOOP accounts">
            <thead>
              <tr className="border-b border-border">
                {['Member', 'Email', 'Status', 'Connected', 'Last Sync', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-medium text-muted-foreground"
                    scope="col"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {localUsers.map((u) => {
                const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Unknown'
                const isCurrentUser = u.whoop_user_id === currentUserId
                return (
                  <tr key={u.whoop_user_id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-semibold text-primary">
                            {getInitials(u.first_name ?? undefined, u.last_name ?? undefined)}
                          </span>
                        </div>
                        <span className="font-medium text-foreground">
                          {name}
                          {isCurrentUser && (
                            <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">(you)</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-5 py-3">
                      {u.is_active ? (
                        <Badge variant="default" className="gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                          <Wifi className="h-3 w-3" aria-hidden="true" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge variant="muted" className="gap-1">
                          <WifiOff className="h-3 w-3" aria-hidden="true" />
                          Disconnected
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {formatDateTime(u.connected_at)}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {u.last_sync_at ? formatDateTime(u.last_sync_at) : 'Never'}
                    </td>
                    <td className="px-5 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
                        onClick={() => handleDisconnect(u.whoop_user_id)}
                        disabled={disconnecting === u.whoop_user_id}
                        aria-label={`Disconnect ${name}`}
                      >
                        {disconnecting === u.whoop_user_id ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
