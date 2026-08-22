"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { SignOutButton } from "./sign-out-button"
import { coachNavItems, athleteNavItems } from "./nav-items"

export function AppSidebar({
  variant,
  userName,
  userSubtitle,
}: {
  variant: "coach" | "athlete"
  userName: string
  userSubtitle: string
}) {
  const pathname = usePathname()
  const navItems = variant === "coach" ? coachNavItems : athleteNavItems
  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Activity className="size-4" />
        </div>
        <span className="text-sm font-semibold tracking-tight">RunCoach</span>
      </div>

      <nav className="flex-1 space-y-0.5 p-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.title}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-3">
        <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground">
          <div className="flex size-7 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-foreground">
            {initials}
          </div>
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-sm font-medium text-foreground">{userName}</span>
            <span className="truncate">{userSubtitle}</span>
          </div>
          <SignOutButton />
        </div>
      </div>
    </aside>
  )
}
