'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { User } from '@/types/auth'

type UserContextType = {
  user: User | null
}

const UserContext = createContext<UserContextType | undefined>(undefined)

type UserProviderProps = {
  children: ReactNode
  user: User | null
}

/**
 * UserProvider - Provides user data throughout the app via React Context
 * 
 * User data comes from Server Components (getCurrentUser) and is passed down
 * This allows any Client Component to access user data without prop drilling
 * 
 * Usage:
 *   const user = useUser()
 *   const isAdmin = useHasRole('ROLE_ADMIN')
 */
export function UserProvider({ children, user }: UserProviderProps) {
  return (
    <UserContext.Provider value={{ user }}>
      {children}
    </UserContext.Provider>
  )
}

/**
 * Hook to access user data anywhere in the app
 * 
 * @returns User | null
 * @throws Error if used outside UserProvider
 * 
 * @example
 * const user = useUser()
 * if (user) {
 *   console.log(user.email, user.roles)
 * }
 */
export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within UserProvider')
  }
  return context.user
}

/**
 * Hook to check if user has a specific role
 * 
 * @param role - Role to check (e.g., 'ROLE_ADMIN', 'ROLE_USER')
 * @returns boolean
 * 
 * @example
 * const isAdmin = useHasRole('ROLE_ADMIN')
 * if (isAdmin) {
 *   return <AdminPanel />
 * }
 */
export function useHasRole(role: string) {
  const user = useUser()
  return user?.roles.includes(role) ?? false
}

/**
 * Hook to check if user has ANY of the specified roles
 * 
 * @param roles - Array of roles to check
 * @returns boolean
 * 
 * @example
 * const canModerate = useHasAnyRole(['ROLE_ADMIN', 'ROLE_MODERATOR'])
 */
export function useHasAnyRole(roles: string[]) {
  const user = useUser()
  if (!user) return false
  return roles.some(role => user.roles.includes(role))
}

/**
 * Hook to check if user has ALL of the specified roles
 * 
 * @param roles - Array of roles to check
 * @returns boolean
 * 
 * @example
 * const isSuperAdmin = useHasAllRoles(['ROLE_ADMIN', 'ROLE_SUPER_USER'])
 */
export function useHasAllRoles(roles: string[]) {
  const user = useUser()
  if (!user) return false
  return roles.every(role => user.roles.includes(role))
}

