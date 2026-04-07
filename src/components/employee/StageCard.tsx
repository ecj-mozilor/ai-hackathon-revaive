"use client"

import { useProgressStore } from "@/store/progressStore"
import { CourseCard } from "./CourseCard"

interface Resource {
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

interface Stage {
  id: string
  title: string
  duration: string
  order: number
  resources: Resource[]
}

export function StageCard({ stage, index }: { stage: Stage; index: number }) {
  const completedIds = useProgressStore(s => s.completedIds)
  const sorted = [...stage.resources].sort((a, b) => a.priority - b.priority)

  const total = stage.resources.length
  const completedCount = stage.resources.filter(
    r => r.status === "COMPLETED" || completedIds.has(r.id)
  ).length
  const progress = total ? Math.round((completedCount / total) * 100) : 0
  const isComplete = progress === 100

  return (
    <div className="space-y-3">
      {/* Stage header */}
      <div className="flex items-center gap-3">
        <div className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shrink-0">
          {index + 1}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-lg font-semibold text-zinc-800">{stage.title}</h3>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">{stage.duration}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-zinc-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-zinc-500 shrink-0">{completedCount} / {total}</span>
          </div>
        </div>
      </div>

      {/* Stage complete banner */}
      {isComplete && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 text-emerald-700 text-sm">
          🎉 Stage complete! Great work.
        </div>
      )}

      {/* Course cards */}
      <div className="space-y-3 pl-11">
        {sorted.map(resource => (
          <CourseCard key={resource.id} resource={resource} />
        ))}
      </div>
    </div>
  )
}
