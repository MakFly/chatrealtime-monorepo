/**
 * Role utilities for user authorization
 */

import type { User } from '@/types/auth'

/**
 * Check if user has a specific role
 */
export function hasRole(user: User | null | undefined, role: string): boolean {
  if (!user || !user.roles) return false
  return user.roles.includes(role)
}

/**
 * Check if user is a global admin (ROLE_ADMIN)
 */
export function isGlobalAdmin(user: User | null | undefined): boolean {
  return hasRole(user, 'ROLE_ADMIN')
}

/**
 * Check if user is a super admin (ROLE_SUPER_ADMIN)
 */
export function isSuperAdmin(user: User | null | undefined): boolean {
  return hasRole(user, 'ROLE_SUPER_ADMIN')
}

/**
 * Check if user has at least one of the specified roles
 */
export function hasAnyRole(user: User | null | undefined, roles: string[]): boolean {
  if (!user || !user.roles) return false
  return roles.some((role) => user.roles.includes(role))
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(user: User | null | undefined, roles: string[]): boolean {
  if (!user || !user.roles) return false
  return roles.every((role) => user.roles.includes(role))
}
