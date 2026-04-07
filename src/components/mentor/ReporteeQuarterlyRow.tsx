"use client"

import { useState } from "react"
import { CheckCircle2, Clock, ChevronDown, ChevronUp } from "lucide-react"
import { MentorQuarterlyFeedbackForm } from "./MentorFeedbackForm"
import { FeedbackSummaryCard } from "@/components/shared/FeedbackSummaryCard"

interface QuarterlyFeedback {
  id: string
  quarter: number
  year: number
  rating: number
  learned: string
  nextGoal: string
  submittedBy: "EMPLOYEE" | "MENTOR"
}

interface Props {
  employee: {
    id: string
    name: string
    designation: string | null
  }
  employeeSubmitted: QuarterlyFeedback | null
  mentorSubmitted: QuarterlyFeedback | null
  quarterLabel: string
  quarter: number
  year: number
}

export function ReporteeQuarterlyRow({ employee, employeeSubmitted, mentorSubmitted, quarterLabel, quarter, year }: Props) {
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5 space-y-3">
      {/* Reportee header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-medium text-zinc-900">{employee.name}</p>
          {employee.designation && (
            <p className="text-xs text-zinc-500">{employee.designation}</p>
          )}
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {/* Employee submission status */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <span>Employee:</span>
            {employeeSubmitted ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle2 className="size-3" /> Submitted
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                <Clock className="size-3" /> Pending
              </span>
            )}
          </div>

          {/* Mentor submission status + action */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Your feedback:</span>
            {mentorSubmitted ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="size-3" /> Submitted ✓
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowForm(v => !v)}
                className="inline-flex items-center gap-1 rounded-lg border border-indigo-300 px-3 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                {showForm ? (
                  <><ChevronUp className="size-3" /> Hide</>
                ) : (
                  <>Give Feedback →</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mentor already submitted: show summary */}
      {mentorSubmitted && (
        <FeedbackSummaryCard
          quarter={mentorSubmitted.quarter}
          year={mentorSubmitted.year}
          rating={mentorSubmitted.rating}
          learned={mentorSubmitted.learned}
          nextGoal={mentorSubmitted.nextGoal}
          submittedBy="MENTOR"
          subjectName={employee.name}
          collapsible
          defaultOpen={false}
        />
      )}

      {/* Form */}
      {showForm && !mentorSubmitted && (
        <MentorQuarterlyFeedbackForm
          employeeId={employee.id}
          employeeName={employee.name}
          quarterLabel={quarterLabel}
          quarter={quarter}
          year={year}
        />
      )}
    </div>
  )
}
