"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

export function GeneratePathButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleGenerate() {
    setLoading(true)
    try {
      const res = await fetch("/api/generate", { method: "POST" })
      const data = await res.json()
      if (!data.success) {
        toast.error(data.error ?? "Something went wrong")
        return
      }
      toast.success("Your learning path is ready!")
      router.push("/employee/learning-path")
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Building your path…
          </>
        ) : (
          <>
            <Sparkles className="size-4" />
            Generate My Learning Path
          </>
        )}
      </button>
      {loading && (
        <p className="text-xs text-indigo-600">
          Hang tight! We&apos;re combining your profile with your mentor&apos;s feedback…
        </p>
      )}
    </div>
  )
}
