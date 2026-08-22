const WORDS = [
  "foulee", "tempo", "sprint", "seuil", "cardio", "podium", "record",
  "vma", "trail", "semi", "marathon", "relance", "cadence", "souffle",
]

export function generateTempPassword() {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)]
  const digits = Math.floor(1000 + Math.random() * 9000)
  return `${word}-${digits}`
}
