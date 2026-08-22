// Parse "mm:ss" ou "h:mm:ss" en secondes totales.
export function parseClockToSeconds(value?: string): number | undefined {
  if (!value) return undefined
  const parts = value.split(":").map((p) => p.trim())
  if (parts.some((p) => p === "" || Number.isNaN(Number(p)))) return undefined

  if (parts.length === 2) {
    const [m, s] = parts.map(Number)
    return m * 60 + s
  }
  if (parts.length === 3) {
    const [h, m, s] = parts.map(Number)
    return h * 3600 + m * 60 + s
  }
  return undefined
}

// Secondes totales -> "mm:ss" (ou "h:mm:ss" si >= 1h).
export function secondsToClock(totalSeconds?: number | null): string {
  if (!totalSeconds || totalSeconds <= 0) return ""
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = Math.round(totalSeconds % 60)
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
  }
  return `${m}:${String(s).padStart(2, "0")}`
}

// Allure (secondes/km) à partir d'un temps de course (secondes) et d'une distance (km).
export function paceFromRaceTime(seconds?: number, distanceKm?: number): number | undefined {
  if (!seconds || !distanceKm) return undefined
  return Math.round(seconds / distanceKm)
}

// VMA (km/h) à partir d'une distance (m) parcourue sur un temps donné (secondes).
export function vmaFromDistanceAndTime(distanceMeters?: number, seconds?: number): number | undefined {
  if (!distanceMeters || !seconds) return undefined
  const km = distanceMeters / 1000
  const hours = seconds / 3600
  return Math.round((km / hours) * 100) / 100
}

// Allure (secondes/km) à partir d'une VMA (km/h) et d'un pourcentage de VMA.
export function paceFromVmaPercent(vma?: number, vmaPercent?: number): number | undefined {
  if (!vma || !vmaPercent) return undefined
  const speedKmh = (vma * vmaPercent) / 100
  if (speedKmh <= 0) return undefined
  return Math.round(3600 / speedKmh)
}

// Durée (secondes) pour parcourir une distance (m) à une allure donnée (secondes/km).
export function durationFromPaceAndDistance(paceSecPerKm?: number, distanceMeters?: number): number | undefined {
  if (!paceSecPerKm || !distanceMeters) return undefined
  return Math.round((paceSecPerKm * distanceMeters) / 1000)
}

// Séances plutôt notées par créneau (matin / après-midi / soir) que par heure précise —
// utile pour les athlètes qui enchaînent deux séances la même journée.
export const TIME_OF_DAY_VALUES = ["MORNING", "AFTERNOON", "EVENING"] as const
export type TimeOfDay = (typeof TIME_OF_DAY_VALUES)[number]

export const timeOfDayLabels: Record<TimeOfDay, string> = {
  MORNING: "Matin",
  AFTERNOON: "Après-midi",
  EVENING: "Soir",
}

const TIME_OF_DAY_HOUR: Record<TimeOfDay, number> = {
  MORNING: 7,
  AFTERNOON: 13,
  EVENING: 18,
}

export function combineDateAndTimeOfDay(dateStr: string, timeOfDay: TimeOfDay): Date {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, (m || 1) - 1, d || 1, TIME_OF_DAY_HOUR[timeOfDay], 0, 0)
}

export function timeOfDayFromDate(date: Date): TimeOfDay {
  const h = date.getHours()
  if (h < 11) return "MORNING"
  if (h < 17) return "AFTERNOON"
  return "EVENING"
}
