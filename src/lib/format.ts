export function formatPace(secPerKm?: number | null) {
  if (!secPerKm) return "—"
  const min = Math.floor(secPerKm / 60)
  const sec = Math.round(secPerKm % 60)
  return `${min}:${String(sec).padStart(2, "0")}/km`
}

export function formatDistance(meters?: number | null) {
  if (!meters) return "—"
  return `${(meters / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km`
}

export function formatDuration(seconds?: number | null) {
  if (!seconds) return "—"
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  return h > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${m} min`
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function formatMonthLabel(date: Date) {
  const label = new Date(date).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function calculateAge(birthDate: Date | string) {
  const bd = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - bd.getFullYear()
  const hasHadBirthdayThisYear =
    today.getMonth() > bd.getMonth() ||
    (today.getMonth() === bd.getMonth() && today.getDate() >= bd.getDate())
  if (!hasHadBirthdayThisYear) age -= 1
  return age
}

export function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Les séances sont notées par créneau (matin / après-midi / soir), pas par heure précise.
export function formatWorkoutSchedule(date: Date | string) {
  const d = new Date(date)
  const h = d.getHours()
  const label = h < 11 ? "Matin" : h < 17 ? "Après-midi" : "Soir"
  return `${formatDate(d)} · ${label}`
}

export function formatMemberSince(createdAt: Date | string) {
  const start = new Date(createdAt)
  const now = new Date()
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  if (now.getDate() < start.getDate()) months -= 1
  if (months <= 0) return "Inscrit ce mois-ci"
  if (months < 12) return `Membre depuis ${months} mois`
  const years = Math.floor(months / 12)
  const remMonths = months % 12
  return remMonths === 0
    ? `Membre depuis ${years} an${years > 1 ? "s" : ""}`
    : `Membre depuis ${years} an${years > 1 ? "s" : ""} et ${remMonths} mois`
}
