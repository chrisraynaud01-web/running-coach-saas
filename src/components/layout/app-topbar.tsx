import { Bell, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./theme-toggle"

export function AppTopbar({
  searchPlaceholder = "Rechercher un athlète...",
}: {
  searchPlaceholder?: string
}) {
  return (
    <header className="flex h-14 items-center gap-4 border-b px-4 md:px-6">
      <div className="relative max-w-xs flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder={searchPlaceholder} className="h-8 pl-8 text-sm" />
      </div>

      <Button variant="ghost" size="icon" className="size-8">
        <Bell className="size-4" />
      </Button>
      <ThemeToggle />
    </header>
  )
}
