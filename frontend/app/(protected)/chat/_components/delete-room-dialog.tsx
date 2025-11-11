"use client"

import * as React from "react"
import { Trash2, Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { ChatRoom } from "@/types/chat"

type DeleteRoomDialogProps = {
  room: ChatRoom | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}

export function DeleteRoomDialog({ room, open, onOpenChange, onConfirm }: DeleteRoomDialogProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleConfirm = async () => {
    if (!room) return

    setIsDeleting(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Supprimer le salon
          </AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer le salon <strong>"{room?.name}"</strong> ?
            <br />
            <br />
            Cette action est irréversible. Tous les messages et participants seront supprimés.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
