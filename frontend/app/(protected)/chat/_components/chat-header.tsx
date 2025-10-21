"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe, Sparkles, Plus } from "lucide-react"
import type { ChatSettings } from "./chat-interface"

interface ChatHeaderProps {
  settings: ChatSettings
  onSettingsChange: (settings: ChatSettings) => void
  onNewChat: () => void
}

export function ChatHeader({ settings, onSettingsChange, onNewChat }: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border px-2 md:px-4 py-2 md:py-3 gap-2 flex-wrap">
      <div className="flex items-center gap-2 md:gap-4 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          className="h-8 md:h-9 gap-1 md:gap-2 bg-transparent text-xs md:text-sm"
          onClick={onNewChat}
        >
          <Plus className="h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden sm:inline">Nouvelle conversation</span>
          <span className="sm:hidden">Nouveau</span>
        </Button>

        <Select value={settings.model} onValueChange={(value) => onSettingsChange({ ...settings, model: value })}>
          <SelectTrigger className="w-[100px] md:w-[140px] h-8 md:h-9 text-xs md:text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GPT-5">GPT-5</SelectItem>
            <SelectItem value="GPT-4">GPT-4</SelectItem>
            <SelectItem value="Claude 3.5">Claude 3.5</SelectItem>
            <SelectItem value="Mistral Large">Mistral Large</SelectItem>
            <SelectItem value="Gemini Pro">Gemini Pro</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={settings.webSearchEnabled ? "default" : "outline"}
          size="sm"
          className="h-8 md:h-9 gap-1 md:gap-2 text-xs md:text-sm"
          onClick={() =>
            onSettingsChange({
              ...settings,
              webSearchEnabled: !settings.webSearchEnabled,
            })
          }
        >
          <Globe className="h-3 w-3 md:h-4 md:w-4" />
          <span className="hidden sm:inline">Web Search</span>
          <span className="sm:hidden">Web</span>
        </Button>
      </div>

      <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-muted-foreground">
        <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
        <span className="font-mono text-xs md:text-sm">{settings.tokensRemaining.toLocaleString()}</span>
        <span className="hidden sm:inline">tokens</span>
      </div>
    </header>
  )
}
