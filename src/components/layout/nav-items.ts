import {
  LayoutDashboard,
  Users,
  CalendarDays,
  User,
  NotebookPen,
  type LucideIcon,
} from "lucide-react"

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
}

export const coachNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Athlètes", href: "/athletes", icon: Users },
  { title: "Séances", href: "/workouts", icon: NotebookPen },
  { title: "Calendrier", href: "/calendar", icon: CalendarDays },
]

export const athleteNavItems: NavItem[] = [
  { title: "Mon planning", href: "/athlete", icon: CalendarDays },
  { title: "Mon journal", href: "/athlete/journal", icon: NotebookPen },
  { title: "Mon profil", href: "/athlete/profil", icon: User },
]
