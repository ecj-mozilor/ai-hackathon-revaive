"use client"

import { useState } from "react"
import { Star, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react"
import { getQuarterLabel } from "@/lib/utils"

interface FeedbackSummaryCardProps {
  quarter: number
  year: number
  rating: number
  learned: string
  nextGoal: string
  submittedBy: "EMPLOYEE" | "MENTOR"
  subjectName?: string
  collapsible?: boolean
  defaultOpen?: boolean
}

function ReadOnlyStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={16}
          className={i < rating ? "text-amber-400 fill-amber-400" : "text-zinc-200"}
        />
      ))}
    </div>
  )
}

export function FeedbackSummaryCard({
  quarter,
  year,
  rating,
  learned,
  nextGoal,
  submittedBy,
  subjectName,
  collapsible = false,
  defaultOpen = true,
}: FeedbackSummaryCardProps) {
  const [open, setOpen] = useState(defaultOpen)
  const label = getQuarterLabel(quarter, year)
  const title = subjectName
    ? `Feedback for ${subjectName} · ${label}`
    : `${label} Reflection`

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      <div
        className={`flex items-center justify-between p-4 ${collapsible ? "cursor-pointer hover:bg-zinc-50" : ""}`}
        onClick={collapsible ? () => setOpen(o => !o) : undefined}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="size-3" />
            Submitted ✓
          </span>
          <span className="text-sm font-medium text-zinc-800">{title}</span>
          <ReadOnlyStars rating={rating} />
        </div>
        {collapsible && (
          open
            ? <ChevronUp className="size-4 text-zinc-400 shrink-0" />
            : <ChevronDown className="size-4 text-zinc-400 shrink-0" />
        )}
      </div>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-zinc-100 pt-3">
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">
              {submittedBy === "EMPLOYEE" ? "What you learned" : "Observations on skill improvement"}
            </p>
            <p className="text-sm text-zinc-700 whitespace-pre-wrap">&ldquo;{learned}&rdquo;</p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">
              {submittedBy === "EMPLOYEE" ? "Focus for next quarter" : "Suggested focus for next quarter"}
            </p>
            <p className="text-sm text-zinc-700 whitespace-pre-wrap">&ldquo;{nextGoal}&rdquo;</p>
          </div>
        </div>
      )}
    </div>
  )
}
