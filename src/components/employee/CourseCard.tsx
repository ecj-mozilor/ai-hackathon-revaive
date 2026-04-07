"use client"

import { useState } from "react"
import { ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CourseCardProps {
  resource: {
    id: string
    title: string
    type: string
    platform: string
    url: string | null
    rationale: string
    priority: number
    addedByMentor: boolean
    status: string
  }
}

export function CourseCard({ resource }: CourseCardProps) {
  const [status, setStatus] = useState(resource.status)
  const [updating, setUpdating] = useState(false)

  async function updateStatus(newStatus: string) {
    const prev = status
    setStatus(newStatus) // optimistic
    setUpdating(true)
    try {
      const res = await fetch("/api/courses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateStatus", resourceId: resource.id, status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setStatus(prev) // revert
        toast.error(data.error ?? "Failed to update status")
      }
    } catch {
      setStatus(prev)
      toast.error("Network error. Please try again.")
    } finally {
      setUpdating(false)
    }
  }

  const isCompleted = status === "COMPLETED"
  const isInProgress = status === "IN_PROGRESS"

  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-4 flex flex-col gap-3 transition-opacity",
        resource.addedByMentor ? "border-l-4 border-l-violet-500 border-r border-t border-b border-zinc-200" : "border-zinc-200",
        isCompleted && "opacity-75"
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {resource.addedByMentor && (
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
              Mentor Recommended
            </span>
          )}
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
            {resource.type}
          </span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
            {resource.platform}
          </span>
        </div>

        {/* Status badge */}
        {isInProgress && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            In Progress
          </span>
        )}
        {isCompleted && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
            Completed ✓
          </span>
        )}
      </div>

      {/* Title + rationale */}
      <div>
        <p className="font-medium text-zinc-900 text-sm">{resource.title}</p>
        <p className="text-xs text-zinc-500 italic mt-0.5">&ldquo;{resource.rationale}&rdquo;</p>
      </div>

      {/* Actions */}
      {!isCompleted && (
        <div className="flex items-center gap-2 flex-wrap">
          {resource.url && (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 hover:border-zinc-400 transition-colors"
            >
              <ExternalLink className="size-3" />
              Open Course
            </a>
          )}

          {status === "PENDING" && (
            <button
              type="button"
              onClick={() => updateStatus("IN_PROGRESS")}
              disabled={updating}
              className="inline-flex items-center rounded-lg border border-indigo-300 px-3 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
            >
              Start
            </button>
          )}

          {isInProgress && (
            <button
              type="button"
              onClick={() => updateStatus("COMPLETED")}
              disabled={updating}
              className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              Mark Complete
            </button>
          )}
        </div>
      )}
    </div>
  )
}
