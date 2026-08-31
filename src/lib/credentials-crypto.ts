import crypto from "crypto"

// Chiffrement réversible (AES-256-GCM) du mot de passe temporaire d'un athlète, pour que le
// coach puisse le retrouver plus tard sans devoir le réinitialiser. À la différence du hash
// bcrypt utilisé pour l'authentification (irréversible, inchangé), ceci est un compromis de
// sécurité assumé pour une app familiale — jamais utilisé pour un compte coach.
const ALGORITHM = "aes-256-gcm"

function getKey(): Buffer {
  const raw = process.env.CREDENTIALS_ENCRYPTION_KEY
  if (!raw) throw new Error("CREDENTIALS_ENCRYPTION_KEY manquante dans l'environnement")
  const key = Buffer.from(raw, "base64")
  if (key.length !== 32) {
    throw new Error("CREDENTIALS_ENCRYPTION_KEY doit être une clé de 32 octets encodée en base64")
  }
  return key
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(".")
}

export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".")
  const iv = Buffer.from(ivB64, "base64")
  const authTag = Buffer.from(tagB64, "base64")
  const data = Buffer.from(dataB64, "base64")
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()])
  return decrypted.toString("utf8")
}
