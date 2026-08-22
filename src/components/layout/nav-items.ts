import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Dumbbell,
  MessageSquare,
  FileText,
  BarChart3,
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
  { title: "Bibliothèque", href: "/exercises", icon: Dumbbell },
  { title: "Messagerie", href: "/messages", icon: MessageSquare },
  { title: "Documents", href: "/documents", icon: FileText },
  { title: "Analyse", href: "/analytics", icon: BarChart3 },
]

export const athleteNavItems: NavItem[] = [
  { title: "Mon planning", href: "/athlete", icon: CalendarDays },
  { title: "Mon journal", href: "/athlete/journal", icon: NotebookPen },
  { title: "Mon profil", href: "/athlete/profil", icon: User },
]
