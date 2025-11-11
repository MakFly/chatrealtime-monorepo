'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { createChatRoomClient } from '@/lib/api/chat-client'

const createRoomSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(255, 'Le nom est trop long'),
  type: z.enum(['direct', 'group', 'public'], {
    required_error: 'Le type est requis',
  }),
})

type CreateRoomFormValues = z.infer<typeof createRoomSchema>

type CreateRoomDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateRoomDialog({ open, onOpenChange }: CreateRoomDialogProps) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<CreateRoomFormValues>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: '',
      type: 'group',
    },
  })

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      form.reset()
    }
  }, [open, form])

  const onSubmit = async (values: CreateRoomFormValues) => {
    try {
      setIsSubmitting(true)
      console.log('[CreateRoomDialog] 📤 Creating room:', values)

      const response = await createChatRoomClient(values)
      console.log('[CreateRoomDialog] 📥 Response:', response)

      if (response.error || !response.data) {
        console.error('[CreateRoomDialog] ❌ Failed to create room:', {
          error: response.error,
          status: response.status,
          data: response.data,
        })
        
        let errorMessage = 'Une erreur est survenue'
        if (response.error?.message) {
          try {
            // Try to parse JSON error message
            const parsed = JSON.parse(response.error.message)
            errorMessage = parsed.message || parsed['hydra:description'] || response.error.message
          } catch {
            errorMessage = response.error.message
          }
        } else if (response.status) {
          errorMessage = `Erreur ${response.status}: ${response.statusText || 'Erreur serveur'}`
        }

        toast.error('Erreur lors de la création de la conversation', {
          description: errorMessage,
        })
        return
      }

      console.log('[CreateRoomDialog] ✅ Room created:', response.data)

      // Invalidate and refetch rooms list
      await queryClient.invalidateQueries({ queryKey: ['chatRooms'] })

      // Reset form and close dialog
      form.reset()
      onOpenChange(false)

      toast.success('Conversation créée avec succès', {
        description: `La conversation "${response.data.name}" a été créée`,
      })

      // ✅ Navigate to the newly created room
      router.push(`/chat/${response.data.id}`)
    } catch (error) {
      console.error('[CreateRoomDialog] ❌ Exception:', error)
      toast.error('Erreur lors de la création de la conversation', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer une nouvelle conversation</DialogTitle>
          <DialogDescription>
            Créez une nouvelle conversation pour commencer à discuter
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la conversation</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ma nouvelle conversation"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de conversation</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="group">Groupe</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

