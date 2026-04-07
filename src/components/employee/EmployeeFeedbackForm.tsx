"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { BookOpen } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { StarRating } from "@/components/shared/StarRating"
import { FeedbackSummaryCard } from "@/components/shared/FeedbackSummaryCard"
import { employeeFeedbackSchema, EmployeeFeedbackFormData } from "@/lib/validations"

interface QuarterlyFeedback {
  id: string
  quarter: number
  year: number
  rating: number
  learned: string
  nextGoal: string
  submittedBy: "EMPLOYEE" | "MENTOR"
}

export function EmployeeFeedbackForm({ quarterLabel }: { quarterLabel: string }) {
  const [submitted, setSubmitted] = useState<QuarterlyFeedback | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFeedbackFormData>({
    resolver: zodResolver(employeeFeedbackSchema),
    defaultValues: { rating: 0, learned: "", nextGoal: "" },
  })

  const rating = watch("rating")

  async function onSubmit(data: EmployeeFeedbackFormData) {
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
    toast.success("Reflection submitted! See you next quarter 👋")
  }

  if (submitted) {
    return (
      <FeedbackSummaryCard
        quarter={submitted.quarter}
        year={submitted.year}
        rating={submitted.rating}
        learned={submitted.learned}
        nextGoal={submitted.nextGoal}
        submittedBy="EMPLOYEE"
      />
    )
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900">{quarterLabel} Reflection</h2>
        <BookOpen className="size-4 text-zinc-400" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">How would you rate your learning path?</label>
          <StarRating value={rating} onChange={v => setValue("rating", v, { shouldValidate: true })} />
          {errors.rating && <p className="text-xs text-red-500">{errors.rating.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">What did you learn this quarter?</label>
          <Textarea
            placeholder="Describe what skills you built, courses you completed, and key takeaways…"
            rows={4}
            {...register("learned")}
          />
          {errors.learned && <p className="text-xs text-red-500">{errors.learned.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-700">What do you want to focus on next quarter?</label>
          <Textarea
            placeholder="Describe your goals and focus areas for the next quarter…"
            rows={3}
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
            {isSubmitting ? "Submitting…" : "Submit Reflection"}
          </button>
        </div>
      </form>
    </div>
  )
}
