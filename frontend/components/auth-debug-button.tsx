'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bug } from 'lucide-react'
import { AuthDebugDialog } from '@/components/auth-debug-dialog'

/**
 * Fixed debug button (bottom-right corner)
 * Shows active token count and opens debug dialog
 * Only visible in development mode
 */
export function AuthDebugButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Prevent hydration mismatch by only rendering on client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Only show in development and after mount
  if (process.env.NODE_ENV !== 'development' || !isMounted) {
    return null
  }

  return (
    <>
      {/* Fixed button - bottom right */}
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="icon"
        className="fixed bottom-8 right-4 mb-28 h-14 w-12 rounded-full shadow-lg border-2 hover:scale-110 transition-transform z-50"
        aria-label="Open auth debug panel"
      >
        <Bug className="h-5 w-5" />
        {/* Badge showing token count - positioned top-right of button */}
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
        >
          2
        </Badge>
      </Button>

      {/* Dialog component */}
      <AuthDebugDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  )
}
