"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ImagePlus, X, Loader2 } from "lucide-react"
import { addWorkoutPhoto, removeWorkoutPhoto } from "@/app/athlete/actions"

const MAX_PHOTOS = 6

export function WorkoutPhotos({ workoutId, photoUrls }: { workoutId: string; photoUrls: string[] }) {
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = React.useState(photoUrls)
  const [uploading, setUploading] = React.useState(false)
  const [removingUrl, setRemovingUrl] = React.useState<string | null>(null)

  React.useEffect(() => setPhotos(photoUrls), [photoUrls])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append("photo", file)
    const result = await addWorkoutPhoto(workoutId, formData)
    setUploading(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }
    setPhotos((prev) => [...prev, result.url])
    router.refresh()
  }

  async function handleRemove(url: string) {
    setRemovingUrl(url)
    const result = await removeWorkoutPhoto(workoutId, url)
    setRemovingUrl(null)

    if (!result.success) {
      toast.error(result.error)
      return
    }
    setPhotos((prev) => prev.filter((u) => u !== url))
    router.refresh()
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Photos</p>
      <div className="flex flex-wrap gap-2">
        {photos.map((url) => (
          <div key={url} className="group relative size-16 shrink-0 overflow-hidden rounded-md border">
            <a href={url} target="_blank" rel="noreferrer">
              {/* Miniatures issues d'upload libre — next/image imposerait de whitelister le
                  domaine Blob sans réel bénéfice ici. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Photo de la séance" className="size-full object-cover" />
            </a>
            <button
              type="button"
              aria-label="Supprimer la photo"
              disabled={removingUrl === url}
              onClick={() => handleRemove(url)}
              className="absolute top-0.5 right-0.5 flex size-5 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 transition-opacity group-hover:opacity-100"
            >
              {removingUrl === url ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <X className="size-3" />
              )}
            </button>
          </div>
        ))}

        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="flex size-16 shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-dashed text-muted-foreground hover:bg-muted/50"
          >
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            <span className="text-[10px]">Ajouter</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
