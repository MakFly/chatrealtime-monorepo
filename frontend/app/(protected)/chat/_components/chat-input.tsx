"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Paperclip, ArrowUp, X, Mic, Square } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface ChatInputProps {
  onSendMessage: (message: string, files?: File[]) => void
  isStreaming?: boolean
  onStopStreaming?: () => void
}

export function ChatInput({ onSendMessage, isStreaming = false, onStopStreaming }: ChatInputProps) {
  const [input, setInput] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isStreaming && onStopStreaming) {
      onStopStreaming()
      return
    }
    if (input.trim() || files.length > 0) {
      onSendMessage(input, files)
      setInput("")
      setFiles([])
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)])
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    const fileItems = Array.from(items).filter((item) => item.kind === "file")
    if (fileItems.length > 0) {
      const pastedFiles = fileItems.map((item) => item.getAsFile()).filter((file): file is File => file !== null)
      setFiles((prev) => [...prev, ...pastedFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const tokenEstimate = Math.ceil(input.length / 4)

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-4xl px-2 md:px-4 py-3 md:py-4">
        <form
          onSubmit={handleSubmit}
          className={cn("transition-all", isDragging && "opacity-50")}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {files.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="relative rounded-lg border border-border p-2 bg-muted/50 flex items-center gap-2"
                >
                  {file.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(file) || "/placeholder.svg"}
                      alt={file.name}
                      className="h-16 w-16 rounded object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded bg-muted flex items-center justify-center">
                      <Paperclip className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="relative rounded-3xl border border-border bg-muted/50 shadow-sm hover:shadow-md transition-shadow">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx,.txt"
            />

            <Textarea
              id="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Poser une question"
              className="min-h-[100px] md:min-h-[120px] max-h-[200px] resize-none border-0 bg-transparent px-3 md:px-4 pt-3 md:pt-4 pb-12 md:pb-14 text-sm md:text-base focus-visible:ring-0"
              rows={1}
            />

            <div className="absolute bottom-2 md:bottom-3 left-3 md:left-4 right-3 md:right-4 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 md:h-8 md:w-8 rounded-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4 md:h-5 md:w-5" />
              </Button>

              <div className="flex items-center gap-1 md:gap-2">
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 rounded-full">
                  <Mic className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  size="icon"
                  className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-foreground text-background hover:bg-foreground/90"
                  disabled={!isStreaming && !input.trim() && files.length === 0}
                >
                  {isStreaming ? (
                    <Square className="h-3 w-3 md:h-4 md:w-4 fill-current" />
                  ) : (
                    <ArrowUp className="h-4 w-4 md:h-5 md:w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {input && (
            <div className="mt-2 flex items-center justify-end text-xs text-muted-foreground">
              <p className="font-mono">
                ~{tokenEstimate} token{tokenEstimate > 1 ? "s" : ""}
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
