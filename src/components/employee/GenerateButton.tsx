"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function GenerateButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    await fetch("/api/generate", { method: "POST" })
    router.push("/employee/learning-path")
    router.refresh()
  }

  return (
    <Button
      onClick={handleGenerate}
      disabled={loading}
      className="bg-indigo-600 hover:bg-indigo-700 text-white"
    >
      {loading ? "Generating…" : "Generate My Learning Path"}
    </Button>
  )
}
