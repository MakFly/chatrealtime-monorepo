'use client'

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/shared/spinner"
import { loginAction } from "@/lib/actions/auth"

type TestUser = {
  email: string
  password: string
  name: string
  role?: string
}

const TEST_USERS: TestUser[] = [
  {
    email: "chat.user1@test.com",
    password: "password",
    name: "Chat User 1",
    role: "Admin"
  },
  {
    email: "chat.user2@test.com",
    password: "password",
    name: "Chat User 2",
    role: "Member"
  }
]

type QuickLoginProps = {
  redirect?: string
}

export function QuickLogin({ redirect }: QuickLoginProps) {
  const [loadingUser, setLoadingUser] = useState<string | null>(null)

  const handleQuickLogin = async (user: TestUser) => {
    setLoadingUser(user.email)
    try {
      const formData = new FormData()
      formData.append('email', user.email)
      formData.append('password', user.password)
      if (redirect) {
        formData.append('redirect', redirect)
      }

      const result = await loginAction(formData)

      if (result?.error) {
        setLoadingUser(null)
        return
      }

      // Force hard reload to ensure Server Components fetch user
      window.location.href = redirect || '/dashboard'
    } catch (error) {
      setLoadingUser(null)
    }
  }

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  return (
    <Card className="border-dashed border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-600 dark:text-yellow-500">
            <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
          </svg>
          Quick Login (Dev Only)
        </CardTitle>
        <CardDescription className="text-xs">
          Login instantly with test users from fixtures
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {TEST_USERS.map((user) => (
          <Button
            key={user.email}
            variant="outline"
            onClick={() => handleQuickLogin(user)}
            disabled={loadingUser !== null}
            className="w-full justify-start text-left font-normal h-auto py-3"
          >
            {loadingUser === user.email ? (
              <Spinner className="mr-2 h-4 w-4" />
            ) : (
              <div className="mr-2 h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
            )}
            <div className="flex flex-col flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
            </div>
            {user.role && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-medium">
                {user.role}
              </span>
            )}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
