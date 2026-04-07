"use client"

import { useProgressStore } from "@/store/progressStore"

export function LearningPathHeader({
  goal,
  generatedAt,
  allResourceIds,
  initialCompleted,
}: {
  goal: string
  generatedAt: string
  allResourceIds: string[]
  initialCompleted: string[]
}) {
  const completedIds = useProgressStore(s => s.completedIds)
  const allCompleted = new Set([...initialCompleted, ...completedIds])
  const total = allResourceIds.length
  const completed = allResourceIds.filter(id => allCompleted.has(id)).length
  const pct = total ? Math.round((completed / total) * 100) : 0

  return (
    <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 text-white">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-indigo-200 text-sm mb-1">Your learning goal</p>
          <h1 className="text-2xl font-semibold">🎯 {goal}</h1>
          <p className="text-indigo-200 text-sm mt-1">Generated on {generatedAt}</p>
        </div>
        <div className="md:w-64 shrink-0">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-indigo-100">Overall Progress</span>
            <span className="font-semibold">{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-indigo-400/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-white transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-indigo-200 text-xs mt-1">{completed} of {total} courses completed</p>
        </div>
      </div>
    </div>
  )
}
