/**
 * Mercure Connection Lost Dialog
 * Displays when Mercure connection is lost (token expired after 6 hours)
 * Asks user if they want to continue (refresh) or quit (go to homepage)
 */

'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type MercureConnectionLostDialogProps = {
  open: boolean
  onContinue: () => void
  onQuit: () => void
}

export function MercureConnectionLostDialog({
  open,
  onContinue,
  onQuit,
}: MercureConnectionLostDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous toujours là ?</AlertDialogTitle>
          <AlertDialogDescription>
            Votre session de chat a expiré après une longue période d'inactivité.
            Voulez-vous continuer la conversation ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onQuit}>
            Non, quitter
          </AlertDialogCancel>
          <AlertDialogAction onClick={onContinue}>
            Oui, continuer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
