"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { StarRating } from "@/components/shared/StarRating"
import { FeedbackSummaryCard } from "@/components/shared/FeedbackSummaryCard"
import { mentorQuarterlySchema, MentorQuarterlyFormData } from "@/lib/validations"

interface Props {
  employeeId: string
  employeeName: string
  quarterLabel: string
  quarter: number
  year: number
}

interface QuarterlyFeedback {
  id: string
  quarter: number
  year: number
  rating: number
  learned: string
  nextGoal: string
  submittedBy: "EMPLOYEE" | "MENTOR"
}

export function MentorQuarterlyFeedbackForm({ employeeId, employeeName, quarterLabel, quarter, year }: Props) {
  const [submitted, setSubmitted] = useState<QuarterlyFeedback | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MentorQuarterlyFormData>({
    resolver: zodResolver(mentorQuarterlySchema),
    defaultValues: { targetUserId: employeeId, rating: 0, learned: "", nextGoal: "" },
  })

  const rating = watch("rating")

  async function onSubmit(data: MentorQuarterlyFormData) {
    const res = await fetch("/api/quarterly-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!json.success) {
      toast.error(typeof json.error === "string" ? json.error : "Failed to submit feedback")
      return
    }
    setSubmitted(json.data)
    toast.success(`Feedback submitted for ${employeeName}!`)
  }

  if (submitted) {
    return (
      <FeedbackSummaryCard
        quarter={submitted.quarter}
        year={submitted.year}
        rating={submitted.rating}
        learned={submitted.learned}
        nextGoal={submitted.nextGoal}
        submittedBy="MENTOR"
        subjectName={employeeName}
      />
    )
  }

  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 mt-3 space-y-4">
      <p className="text-sm font-medium text-zinc-700">
        Feedback for: <span className="text-zinc-900 font-semibold">{employeeName}</span> · {quarterLabel}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register("targetUserId")} value={employeeId} />

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">How would you rate their progress?</label>
          <StarRating value={rating} onChange={v => setValue("rating", v, { shouldValidate: true })} />
          {errors.rating && <p className="text-xs text-red-500">{errors.rating.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Observations on skill improvement</label>
          <Textarea
            placeholder="What growth have you observed? What skills did they develop this quarter?"
            rows={3}
            {...register("learned")}
          />
          {errors.learned && <p className="text-xs text-red-500">{errors.learned.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">Suggested focus for next quarter</label>
          <Textarea
            placeholder="What should they prioritize in the next quarter?"
            rows={2}
            {...register("nextGoal")}
          />
          {errors.nextGoal && <p className="text-xs text-red-500">{errors.nextGoal.message}</p>}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting…" : "Submit Feedback"}
          </button>
        </div>
      </form>
    </div>
  )
}
