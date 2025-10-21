'use client'

import { useUser, useHasRole, useHasAnyRole } from '@/lib/contexts/user-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Lock, Users } from 'lucide-react'

/**
 * Example component showing role-based access control
 * 
 * This demonstrates:
 * - useUser() to get full user data
 * - useHasRole() to check single role
 * - useHasAnyRole() to check multiple roles
 */
export function RoleBasedComponent() {
  const user = useUser()
  const isAdmin = useHasRole('ROLE_ADMIN')
  const canModerate = useHasAnyRole(['ROLE_ADMIN', 'ROLE_MODERATOR'])

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Please log in to see this content</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="font-medium">Name:</span> {user.name || 'N/A'}
          </div>
          <div>
            <span className="font-medium">Email:</span> {user.email}
          </div>
          <div>
            <span className="font-medium">Roles:</span>
            <div className="flex gap-2 mt-1">
              {user.roles.map((role) => (
                <Badge key={role} variant="secondary">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin-Only Content */}
      {isAdmin && (
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Shield className="size-5" />
              Admin Panel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">You have administrator privileges!</p>
            <div className="flex gap-2">
              <Button variant="destructive" size="sm">
                Delete User
              </Button>
              <Button variant="outline" size="sm">
                Manage Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Moderator Content (Admin or Moderator) */}
      {canModerate && (
        <Card className="border-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <Lock className="size-5" />
              Moderation Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              You can moderate content (Admin or Moderator role)
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Review Reports
              </Button>
              <Button variant="outline" size="sm">
                Manage Comments
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Everyone sees this */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            This content is visible to all authenticated users
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

